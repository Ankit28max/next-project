// Small text helpers shared by classification, duplicate detection, fraud checks and routing.

/** Lower-case, and turn everything that is not a letter or digit into a single space. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Whole-word match. "tar" is found in "fresh tar laid" but not in "start",
 * because both the text and the phrase are wrapped in spaces before comparing.
 */
export function containsPhrase(normalizedText: string, phrase: string): boolean {
  const needle = normalize(phrase);
  return needle.length > 0 && ` ${normalizedText} `.includes(` ${needle} `);
}

const STOP_WORDS = new Set(
  'the a an is are was were of in on at to for and or but with from this that it its has have had be been not no very there here near my our your please sir hai hain ka ki ke ko se me mein par aur nahi bhi ho raha rahi rahe tha thi kar'.split(' ')
);

export function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/** Cosine similarity of word counts: 0 = no shared words, 1 = same words in the same proportions. */
export function textSimilarity(a: string, b: string): number {
  const count = (words: string[]) => {
    const map = new Map<string, number>();
    for (const w of words) map.set(w, (map.get(w) ?? 0) + 1);
    return map;
  };
  const ca = count(tokens(a));
  const cb = count(tokens(b));
  if (ca.size === 0 || cb.size === 0) return 0;
  let dot = 0;
  ca.forEach((n, word) => {
    dot += n * (cb.get(word) ?? 0);
  });
  const magnitude = (m: Map<string, number>) => Math.sqrt(Array.from(m.values()).reduce((sum, n) => sum + n * n, 0));
  return dot / (magnitude(ca) * magnitude(cb));
}
