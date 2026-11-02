import { classifyComplaintDeterministic } from './classification';
import { IAIProvider } from './types';
import { AIClassificationResult, DuplicateDetectionMatch, FraudRiskAssessment } from '@/types';

/**
 * Deterministic Mock AI Provider
 * Provides realistic, immediate, zero-cost AI inference for university demonstrations and testing.
 */
export class MockAIProvider implements IAIProvider {
  name = 'Mock AI Engine (Academic Deterministic)';
  version = 'v2.4-civic';

  async classify(title: string, description: string, imageUrl?: string): Promise<AIClassificationResult> {
    // Uses the deterministic multi-keyword & contextual model
    return classifyComplaintDeterministic(title, description);
  }

  async assessFraud(
    title: string,
    description: string,
    categoryName: string,
    imageUrls?: string[],
    duplicateMatches: DuplicateDetectionMatch[] = []
  ): Promise<FraudRiskAssessment> {
    // The main fraud logic is handled in fraud-risk.ts, but provider can annotate
    let score = 12;
    const flagReasons: string[] = [];

    const lower = `${title} ${description}`.toLowerCase();

    if (lower.length < 25) {
      score += 30;
      flagReasons.push('Extremely short submission without location details');
    }

    if (lower.includes('fake') || lower.includes('test test') || lower.includes('spam')) {
      score += 55;
      flagReasons.push('Test / spam markers identified in text input');
    }

    const riskLevel = score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW';

    return {
      riskScore: score,
      riskLevel,
      flagReasons: flagReasons.length > 0 ? flagReasons : ['Verified genuine submission pattern'],
      recommendedAction:
        score > 60
          ? 'Requires manual field officer verification before dispatch.'
          : 'Standard department workflow.',
      indicators: {
        reusedImageAcrossComplaints: false,
        descriptionSpamPattern: score > 40,
        categoryImageMismatch: false,
        velocityAlert: false,
        suspiciousMetadata: false,
      },
    };
  }
}

/**
 * Live Google Gemini Vision Provider
 * Can be activated by providing GEMINI_API_KEY in .env
 */
export class GeminiAIProvider implements IAIProvider {
  name = 'Google Gemini Multimodal';
  version = 'gemini-1.5-flash';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async classify(title: string, description: string, imageUrl?: string): Promise<AIClassificationResult> {
    if (!this.apiKey) {
      // Graceful fallback to deterministic mock if key is missing
      const mock = new MockAIProvider();
      return mock.classify(title, description, imageUrl);
    }

    try {
      const prompt = `You are a civic grievance classifier. Analyze this complaint:
Title: ${title}
Description: ${description}
Return a strict JSON response with:
{
  "predictedCategory": "Roads & Potholes" | "Water Supply & Leakage" | "Sanitation & Garbage" | "Streetlights & Electricity" | "Drainage & Sewage" | "Public Property Damage" | "Other Civic Issues",
  "confidence": number between 0.7 and 0.99,
  "explanation": "brief reason for classification",
  "recommendedDepartmentCode": "PWD" | "WATER" | "ELEC" | "HEALTH",
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          predictedCategory: parsed.predictedCategory || 'Other Civic Issues',
          confidence: parsed.confidence || 0.85,
          explanation: parsed.explanation || 'Classified using Gemini Multimodal Model',
          recommendedDepartmentCode: parsed.recommendedDepartmentCode || 'PWD',
          suggestedPriority: parsed.suggestedPriority || 'MEDIUM',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic fallback:', err);
    }

    const fallback = new MockAIProvider();
    return fallback.classify(title, description, imageUrl);
  }

  async assessFraud(
    title: string,
    description: string,
    categoryName: string,
    imageUrls?: string[],
    duplicateMatches: DuplicateDetectionMatch[] = []
  ): Promise<FraudRiskAssessment> {
    // Default to the deterministic rule-based fraud assessor
    const mock = new MockAIProvider();
    return mock.assessFraud(title, description, categoryName, imageUrls, duplicateMatches);
  }
}

export function getAIProvider(): IAIProvider {
  const providerType = process.env.AI_PROVIDER || 'mock';
  const geminiKey = process.env.GEMINI_API_KEY;

  if (providerType === 'gemini' && geminiKey) {
    return new GeminiAIProvider(geminiKey);
  }

  return new MockAIProvider();
}
