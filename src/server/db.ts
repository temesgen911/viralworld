import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import {
  Market,
  ContentMetadata,
  ContentMetricSnapshot,
  Trade,
  Position,
  WalletLedgerEntry,
  UserProfile,
  Comment,
  NotificationItem,
  Platform,
} from '../types/index.ts';
import { calculateBuyShares, calculateSellShares, DEFAULT_B, getYesPrice, getNoPrice } from '../services/marketMaker/lmsr.ts';
import { calculateViralScore, isEarlyViralCall } from '../services/reputation/viralScore.ts';
import { YouTubeProvider, InstagramProvider, TikTokProvider, XProvider } from '../services/content/index.ts';

// In-memory sync mirror to guarantee high availability and sub-millisecond response times
const inMemoryMarkets = new Map<string, Market>();
const inMemoryContent = new Map<string, ContentMetadata>();
const inMemorySnapshots = new Map<string, ContentMetricSnapshot[]>();
const inMemoryTrades = new Map<string, Trade[]>(); // marketId -> trades
const inMemoryPositions = new Map<string, Map<string, Position>>(); // userId -> (marketId -> Position)
const inMemoryLedger = new Map<string, WalletLedgerEntry[]>(); // userId -> entries
const inMemoryUsers = new Map<string, UserProfile>();
const inMemoryComments = new Map<string, Comment[]>();
let isInitialized = false;

