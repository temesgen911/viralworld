import { ServerStore } from './db.ts';
import { ContentProviderRegistry } from '../services/content/index.ts';
import { Market, Platform } from '../types/index.ts';

export class MetricPoller {
  private static pollTimer: NodeJS.Timeout | null = null;
  private static isPolling = false;
  private static lastPollTimestamp: string | null = null;
  private static pollCount = 0;
  private static errorCount = 0;

  /**
   * Start scheduled background polling (e.g. every 15 minutes)
   */
  public static start(intervalMs = 15 * 60 * 1000): void {
    if (this.pollTimer) return;
    console.log(`[MetricPoller] Starting background metric poller (interval: ${intervalMs / 1000}s)`);
    // Run an initial poll cycle shortly after start
    setTimeout(() => this.runPollCycle(), 3000);
    this.pollTimer = setInterval(() => this.runPollCycle(), intervalMs);
  }

  public static stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public static getStatus() {
    return {
      isRunning: !!this.pollTimer,
      isPolling: this.isPolling,
      lastPollTimestamp: this.lastPollTimestamp,
      pollCount: this.pollCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * Run a complete single polling and settlement cycle:
   * 1. Query all active or pending markets
   * 2. Group by unique contentId to optimize YouTube API quota usage
   * 3. Fetch latest metrics for each unique video
   * 4. Check targets & deadlines
   * 5. Settle YES (early resolution), NO (deadline passed), or VOID (unresolved after grace period)
   */
  public static async runPollCycle(): Promise<{ updatedMarkets: number; settledMarkets: number }> {
    if (this.isPolling) return { updatedMarkets: 0, settledMarkets: 0 };
    this.isPolling = true;
    this.lastPollTimestamp = new Date().toISOString();
    this.pollCount++;

    let updatedMarkets = 0;
    let settledMarkets = 0;

    try {
      const activeMarkets = (await ServerStore.getMarkets()).filter(
        (m) => m.status === 'active' || m.status === 'pending_resolution'
      );

      if (activeMarkets.length === 0) {
        return { updatedMarkets: 0, settledMarkets: 0 };
      }

      // Group markets by contentId to prevent duplicate YouTube API calls
      const marketsByContent = new Map<string, Market[]>();
      for (const market of activeMarkets) {
        const list = marketsByContent.get(market.contentId) || [];
        list.push(market);
        marketsByContent.set(market.contentId, list);
      }

      const now = Date.now();

      for (const [contentId, markets] of marketsByContent.entries()) {
        try {
          const platform = markets[0]?.platform || 'youtube';
          const provider = ContentProviderRegistry.get(platform);
          const metrics = await provider.fetchMetrics(contentId);
          const currentViews = metrics.viewCount;
          const currentLikes = metrics.likeCount;

          const sourceName = platform === 'youtube' 
            ? 'YouTube Data API v3' 
            : platform === 'instagram' 
            ? 'Instagram Graph & Public Metric Verification' 
            : platform === 'tiktok' 
            ? 'TikTok Public Metric Stream' 
            : 'X / Twitter Public Impressions Stream';

          // Record snapshot if metrics changed
          const prevSnapshots = await ServerStore.getSnapshots(contentId);
          const lastSnap = prevSnapshots[prevSnapshots.length - 1];

          if (!lastSnap || lastSnap.viewCount !== currentViews || lastSnap.likeCount !== currentLikes) {
            await ServerStore.addSnapshot(contentId, currentViews, currentLikes);
          }

          // Evaluate each market attached to this content
          for (const market of markets) {
            market.currentMetric = currentViews;
            updatedMarkets++;

            // Check 1: Target reached before or at deadline -> Resolve YES immediately!
            if (currentViews >= market.targetMetric) {
              await ServerStore.settleMarket(market.id, 'YES', {
                metric: currentViews,
                source: sourceName,
                reason: `Official view count reached ${currentViews.toLocaleString()}, meeting or exceeding target ${market.targetMetric.toLocaleString()}`,
              });
              settledMarkets++;
              continue;
            }

            // Check 2: Deadline passed without reaching target -> Resolve NO
            const deadlineTime = new Date(market.deadline).getTime();
            if (deadlineTime <= now) {
              await ServerStore.settleMarket(market.id, 'NO', {
                metric: currentViews,
                source: sourceName,
                reason: `Deadline passed (${market.deadline}). Final verified view count was ${currentViews.toLocaleString()} against target ${market.targetMetric.toLocaleString()}`,
              });
              settledMarkets++;
            }
          }
        } catch (err) {
          console.error(`[MetricPoller] Failed to fetch metrics for ${contentId}:`, err);
          this.errorCount++;

          const platform = markets[0]?.platform || 'youtube';
          const sourceName = platform === 'youtube' ? 'YouTube Data API v3' : `${platform.toUpperCase()} Metric Stream`;

          // Handle temporary unavailability / grace period
          for (const market of markets) {
            if (market.status === 'active') {
              market.status = 'pending_resolution';
              market.unavailableSince = new Date().toISOString();
              market.gracePeriodDeadline = new Date(now + 24 * 3600 * 1000).toISOString();
            } else if (market.status === 'pending_resolution' && market.gracePeriodDeadline) {
              if (new Date(market.gracePeriodDeadline).getTime() <= now) {
                // Grace period expired, void market and refund
                await ServerStore.settleMarket(market.id, 'VOID', {
                  metric: market.currentMetric,
                  source: sourceName,
                  reason: 'Content remained private, deleted, or inaccessible past the 24-hour grace period. Market voided and all trading positions refunded.',
                });
                settledMarkets++;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[MetricPoller] Error during poll cycle:', err);
      this.errorCount++;
    } finally {
      this.isPolling = false;
    }

    return { updatedMarkets, settledMarkets };
  }
}
