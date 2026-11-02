import { describe, it, expect } from 'vitest';

describe('Suspicious Complaint & Fraud Risk Assessment Heuristics', () => {
  const gibberishRegex = /(.)\1{4,}|asdf|qwerty|zxcv|12345/i;

  it('detects keyboard smash and spam patterns in text', () => {
    expect(gibberishRegex.test('road broken asdfghjk test')).toBe(true);
    expect(gibberishRegex.test('testing qwerty keyboard')).toBe(true);
    expect(gibberishRegex.test('urgent water pipe burst in sector 4')).toBe(false);
  });

  it('computes severity score bounds properly', () => {
    let score = 10; // Baseline
    const text = 'test 12345';

    // Extremely short text penalty
    if (text.length < 20) score += 25;
    // Gibberish penalty
    if (gibberishRegex.test(text)) score += 30;

    expect(score).toBe(65);
    const riskLevel = score >= 65 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    expect(riskLevel).toBe('HIGH');
  });

  it('rates genuine complaints as LOW risk', () => {
    let score = 10;
    const genuineText = 'Large crater on Outer Ring Road flyover near Munirka causing safety issues';

    if (genuineText.length < 20) score += 25;
    if (gibberishRegex.test(genuineText)) score += 30;

    expect(score).toBe(10);
    const riskLevel = score >= 65 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    expect(riskLevel).toBe('LOW');
  });
});
