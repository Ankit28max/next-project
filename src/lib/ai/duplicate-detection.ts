import { prisma } from '@/lib/db/prisma';
import { calculateHaversineDistance, calculateTextSimilarity } from '@/lib/utils';
import { DuplicateDetectionMatch } from '@/types';

export interface DuplicateDetectionParams {
  complaintId?: string;
  title: string;
  description: string;
  categoryId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageHash?: string | null;
  maxRadiusKm?: number;
  threshold?: number;
}

export async function detectDuplicateComplaints({
  complaintId,
  title,
  description,
  categoryId,
  latitude,
  longitude,
  imageHash,
  maxRadiusKm = 2.0,
  threshold = 0.60,
}: DuplicateDetectionParams): Promise<{
  highestDuplicateScore: number;
  matches: DuplicateDetectionMatch[];
}> {
  // Query existing recent complaints (excluding the current one) that are active or recently submitted
  const existingComplaints = await prisma.complaint.findMany({
    where: {
      id: complaintId ? { not: complaintId } : undefined,
      status: {
        notIn: ['REJECTED'],
      },
    },
    include: {
      category: true,
      images: true,
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  const fullNewText = `${title} ${description}`;
  const scoredMatches: DuplicateDetectionMatch[] = [];

  for (const existing of existingComplaints) {
    const existingFullText = `${existing.title} ${existing.description}`;

    // 1. Text Similarity Score (0.0 to 1.0)
    const textSim = calculateTextSimilarity(fullNewText, existingFullText);

    // 2. Geographic Distance & Score
    const distanceKm = calculateHaversineDistance(
      latitude,
      longitude,
      existing.latitude,
      existing.longitude
    );

    // Distance Score: 1.0 if right next to each other (<50m), scaling down to 0 if > maxRadiusKm
    let geoSim = 0.0;
    if (distanceKm <= maxRadiusKm) {
      geoSim = Math.max(0, 1 - distanceKm / maxRadiusKm);
    }

    // 3. Category Match Bonus
    const categoryMatches = Boolean(categoryId && existing.categoryId && categoryId === existing.categoryId);
    const categoryScore = categoryMatches ? 1.0 : 0.0;

    // 4. Image Hash Similarity
    let imgSim = 0.0;
    if (imageHash && existing.images.length > 0) {
      const matchFound = existing.images.some((img) => img.imageHash === imageHash);
      if (matchFound) {
        imgSim = 0.95; // Exact or high perceptual hash match
      }
    }

    // 5. Temporal Proximity (decay over 60 days)
    const ageInDays = (Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const temporalFactor = Math.max(0.5, 1 - ageInDays / 60);

    // Weighted Combined Score calculation:
    // Text: 35%, Geo: 35%, Category: 15%, Image: 15%
    let combined =
      (textSim * 0.35 + geoSim * 0.35 + categoryScore * 0.15 + imgSim * 0.15) * temporalFactor;

    // If both text similarity and geo distance are very high, boost combined score
    if (textSim > 0.65 && distanceKm < 0.3) {
      combined = Math.min(0.99, combined + 0.2);
    }

    // Round to 2 decimal places
    combined = Math.round(combined * 100) / 100;

    if (combined >= threshold) {
      const reasons: string[] = [];
      if (distanceKm < 0.5) reasons.push(`Close proximity (${distanceKm.toFixed(2)} km away)`);
      if (textSim > 0.5) reasons.push(`High text similarity (${Math.round(textSim * 100)}%)`);
      if (categoryMatches) reasons.push('Identical civic category');
      if (imgSim > 0.8) reasons.push('Matching photo evidence signature');

      scoredMatches.push({
        matchedComplaintId: existing.id,
        referenceNumber: existing.referenceNumber,
        title: existing.title,
        textSimilarity: Math.round(textSim * 100) / 100,
        imageSimilarity: Math.round(imgSim * 100) / 100,
        geographicDistanceKm: distanceKm,
        combinedScore: combined,
        matchReason: reasons.join('; ') || 'Moderate multi-signal correlation',
        createdAt: existing.createdAt.toISOString(),
      });
    }
  }

  // Sort descending by combined duplicate score
  scoredMatches.sort((a, b) => b.combinedScore - a.combinedScore);

  const highestScore = scoredMatches.length > 0 ? scoredMatches[0].combinedScore : 0.0;

  return {
    highestDuplicateScore: highestScore,
    matches: scoredMatches.slice(0, 5), // Return top 5 matches
  };
}
