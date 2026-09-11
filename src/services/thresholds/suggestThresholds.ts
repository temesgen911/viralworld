import { SuggestedThreshold } from '../../types/index.ts';

const CULTURAL_MILESTONES = [
  10_000,
  25_000,
  50_000,
  100_000,
  250_000,
  500_000,
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
  25_000_000,
  50_000_000,
  100_000_000,
];

export function formatMetricNumber(val: number): string {
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return val.toLocaleString();
}

/**
 * Deterministic suggestion of 4 progressive market thresholds
 * strictly larger than current metric, mapped to culturally rounded milestones.
 */
export function suggestThresholds(currentMetric: number, metricType: 'views' | 'likes' = 'views'): SuggestedThreshold[] {
  const now = Date.now();

  // Find the smallest milestone strictly greater than current metric
  let nextMilestoneIdx = CULTURAL_MILESTONES.findIndex((m) => m > currentMetric);
  if (nextMilestoneIdx === -1) {
    nextMilestoneIdx = CULTURAL_MILESTONES.length - 1;
  }

  // Tier 1: Sprint (~24 hours)
  const tier1Target = CULTURAL_MILESTONES[nextMilestoneIdx] || currentMetric * 1.5;
  const tier1Hours = 24;

  // Tier 2: Weekend (~48 hours)
  const tier2Idx = Math.min(CULTURAL_MILESTONES.length - 1, nextMilestoneIdx + 1);
  const tier2Target = CULTURAL_MILESTONES[tier2Idx] || currentMetric * 2.5;
  const tier2Hours = 48;

  // Tier 3: Breakout (~3 days / 72 hours)
  const tier3Idx = Math.min(CULTURAL_MILESTONES.length - 1, nextMilestoneIdx + 2);
  const tier3Target = CULTURAL_MILESTONES[tier3Idx] || currentMetric * 5;
  const tier3Hours = 72;

  // Tier 4: Mega Viral (~7 days / 168 hours)
  const tier4Idx = Math.min(CULTURAL_MILESTONES.length - 1, nextMilestoneIdx + 3);
  const tier4Target = CULTURAL_MILESTONES[tier4Idx] || currentMetric * 10;
  const tier4Hours = 168;

  return [
    {
      target: tier1Target,
      targetLabel: formatMetricNumber(tier1Target),
      durationLabel: 'Within 24 Hours',
      durationHours: tier1Hours,
      deadlineIso: new Date(now + tier1Hours * 3600 * 1000).toISOString(),
      estimatedDifficulty: 'Accessible',
    },
    {
      target: tier2Target,
      targetLabel: formatMetricNumber(tier2Target),
      durationLabel: 'Within 48 Hours',
      durationHours: tier2Hours,
      deadlineIso: new Date(now + tier2Hours * 3600 * 1000).toISOString(),
      estimatedDifficulty: 'Moderate',
    },
    {
      target: tier3Target,
      targetLabel: formatMetricNumber(tier3Target),
      durationLabel: 'Within 3 Days',
      durationHours: tier3Hours,
      deadlineIso: new Date(now + tier3Hours * 3600 * 1000).toISOString(),
      estimatedDifficulty: 'Ambitious',
    },
    {
      target: tier4Target,
      targetLabel: formatMetricNumber(tier4Target),
      durationLabel: 'Within 7 Days',
      durationHours: tier4Hours,
      deadlineIso: new Date(now + tier4Hours * 3600 * 1000).toISOString(),
      estimatedDifficulty: 'Ultra Viral',
    },
  ];
}
