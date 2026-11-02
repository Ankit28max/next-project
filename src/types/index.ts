export type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_CITIZEN_RESPONSE'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REOPENED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  officerProfile?: {
    id: string;
    departmentId: string;
    employeeId: string;
    department: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ComplaintSubmissionInput {
  title: string;
  description: string;
  categoryId?: string;
  preferredDepartmentId?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  urgencyDeclared?: boolean;
  consentGiven: boolean;
  imageUrls?: string[];
}

export interface AIClassificationResult {
  predictedCategory: string;
  confidence: number;
  explanation: string;
  recommendedDepartmentId?: string;
  recommendedDepartmentCode?: string;
  suggestedPriority: Priority;
}

export interface DuplicateDetectionMatch {
  matchedComplaintId: string;
  referenceNumber: string;
  title: string;
  textSimilarity: number;
  imageSimilarity: number;
  geographicDistanceKm: number;
  combinedScore: number;
  matchReason: string;
  createdAt: string;
}

export interface FraudRiskAssessment {
  riskScore: number; // 0 - 100
  riskLevel: FraudRiskLevel;
  flagReasons: string[];
  recommendedAction: string;
  indicators: {
    reusedImageAcrossComplaints: boolean;
    descriptionSpamPattern: boolean;
    categoryImageMismatch: boolean;
    velocityAlert: boolean;
    suspiciousMetadata: boolean;
  };
}

export interface FullAIAnalysisReport {
  classification: AIClassificationResult;
  duplicateScore: number;
  topDuplicates: DuplicateDetectionMatch[];
  fraudAssessment: FraudRiskAssessment;
  provider: string;
  modelVersion: string;
}
