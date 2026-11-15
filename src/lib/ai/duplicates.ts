// Duplicate detection: is this complaint probably about the same incident as an earlier one?
import type { Prisma } from '@prisma/client';
import { boundingBox, distanceMeters } from '@/lib/geo';
import { hammingDistance } from '@/lib/images/dhash';
import { DUPLICATE } from './config';
import { textSimilarity } from './text';

export interface DuplicateSubject {
  text: string;
  latitude: number;
  longitude: number;
  categoryCode: string | null;
  imageHash: string | null;
}

export interface DuplicateScore {
  textSimilarity: number;
  distanceMeters: number;
  sameCategory: boolean;
  /** null when one of the two complaints has no photo hash. */
  hamming: number | null;
  samePhoto: boolean;
  combinedScore: number;
  isDuplicate: boolean;
  reasons: string[];
}

/** Pure scoring of one pair. No database access, so it is used by the app, the tests and `npm run eval`. */
export function scoreDuplicate(a: DuplicateSubject, b: DuplicateSubject): DuplicateScore {
  const W = DUPLICATE.WEIGHTS;
  const text = textSimilarity(a.text, b.text);
  const meters = distanceMeters(a.latitude, a.longitude, b.latitude, b.longitude);
  const distanceScore = Math.max(0, 1 - meters / DUPLICATE.RADIUS_M);
  const sameCategory = a.categoryCode !== null && a.categoryCode === b.categoryCode;
  const hamming = a.imageHash && b.imageHash ? hammingDistance(a.imageHash, b.imageHash) : null;
  const samePhoto = hamming !== null && hamming <= DUPLICATE.SAME_PHOTO_MAX_HAMMING;

  let total = text * W.text + distanceScore * W.distance + (sameCategory ? W.category : 0);
  let weightUsed = W.text + W.distance + W.category;
  // The photo signal only takes part when both complaints have a photo.
  if (hamming !== null) {
    total += samePhoto ? W.image : 0;
    weightUsed += W.image;
  }
  const combinedScore = Math.round((total / weightUsed) * 100) / 100;

  const reasons: string[] = [];
  if (samePhoto) reasons.push(`Photos are visually the same (${hamming} of 64 hash bits differ)`);
  if (meters <= DUPLICATE.RADIUS_M) reasons.push(`Locations are ${Math.round(meters)} m apart`);
  if (text >= 0.3) reasons.push(`Descriptions share wording (similarity ${text.toFixed(2)})`);
  if (sameCategory) reasons.push('Same category');

  return {
    textSimilarity: Math.round(text * 100) / 100,
    distanceMeters: Math.round(meters),
    sameCategory,
    hamming,
    samePhoto,
    combinedScore,
    isDuplicate: combinedScore >= DUPLICATE.THRESHOLD,
    reasons,
  };
}

export interface DuplicateMatch extends DuplicateScore {
  matchedComplaintId: string;
  matchedCitizenId: string;
}

/**
 * Step 1 (SQL): fetch only nearby, recent, non-rejected complaints.
 * Step 2 (code): score each candidate and keep the ones above the threshold.
 */
export async function findDuplicates(db: Prisma.TransactionClient, subject: DuplicateSubject): Promise<DuplicateMatch[]> {
  const box = boundingBox(subject.latitude, subject.longitude, DUPLICATE.RADIUS_M);
  const since = new Date(Date.now() - DUPLICATE.WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await db.complaint.findMany({
    where: {
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
      createdAt: { gte: since },
      status: { not: 'REJECTED' },
    },
    select: {
      id: true,
      citizenId: true,
      title: true,
      description: true,
      latitude: true,
      longitude: true,
      category: { select: { code: true } },
      images: { select: { imageHash: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: DUPLICATE.MAX_CANDIDATES,
  });

  return candidates
    .map((c) => ({
      matchedComplaintId: c.id,
      matchedCitizenId: c.citizenId,
      ...scoreDuplicate(subject, {
        text: `${c.title} ${c.description}`,
        latitude: c.latitude,
        longitude: c.longitude,
        categoryCode: c.category?.code ?? null,
        imageHash: c.images[0]?.imageHash ?? null,
      }),
    }))
    .filter((match) => match.isDuplicate)
    .sort((x, y) => y.combinedScore - x.combinedScore)
    .slice(0, DUPLICATE.MAX_MATCHES);
}
