import React, { useState } from 'react';
import { Sparkles, ArrowRight, Eye, ThumbsUp, Clock, AlertCircle, CheckCircle, ExternalLink, Youtube, Instagram, Twitter, Music } from 'lucide-react';
import { ContentMetadata, SuggestedThreshold, Market, Platform } from '../types/index.ts';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PlatformBadge, getPlatformConfig } from '../components/PlatformBadge.tsx';

interface CreateMarketPageProps {
  initialUrl?: string;
  onMarketCreated: (market: Market) => void;
  onOpenAuth: () => void;
  onSelectExistingMarket: (market: Market) => void;
}

const PLATFORM_SAMPLES = [
  {
    platform: 'youtube' as Platform,
    name: 'YouTube',
    label: 'MrBeast Short',
    url: 'https://www.youtube.com/shorts/07d2dXHYb94',
    icon: Youtube,
    color: 'text-red-400 hover:border-red-500/50',
  },
  {
    platform: 'tiktok' as Platform,
    name: 'TikTok',
    label: 'Khaby Lame TikTok',
    url: 'https://www.tiktok.com/@khaby.lame/video/7345678901234567890',
    icon: Music,
    color: 'text-cyan-400 hover:border-cyan-500/50',
  },
  {
    platform: 'instagram' as Platform,
    name: 'Instagram',
    label: 'Khaby Lame Reel',
    url: 'https://www.instagram.com/reel/C4aBc123DeF/',
    icon: Instagram,
    color: 'text-pink-400 hover:border-pink-500/50',
  },
  {
    platform: 'x' as Platform,
    name: 'X (Twitter)',
    label: 'Elon Musk Post',
    url: 'https://x.com/elonmusk/status/1765432109876543210',
    icon: Twitter,
    color: 'text-zinc-300 hover:border-zinc-400/50',
  },
];

