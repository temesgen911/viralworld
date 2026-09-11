export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'spotify' | 'twitch';

export type MetricType = 'views' | 'likes';

export type MarketStatus = 'active' | 'pending_resolution' | 'resolved' | 'voided';

export type MarketOutcome = 'YES' | 'NO' | 'VOID';

export interface ContentMetadata {
  contentId: string;
  platform: Platform;
  canonicalUrl: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorId: string;
  creatorAvatarUrl?: string;
  publishedAt: string;
  currentViews: number;
  currentLikes: number;
  lastCheckedAt: string;
}

export interface ContentMetricSnapshot {
  id?: string;
  contentId: string;
  timestamp: string;
  viewCount: number;
  likeCount: number;
}

export interface Market {
  id: string;
  slug: string;
  contentId: string;
  platform: Platform;
  canonicalUrl: string;
  title: string;
  creatorName: string;
  creatorId: string;
  creatorAvatarUrl?: string;
  thumbnailUrl: string;
  metricType: MetricType;
  initialMetric: number;
  currentMetric: number;
  targetMetric: number;
  deadline: string; // ISO string
  createdAt: string; // ISO string
  createdByUserId: string;
  createdByUsername: string;
  status: MarketStatus;
  
  // LMSR Automated Market Maker State
  qYes: number;
  qNo: number;
  liquidityB: number;
  yesPrice: number; // 0 to 1
  noPrice: number;  // 0 to 1
  totalVolumeCredits: number;
  tradersCount: number;
  
  // Resolution details
  resolvedOutcome?: MarketOutcome;
  resolvedAt?: string;
  resolutionMetric?: number;
  resolutionSource?: string;
  resolutionReason?: string;
  
  // Flags & grace period
  unavailableSince?: string;
  gracePeriodDeadline?: string;
}

export interface Trade {
  id: string;
  marketId: string;
  userId: string;
  username: string;
  side: 'YES' | 'NO';
  action: 'BUY' | 'SELL';
  creditsSpent: number; // positive if spent, negative if refunded on sell
  sharesCount: number;
  averagePrice: number;
  priceBeforeTrade: number;
  priceAfterTrade: number;
  timestamp: string;
  entryMetric: number; // Metric at trade time for Viral Call tracking
}

export interface Position {
  id: string;
  userId: string;
  marketId: string;
  yesShares: number;
  noShares: number;
  totalCostCredits: number;
  averageYesPrice: number;
  averageNoPrice: number;
  firstEntryMetric: number;
  lastTradeAt: string;
  settled: boolean;
  settledPayoutCredits?: number;
}

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  type: 'welcome' | 'trade_buy' | 'trade_sell' | 'settlement_payout' | 'void_refund';
  amount: number; // can be negative or positive
  balanceAfter: number;
  marketId?: string;
  marketTitle?: string;
  description: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  profilePhoto?: string;
  bio?: string;
  createdAt: string;
  virtualCreditsBalance: number;
  resolvedMarkets: number;
  profitableCalls: number;
  predictionAccuracy: number; // percentage 0-100
  virtualROI: number; // percentage
  viralCalls: number;
  totalPredictions?: number;
  biggestCall?: {
    marketTitle: string;
    entryMetric: number;
    finalMetric: number;
    multiplier: number;
  };
  bestCall?: {
    marketTitle: string;
    entryMetric: number;
    resolvedMetric: number;
    multiplier: number;
  };
  averageEntryViewCount: number;
  leaderboardRank?: number;
  viralScore: number; // 0-100 reputation score
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  predictionAccuracy: number;
  viralScore: number;
  viralCalls: number;
  virtualROI: number;
  resolvedMarkets: number;
  profitableCalls: number;
}

export interface Comment {
  id: string;
  marketId: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userPhoto?: string;
  text: string;
  timestamp: string;
  likeCount: number;
  parentCommentId?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'win' | 'loss' | 'progress' | 'settlement' | 'market_closing' | 'follow' | 'reply';
  marketId?: string;
  marketSlug?: string;
  read: boolean;
  timestamp: string;
}

export interface SuggestedThreshold {
  target: number;
  targetLabel: string;
  durationLabel: string;
  durationHours: number;
  deadlineIso: string;
  estimatedDifficulty: 'Accessible' | 'Moderate' | 'Ambitious' | 'Ultra Viral';
}
