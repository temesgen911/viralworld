import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Clock,
  Flame,
  Users,
  Eye,
  ShieldCheck,
  Share2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { Market, ContentMetricSnapshot, Position, Trade } from '../types/index.ts';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';
import { MetricChart } from '../components/MetricChart.tsx';
import { PositionCard } from '../components/PositionsList.tsx';
import { CommentsSection } from '../components/CommentsSection.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { PlatformBadge, getPlatformConfig } from '../components/PlatformBadge.tsx';

interface MarketDetailPageProps {
  marketIdOrSlug: string;
  onOpenTrade: (side: 'YES' | 'NO') => void;
  onOpenShare: () => void;
  onOpenAuth: () => void;
  onViewCreator: (creatorId: string) => void;
}

export const MarketDetailPage: React.FC<MarketDetailPageProps> = ({
  marketIdOrSlug,
  onOpenTrade,
  onOpenShare,
  onOpenAuth,
  onViewCreator,
}) => {
  const { user } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [snapshots, setSnapshots] = useState<ContentMetricSnapshot[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'trades' | 'rules'>('chart');

  useEffect(() => {
    let isSubscribed = true;

    const fetchMarketData = async () => {
      try {
        const res = await fetch(`/api/markets/${marketIdOrSlug}`);
        if (!res.ok) throw new Error('Market not found');
        const data = await res.json();
        if (isSubscribed) {
          setMarket(data.market);
          setSnapshots(data.snapshots || []);
          setRecentTrades(data.recentTrades || []);
        }

        // Fetch user position if logged in
        if (user && isSubscribed) {
          const posRes = await fetch(`/api/positions/${user.uid}`);
          if (posRes.ok) {
            const positions: Position[] = await posRes.json();
            const userPos = positions.find((p) => p.marketId === data.market.id);
            if (isSubscribed) setPosition(userPos || null);
          }
        }
      } catch (err: any) {
        if (isSubscribed) setError(err.message);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchMarketData();
    return () => {
      isSubscribed = false;
    };
  }, [marketIdOrSlug, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-1/3 bg-white/10 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-3xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
        <h2 className="text-xl font-bold text-white">Market Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">{error || 'This market could not be loaded.'}</p>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const progressPercent = Math.min(100, Math.round((market.currentMetric / market.targetMetric) * 100));
  const platformConfig = getPlatformConfig(market.platform || 'youtube');

  // Time remaining string
  const diffMs = new Date(market.deadline).getTime() - Date.now();
  let timeRemainingStr = '';
  if (market.status === 'resolved') {
    timeRemainingStr = `Resolved ${market.resolvedOutcome}`;
  } else if (market.status === 'voided') {
    timeRemainingStr = 'Voided';
  } else if (diffMs <= 0) {
    timeRemainingStr = 'Ended';
  } else {
    const hours = Math.floor(diffMs / (1000 * 3600));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const mins = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
    timeRemainingStr = days > 0 ? `${days}d ${remHours}h ${mins}m` : `${hours}h ${mins}m`;
  }

  const resolutionSourceLabel = 
    market.platform === 'youtube'
      ? 'Official YouTube Data API v3'
      : market.platform === 'instagram'
      ? 'Official Instagram Graph & Public Metric Verification'
      : market.platform === 'tiktok'
      ? 'Official TikTok Content & Metric Verification Stream'
      : 'Official X / Twitter Public Impressions Stream';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={market.platform || 'youtube'} size="sm" />
          <span>•</span>
          <button
            onClick={() => onViewCreator(market.creatorId)}
            className="flex items-center gap-1.5 font-semibold text-zinc-200 hover:text-emerald-400 transition-colors"
          >
            {market.creatorAvatarUrl && (
              <img src={market.creatorAvatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            )}
            <span>@{market.creatorName}</span>
          </button>
          <span>•</span>
          <a
            href={market.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline"
          >
            <span>{platformConfig.watchLabel}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Call</span>
          </button>
        </div>
      </div>

      {/* Main Title & Hero Target */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase leading-tight">
          Will it hit {formatMetricNumber(market.targetMetric)} {platformConfig.metricName}?
        </h1>
        <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{market.title}</p>
      </div>

      {/* Two Column Layout: Main Details + Trade Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Content & Probability Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Header Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#12141a] p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Thumbnail */}
              <div className="relative h-44 w-32 sm:h-52 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-black border border-white/15 shadow-xl">
                <img
                  src={market.thumbnailUrl}
                  alt={market.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <PlatformBadge platform={market.platform || 'youtube'} size="sm" showLabel={false} />
                </div>
                <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider uppercase">
                  {market.platform === 'youtube' ? 'Short' : market.platform === 'instagram' ? 'Reel' : market.platform === 'tiktok' ? 'TikTok' : 'Post'}
                </span>
              </div>

              {/* Target & Metric Stats */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Current {platformConfig.metricName}</span>
                    <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      {formatMetricNumber(market.currentMetric)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Target Milestone</span>
                    <div className="text-lg font-black font-mono text-white mt-0.5">
                      {formatMetricNumber(market.targetMetric)}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Time Remaining</span>
                    <div className="text-sm font-bold text-zinc-200 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{timeRemainingStr}</span>
                    </div>
                  </div>
                </div>

                {/* Metric Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-mono">
                    <span>{market.currentMetric.toLocaleString()} {platformConfig.metricName}</span>
                    <span className="text-emerald-400 font-bold">{progressPercent}% of target</span>
                    <span>{market.targetMetric.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Market Status Banner if resolved */}
                {market.status === 'resolved' && (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <div>
                      <strong>Resolved {market.resolvedOutcome}!</strong> {market.resolutionReason}
                    </div>
                  </div>
                )}
                {market.status === 'voided' && (
                  <div className="flex items-center gap-3 rounded-xl bg-zinc-800/80 border border-white/10 p-3 text-xs text-zinc-300">
                    <AlertCircle className="h-5 w-5 shrink-0 text-zinc-400" />
                    <div>
                      <strong>Market Voided:</strong> {market.resolutionReason || 'All positions refunded.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Meta Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <strong className="text-zinc-300 font-mono">{formatMetricNumber(market.totalVolumeCredits)}</strong> credits traded
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <strong className="text-zinc-300">{market.tradersCount}</strong> traders
                </span>
              </div>
              <span className="text-[11px]">Market created by @{market.createdByUsername}</span>
            </div>
          </div>

          {/* User's Current Position */}
          {position && (
            <PositionCard
              position={position}
              market={market}
              onTrade={(side, action) => onOpenTrade(side)}
            />
          )}

          {/* Tab Navigation: Chart, Trades, Rules */}
          <div>
            <div className="flex border-b border-white/10 mb-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chart')}
                className={`pb-3 px-4 transition-colors border-b-2 ${
                  activeTab === 'chart'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Views Chart
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`pb-3 px-4 transition-colors border-b-2 ${
                  activeTab === 'trades'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Recent Trades ({recentTrades.length})
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`pb-3 px-4 transition-colors border-b-2 ${
                  activeTab === 'rules'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Resolution Rules
              </button>
            </div>

            {activeTab === 'chart' && (
              <MetricChart market={market} snapshots={snapshots} />
            )}

            {activeTab === 'trades' && (
              <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
                {recentTrades.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">No trades yet. Be the first to predict!</div>
                ) : (
                  <div className="divide-y divide-white/5 text-xs font-mono">
                    {recentTrades.map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              t.side === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {t.action} {t.side}
                          </span>
                          <span className="text-zinc-300 font-sans">@{t.username}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-zinc-400">{Math.abs(t.creditsSpent).toLocaleString()} credits</span>
                          <span className="text-zinc-500 text-[11px]">
                            @ {Math.round(t.averagePrice * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="rounded-2xl border border-white/10 bg-[#12141a] p-5 text-xs text-zinc-300 space-y-3 leading-relaxed">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Market Resolution Specifications</span>
                </div>
                <p>
                  <strong>Resolution Source:</strong> {resolutionSourceLabel}.
                </p>
                <p>
                  <strong>Rule 1 (Target Reached):</strong> If an official metric snapshot reaches or exceeds{' '}
                  <strong className="text-white font-mono">{market.targetMetric.toLocaleString()} {platformConfig.metricName}</strong> at any point before or at the deadline, the market resolves <strong>YES</strong> immediately.
                </p>
                <p>
                  <strong>Rule 2 (Deadline Passed):</strong> If the deadline passes without the official metric reaching the target, the market resolves <strong>NO</strong>.
                </p>
                <p>
                  <strong>Rule 3 (Payouts):</strong> Winning shares settle at 1.00 credit each. Losing shares settle at 0.00 credits.
                </p>
                <p>
                  <strong>Rule 4 (Unavailable/Private Content):</strong> If the content becomes unavailable or private near deadline, a 24-hour grace period begins. If metrics cannot be retrieved authoritatively after 24 hours, the market is VOIDED and all positions are refunded.
                </p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <CommentsSection marketId={market.id} onOpenAuth={onOpenAuth} />
        </div>

        {/* Right 1 Col: Big Trading Card */}
        <div className="space-y-4">
          <div className="sticky top-20 rounded-3xl border border-white/15 bg-[#12141a] p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Market Prediction
            </h3>

            {/* Large Probability Display */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <span className="text-xs font-bold uppercase text-emerald-400">YES</span>
                <div className="text-3xl font-black text-white font-mono mt-1">{yesPercent}%</div>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
                <span className="text-xs font-bold uppercase text-rose-400">NO</span>
                <div className="text-3xl font-black text-white font-mono mt-1">{noPercent}%</div>
              </div>
            </div>

            {/* Action Buttons */}
            {market.status === 'active' ? (
              <div className="space-y-3">
                <button
                  id="market-detail-back-yes-btn"
                  onClick={() => onOpenTrade('YES')}
                  className="w-full flex items-center justify-between rounded-2xl bg-emerald-500 hover:bg-emerald-400 p-4 text-black font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
                >
                  <span>BACK YES</span>
                  <span className="font-mono text-xs">{yesPercent}%</span>
                </button>

                <button
                  id="market-detail-back-no-btn"
                  onClick={() => onOpenTrade('NO')}
                  className="w-full flex items-center justify-between rounded-2xl bg-rose-500 hover:bg-rose-400 p-4 text-white font-black text-sm shadow-lg shadow-rose-500/25 active:scale-98 transition-all"
                >
                  <span>BACK NO</span>
                  <span className="font-mono text-xs">{noPercent}%</span>
                </button>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-400">
                This market has settled {market.resolvedOutcome}. Trading is closed.
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <span className="text-[11px] text-zinc-500 font-medium">
                Automated LMSR Market Maker • Zero spread
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
