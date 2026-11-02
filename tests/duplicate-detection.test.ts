import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, calculateTextSimilarity } from '../src/lib/utils';

describe('Duplicate Detection Algorithms', () => {
  it('calculates Haversine geographic distance correctly', () => {
    // Exact same coordinates should yield 0 km
    const distZero = calculateHaversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
    expect(distZero).toBe(0);

    // Nearby coordinates (~30-50 meters apart)
    const distClose = calculateHaversineDistance(28.7041, 77.1025, 28.7043, 77.1028);
    expect(distClose).toBeLessThan(0.1); // Less than 100 meters
    expect(distClose).toBeGreaterThan(0.01);

    // Missing coordinates should safely return a large distance
    const distMissing = calculateHaversineDistance(null, null, 28.7041, 77.1025);
    expect(distMissing).toBeGreaterThanOrEqual(9999);
  });

  it('calculates TF-IDF token text similarity correctly', () => {
    // Identical text should return 1.0 (100%)
    const simIdentical = calculateTextSimilarity(
      'Deep pothole on main road causing accidents',
      'Deep pothole on main road causing accidents'
    );
    expect(simIdentical).toBe(1);

    // High similarity overlapping text
    const simHigh = calculateTextSimilarity(
      'Major water pipeline burst flooding Main Market Sector 4',
      'Huge water leak and pipe burst in Sector 4 commercial market'
    );
    expect(simHigh).toBeGreaterThan(0.5);

    // Completely disjoint text should return 0.0
    const simDisjoint = calculateTextSimilarity(
      'pothole road asphalt broken',
      'streetlights transformer electric voltage electricity'
    );
    expect(simDisjoint).toBe(0);
  });
});
