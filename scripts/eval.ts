// npm run eval
// Runs the labelled set in eval/dataset.ts through the REAL pipeline functions
// (image processing, classification, duplicate scoring, fraud scoring) and prints
// accuracy, precision and recall. No database is needed: history is kept in memory.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EVAL_CASES, type EvalCase } from '../eval/dataset';
import { classifyByRules } from '../src/lib/ai/classification';
import { classifyWithGemini, describeGeminiFailure, geminiModelName, isGeminiConfigured, type GeminiResult } from '../src/lib/ai/gemini';
import { DUPLICATE, FRAUD } from '../src/lib/ai/config';
import { scoreDuplicate } from '../src/lib/ai/duplicates';
import { assessFraud } from '../src/lib/ai/fraud';
import { distanceMeters } from '../src/lib/geo';
import { hammingDistance } from '../src/lib/images/dhash';
import { processUpload, type ProcessedImage } from '../src/lib/images/process';

const START = new Date('2026-11-10T04:30:00.000Z'); // 10:00 IST
const percent = (n: number, d: number) => (d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`);

interface Processed {
  c: EvalCase;
  at: Date;
  image: ProcessedImage;
  category: string;
  vision: GeminiResult | null;
}

async function main() {
  const useVision = isGeminiConfigured();
  console.log('JanSetu evaluation');
  console.log('==================');
  console.log(`Cases: ${EVAL_CASES.length} (synthetic photos, labels in eval/dataset.ts)`);
  console.log(
    useVision
      ? `Classifier: vision model ${geminiModelName()} with keyword-rules fallback`
      : 'Classifier: KEYWORD RULES ONLY (GEMINI_API_KEY is not set, so no vision model was used)'
  );
  console.log('');

  const cases = [...EVAL_CASES].sort((a, b) => a.minute - b.minute);
  const done: Processed[] = [];
  let rulesCorrect = 0;
  let visionCorrect = 0;
  let visionAnswered = 0;
  const visionFailures: string[] = [];
  const categoryMisses: string[] = [];
  const dup = { tp: 0, fp: 0, fn: 0, notes: [] as string[] };
  const fraud = { tp: 0, fp: 0, fn: 0, tn: 0, notes: [] as string[] };

  for (const c of cases) {
    const at = new Date(START.getTime() + c.minute * 60_000);
    const image = await processUpload(await readFile(path.join(process.cwd(), 'eval', 'images', c.image)));

    // 1. Classification
    const rules = classifyByRules(c.title, c.description);
    if (rules.categoryCode === c.expectedCategory) rulesCorrect++;
    let vision: GeminiResult | null = null;
    if (useVision) {
      try {
        vision = await classifyWithGemini({ title: c.title, description: c.description, jpeg: image.jpeg });
        visionAnswered++;
        if (vision.category === c.expectedCategory) visionCorrect++;
      } catch (error) {
        visionFailures.push(`${c.id}: ${describeGeminiFailure(error)}`);
      }
    }
    const category = vision?.category ?? rules.categoryCode;
    if (category !== c.expectedCategory) categoryMisses.push(`${c.id} expected ${c.expectedCategory}, got ${category}${c.note ? ` (${c.note})` : ''}`);

    // 2. Duplicates: same pre-filter as the SQL query (radius, time window), then the same scoring.
    const subject = { text: `${c.title} ${c.description}`, latitude: c.latitude, longitude: c.longitude, categoryCode: category, imageHash: image.imageHash };
    const windowStart = at.getTime() - DUPLICATE.WINDOW_DAYS * 86_400_000;
    const matches = done
      .filter((p) => p.at.getTime() >= windowStart && distanceMeters(c.latitude, c.longitude, p.c.latitude, p.c.longitude) <= DUPLICATE.RADIUS_M * 1.5)
      .map((p) => ({ p, score: scoreDuplicate(subject, { text: `${p.c.title} ${p.c.description}`, latitude: p.c.latitude, longitude: p.c.longitude, categoryCode: p.category, imageHash: p.image.imageHash }) }))
      .filter((m) => m.score.isDuplicate);
    for (const m of matches) {
      if (m.p.c.id === c.duplicateOf) dup.tp++;
      else {
        dup.fp++;
        dup.notes.push(`false link: ${c.id} -> ${m.p.c.id} (score ${m.score.combinedScore})`);
      }
    }
    if (c.duplicateOf && !matches.some((m) => m.p.c.id === c.duplicateOf)) {
      dup.fn++;
      dup.notes.push(`missed: ${c.id} should link to ${c.duplicateOf}`);
    }

    // 3. Fraud risk, with history signals computed from the earlier cases.
    const samePhoto = done.filter((p) => hammingDistance(p.image.imageHash, image.imageHash) <= DUPLICATE.SAME_PHOTO_MAX_HAMMING);
    const assessment = assessFraud({
      text: subject.text,
      submittedAt: at,
      latitude: c.latitude,
      longitude: c.longitude,
      image,
      photoReusedByOthers: samePhoto.filter((p) => p.c.citizen !== c.citizen).map((p) => p.c.id),
      photoReusedBySelf: samePhoto.filter((p) => p.c.citizen === c.citizen).length,
      recentSubmissions: done.filter((p) => p.c.citizen === c.citizen && at.getTime() - p.at.getTime() <= FRAUD.VELOCITY_WINDOW_MINUTES * 60_000).length,
      duplicateOfOwnComplaint: matches.some((m) => m.p.c.citizen === c.citizen),
      imageMatchesText: vision?.imageMatchesText ?? null,
      looksLikeStockOrScreenshot: vision?.looksLikeStockOrScreenshot ?? null,
    });
    const flagged = assessment.score >= FRAUD.MEDIUM_AT;
    if (flagged && c.suspicious) fraud.tp++;
    else if (flagged && !c.suspicious) {
      fraud.fp++;
      fraud.notes.push(`false alarm: ${c.id} score ${assessment.score}${c.note ? ` (${c.note})` : ''}`);
    } else if (!flagged && c.suspicious) {
      fraud.fn++;
      fraud.notes.push(`missed: ${c.id} score ${assessment.score}${c.note ? ` (${c.note})` : ''}`);
    } else fraud.tn++;

    done.push({ c, at, image, category, vision });
  }

  const n = cases.length;
  console.log('1. Category classification');
  console.log(`   Keyword rules accuracy:  ${rulesCorrect}/${n} = ${percent(rulesCorrect, n)}`);
  if (useVision) {
    console.log(`   Vision model accuracy:   ${visionCorrect}/${visionAnswered} = ${percent(visionCorrect, visionAnswered)} (of the cases it answered)`);
    console.log(`   Vision model failures:   ${visionFailures.length} (these fell back to rules)`);
    visionFailures.forEach((f) => console.log(`     - ${f}`));
  }
  console.log(`   Pipeline result (what the app would store): ${n - categoryMisses.length}/${n} = ${percent(n - categoryMisses.length, n)}`);
  categoryMisses.forEach((m) => console.log(`     - ${m}`));

  console.log('');
  console.log(`2. Duplicate detection (threshold ${DUPLICATE.THRESHOLD}, radius ${DUPLICATE.RADIUS_M} m)`);
  console.log(`   Labelled duplicate pairs: ${dup.tp + dup.fn}`);
  console.log(`   Precision: ${dup.tp}/${dup.tp + dup.fp} = ${percent(dup.tp, dup.tp + dup.fp)}`);
  console.log(`   Recall:    ${dup.tp}/${dup.tp + dup.fn} = ${percent(dup.tp, dup.tp + dup.fn)}`);
  dup.notes.forEach((m) => console.log(`     - ${m}`));

  console.log('');
  console.log(`3. Suspicious-submission flag (risk score >= ${FRAUD.MEDIUM_AT}, i.e. MEDIUM or HIGH)`);
  console.log(`   Labelled suspicious cases: ${fraud.tp + fraud.fn} of ${n}`);
  console.log(`   Precision: ${fraud.tp}/${fraud.tp + fraud.fp} = ${percent(fraud.tp, fraud.tp + fraud.fp)}`);
  console.log(`   Recall:    ${fraud.tp}/${fraud.tp + fraud.fn} = ${percent(fraud.tp, fraud.tp + fraud.fn)}`);
  fraud.notes.forEach((m) => console.log(`     - ${m}`));

  console.log('');
  console.log('Caveat: a small, hand-written set with synthetic photos. These numbers describe');
  console.log('this set only and say little about real-world performance.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
