import type { ProjectReportSummary } from '../../types/index.js';

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * v1: `missingKeysCount * 5 + dynamicSitesCount * 2`.
 */
export function computeRiskScore(summary: Pick<ProjectReportSummary, 'missingKeysCount' | 'dynamicSitesCount'>): {
  score: number;
  level: RiskLevel;
} {
  const score = summary.missingKeysCount * 5 + summary.dynamicSitesCount * 2;
  let level: RiskLevel = 'low';
  if (score > 0 && score < 15) level = 'medium';
  else if (score >= 15) level = 'high';
  return { score, level };
}
