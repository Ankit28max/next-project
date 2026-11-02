import { AIClassificationResult, DuplicateDetectionMatch, FraudRiskAssessment } from '@/types';

export interface AIAnalysisRequest {
  title: string;
  description: string;
  categoryId?: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrls?: string[];
  citizenId: string;
}

export interface IAIProvider {
  name: string;
  version: string;
  classify(title: string, description: string, imageUrl?: string): Promise<AIClassificationResult>;
  assessFraud(
    title: string,
    description: string,
    categoryName: string,
    imageUrls?: string[],
    duplicateMatches?: DuplicateDetectionMatch[]
  ): Promise<FraudRiskAssessment>;
}