export const CreateMarketPage: React.FC<CreateMarketPageProps> = ({
  initialUrl = '',
  onMarketCreated,
  onOpenAuth,
  onSelectExistingMarket,
}) => {
  const { user, profile } = useAuth();
  const [url, setUrl] = useState(initialUrl);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null);
  const [thresholds, setThresholds] = useState<SuggestedThreshold[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<SuggestedThreshold | null>(null);
  const [existingMarkets, setExistingMarkets] = useState<any[]>([]);
  
  // Custom threshold state
  const [isCustom, setIsCustom] = useState(false);
  const [customTarget, setCustomTarget] = useState('');
  const [customDays, setCustomDays] = useState('7');

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent, targetUrl?: string) => {
    if (e) e.preventDefault();
    const linkToAnalyze = (targetUrl || url).trim();
    if (!linkToAnalyze) return;

    setAnalyzing(true);
    setError(null);
    setMetadata(null);
    setThresholds([]);
    setSelectedThreshold(null);

    try {
      const res = await fetch('/api/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkToAnalyze }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze content link');
      }

      const data = await res.json();
      setMetadata(data.metadata);
      setThresholds(data.suggestedThresholds || []);
      setExistingMarkets(data.existingMarkets || []);
      if (data.suggestedThresholds?.length > 0) {
        setSelectedThreshold(data.suggestedThresholds[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Could not retrieve content details');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSample = (sampleUrl: string, plat: Platform) => {
    setUrl(sampleUrl);
    setSelectedPlatform(plat);
    handleAnalyze(undefined, sampleUrl);
  };

  const handleCreateMarket = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!metadata) return;

    let target = 0;
    let deadlineIso = '';

    if (isCustom) {
      target = parseInt(customTarget.replace(/,/g, ''), 10);
      if (isNaN(target) || target <= metadata.currentViews) {
        setError(`Target must be greater than current metric count (${metadata.currentViews.toLocaleString()})`);
        return;
      }
      const days = parseFloat(customDays);
      if (isNaN(days) || days <= 0 || days > 30) {
        setError('Custom deadline must be between 1 hour and 30 days');
        return;
      }
      deadlineIso = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    } else {
      if (!selectedThreshold) {
        setError('Please select a target milestone');
        return;
      }
      target = selectedThreshold.target;
      deadlineIso = selectedThreshold.deadlineIso;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/markets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: metadata.canonicalUrl,
          targetMetric: target,
          deadlineIso,
          userId: user.uid,
          username: profile?.username || 'predictor',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 409 && errData.existingMarket) {
          // Duplicate found: offer navigation
          setError('A market with this target already exists.');
          setExistingMarkets([errData.existingMarket]);
          return;
        }
        throw new Error(errData.error || 'Market creation failed');
      }

      const newMarket = await res.json();
      onMarketCreated(newMarket);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const currentPlatformConfig = metadata ? getPlatformConfig(metadata.platform) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 pb-28">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Attention Market</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">
          Create a Prediction Market
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
          Found content on YouTube, TikTok, Instagram, or X you think will blow up? Launch a market and invite the community to trade YES or NO.
        </p>
      </div>

      {/* STEP 1: Link input */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
            Step 1: Paste Content Link
          </h2>
          <span className="text-[11px] text-zinc-400">Supports YouTube, TikTok, Instagram & X</span>
        </div>

        {/* Platform Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Supported platforms:</span>
          {PLATFORM_SAMPLES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.platform}
                type="button"
                onClick={() => handleSelectSample(p.url, p.platform)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                title={`Click to try demo ${p.name} URL`}
              >
                <Icon className={`h-3 w-3 ${p.color}`} />
                <span>{p.name}</span>
                <span className="text-[10px] text-zinc-500">demo</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-2">
          <input
            id="create-url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any link from YouTube, TikTok, Instagram, or X..."
            className="flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            id="create-analyze-btn"
            type="submit"
            disabled={analyzing || !url.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-xs sm:text-sm font-bold text-black shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            {analyzing ? (
              <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Analyze Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Content Verified Card */}
      {metadata && currentPlatformConfig && (
        <div className="rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-xl mb-6 animate-in fade-in-50 duration-300">
          <div className="flex items-start gap-4">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-black border border-white/10">
              <img src={metadata.thumbnailUrl} alt={metadata.title} className="h-full w-full object-cover" />
              <div className="absolute top-1 left-1">
                <PlatformBadge platform={metadata.platform} size="sm" showLabel={false} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PlatformBadge platform={metadata.platform} size="sm" showLabel={true} />
                <span className="text-[11px] text-emerald-400 font-semibold">Verified Metadata</span>
              </div>
              <h3 className="text-base font-bold text-white line-clamp-2 mt-0.5">{metadata.title}</h3>
              <p className="text-xs text-zinc-400 mt-1">@{metadata.creatorName}</p>

              <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-zinc-200">
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                  <strong>{metadata.currentViews.toLocaleString()}</strong> {currentPlatformConfig.metricName}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <ThumbsUp className="h-3.5 w-3.5 text-zinc-500" />
                  {metadata.currentLikes.toLocaleString()} likes
                </span>
              </div>
            </div>
          </div>

          {/* Existing Markets Alert */}
          {existingMarkets.length > 0 && (
            <div className="mt-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  <span>Existing Markets on this Content</span>
                </div>
                <span className="text-[11px] text-zinc-400">Consider joining existing liquidity</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {existingMarkets.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectExistingMarket(m)}
                    className="flex items-center justify-between rounded-lg bg-black/40 p-2 text-xs text-white hover:bg-black/60 cursor-pointer transition-colors"
                  >
                    <span>{m.title}</span>
                    <span className="text-emerald-400 font-bold font-mono">YES {Math.round(m.yesPrice * 100)}% →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Threshold Suggestion Cards */}
      {metadata && currentPlatformConfig && (
        <div className="rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Step 2: What are you calling?
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Select a milestone target or enter custom numbers</p>
            </div>

            <button
              onClick={() => setIsCustom(!isCustom)}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              {isCustom ? '← Use Suggested Milestones' : 'Custom Target + Deadline'}
            </button>
          </div>

          {!isCustom ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {thresholds.map((t, idx) => {
                const isSelected = selectedThreshold?.target === t.target;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedThreshold(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xl font-black font-mono text-white">
                        {t.targetLabel} {currentPlatformConfig.metricName}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                        {t.estimatedDifficulty}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span>{t.durationLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Target {currentPlatformConfig.metricName} Count
                </label>
                <input
                  id="custom-target-input"
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  placeholder={`Must exceed ${metadata.currentViews.toLocaleString()}`}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Duration (Days, max 30)</label>
                <input
                  id="custom-days-input"
                  type="number"
                  min="1"
                  max="30"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Launch Button */}
          <button
            id="create-market-confirm-btn"
            onClick={handleCreateMarket}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 py-4 text-sm font-black text-black shadow-lg shadow-emerald-500/25 active:scale-98 disabled:opacity-50 transition-all"
          >
            {creating ? (
              <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>LAUNCH PREDICTION MARKET</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
