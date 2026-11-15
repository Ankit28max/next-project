import { describe, expect, it } from 'vitest';
import { classifyByRules } from '@/lib/ai/classification';
import { containsPhrase, normalize, textSimilarity } from '@/lib/ai/text';

describe('whole-word matching', () => {
  it('does not match a keyword inside another word', () => {
    expect(containsPhrase(normalize('Please start the work on the broad lane'), 'tar')).toBe(false);
    expect(containsPhrase(normalize('Please start the work on the broad lane'), 'road')).toBe(false);
  });

  it('matches whole words and phrases regardless of case and punctuation', () => {
    expect(containsPhrase(normalize('Fresh TAR was laid.'), 'tar')).toBe(true);
    expect(containsPhrase(normalize('There is a pipe-burst, near my house'), 'pipe burst')).toBe(true);
  });
});

describe('classifyByRules', () => {
  it('classifies an English pothole complaint as ROADS', () => {
    const result = classifyByRules('Deep pothole near bus stand', 'A large pothole on the main road is damaging vehicles.');
    expect(result.categoryCode).toBe('ROADS');
    expect(result.matchedKeywords).toContain('pothole');
    expect(result.matchStrength).toBeGreaterThan(0);
  });

  it('classifies Hinglish text', () => {
    expect(classifyByRules('Kachra uthane koi nahi aata', 'Gali me kachre ka dher laga hai').categoryCode).toBe('SANITATION');
    expect(classifyByRules('Bijli ka khamba jhuk gaya', 'Taar latak rahe hain').categoryCode).toBe('LIGHTING');
  });

  it('is not fooled by substrings ("start", "broad")', () => {
    const result = classifyByRules('Please start soon', 'We need a broad discussion about the colony meeting hall.');
    expect(result.categoryCode).toBe('OTHER');
    expect(result.matchStrength).toBe(0);
  });

  it('breaks ties in a fixed order: the category listed first wins', () => {
    // "road" (ROADS, weight 1) and "water" (WATER_SUPPLY, weight 1) tie; ROADS is listed first.
    const result = classifyByRules('Road and water', 'road water issue reported here');
    expect(result.categoryCode).toBe('ROADS');
    // Same input always gives the same answer.
    expect(classifyByRules('Road and water', 'road water issue reported here')).toEqual(result);
  });

  it('raises severity to URGENT on urgency words', () => {
    expect(classifyByRules('Streetlight wire sparking', 'Live wire is sparking, very dangerous').severity).toBe('URGENT');
    expect(classifyByRules('Streetlight not working', 'The streetlight is off since a week').severity).toBe('MEDIUM');
  });
});

describe('textSimilarity', () => {
  it('is 1 for identical text and 0 for unrelated text', () => {
    expect(textSimilarity('garbage pile near school', 'garbage pile near school')).toBeCloseTo(1);
    expect(textSimilarity('garbage pile near school', 'streetlight broken tonight')).toBe(0);
  });
});
