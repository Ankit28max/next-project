import { AIClassificationResult, Priority } from '@/types';

interface CategoryKeywordRule {
  categoryCode: string;
  categoryName: string;
  departmentCode: string;
  keywords: string[];
  suggestedPriority: Priority;
  baseConfidence: number;
}

const CATEGORY_RULES: CategoryKeywordRule[] = [
  {
    categoryCode: 'ROADS',
    categoryName: 'Roads & Potholes',
    departmentCode: 'PWD',
    keywords: ['pothole', 'road', 'asphalt', 'crater', 'highway', 'street damage', 'pavement', 'tar', 'crack in road', 'traffic barrier'],
    suggestedPriority: 'HIGH',
    baseConfidence: 0.92,
  },
  {
    categoryCode: 'WATER_SUPPLY',
    categoryName: 'Water Supply & Leakage',
    departmentCode: 'WATER',
    keywords: ['water leak', 'pipe burst', 'no water', 'contaminated water', 'pipeline', 'water pressure', 'supply disruption', 'meter leak', 'tap'],
    suggestedPriority: 'HIGH',
    baseConfidence: 0.94,
  },
  {
    categoryCode: 'SANITATION',
    categoryName: 'Sanitation & Garbage',
    departmentCode: 'HEALTH',
    keywords: ['garbage', 'trash', 'waste', 'dump', 'dustbin', 'litter', 'filth', 'stagnant smell', 'cleanliness', 'debris', 'dead animal'],
    suggestedPriority: 'MEDIUM',
    baseConfidence: 0.89,
  },
  {
    categoryCode: 'LIGHTING',
    categoryName: 'Streetlights & Electricity',
    departmentCode: 'ELEC',
    keywords: ['streetlight', 'electric pole', 'sparking wire', 'power cut', 'dark street', 'transformer', 'hanging cable', 'light bulb', 'blackout'],
    suggestedPriority: 'MEDIUM',
    baseConfidence: 0.91,
  },
  {
    categoryCode: 'DRAINAGE',
    categoryName: 'Drainage & Sewage',
    departmentCode: 'WATER',
    keywords: ['drain', 'sewer', 'manhole', 'overflowing drain', 'gutters', 'waterlogging', 'flooding', 'sewage', 'clogged drain'],
    suggestedPriority: 'HIGH',
    baseConfidence: 0.93,
  },
  {
    categoryCode: 'PUBLIC_DAMAGE',
    categoryName: 'Public Property Damage',
    departmentCode: 'PWD',
    keywords: ['broken bench', 'vandalism', 'damaged park', 'fence broken', 'footpath damaged', 'public toilet damage', 'signboard down', 'bus stop'],
    suggestedPriority: 'MEDIUM',
    baseConfidence: 0.86,
  },
];

export function classifyComplaintDeterministic(
  title: string,
  description: string
): AIClassificationResult {
  const content = `${title} ${description}`.toLowerCase();

  let bestMatch: CategoryKeywordRule | null = null;
  let maxKeywordHits = 0;

  for (const rule of CATEGORY_RULES) {
    let hits = 0;
    for (const kw of rule.keywords) {
      if (content.includes(kw)) {
        hits += 1;
      }
    }
    if (hits > maxKeywordHits) {
      maxKeywordHits = hits;
      bestMatch = rule;
    }
  }

  // Check for urgency signals in text
  const urgencyKeywords = ['urgent', 'emergency', 'danger', 'hazard', 'sparking', 'burst', 'accident', 'overflowing', 'critical'];
  const hasUrgency = urgencyKeywords.some((w) => content.includes(w));

  if (bestMatch && maxKeywordHits > 0) {
    const confidence = Math.min(0.98, bestMatch.baseConfidence + maxKeywordHits * 0.02);
    const priority: Priority = hasUrgency ? 'URGENT' : bestMatch.suggestedPriority;

    return {
      predictedCategory: bestMatch.categoryName,
      confidence: Math.round(confidence * 100) / 100,
      recommendedDepartmentCode: bestMatch.departmentCode,
      suggestedPriority: priority,
      explanation: `Identified civic context matching "${bestMatch.categoryName}" based on linguistic markers (${maxKeywordHits} direct indicators found). Recommended routing to ${bestMatch.departmentCode}.`,
    };
  }

  // Fallback for general civic issues
  return {
    predictedCategory: 'Other Civic Issues',
    confidence: 0.72,
    recommendedDepartmentCode: 'PWD',
    suggestedPriority: hasUrgency ? 'HIGH' : 'MEDIUM',
    explanation: 'General civic complaint with broad phrasing. Routed to general Public Works for initial assessment.',
  };
}
