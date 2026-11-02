import { detectDuplicateComplaints } from './duplicate-detection';
import { assessFraudRisk } from './fraud-risk';
import { getAIProvider } from './provider';
import { routeGrievance } from './routing';
import { prisma } from '@/lib/db/prisma';
import { FullAIAnalysisReport } from '@/types';

export interface ProcessComplaintParams {
  complaintId: string;
  citizenId: string;
  title: string;
  description: string;
  categoryId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageHash?: string | null;
  imageUrls?: string[];
}

export async function runFullAIProcessingPipeline({
  complaintId,
  citizenId,
  title,
  description,
  categoryId,
  latitude,
  longitude,
  imageHash,
  imageUrls = [],
}: ProcessComplaintParams): Promise<FullAIAnalysisReport> {
  const provider = getAIProvider();

  try {
    // 1. Classification
    const classification = await provider.classify(title, description, imageUrls[0]);

    // 2. Duplicate Detection
    const duplicateResult = await detectDuplicateComplaints({
      complaintId,
      title,
      description,
      categoryId,
      latitude,
      longitude,
      imageHash,
    });

    // 3. Fraud Risk Assessment
    const fraudAssessment = await assessFraudRisk({
      complaintId,
      citizenId,
      title,
      description,
      categoryName: classification.predictedCategory,
      imageHash,
      duplicateMatches: duplicateResult.matches,
    });

    // 4. Routing & Officer Assignment
    const routing = await routeGrievance(
      categoryId,
      classification.recommendedDepartmentCode,
      `${title} ${description}`
    );

    // 5. Persist Duplicate Matches to Database
    if (duplicateResult.matches.length > 0) {
      await prisma.complaintMatch.deleteMany({
        where: { complaintId },
      });

      for (const match of duplicateResult.matches) {
        await prisma.complaintMatch.create({
          data: {
            complaintId,
            matchedComplaintId: match.matchedComplaintId,
            textSimilarity: match.textSimilarity,
            imageSimilarity: match.imageSimilarity,
            geographicDistance: match.geographicDistanceKm,
            combinedScore: match.combinedScore,
            matchReason: match.matchReason,
          },
        });
      }
    }

    // 6. Persist ComplaintAnalysis Record
    await prisma.complaintAnalysis.create({
      data: {
        complaintId,
        modelProvider: provider.name,
        modelVersion: provider.version,
        predictedCategory: classification.predictedCategory,
        confidence: classification.confidence,
        duplicateScore: duplicateResult.highestDuplicateScore,
        fraudRiskScore: fraudAssessment.riskScore,
        fraudRiskLevel: fraudAssessment.riskLevel,
        explanation: `${classification.explanation} | Routing: ${routing.routingRationale}`,
        rawResult: {
          classification,
          fraudAssessment,
          routing,
          duplicateMatchesCount: duplicateResult.matches.length,
        },
      },
    });

    // 7. Update Complaint with AI Outputs, Assigned Department & Officer
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        aiCategory: classification.predictedCategory,
        aiConfidence: classification.confidence,
        aiExplanation: classification.explanation,
        duplicateScore: duplicateResult.highestDuplicateScore,
        fraudRiskScore: fraudAssessment.riskScore,
        fraudRiskLevel: fraudAssessment.riskLevel,
        priority: classification.suggestedPriority,
        departmentId: routing.departmentId || undefined,
        assignedOfficerId: routing.assignedOfficerId || undefined,
        status: routing.assignedOfficerId ? 'ASSIGNED' : 'UNDER_REVIEW',
      },
    });

    // 8. Create initial Status History record
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId,
        actorId: null, // System / AI Actor
        previousStatus: 'SUBMITTED',
        newStatus: routing.assignedOfficerId ? 'ASSIGNED' : 'UNDER_REVIEW',
        remarks: `AI analysis complete (${provider.name}). ${routing.routingRationale}`,
        isInternal: false,
      },
    });

    return {
      classification,
      duplicateScore: duplicateResult.highestDuplicateScore,
      topDuplicates: duplicateResult.matches,
      fraudAssessment,
      provider: provider.name,
      modelVersion: provider.version,
    };
  } catch (error) {
    console.error('Error during AI grievance processing pipeline:', error);

    // Safe fallback: Complaint remains saved in database in SUBMITTED or UNDER_REVIEW state
    return {
      classification: {
        predictedCategory: 'General Review',
        confidence: 0.5,
        explanation: 'AI Pipeline deferred. Complaint placed in manual triage queue.',
        suggestedPriority: 'MEDIUM',
      },
      duplicateScore: 0,
      topDuplicates: [],
      fraudAssessment: {
        riskScore: 20,
        riskLevel: 'LOW',
        flagReasons: ['Automated pipeline deferred. Pending officer review.'],
        recommendedAction: 'Manual verification recommended.',
        indicators: {
          reusedImageAcrossComplaints: false,
          descriptionSpamPattern: false,
          categoryImageMismatch: false,
          velocityAlert: false,
          suspiciousMetadata: false,
        },
      },
      provider: 'System Fallback',
      modelVersion: '1.0',
    };
  }
}