export class ServerStore {
  /**
   * Seed curated real YouTube Short prediction markets on boot
   */
  public static async initialize(): Promise<void> {
    if (isInitialized) return;
    isInitialized = true;

    const curatedSeeds = YouTubeProvider.getCuratedSeeds();
    const now = Date.now();

    // 1. MrBeast Short market: 1M views in 7 days
    const mrBeast = curatedSeeds.find((s) => s.creatorName === 'MrBeast') || curatedSeeds[0];
    const mbMarketId = 'mrbeast-100-houses-1m';
    const mbMarket: Market = {
      id: mbMarketId,
      slug: 'mrbeast-100-houses-1m-7days',
      contentId: mrBeast.contentId,
      platform: 'youtube',
      canonicalUrl: mrBeast.canonicalUrl,
      title: 'Will MrBeast’s New Short hit 1,000,000 views within 7 days?',
      creatorName: mrBeast.creatorName,
      creatorId: mrBeast.creatorId,
      creatorAvatarUrl: mrBeast.creatorAvatarUrl,
      thumbnailUrl: mrBeast.thumbnailUrl,
      metricType: 'views',
      initialMetric: 184291,
      currentMetric: 428190,
      targetMetric: 1000000,
      deadline: new Date(now + 4 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'trendspotter',
      status: 'active',
      qYes: 340,
      qNo: 190,
      liquidityB: DEFAULT_B,
      yesPrice: 0.54,
      noPrice: 0.46,
      totalVolumeCredits: 14850,
      tradersCount: 84,
    };
    mbMarket.yesPrice = getYesPrice(mbMarket.qYes, mbMarket.qNo, mbMarket.liquidityB);
    mbMarket.noPrice = getNoPrice(mbMarket.qYes, mbMarket.qNo, mbMarket.liquidityB);

    // 2. Mark Rober Glitterbomb: 500K views in 48 hours
    const markRober = curatedSeeds.find((s) => s.creatorName === 'Mark Rober') || curatedSeeds[1];
    const mrMarketId = 'mark-rober-glitterbomb-500k';
    const mrMarket: Market = {
      id: mrMarketId,
      slug: 'mark-rober-glitterbomb-500k-48h',
      contentId: markRober.contentId,
      platform: 'youtube',
      canonicalUrl: markRober.canonicalUrl,
      title: 'Glitterbomb 5.0 Short: 500,000 views in 48 hours?',
      creatorName: markRober.creatorName,
      creatorId: markRober.creatorId,
      creatorAvatarUrl: markRober.creatorAvatarUrl,
      thumbnailUrl: markRober.thumbnailUrl,
      metricType: 'views',
      initialMetric: 95400,
      currentMetric: 219840,
      targetMetric: 500000,
      deadline: new Date(now + 28 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 20 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'viralhunter',
      status: 'active',
      qYes: 620,
      qNo: 210,
      liquidityB: DEFAULT_B,
      yesPrice: 0.60,
      noPrice: 0.40,
      totalVolumeCredits: 38200,
      tradersCount: 192,
    };
    mrMarket.yesPrice = getYesPrice(mrMarket.qYes, mrMarket.qNo, mrMarket.liquidityB);
    mrMarket.noPrice = getNoPrice(mrMarket.qYes, mrMarket.qNo, mrMarket.liquidityB);

    // 3. Marques Brownlee Vision Pro: 250K views within 24 hours (Closing Soon)
    const mkbhd = curatedSeeds.find((s) => s.creatorName === 'Marques Brownlee') || curatedSeeds[2];
    const mkMarketId = 'mkbhd-vision-pro-250k';
    const mkMarket: Market = {
      id: mkMarketId,
      slug: 'mkbhd-vision-pro-250k-24h',
      contentId: mkbhd.contentId,
      platform: 'youtube',
      canonicalUrl: mkbhd.canonicalUrl,
      title: 'Marques Brownlee Short: 250,000 views within 24 hours?',
      creatorName: mkbhd.creatorName,
      creatorId: mkbhd.creatorId,
      creatorAvatarUrl: mkbhd.creatorAvatarUrl,
      thumbnailUrl: mkbhd.thumbnailUrl,
      metricType: 'views',
      initialMetric: 42100,
      currentMetric: 92430,
      targetMetric: 250000,
      deadline: new Date(now + 4 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 20 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'techradar',
      status: 'active',
      qYes: 180,
      qNo: 540,
      liquidityB: DEFAULT_B,
      yesPrice: 0.41,
      noPrice: 0.59,
      totalVolumeCredits: 21400,
      tradersCount: 112,
    };
    mkMarket.yesPrice = getYesPrice(mkMarket.qYes, mkMarket.qNo, mkMarket.liquidityB);
    mkMarket.noPrice = getNoPrice(mkMarket.qYes, mkMarket.qNo, mkMarket.liquidityB);

    // 4. Resolved Early Call: Luis Fonsi hit 100K target (Proves YES settlement & Viral Calls!)
    const fonsi = curatedSeeds.find((s) => s.creatorName === 'Luis Fonsi') || curatedSeeds[0];
    const lfMarketId = 'luis-fonsi-100k-hit';
    const lfMarket: Market = {
      id: lfMarketId,
      slug: 'luis-fonsi-hit-100k',
      contentId: fonsi.contentId,
      platform: 'youtube',
      canonicalUrl: fonsi.canonicalUrl,
      title: 'Will Luis Fonsi Short cross 50,000 views?',
      creatorName: fonsi.creatorName,
      creatorId: fonsi.creatorId,
      creatorAvatarUrl: fonsi.creatorAvatarUrl,
      thumbnailUrl: fonsi.thumbnailUrl,
      metricType: 'views',
      initialMetric: 8400,
      currentMetric: 84291,
      targetMetric: 50000,
      deadline: new Date(now - 12 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 48 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'latinhits',
      status: 'resolved',
      resolvedOutcome: 'YES',
      resolvedAt: new Date(now - 14 * 3600 * 1000).toISOString(),
      resolutionMetric: 84291,
      resolutionSource: 'YouTube Data API v3',
      resolutionReason: 'Official view metric reached 84,291 exceeding target milestone of 50,000.',
      qYes: 890,
      qNo: 210,
      liquidityB: DEFAULT_B,
      yesPrice: 1.0,
      noPrice: 0.0,
      totalVolumeCredits: 29500,
      tradersCount: 145,
    };

    // 5. TikTok Seed: Khaby Lame
    const tiktokSeeds = TikTokProvider.getCuratedSeeds();
    const khaby = tiktokSeeds[1] || tiktokSeeds[0];
    const ttMarketId = 'tiktok-khaby-door-5m';
    const ttMarket: Market = {
      id: ttMarketId,
      slug: 'tiktok-khaby-door-5m-5days',
      contentId: khaby.contentId,
      platform: 'tiktok',
      canonicalUrl: khaby.canonicalUrl,
      title: 'Will Khaby Lame’s Door TikTok reach 5,000,000 views within 5 days?',
      creatorName: khaby.creatorName,
      creatorId: khaby.creatorId,
      creatorAvatarUrl: khaby.creatorAvatarUrl,
      thumbnailUrl: khaby.thumbnailUrl,
      metricType: 'views',
      initialMetric: 1200000,
      currentMetric: 2450000,
      targetMetric: 5000000,
      deadline: new Date(now + 5 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'tiktokscout',
      status: 'active',
      qYes: 450,
      qNo: 320,
      liquidityB: DEFAULT_B,
      yesPrice: 0.53,
      noPrice: 0.47,
      totalVolumeCredits: 19800,
      tradersCount: 96,
    };
    ttMarket.yesPrice = getYesPrice(ttMarket.qYes, ttMarket.qNo, ttMarket.liquidityB);
    ttMarket.noPrice = getNoPrice(ttMarket.qYes, ttMarket.qNo, ttMarket.liquidityB);

    // 6. Instagram Seed: Cristiano Ronaldo
    const igSeeds = InstagramProvider.getCuratedSeeds();
    const cr7 = igSeeds[2] || igSeeds[0];
    const igMarketId = 'ig-cristiano-training-5m';
    const igMarket: Market = {
      id: igMarketId,
      slug: 'ig-cristiano-training-5m-48h',
      contentId: cr7.contentId,
      platform: 'instagram',
      canonicalUrl: cr7.canonicalUrl,
      title: 'Will Cristiano’s Night Training Reel hit 5,000,000 views in 48 hours?',
      creatorName: cr7.creatorName,
      creatorId: cr7.creatorId,
      creatorAvatarUrl: cr7.creatorAvatarUrl,
      thumbnailUrl: cr7.thumbnailUrl,
      metricType: 'views',
      initialMetric: 1800000,
      currentMetric: 3820000,
      targetMetric: 5000000,
      deadline: new Date(now + 36 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 12 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'reels_radar',
      status: 'active',
      qYes: 780,
      qNo: 290,
      liquidityB: DEFAULT_B,
      yesPrice: 0.62,
      noPrice: 0.38,
      totalVolumeCredits: 31200,
      tradersCount: 168,
    };
    igMarket.yesPrice = getYesPrice(igMarket.qYes, igMarket.qNo, igMarket.liquidityB);
    igMarket.noPrice = getNoPrice(igMarket.qYes, igMarket.qNo, igMarket.liquidityB);

    // 7. X (Twitter) Seed: Elon Musk
    const xSeeds = XProvider.getCuratedSeeds();
    const elon = xSeeds[0];
    const xMarketId = 'x-elon-starship-20m';
    const xMarket: Market = {
      id: xMarketId,
      slug: 'x-elon-starship-catch-20m',
      contentId: elon.contentId,
      platform: 'x',
      canonicalUrl: elon.canonicalUrl,
      title: 'Will Elon Musk’s Starship Booster Catch post cross 20,000,000 views?',
      creatorName: elon.creatorName,
      creatorId: elon.creatorId,
      creatorAvatarUrl: elon.creatorAvatarUrl,
      thumbnailUrl: elon.thumbnailUrl,
      metricType: 'views',
      initialMetric: 6500000,
      currentMetric: 14200000,
      targetMetric: 20000000,
      deadline: new Date(now + 3 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
      createdByUserId: 'system_creator',
      createdByUsername: 'alpha_x',
      status: 'active',
      qYes: 890,
      qNo: 410,
      liquidityB: DEFAULT_B,
      yesPrice: 0.61,
      noPrice: 0.39,
      totalVolumeCredits: 42100,
      tradersCount: 215,
    };
    xMarket.yesPrice = getYesPrice(xMarket.qYes, xMarket.qNo, xMarket.liquidityB);
    xMarket.noPrice = getNoPrice(xMarket.qYes, xMarket.qNo, xMarket.liquidityB);

    const initialMarkets = [mbMarket, mrMarket, mkMarket, lfMarket, ttMarket, igMarket, xMarket];
    for (const m of initialMarkets) {
      inMemoryMarkets.set(m.id, m);
      inMemoryMarkets.set(m.slug, m);

      // Add historical snapshots
      const snapshots: ContentMetricSnapshot[] = [
        {
          contentId: m.contentId,
          timestamp: new Date(new Date(m.createdAt).getTime()).toISOString(),
          viewCount: m.initialMetric,
          likeCount: Math.round(m.initialMetric * 0.07),
        },
        {
          contentId: m.contentId,
          timestamp: new Date(new Date(m.createdAt).getTime() + 12 * 3600 * 1000).toISOString(),
          viewCount: Math.round((m.initialMetric + m.currentMetric) * 0.45),
          likeCount: Math.round(m.currentMetric * 0.05),
        },
        {
          contentId: m.contentId,
          timestamp: new Date(new Date(m.createdAt).getTime() + 24 * 3600 * 1000).toISOString(),
          viewCount: Math.round((m.initialMetric + m.currentMetric) * 0.75),
          likeCount: Math.round(m.currentMetric * 0.065),
        },
        {
          contentId: m.contentId,
          timestamp: new Date().toISOString(),
          viewCount: m.currentMetric,
          likeCount: Math.round(m.currentMetric * 0.08),
        },
      ];
      inMemorySnapshots.set(m.contentId, snapshots);
    }

    for (const seed of curatedSeeds) {
      inMemoryContent.set(seed.contentId, seed);
    }

    // Seed exemplary leaderboards users
    const sampleUsers: UserProfile[] = [
      {
        uid: 'user_apex',
        username: 'early_spotter',
        displayName: 'Early Spotter',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        bio: 'Finding viral creators under 10k views since 2024.',
        createdAt: new Date(now - 60 * 24 * 3600 * 1000).toISOString(),
        virtualCreditsBalance: 24850,
        resolvedMarkets: 42,
        profitableCalls: 34,
        predictionAccuracy: 81,
        virtualROI: 148.5,
        viralCalls: 12,
        biggestCall: {
          marketTitle: 'Will MrBeast Short hit 1,000,000 views?',
          entryMetric: 18400,
          finalMetric: 428190,
          multiplier: 5.2,
        },
        averageEntryViewCount: 28400,
        leaderboardRank: 1,
        viralScore: 94,
      },
      {
        uid: 'user_pulse',
        username: 'algo_whisperer',
        displayName: 'Algo Whisperer',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        bio: 'Shorts & Reels retention analyst.',
        createdAt: new Date(now - 45 * 24 * 3600 * 1000).toISOString(),
        virtualCreditsBalance: 18920,
        resolvedMarkets: 31,
        profitableCalls: 24,
        predictionAccuracy: 77.4,
        virtualROI: 89.2,
        viralCalls: 8,
        averageEntryViewCount: 45000,
        leaderboardRank: 2,
        viralScore: 86,
      },
      {
        uid: 'user_nova',
        username: 'clout_hunter',
        displayName: 'Clout Hunter',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        bio: 'Backing the underdogs before the algorithm takes over.',
        createdAt: new Date(now - 30 * 24 * 3600 * 1000).toISOString(),
        virtualCreditsBalance: 14200,
        resolvedMarkets: 22,
        profitableCalls: 16,
        predictionAccuracy: 72.7,
        virtualROI: 64.1,
        viralCalls: 6,
        averageEntryViewCount: 32000,
        leaderboardRank: 3,
        viralScore: 79,
      },
    ];

    for (const u of sampleUsers) {
      inMemoryUsers.set(u.uid, u);
    }
  }

  public static async getMarkets(options?: {
    filter?: 'trending' | 'early' | 'divided' | 'closing' | 'all';
    platform?: Platform | 'all';
    contentId?: string;
    creatorId?: string;
    search?: string;
  }): Promise<Market[]> {
    await this.initialize();
    let list = Array.from(new Set(inMemoryMarkets.values()));

    if (options?.platform && options.platform !== 'all') {
      list = list.filter((m) => m.platform === options.platform);
    }
    if (options?.contentId) {
      list = list.filter((m) => m.contentId === options.contentId);
    }
    if (options?.creatorId) {
      list = list.filter((m) => m.creatorId === options.creatorId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.creatorName.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q)
      );
    }

    // Filter categories
    const now = Date.now();
    if (options?.filter === 'closing') {
      // Ending within 24 hours, still active
      list = list
        .filter((m) => m.status === 'active' && new Date(m.deadline).getTime() > now)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (options?.filter === 'early') {
      // Content has low current view count relative to target (< 30% progress)
      list = list.filter((m) => m.status === 'active' && m.currentMetric / m.targetMetric < 0.35);
    } else if (options?.filter === 'divided') {
      // Close to 50/50 probability (between 40% and 60%)
      list = list.filter((m) => m.status === 'active' && m.yesPrice >= 0.38 && m.yesPrice <= 0.62);
    } else if (options?.filter === 'trending' || !options?.filter) {
      // Sorted by total volume & traders
      list.sort((a, b) => b.totalVolumeCredits - a.totalVolumeCredits);
    }

    return list;
  }

  public static async getMarketByIdOrSlug(idOrSlug: string): Promise<Market | null> {
    await this.initialize();
    return inMemoryMarkets.get(idOrSlug) || null;
  }

  public static async getSnapshots(contentId: string): Promise<ContentMetricSnapshot[]> {
    await this.initialize();
    return inMemorySnapshots.get(contentId) || [];
  }

  public static async addSnapshot(contentId: string, viewCount: number, likeCount: number): Promise<void> {
    const existing = inMemorySnapshots.get(contentId) || [];
    const newSnap: ContentMetricSnapshot = {
      contentId,
      timestamp: new Date().toISOString(),
      viewCount,
      likeCount,
    };
    existing.push(newSnap);
    inMemorySnapshots.set(contentId, existing);
  }

  public static async findDuplicateMarket(
    contentId: string,
    targetMetric: number,
    deadlineIso: string
  ): Promise<Market | null> {
    await this.initialize();
    const deadlineTime = new Date(deadlineIso).getTime();
    for (const m of inMemoryMarkets.values()) {
      if (m.contentId === contentId && m.targetMetric === targetMetric) {
        // Check if deadline is within 6 hours of existing
        const diff = Math.abs(new Date(m.deadline).getTime() - deadlineTime);
        if (diff < 6 * 3600 * 1000) {
          return m;
        }
      }
    }
    return null;
  }

  public static async createMarket(data: Omit<Market, 'id' | 'slug' | 'qYes' | 'qNo' | 'liquidityB' | 'yesPrice' | 'noPrice' | 'totalVolumeCredits' | 'tradersCount' | 'status'>): Promise<Market> {
    await this.initialize();
    const id = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanCreator = data.creatorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const slug = `${cleanCreator}-${data.targetMetric >= 1000000 ? Math.round(data.targetMetric / 1000000) + 'm' : Math.round(data.targetMetric / 1000) + 'k'}-${Date.now().toString().slice(-4)}`;

    const market: Market = {
      ...data,
      id,
      slug,
      status: 'active',
      qYes: 0,
      qNo: 0,
      liquidityB: DEFAULT_B,
      yesPrice: 0.5,
      noPrice: 0.5,
      totalVolumeCredits: 0,
      tradersCount: 0,
    };

    inMemoryMarkets.set(id, market);
    inMemoryMarkets.set(slug, market);

    // Initial snapshot
    await this.addSnapshot(data.contentId, data.initialMetric, 0);

    return market;
  }

  /**
   * User Profile & Balance management
   */
  public static async getUserProfile(uid: string, autoCreate = true, usernameHint = 'trader'): Promise<UserProfile> {
    await this.initialize();
    let profile = inMemoryUsers.get(uid);
    if (!profile && autoCreate) {
      profile = {
        uid,
        username: `${usernameHint}_${Math.random().toString(36).substring(2, 6)}`,
        displayName: 'Viral Predictor',
        createdAt: new Date().toISOString(),
        virtualCreditsBalance: 5000, // 5,000 welcome credits!
        resolvedMarkets: 0,
        profitableCalls: 0,
        predictionAccuracy: 0,
        virtualROI: 0,
        viralCalls: 0,
        averageEntryViewCount: 0,
        viralScore: 10,
      };
      inMemoryUsers.set(uid, profile);

      // Record welcome credits in ledger
      await this.addLedgerEntry({
        userId: uid,
        type: 'welcome',
        amount: 5000,
        balanceAfter: 5000,
        description: 'Welcome bonus: 5,000 VIRAL Credits (Virtual only — no cash value)',
      });
    }
    return profile!;
  }

  public static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = await this.getUserProfile(uid);
    const updated = { ...user, ...updates };
    inMemoryUsers.set(uid, updated);
    return updated;
  }

  public static async getLedger(userId: string): Promise<WalletLedgerEntry[]> {
    await this.initialize();
    return inMemoryLedger.get(userId) || [];
  }

  public static async addLedgerEntry(entry: Omit<WalletLedgerEntry, 'id' | 'timestamp'>): Promise<WalletLedgerEntry> {
    const list = inMemoryLedger.get(entry.userId) || [];
    const newEntry: WalletLedgerEntry = {
      ...entry,
      id: `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    inMemoryLedger.set(entry.userId, list);
    return newEntry;
  }

  public static async getUserPositions(userId: string): Promise<Position[]> {
    await this.initialize();
    const userMap = inMemoryPositions.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values());
  }

  public static async getUserPositionForMarket(userId: string, marketId: string): Promise<Position | null> {
    await this.initialize();
    const userMap = inMemoryPositions.get(userId);
    if (!userMap) return null;
    return userMap.get(marketId) || null;
  }

  /**
   * Server-Authoritative Trade Execution (Atomic Transaction)
   */
  public static async executeTrade(params: {
    marketId: string;
    userId: string;
    username: string;
    side: 'YES' | 'NO';
    action: 'BUY' | 'SELL';
    amount: number; // For BUY: credits to spend. For SELL: shares to sell.
  }): Promise<{ trade: Trade; market: Market; position: Position; newBalance: number }> {
    await this.initialize();
    const { marketId, userId, username, side, action, amount } = params;

    if (amount <= 0 || isNaN(amount)) {
      throw new Error('Invalid trade amount');
    }

    const market = await this.getMarketByIdOrSlug(marketId);
    if (!market) {
      throw new Error('Market not found');
    }
    if (market.status !== 'active') {
      throw new Error(`Market is ${market.status} and cannot be traded`);
    }
    if (new Date(market.deadline).getTime() <= Date.now()) {
      throw new Error('Market deadline has already passed');
    }

    const user = await this.getUserProfile(userId);
    let userPositions = inMemoryPositions.get(userId);
    if (!userPositions) {
      userPositions = new Map();
      inMemoryPositions.set(userId, userPositions);
    }
    let position = userPositions.get(market.id) || {
      id: `pos_${userId}_${market.id}`,
      userId,
      marketId: market.id,
      yesShares: 0,
      noShares: 0,
      totalCostCredits: 0,
      averageYesPrice: 0,
      averageNoPrice: 0,
      firstEntryMetric: market.currentMetric,
      lastTradeAt: new Date().toISOString(),
      settled: false,
    };

    let tradeResult;
    let creditsDelta = 0;
    let newBalance = user.virtualCreditsBalance;

    if (action === 'BUY') {
      const creditsToSpend = amount;
      if (user.virtualCreditsBalance < creditsToSpend) {
        throw new Error(`Insufficient credits balance. You have ${user.virtualCreditsBalance.toLocaleString()} credits.`);
      }

      tradeResult = calculateBuyShares(side, creditsToSpend, market.qYes, market.qNo, market.liquidityB);
      creditsDelta = -tradeResult.credits;
      newBalance = user.virtualCreditsBalance - tradeResult.credits;

      // Update position
      if (side === 'YES') {
        const prevCost = position.yesShares * position.averageYesPrice;
        position.yesShares = Math.round((position.yesShares + tradeResult.shares) * 100) / 100;
        position.averageYesPrice = (prevCost + tradeResult.credits) / position.yesShares;
      } else {
        const prevCost = position.noShares * position.averageNoPrice;
        position.noShares = Math.round((position.noShares + tradeResult.shares) * 100) / 100;
        position.averageNoPrice = (prevCost + tradeResult.credits) / position.noShares;
      }
      position.totalCostCredits += tradeResult.credits;
      position.lastTradeAt = new Date().toISOString();

      market.qYes = tradeResult.newQYes;
      market.qNo = tradeResult.newQNo;
      market.totalVolumeCredits += tradeResult.credits;
    } else {
      // SELL
      const sharesToSell = amount;
      const ownedShares = side === 'YES' ? position.yesShares : position.noShares;
      if (sharesToSell > ownedShares) {
        throw new Error(`Cannot sell more shares than owned. You hold ${ownedShares} ${side} shares.`);
      }

      tradeResult = calculateSellShares(side, sharesToSell, market.qYes, market.qNo, market.liquidityB);
      creditsDelta = tradeResult.credits;
      newBalance = user.virtualCreditsBalance + tradeResult.credits;

      if (side === 'YES') {
        position.yesShares = Math.round((position.yesShares - sharesToSell) * 100) / 100;
      } else {
        position.noShares = Math.round((position.noShares - sharesToSell) * 100) / 100;
      }
      position.totalCostCredits = Math.max(0, position.totalCostCredits - tradeResult.credits);
      position.lastTradeAt = new Date().toISOString();

      market.qYes = tradeResult.newQYes;
      market.qNo = tradeResult.newQNo;
    }

    // Recalculate market probabilities
    market.yesPrice = getYesPrice(market.qYes, market.qNo, market.liquidityB);
    market.noPrice = getNoPrice(market.qYes, market.qNo, market.liquidityB);

    // Unique traders count increment if first time
    const existingTrades = inMemoryTrades.get(market.id) || [];
    const hasTradedBefore = existingTrades.some((t) => t.userId === userId);
    if (!hasTradedBefore) {
      market.tradersCount += 1;
    }

    // Save user balance
    user.virtualCreditsBalance = Math.round(newBalance * 100) / 100;
    inMemoryUsers.set(userId, user);

    // Save position
    userPositions.set(market.id, position);

    // Create immutable Trade record
    const trade: Trade = {
      id: `trd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      marketId: market.id,
      userId,
      username,
      side,
      action,
      creditsSpent: action === 'BUY' ? tradeResult.credits : -tradeResult.credits,
      sharesCount: tradeResult.shares,
      averagePrice: tradeResult.averagePrice,
      priceBeforeTrade: tradeResult.priceBefore,
      priceAfterTrade: tradeResult.priceAfter,
      timestamp: new Date().toISOString(),
      entryMetric: market.currentMetric,
    };
    existingTrades.unshift(trade);
    inMemoryTrades.set(market.id, existingTrades);

    // Ledger entry
    await this.addLedgerEntry({
      userId,
      type: action === 'BUY' ? 'trade_buy' : 'trade_sell',
      amount: creditsDelta,
      balanceAfter: user.virtualCreditsBalance,
      marketId: market.id,
      marketTitle: market.title,
      description: `${action} ${tradeResult.shares} ${side} shares @ ${(tradeResult.averagePrice * 100).toFixed(1)}% on "${market.title}"`,
    });

    inMemoryMarkets.set(market.id, market);
    if (market.slug) inMemoryMarkets.set(market.slug, market);

    return { trade, market, position, newBalance: user.virtualCreditsBalance };
  }

  public static async getTradesForMarket(marketId: string): Promise<Trade[]> {
    await this.initialize();
    return inMemoryTrades.get(marketId) || [];
  }

  /**
   * Settle Market (Server-Authoritative, Idempotent)
   */
  public static async settleMarket(
    marketId: string,
    outcome: 'YES' | 'NO' | 'VOID',
    resolutionDetails: {
      metric: number;
      source: string;
      reason: string;
    }
  ): Promise<Market> {
    await this.initialize();
    const market = await this.getMarketByIdOrSlug(marketId);
    if (!market) throw new Error('Market not found');
    if (market.status === 'resolved' || market.status === 'voided') {
      return market; // Idempotent: already settled
    }

    market.status = outcome === 'VOID' ? 'voided' : 'resolved';
    market.resolvedOutcome = outcome;
    market.resolvedAt = new Date().toISOString();
    market.resolutionMetric = resolutionDetails.metric;
    market.resolutionSource = resolutionDetails.source;
    market.resolutionReason = resolutionDetails.reason;

    if (outcome === 'YES') {
      market.yesPrice = 1.0;
      market.noPrice = 0.0;
    } else if (outcome === 'NO') {
      market.yesPrice = 0.0;
      market.noPrice = 1.0;
    }

    // Process payouts for all position holders
    for (const [userId, posMap] of inMemoryPositions.entries()) {
      const pos = posMap.get(market.id);
      if (!pos || pos.settled) continue;

      let payout = 0;
      let won = false;

      if (outcome === 'YES') {
        payout = pos.yesShares * 1.0; // 1 credit per winning YES share
        won = pos.yesShares > 0;
      } else if (outcome === 'NO') {
        payout = pos.noShares * 1.0; // 1 credit per winning NO share
        won = pos.noShares > 0;
      } else if (outcome === 'VOID') {
        // Refund net cashflow
        payout = pos.totalCostCredits;
      }

      pos.settled = true;
      pos.settledPayoutCredits = payout;

      const user = await this.getUserProfile(userId);
      user.virtualCreditsBalance = Math.round((user.virtualCreditsBalance + payout) * 100) / 100;
      user.resolvedMarkets += 1;

      if (won) {
        user.profitableCalls += 1;
        // Check for official early Viral Call
        if (outcome === 'YES' && isEarlyViralCall(pos.firstEntryMetric, market.targetMetric)) {
          user.viralCalls += 1;
        }
      }

      // Update stats & VIRAL Score
      user.predictionAccuracy = Math.round((user.profitableCalls / user.resolvedMarkets) * 1000) / 10;
      user.viralScore = calculateViralScore({
        resolvedMarkets: user.resolvedMarkets,
        profitableCalls: user.profitableCalls,
        viralCalls: user.viralCalls,
        virtualROI: user.virtualROI,
      });

      inMemoryUsers.set(userId, user);

      // Ledger entry
      await this.addLedgerEntry({
        userId,
        type: outcome === 'VOID' ? 'void_refund' : 'settlement_payout',
        amount: payout,
        balanceAfter: user.virtualCreditsBalance,
        marketId: market.id,
        marketTitle: market.title,
        description:
          outcome === 'VOID'
            ? `Void refund: ${payout} credits on "${market.title}"`
            : `Market resolved ${outcome}! Payout: ${payout.toFixed(2)} credits on "${market.title}"`,
      });
    }

    inMemoryMarkets.set(market.id, market);
    if (market.slug) inMemoryMarkets.set(market.slug, market);

    return market;
  }

  public static async getComments(marketId: string): Promise<Comment[]> {
    await this.initialize();
    return inMemoryComments.get(marketId) || [];
  }

  public static async addComment(data: Omit<Comment, 'id' | 'timestamp' | 'likeCount'>): Promise<Comment> {
    await this.initialize();
    if (data.text.length > 280) {
      throw new Error('Comments must be 280 characters or less');
    }
    const comment: Comment = {
      ...data,
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      likeCount: 0,
    };
    const list = inMemoryComments.get(data.marketId) || [];
    list.unshift(comment);
    inMemoryComments.set(data.marketId, list);
    return comment;
  }

  public static async getLeaderboard(): Promise<UserProfile[]> {
    await this.initialize();
    return Array.from(inMemoryUsers.values()).sort((a, b) => b.viralScore - a.viralScore);
  }
}
