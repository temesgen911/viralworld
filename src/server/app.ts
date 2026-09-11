import express from 'express';
import { ServerStore } from './db.ts';
import { MetricPoller } from './poller.ts';
import {
  ContentProviderRegistry,
  YouTubeProvider,
  InstagramProvider,
  TikTokProvider,
  XProvider,
} from '../services/content/index.ts';
import { suggestThresholds } from '../services/thresholds/suggestThresholds.ts';
import { calculateBuyShares, calculateSellShares, DEFAULT_B } from '../services/marketMaker/lmsr.ts';

export const apiApp = express();

apiApp.use(express.json());

// Boot poller and initial store
ServerStore.initialize().catch((err) => console.error('Failed to initialize server store:', err));
MetricPoller.start(15 * 60 * 1000); // Poll every 15 minutes

// Health check
apiApp.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VIRAL Prediction Market API',
    poller: MetricPoller.getStatus(),
    supportedPlatforms: ['youtube', 'instagram', 'tiktok', 'x'],
    timestamp: new Date().toISOString(),
    virtualCreditsOnly: true,
  });
});

// Multi-Platform URL Analyze Handler (YouTube, Instagram, TikTok, X)
const handleAnalyzeContent = async (req: express.Request, res: express.Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid content URL' });
    }

    const detected = ContentProviderRegistry.detectProvider(url);
    if (!detected) {
      return res.status(400).json({
        error: 'Unsupported platform or link. Please paste a link from YouTube, Instagram, TikTok, or X (Twitter).',
      });
    }

    const metadata = await detected.provider.fetchContent(detected.contentId);
    const suggestedThresholds = suggestThresholds(metadata.currentViews, 'views');

    // Check for similar / existing markets
    const existingMarkets = await ServerStore.getMarkets({ contentId: metadata.contentId });

    res.json({
      metadata,
      suggestedThresholds,
      existingMarketsCount: existingMarkets.length,
      existingMarkets: existingMarkets.map((m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        platform: m.platform,
        targetMetric: m.targetMetric,
        deadline: m.deadline,
        yesPrice: m.yesPrice,
      })),
    });
  } catch (err: any) {
    console.error('Analyze link error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze content link' });
  }
};

apiApp.post('/api/content/analyze', handleAnalyzeContent);
apiApp.post('/api/youtube/analyze', handleAnalyzeContent);

