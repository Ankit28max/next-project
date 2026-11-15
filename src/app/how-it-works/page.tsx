import type { Metadata } from 'next';
import { DUPLICATE, FRAUD } from '@/lib/ai/config';
import { CATEGORIES } from '@/lib/ai/categories';

// Static rendering: built once at deploy time, served as plain HTML.
export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'How it works' };

export default function HowItWorksPage() {
  return (
    <article className="page prose-block max-w-3xl">
      <h1>How JanSetu handles a complaint</h1>
      <p>
        This page explains exactly what happens after you press Submit. The numbers below are read from the same configuration
        file the application uses.
      </p>

      <h2>1. Your photo is checked and cleaned</h2>
      <ul>
        <li>The server confirms the file really is a JPEG, PNG or WebP image by looking at its first bytes.</li>
        <li>It notes a few facts from the photo metadata (capture time, GPS position, camera, editing software).</li>
        <li>It then re-encodes the photo, which removes all metadata. Only the cleaned photo is stored.</li>
        <li>It computes a 64-bit visual fingerprint (dHash) so the same photo can be recognised even after resizing.</li>
      </ul>

      <h2>2. A category is suggested</h2>
      <p>
        Keyword rules always run. They look for whole words in English and Hinglish for {CATEGORIES.length} categories:{' '}
        {CATEGORIES.map((c) => c.name).join(', ')}. When a vision model (Google Gemini) is configured, it also looks at the photo
        and its answer is used instead. If the model is unavailable or answers incorrectly, the rules result is used and the
        complaint record says so.
      </p>
      <p>
        The rules produce a &quot;match strength&quot; (how many keyword points were found). It is not a probability and is not
        shown as a percentage.
      </p>

      <h2>3. Possible duplicates are linked</h2>
      <p>
        The complaint is compared with complaints from the last {DUPLICATE.WINDOW_DAYS} days within {DUPLICATE.RADIUS_M} metres.
        Text similarity ({DUPLICATE.WEIGHTS.text * 100}%), distance ({DUPLICATE.WEIGHTS.distance * 100}%), category (
        {DUPLICATE.WEIGHTS.category * 100}%) and photo fingerprint ({DUPLICATE.WEIGHTS.image * 100}%) are combined into one
        score. At {DUPLICATE.THRESHOLD} or above, the two complaints are linked so the officer can compare them side by side.
        Nothing is merged or deleted automatically.
      </p>

      <h2>4. A risk score is calculated for the officer</h2>
      <p>
        Signals include: the same photo used by a different citizen, photo GPS far from the pinned location, an old photo,
        missing metadata (a weak signal), a photo that does not match the text or looks like a screenshot (vision model only),
        filler text, and many submissions in a few minutes. The score is 0 to 100; {FRAUD.MEDIUM_AT} or more is
        &quot;medium&quot; and {FRAUD.HIGH_AT} or more is &quot;high&quot;. Each point comes with a written reason.
      </p>
      <p>
        <strong>The score is advice only.</strong> No complaint is rejected by software. Only officers see the score, and they
        decide.
      </p>

      <h2>5. The complaint is routed</h2>
      <p>
        Administrator keyword rules are checked first, then the default department of the category. Inside the department, the
        active officer with the fewest open cases is assigned.
      </p>

      <h2>If the analysis fails</h2>
      <p>
        The complaint is still saved, marked &quot;needs manual triage&quot; with no risk level at all, and an administrator
        routes it by hand.
      </p>
    </article>
  );
}
