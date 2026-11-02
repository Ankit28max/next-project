import { prisma } from '@/lib/db/prisma';
import { DuplicateDetectionMatch, FraudRiskAssessment, FraudRiskLevel } from '@/types';

export interface FraudAssessmentParams {
  complaintId?: string;
  citizenId: string;
  title: string;
  description: string;
  categoryName?: string;
  imageHash?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  duplicateMatches?: DuplicateDetectionMatch[];
}

export async function assessFraudRisk({
  complaintId,
  citizenId,
  title,
  description,
  categoryName = 'General',
  imageHash,
  duplicateMatches = [],
}: FraudAssessmentParams): Promise<FraudRiskAssessment> {
  let riskScore = 10; // Baseline low risk score
  const flagReasons: string[] = [];

  const indicators = {
    reusedImageAcrossComplaints: false,
    descriptionSpamPattern: false,
    categoryImageMismatch: false,
    velocityAlert: false,
    suspiciousMetadata: false,
  };

  const combinedText = `${title} ${description}`.trim();

  // 1. Description Quality & Spam Pattern Check
  // Check for excessively short or repetitive content
  if (combinedText.length < 20) {
    riskScore += 25;
    indicators.descriptionSpamPattern = true;
    flagReasons.push('Description is unusually brief (< 20 characters) and lacks situational details');
  }

  // Check for repeated character sequences or gibberish (e.g., "aaaaa", "qwerty", "asdfgh")
  const gibberishRegex = /(.)\1{4,}|asdf|qwerty|zxcv|12345/i;
  if (gibberishRegex.test(combinedText)) {
    riskScore += 30;
    indicators.descriptionSpamPattern = true;
    flagReasons.push('Repetitive character or keyboard-smash patterns detected in grievance text');
  }

  // 2. Velocity Check (Rapid-fire submissions by the same citizen)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentSubmissionsCount = await prisma.complaint.count({
    where: {
      citizenId,
      createdAt: { gte: tenMinutesAgo },
      id: complaintId ? { not: complaintId } : undefined,
    },
  });

  if (recentSubmissionsCount >= 4) {
    riskScore += 35;
    indicators.velocityAlert = true;
    flagReasons.push(
      `Velocity anomaly: Citizen submitted ${recentSubmissionsCount} grievances in the past 10 minutes`
    );
  }

  // 3. Reused Evidence Image Across Disparate Complaints
  if (imageHash) {
    const reusedImageComplaints = await prisma.complaintImage.findMany({
      where: {
        imageHash,
        complaintId: complaintId ? { not: complaintId } : undefined,
      },
      include: {
        complaint: {
          select: {
            id: true,
            referenceNumber: true,
            citizenId: true,
            title: true,
          },
        },
      },
      take: 5,
    });

    if (reusedImageComplaints.length > 0) {
      // Check if reused by a different citizen or different issue
      const differentUserReuse = reusedImageComplaints.some(
        (img) => img.complaint.citizenId !== citizenId
      );

      if (differentUserReuse) {
        riskScore += 45;
        indicators.reusedImageAcrossComplaints = true;
        const refNumbers = reusedImageComplaints.map((c) => c.complaint.referenceNumber).join(', ');
        flagReasons.push(
          `Image evidence hash matches existing submissions from different citizen accounts (${refNumbers})`
        );
      } else if (reusedImageComplaints.length > 2) {
        riskScore += 20;
        indicators.reusedImageAcrossComplaints = true;
        flagReasons.push('Image evidence previously submitted multiple times by this citizen');
      }
    }
  }

  // 4. Inconsistent Category & Description Signals
  const categoryKeywords: Record<string, string[]> = {
    Roads: ['road', 'pothole', 'street', 'asphalt', 'tar', 'highway'],
    Water: ['water', 'pipe', 'leak', 'drain', 'supply', 'pressure', 'meter', 'tap'],
    Sanitation: ['garbage', 'trash', 'waste', 'cleaning', 'dump', 'dustbin', 'filth'],
    Electricity: ['light', 'pole', 'electric', 'wire', 'power', 'bulb', 'dark', 'cable'],
  };

  const matchedKeywords = Object.entries(categoryKeywords).find(([key]) =>
    categoryName.toLowerCase().includes(key.toLowerCase())
  );

  if (matchedKeywords && combinedText.length > 30) {
    const hasCategoryWords = matchedKeywords[1].some((word) =>
      combinedText.toLowerCase().includes(word)
    );
    if (!hasCategoryWords) {
      riskScore += 15;
      indicators.categoryImageMismatch = true;
      flagReasons.push(
        `Grievance content does not contain typical terminology for category "${categoryName}"`
      );
    }
  }

  // Clamp score between 5 and 98
  riskScore = Math.min(98, Math.max(5, riskScore));

  let riskLevel: FraudRiskLevel = 'LOW';
  let recommendedAction = 'Routine department processing. Evidence appears standard.';

  if (riskScore >= 65) {
    riskLevel = 'HIGH';
    recommendedAction =
      'Hold for manual department officer verification. Request high-resolution geo-tagged photo or on-site field inspection.';
  } else if (riskScore >= 35) {
    riskLevel = 'MEDIUM';
    recommendedAction =
      'Proceed with standard review, but verify image uniqueness and citizen contact details before dispatching field staff.';
  }

  return {
    riskScore,
    riskLevel,
    flagReasons:
      flagReasons.length > 0
        ? flagReasons
        : ['No suspicious patterns detected. Standard grievance submission.'],
    recommendedAction,
    indicators,
  };
}
