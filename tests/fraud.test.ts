import { describe, expect, it } from 'vitest';
import { FRAUD } from '@/lib/ai/config';
import { assessFraud, looksLikeSpam, riskLevel, type FraudSignals } from '@/lib/ai/fraud';

const submittedAt = new Date('2026-11-10T10:00:00Z');

const clean: FraudSignals = {
  text: 'Deep pothole near the bus stand. Two bikes slipped here yesterday evening.',
  submittedAt,
  latitude: 31.2536,
  longitude: 75.7037,
  image: { hasExif: true, exifTakenAt: new Date('2026-11-10T09:00:00Z'), exifLat: 31.2536, exifLng: 75.7037, exifSoftware: null },
  photoReusedByOthers: [],
  photoReusedBySelf: 0,
  recentSubmissions: 0,
  duplicateOfOwnComplaint: false,
  imageMatchesText: null,
  looksLikeStockOrScreenshot: null,
};

describe('riskLevel', () => {
  it('uses the single pair of thresholds from the config', () => {
    expect(riskLevel(FRAUD.MEDIUM_AT - 1)).toBe('LOW');
    expect(riskLevel(FRAUD.MEDIUM_AT)).toBe('MEDIUM');
    expect(riskLevel(FRAUD.HIGH_AT - 1)).toBe('MEDIUM');
    expect(riskLevel(FRAUD.HIGH_AT)).toBe('HIGH');
  });
});

describe('looksLikeSpam', () => {
  it('flags filler text', () => {
    expect(looksLikeSpam('asdf asdf asdf asdf qwerty')).toBe(true);
    expect(looksLikeSpam('aaaaaaaa bbbbbbb help help')).toBe(true);
    expect(looksLikeSpam('fix it')).toBe(true);
  });

  it('does not flag real text that contains numbers', () => {
    expect(looksLikeSpam('People throw household waste in the empty Plot 12345 next to our house.')).toBe(false);
    expect(looksLikeSpam('Call 9999999999 for directions to the broken streetlight near gate 2')).toBe(false);
  });
});

describe('assessFraud', () => {
  it('gives a clean complaint a score of 0 and says so', () => {
    const result = assessFraud(clean);
    expect(result.score).toBe(0);
    expect(result.level).toBe('LOW');
    expect(result.reasons).toEqual(['No risk signals were triggered.']);
  });

  it('flags a photo that another citizen already used, naming the complaint', () => {
    const result = assessFraud({ ...clean, photoReusedByOthers: ['JS-2026-ABC234'] });
    expect(result.score).toBe(FRAUD.POINTS.photoReusedByOtherCitizen);
    expect(result.level).toBe('MEDIUM');
    expect(result.reasons[0]).toContain('JS-2026-ABC234');
  });

  it('flags photo GPS far from the pin and an old capture date', () => {
    const result = assessFraud({
      ...clean,
      image: { hasExif: true, exifTakenAt: new Date('2025-03-01T08:00:00Z'), exifLat: 28.6139, exifLng: 77.209, exifSoftware: null },
    });
    expect(result.score).toBe(FRAUD.POINTS.exifGpsFarFromPin + FRAUD.POINTS.exifTimeInconsistent);
    expect(result.reasons).toHaveLength(2);
  });

  it('treats missing EXIF as a weak signal only', () => {
    const result = assessFraud({ ...clean, image: { hasExif: false, exifTakenAt: null, exifLat: null, exifLng: null, exifSoftware: null } });
    expect(result.score).toBe(FRAUD.POINTS.exifMissing);
    expect(result.level).toBe('LOW');
  });

  it('uses vision-model findings when they exist', () => {
    const result = assessFraud({ ...clean, imageMatchesText: false, looksLikeStockOrScreenshot: true });
    expect(result.score).toBe(FRAUD.POINTS.imageTextMismatch + FRAUD.POINTS.stockOrScreenshot);
  });

  it('flags rapid submissions and resubmitting one\'s own complaint', () => {
    const result = assessFraud({ ...clean, recentSubmissions: FRAUD.VELOCITY_MAX_SUBMISSIONS, duplicateOfOwnComplaint: true });
    expect(result.score).toBe(FRAUD.POINTS.velocity + FRAUD.POINTS.selfDuplicate);
  });

  it('reaches HIGH when several signals combine, and never exceeds 100', () => {
    const result = assessFraud({
      ...clean,
      text: 'asdf asdf asdf qwerty',
      photoReusedByOthers: ['JS-2026-ABC234'],
      imageMatchesText: false,
      looksLikeStockOrScreenshot: true,
      recentSubmissions: 5,
    });
    expect(result.level).toBe('HIGH');
    expect(result.score).toBeLessThanOrEqual(100);
    // Every point is explained.
    expect(result.reasons.length).toBeGreaterThanOrEqual(5);
  });
});