// Get Markets
apiApp.get('/api/markets', async (req, res) => {
  try {
    const filter = req.query.filter as any;
    const platform = req.query.platform as any;
    const contentId = req.query.contentId as string | undefined;
    const creatorId = req.query.creatorId as string | undefined;
    const search = req.query.search as string | undefined;

    const markets = await ServerStore.getMarkets({ filter, platform, contentId, creatorId, search });
    res.json(markets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Market
apiApp.get('/api/markets/:idOrSlug', async (req, res) => {
  try {
    const market = await ServerStore.getMarketByIdOrSlug(req.params.idOrSlug);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const snapshots = await ServerStore.getSnapshots(market.contentId);
    const recentTrades = await ServerStore.getTradesForMarket(market.id);

    res.json({
      market,
      snapshots,
      recentTrades: recentTrades.slice(0, 30),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Market
apiApp.post('/api/markets/create', async (req, res) => {
  try {
    const {
      url,
      targetMetric,
      deadlineIso,
      userId,
      username,
    } = req.body;

    if (!url || !targetMetric || !deadlineIso || !userId) {
      return res.status(400).json({ error: 'Missing required market creation parameters' });
    }

    const detected = ContentProviderRegistry.detectProvider(url);
    if (!detected) {
      return res.status(400).json({ error: 'Unsupported or invalid content URL' });
    }

    const metadata = await detected.provider.fetchContent(detected.contentId);

    // Validation: Target must be greater than current metric
    const target = Number(targetMetric);
    if (isNaN(target) || target <= metadata.currentViews) {
      return res.status(400).json({
        error: `Target must be greater than current view count (${metadata.currentViews.toLocaleString()})`,
      });
    }

    // Validation: Deadline must be in the future, max 30 days
    const deadlineTime = new Date(deadlineIso).getTime();
    const now = Date.now();
    if (deadlineTime <= now) {
      return res.status(400).json({ error: 'Deadline must be in the future' });
    }
    if (deadlineTime > now + 30 * 24 * 3600 * 1000) {
      return res.status(400).json({ error: 'Maximum prediction window is 30 days' });
    }

    // Deduplication check
    const duplicate = await ServerStore.findDuplicateMarket(metadata.contentId, target, deadlineIso);
    if (duplicate) {
      return res.status(409).json({
        error: 'A market with this target milestone and deadline already exists',
        existingMarket: duplicate,
      });
    }

    const title = `Will "${metadata.title}" reach ${target.toLocaleString()} views before ${new Date(deadlineIso).toLocaleDateString()}?`;

    const market = await ServerStore.createMarket({
      contentId: metadata.contentId,
      platform: metadata.platform,
      canonicalUrl: metadata.canonicalUrl,
      title,
      creatorName: metadata.creatorName,
      creatorId: metadata.creatorId,
      creatorAvatarUrl: metadata.creatorAvatarUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      metricType: 'views',
      initialMetric: metadata.currentViews,
      currentMetric: metadata.currentViews,
      targetMetric: target,
      deadline: deadlineIso,
      createdAt: new Date().toISOString(),
      createdByUserId: userId,
      createdByUsername: username || 'predictor',
    });

    res.status(201).json(market);
  } catch (err: any) {
    console.error('Create market error:', err);
    res.status(500).json({ error: err.message || 'Failed to create market' });
  }
});

// Trade Quote (Live calculation preview)
apiApp.post('/api/trades/quote', async (req, res) => {
  try {
    const { marketId, side, action, amount } = req.body;
    const market = await ServerStore.getMarketByIdOrSlug(marketId);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid trade amount' });
    }

    let quote;
    if (action === 'BUY') {
      quote = calculateBuyShares(side, numAmount, market.qYes, market.qNo, market.liquidityB);
    } else {
      quote = calculateSellShares(side, numAmount, market.qYes, market.qNo, market.liquidityB);
    }

    res.json(quote);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Execute Trade
apiApp.post('/api/trades/execute', async (req, res) => {
  try {
    const { marketId, userId, username, side, action, amount } = req.body;

    if (!marketId || !userId || !side || !action || !amount) {
      return res.status(400).json({ error: 'Missing required trade parameters' });
    }

    const result = await ServerStore.executeTrade({
      marketId,
      userId,
      username: username || 'trader',
      side,
      action,
      amount: Number(amount),
    });

    res.json(result);
  } catch (err: any) {
    console.error('Trade execution error:', err);
    res.status(400).json({ error: err.message || 'Trade execution failed' });
  }
});

// User Profile
apiApp.get('/api/user/:uid', async (req, res) => {
  try {
    const profile = await ServerStore.getUserProfile(req.params.uid);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiApp.put('/api/user/:uid', async (req, res) => {
  try {
    const { displayName, username, bio, profilePhoto } = req.body;
    const updated = await ServerStore.updateUserProfile(req.params.uid, {
      displayName,
      username,
      bio,
      profilePhoto,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Positions
apiApp.get('/api/positions/:uid', async (req, res) => {
  try {
    const positions = await ServerStore.getUserPositions(req.params.uid);
    res.json(positions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet Ledger
apiApp.get('/api/ledger/:uid', async (req, res) => {
  try {
    const ledger = await ServerStore.getLedger(req.params.uid);
    res.json(ledger);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard
apiApp.get('/api/leaderboard', async (req, res) => {
  try {
    const board = await ServerStore.getLeaderboard();
    res.json(board);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Comments
apiApp.get('/api/comments/:marketId', async (req, res) => {
  try {
    const comments = await ServerStore.getComments(req.params.marketId);
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiApp.post('/api/comments', async (req, res) => {
  try {
    const { marketId, userId, username, userDisplayName, text } = req.body;
    if (!marketId || !userId || !text) {
      return res.status(400).json({ error: 'Missing comment parameters' });
    }
    const comment = await ServerStore.addComment({
      marketId,
      userId,
      username: username || 'predictor',
      userDisplayName: userDisplayName || 'Predictor',
      text,
    });
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Force Immediate Poll & Settlement (Admin or scheduled trigger)
apiApp.post('/api/poll-now', async (req, res) => {
  try {
    const results = await MetricPoller.runPollCycle();
    res.json({
      success: true,
      ...results,
      status: MetricPoller.getStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Overview
apiApp.get('/api/admin/overview', async (req, res) => {
  try {
    const allMarkets = await ServerStore.getMarkets();
    const active = allMarkets.filter((m) => m.status === 'active');
    const resolved = allMarkets.filter((m) => m.status === 'resolved');
    const voided = allMarkets.filter((m) => m.status === 'voided');
    const pending = allMarkets.filter((m) => m.status === 'pending_resolution');
    const totalVolume = allMarkets.reduce((sum, m) => sum + m.totalVolumeCredits, 0);

    res.json({
      totalMarkets: allMarkets.length,
      activeCount: active.length,
      resolvedCount: resolved.length,
      voidedCount: voided.length,
      pendingCount: pending.length,
      totalVolumeCredits: totalVolume,
      poller: MetricPoller.getStatus(),
      apiKeyConfigured: !!process.env.YOUTUBE_API_KEY,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Void Market
apiApp.post('/api/admin/void', async (req, res) => {
  try {
    const { marketId, reason } = req.body;
    if (!marketId || !reason) {
      return res.status(400).json({ error: 'Market ID and mandatory void reason are required' });
    }
    const market = await ServerStore.getMarketByIdOrSlug(marketId);
    if (!market) return res.status(404).json({ error: 'Market not found' });

    const settled = await ServerStore.settleMarket(market.id, 'VOID', {
      metric: market.currentMetric,
      source: 'Admin Intervention',
      reason: `Market voided by administrator. Reason: ${reason}`,
    });

    res.json(settled);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Settle Market (Manual Override with auditable reason)
apiApp.post('/api/admin/settle', async (req, res) => {
  try {
    const { marketId, outcome, reason } = req.body;
    if (!marketId || !outcome || !reason) {
      return res.status(400).json({ error: 'marketId, outcome (YES/NO), and reason are required' });
    }
    const market = await ServerStore.getMarketByIdOrSlug(marketId);
    if (!market) return res.status(404).json({ error: 'Market not found' });

    const settled = await ServerStore.settleMarket(market.id, outcome, {
      metric: market.currentMetric,
      source: 'Admin Auditable Override',
      reason: `Administrator resolution override to ${outcome}. Reason: ${reason}`,
    });

    res.json(settled);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Demo: Force metric update on content (useful for testing early resolution)
apiApp.post('/api/admin/force-metric', async (req, res) => {
  try {
    const { contentId, newViews, platform } = req.body;
    if (!contentId || newViews === undefined) {
      return res.status(400).json({ error: 'contentId and newViews are required' });
    }

    const views = Number(newViews);
    if (platform === 'tiktok') {
      TikTokProvider.updateSimulatedMetric(contentId, views);
    } else if (platform === 'instagram') {
      InstagramProvider.updateSimulatedMetric(contentId, views);
    } else if (platform === 'x') {
      XProvider.updateSimulatedMetric(contentId, views);
    } else {
      YouTubeProvider.updateSimulatedMetric(contentId, views);
      TikTokProvider.updateSimulatedMetric(contentId, views);
      InstagramProvider.updateSimulatedMetric(contentId, views);
      XProvider.updateSimulatedMetric(contentId, views);
    }

    // Trigger poll cycle immediately to see if target is hit
    const pollResult = await MetricPoller.runPollCycle();

    res.json({
      success: true,
      contentId,
      newViews: views,
      pollResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
