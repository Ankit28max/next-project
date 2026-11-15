// Fraud / suspicious-submission risk. ADVISORY ONLY: it produces a score and reasons
// for a human officer. Nothing in the app rejects a complaint because of this score.
import type { Prisma } from '@prisma/client';
import { distanceMeters } from '@/lib/geo';
import { hammingDistance } from '@/lib/images/dhash';
import { DUPLICATE, FRAUD } from './config';
import { normalize } from './text';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** The single place where a score becomes a level. */
export function riskLevel(score: number): RiskLevel {
  if (score >= FRAUD.HIGH_AT) return 'HIGH';
  if (score >= FRAUD.MEDIUM_AT) return 'MEDIUM';
  return 'LOW';
}

/** True for text that looks like filler rather than a description. */
export function looksLikeSpam(text: string): boolean {
  const words = normalize(text).split(' ').filter(Boolean);
  if (words.length < 4) return true;
  if (/(\p{L})\1{4,}/u.test(text)) return true; // "aaaaa", but not digits such as "Plot 11111"
  const smash = ['asdf', 'asdfgh', 'qwerty', 'zxcv', 'test test', 'lorem ipsum'];
  const padded = ` ${words.join(' ')} `;
  if (smash.some((s) => padded.includes(` ${s} `))) return true;
  const unique = new Set(words).size;
  return words.length >= 8 && unique / words.length < 0.4; // the same few words repeated
}

export interface FraudSignals {
  text: string;
  submittedAt: Date;
  latitude: number;
  longitude: number;
  image: {
    hasExif: boolean;
    exifTakenAt: Date | null;
    exifLat: number | null;
    exifLng: number | null;
    exifSoftware: string | null;
  };
  /** Reference numbers of OTHER citizens' complaints that used a visually identical photo. */
  photoReusedByOthers: string[];
  /** Number of this citizen's earlier complaints that used a visually identical photo. */
  photoReusedBySelf: number;
  /** This citizen's submissions in the last FRAUD.VELOCITY_WINDOW_MINUTES (not counting this one). */
  recentSubmissions: number;
  /** A duplicate match was found against this citizen's own earlier complaint. */
  duplicateOfOwnComplaint: boolean;
  /** From the vision model; null when it did not run. */
  imageMatchesText: boolean | null;
  looksLikeStockOrScreenshot: boolean | null;
}

export interface FraudAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

const EDITING_SOFTWARE = /photoshop|gimp|lightroom|snapseed|picsart|canva|pixlr/i;

/** Pure: turns signals into a score, a level and human-readable reasons. */
export function assessFraud(s: FraudSignals): FraudAssessment {
  const P = FRAUD.POINTS;
  let score = 0;
  const reasons: string[] = [];
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(`${reason} (+${points})`);
  };

  if (s.photoReusedByOthers.length > 0) {
    add(P.photoReusedByOtherCitizen, `The same photo was submitted by a different citizen in ${s.photoReusedByOthers.join(', ')}`);
  } else if (s.photoReusedBySelf > 0) {
    add(P.photoReusedBySameCitizen, 'This citizen used the same photo in an earlier complaint');
  }

  if (s.image.exifLat !== null && s.image.exifLng !== null) {
    const km = distanceMeters(s.latitude, s.longitude, s.image.exifLat, s.image.exifLng) / 1000;
    if (km > FRAUD.EXIF_GPS_MAX_KM) {
      add(P.exifGpsFarFromPin, `Photo GPS position is ${km.toFixed(1)} km away from the pinned location`);
    }
  }

  if (s.image.exifTakenAt) {
    const ageDays = (s.submittedAt.getTime() - s.image.exifTakenAt.getTime()) / 86_400_000;
    if (ageDays > FRAUD.EXIF_MAX_AGE_DAYS) add(P.exifTimeInconsistent, `Photo was taken ${Math.round(ageDays)} days before submission`);
    else if (ageDays < -1) add(P.exifTimeInconsistent, 'Photo capture date is in the future');
  }

  if (!s.image.hasExif) {
    add(P.exifMissing, 'Photo has no camera metadata (weak signal: messaging apps also remove it)');
  } else if (s.image.exifSoftware && EDITING_SOFTWARE.test(s.image.exifSoftware)) {
    add(P.editingSoftware, `Photo metadata names editing software (${s.image.exifSoftware})`);
  }

  if (s.imageMatchesText === false) add(P.imageTextMismatch, 'Vision model: the photo does not appear to show the described problem');
  if (s.looksLikeStockOrScreenshot === true) add(P.stockOrScreenshot, 'Vision model: the photo looks like a stock image or screenshot');

  if (looksLikeSpam(s.text)) add(P.spamText, 'The text is very short, repetitive or looks like filler');

  if (s.recentSubmissions >= FRAUD.VELOCITY_MAX_SUBMISSIONS) {
    add(P.velocity, `${s.recentSubmissions} other complaints from this citizen in the last ${FRAUD.VELOCITY_WINDOW_MINUTES} minutes`);
  }

  if (s.duplicateOfOwnComplaint) add(P.selfDuplicate, 'Very similar to an earlier complaint from the same citizen');

  score = Math.min(100, score);
  if (reasons.length === 0) reasons.push('No risk signals were triggered.');
  return { score, level: riskLevel(score), reasons };
}

/** Database lookups for the signals that need history. */
export async function gatherHistorySignals(
  db: Prisma.TransactionClient,
  input: { citizenId: string; imageHash: string }
): Promise<Pick<FraudSignals, 'photoReusedByOthers' | 'photoReusedBySelf' | 'recentSubmissions'>> {
  // Perceptual hashes cannot be compared with SQL "=", so recent hashes are compared in code.
  // Fine at demo scale; a larger system would index hashes (for example with a BK-tree).
  const earlierImages = await db.complaintImage.findMany({
    where: { complaintId: { not: null } },
    select: { imageHash: true, complaint: { select: { referenceNumber: true, citizenId: true } } },
    orderBy: { uploadedAt: 'desc' },
    take: 2000,
  });
  const same = earlierImages.filter(
    (img) => img.complaint && hammingDistance(img.imageHash, input.imageHash) <= DUPLICATE.SAME_PHOTO_MAX_HAMMING
  );

  const windowStart = new Date(Date.now() - FRAUD.VELOCITY_WINDOW_MINUTES * 60 * 1000);
  const recentSubmissions = await db.complaint.count({
    where: { citizenId: input.citizenId, createdAt: { gte: windowStart } },
  });

  return {
    photoReusedByOthers: same.filter((i) => i.complaint!.citizenId !== input.citizenId).map((i) => i.complaint!.referenceNumber).slice(0, 5),
    photoReusedBySelf: same.filter((i) => i.complaint!.citizenId === input.citizenId).length,
    recentSubmissions,
  };
}
