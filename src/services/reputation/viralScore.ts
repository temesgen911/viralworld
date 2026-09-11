/**
 * Deterministic VIRAL SCORE & Reputation Engine
 * Range: 0 to 100
 *
 * Mathematical Formula:
 * 1. Accuracy Component (max 40 pts):
 *    (profitableCalls / resolvedMarkets) * 40
 *    Requires >= 3 resolved markets; otherwise scales proportionally to avoid 1-prediction 100% distortions.
 *
 * 2. Activity / Experience Component (max 20 pts):
 *    min(20, ln(1 + resolvedMarkets) * 4.5)
 *
 * 3. Early Viral Call Component (max 25 pts):
 *    min(25, viralCalls * 5)
 *    Reward for spotting content before it hit 10% of target milestone.
 *
 * 4. Virtual ROI Component (max 15 pts):
 *    min(15, max(0, (virtualROI + 20) * 0.2))
 */

export interface ReputationInput {
  resolvedMarkets: number;
  profitableCalls: number;
  viralCalls: number;
  virtualROI: number; // percentage, e.g. 24.5
}

export function calculateViralScore(stats: ReputationInput): number {
  const { resolvedMarkets, profitableCalls, viralCalls, virtualROI } = stats;

  if (resolvedMarkets <= 0) {
    return 10; // Baseline entry score for new predictors
  }

  // 1. Accuracy (0 - 40 pts)
  const rawAccuracy = profitableCalls / resolvedMarkets;
  // Credibility weight for low sample counts (requires at least 5 resolved to receive full accuracy weighting)
  const credibilityFactor = Math.min(1, resolvedMarkets / 5);
  const accuracyScore = rawAccuracy * 40 * credibilityFactor;

  // 2. Experience (0 - 20 pts)
  const experienceScore = Math.min(20, Math.log(1 + resolvedMarkets) * 4.5);

  // 3. Early Viral Calls (0 - 25 pts)
  const viralCallsScore = Math.min(25, viralCalls * 5);

  // 4. Virtual ROI (0 - 15 pts)
  // ROI of +55% gives full 15 points; negative ROI tapers down safely
  const roiScore = Math.min(15, Math.max(0, (virtualROI + 20) * 0.2));

  const total = Math.round(accuracyScore + experienceScore + viralCallsScore + roiScore);
  return Math.max(1, Math.min(100, total));
}

/**
 * Minimum resolved markets required for official leaderboard ranking
 */
export const MIN_RESOLVED_FOR_RANKING = 3;

/**
 * Checks if a winning trade qualifies as an official early "Viral Call"
 * Condition: User backed YES, market resolved YES, and user entered when
 * content metric was <= 10% of target milestone.
 */
export function isEarlyViralCall(entryMetric: number, targetMetric: number): boolean {
  if (targetMetric <= 0) return false;
  return entryMetric <= targetMetric * 0.10;
}
