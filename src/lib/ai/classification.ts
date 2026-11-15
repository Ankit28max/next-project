// Rule-based classifier: always available, needs no network. It counts keyword hits.
import { CATEGORIES, OTHER_CATEGORY, URGENT_PHRASES, type Severity } from './categories';
import { containsPhrase, normalize } from './text';

export interface RuleClassification {
  categoryCode: string;
  /** Sum of the weights of the matched keywords. A match strength, NOT a probability. */
  matchStrength: number;
  matchedKeywords: string[];
  severity: Severity;
  reasons: string[];
}

export function classifyByRules(title: string, description: string): RuleClassification {
  const text = normalize(`${title} ${description}`);

  let best = { code: OTHER_CATEGORY.code, name: OTHER_CATEGORY.name, score: 0, matched: [] as string[], severity: OTHER_CATEGORY.defaultSeverity };
  for (const category of CATEGORIES) {
    const matched = Object.keys(category.keywords).filter((keyword) => containsPhrase(text, keyword));
    const score = matched.reduce((sum, keyword) => sum + category.keywords[keyword], 0);
    // Strictly greater: on a tie the category listed first in CATEGORIES is kept.
    if (score > best.score) {
      best = { code: category.code, name: category.name, score, matched, severity: category.defaultSeverity };
    }
  }

  const urgentWords = URGENT_PHRASES.filter((phrase) => containsPhrase(text, phrase));
  const reasons =
    best.score > 0
      ? [`Keywords for "${best.name}": ${best.matched.join(', ')}`]
      : ['No category keywords found, so it was filed under "Other Civic Issue".'];
  if (urgentWords.length > 0) reasons.push(`Urgency words: ${urgentWords.join(', ')}`);

  return {
    categoryCode: best.code,
    matchStrength: best.score,
    matchedKeywords: best.matched,
    severity: urgentWords.length > 0 ? 'URGENT' : best.severity,
    reasons,
  };
}
