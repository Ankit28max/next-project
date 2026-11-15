import { describe, expect, it } from 'vitest';
import { DUPLICATE } from '@/lib/ai/config';
import { scoreDuplicate, type DuplicateSubject } from '@/lib/ai/duplicates';
import { boundingBox, distanceMeters } from '@/lib/geo';

const base: DuplicateSubject = {
  text: 'Deep pothole near bus stand. A large pothole on the main road near the bus stand.',
  latitude: 31.2536,
  longitude: 75.7037,
  categoryCode: 'ROADS',
  imageHash: 'f0f0f0f0f0f0f0f0',
};

describe('geo helpers', () => {
  it('measures distance in metres', () => {
    expect(distanceMeters(31.2536, 75.7037, 31.2536, 75.7037)).toBe(0);
    // 0.001 degrees of latitude is about 111 m.
    expect(distanceMeters(31.2536, 75.7037, 31.2546, 75.7037)).toBeGreaterThan(105);
    expect(distanceMeters(31.2536, 75.7037, 31.2546, 75.7037)).toBeLessThan(117);
  });

  it('builds a bounding box that contains the radius', () => {
    const box = boundingBox(31.2536, 75.7037, 500);
    expect(distanceMeters(31.2536, 75.7037, box.maxLat, 75.7037)).toBeCloseTo(500, -1);
    expect(box.minLng).toBeLessThan(75.7037);
  });
});

describe('scoreDuplicate', () => {
  it('flags a nearby complaint with similar wording and the same category', () => {
    const score = scoreDuplicate(base, {
      text: 'Big pothole on main road near bus stand. Large pothole near the bus stand.',
      latitude: 31.2538,
      longitude: 75.704,
      categoryCode: 'ROADS',
      imageHash: '0f0f0f0f0f0f0f0f', // a different photo
    });
    expect(score.isDuplicate).toBe(true);
    expect(score.samePhoto).toBe(false);
    expect(score.distanceMeters).toBeLessThan(50);
    expect(score.reasons.length).toBeGreaterThan(0);
  });

  it('does not flag the same wording far away', () => {
    const score = scoreDuplicate(base, { ...base, latitude: 31.30, longitude: 75.76, imageHash: '0f0f0f0f0f0f0f0f' });
    expect(score.isDuplicate).toBe(false);
  });

  it('does not flag a different problem at the same place', () => {
    const score = scoreDuplicate(base, {
      text: 'Streetlight not working. The lane is dark at night since ten days.',
      latitude: base.latitude,
      longitude: base.longitude,
      categoryCode: 'LIGHTING',
      imageHash: '0f0f0f0f0f0f0f0f',
    });
    expect(score.isDuplicate).toBe(false);
  });

  it('recognises the same photo by Hamming distance', () => {
    const almostSame = 'f0f0f0f0f0f0f0f3'; // 2 bits differ
    const score = scoreDuplicate(base, { ...base, imageHash: almostSame });
    expect(score.hamming).toBe(2);
    expect(score.samePhoto).toBe(true);
  });

  it('leaves the photo out of the score when one side has no hash', () => {
    const score = scoreDuplicate(base, { ...base, imageHash: null });
    expect(score.hamming).toBeNull();
    expect(score.combinedScore).toBe(1); // identical text, place and category
  });

  it('uses the single configured threshold', () => {
    const score = scoreDuplicate(base, { ...base, imageHash: null });
    expect(score.isDuplicate).toBe(score.combinedScore >= DUPLICATE.THRESHOLD);
  });
});
