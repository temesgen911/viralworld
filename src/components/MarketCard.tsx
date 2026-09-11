import React from 'react';
import { Flame, Clock, Eye, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Market } from '../types/index.ts';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';
import { PlatformBadge, getPlatformConfig } from './PlatformBadge.tsx';

interface MarketCardProps {
  market: Market;
  onSelect: (market: Market) => void;
  onTradeQuick?: (market: Market, side: 'YES' | 'NO') => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market, onSelect, onTradeQuick }) => {
  const platformConfig = getPlatformConfig(market.platform || 'youtube');
  const now = Date.now();
  const deadlineTime = new Date(market.deadline).getTime();
  const diffMs = deadlineTime - now;

  let timeLabel = '';
  if (market.status === 'resolved') {
    timeLabel = `Resolved ${market.resolvedOutcome}`;
  } else if (market.status === 'voided') {
    timeLabel = 'Voided';
  } else if (diffMs <= 0) {
    timeLabel = 'Ended';
  } else {
    const hours = Math.floor(diffMs / (1000 * 3600));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    timeLabel = days > 0 ? `${days}d ${remHours}h left` : `${hours}h left`;
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  // Progress towards target
  const progressPercent = Math.min(100, Math.round((market.currentMetric / market.targetMetric) * 100));

  return (
    <div
      id={`market-card-${market.id}`}
      onClick={() => onSelect(market)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#12141a]/90 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
    >
      {/* Top Header: Creator & Time remaining */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {market.creatorAvatarUrl ? (
              <img
                src={market.creatorAvatarUrl}
                alt={market.creatorName}
                className="h-6 w-6 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                {market.creatorName.substring(0, 1)}
              </div>
            )}
            <span className="text-xs font-semibold text-zinc-300 truncate">@{market.creatorName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 shrink-0">
            <Clock className="h-3 w-3 text-zinc-500" />
            <span>{timeLabel}</span>
          </div>
        </div>

        {/* Thumbnail & Title */}
        <div className="flex gap-3 mb-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-white/10">
            <img
              src={market.thumbnailUrl}
              alt={market.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-1 left-1">
              <PlatformBadge platform={market.platform || 'youtube'} size="sm" showLabel={false} />
            </div>
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white tracking-wider uppercase">
              {market.platform === 'youtube' ? 'Short' : market.platform === 'instagram' ? 'Reel' : market.platform === 'tiktok' ? 'TikTok' : 'Post'}
            </span>
          </div>

          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
              {market.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1 font-mono text-zinc-300">
                <Eye className="h-3 w-3 text-emerald-400" />
                {formatMetricNumber(market.currentMetric)}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Target: <strong className="text-white font-mono">{formatMetricNumber(market.targetMetric)}</strong></span>
            </div>
          </div>
        </div>

        {/* Metric Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-mono">
            <span>{formatMetricNumber(market.currentMetric)}</span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
            <span>{formatMetricNumber(market.targetMetric)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Probability Buttons & Volume */}
      <div className="border-t border-white/5 pt-3">
        {market.status === 'resolved' ? (
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <div className="flex items-center gap-2">
              {market.resolvedOutcome === 'YES' ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className="text-xs font-bold text-white">
                Resolved {market.resolvedOutcome}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {market.resolutionMetric ? `${formatMetricNumber(market.resolutionMetric)} views` : ''}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              id={`quick-yes-${market.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTradeQuick) onTradeQuick(market, 'YES');
                else onSelect(market);
              }}
              className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <span className="text-xs font-bold text-emerald-400">YES</span>
              <span className="font-mono text-xs font-bold text-white">{yesPercent}%</span>
            </button>

            <button
              id={`quick-no-${market.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTradeQuick) onTradeQuick(market, 'NO');
                else onSelect(market);
              }}
              className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all"
            >
              <span className="text-xs font-bold text-rose-400">NO</span>
              <span className="font-mono text-xs font-bold text-white">{noPercent}%</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-500 font-medium">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-400" />
            <strong className="text-zinc-300 font-mono">{formatMetricNumber(market.totalVolumeCredits)}</strong> traded
          </span>
          <span>{market.tradersCount} traders</span>
        </div>
      </div>
    </div>
  );
};
