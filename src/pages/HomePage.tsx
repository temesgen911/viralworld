import React, { useState, useEffect } from 'react';
import { Flame, Compass, Clock, Swords, Sparkles, ArrowRight, TrendingUp, ShieldCheck, Youtube, Instagram, Twitter, Music, Globe } from 'lucide-react';
import { Market, Platform } from '../types/index.ts';
import { MarketCard } from '../components/MarketCard.tsx';

interface HomePageProps {
  onSelectMarket: (market: Market) => void;
  onTradeQuick: (market: Market, side: 'YES' | 'NO') => void;
  onNavigateCreateWithUrl: (url: string) => void;
  onSelectTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectMarket,
  onTradeQuick,
  onNavigateCreateWithUrl,
  onSelectTab,
}) => {
  const [heroUrl, setHeroUrl] = useState('');
  const [activeFilter, setActiveFilter] = useState<'trending' | 'early' | 'divided' | 'closing'>('trending');
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeFilter) queryParams.set('filter', activeFilter);
        if (activePlatform && activePlatform !== 'all') queryParams.set('platform', activePlatform);

        const res = await fetch(`/api/markets?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMarkets(data);
        }
      } catch (err) {
        console.error('Failed to load markets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [activeFilter, activePlatform]);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroUrl.trim()) {
      onNavigateCreateWithUrl(heroUrl.trim());
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#12141a] via-[#0c0d12] to-[#0a0b0e] px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Prediction Market for Internet Attention</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none sm:leading-[1.1]">
            Bet on what <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500 bg-clip-text text-transparent">
              blows up next
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Spot viral content across YouTube, TikTok, Instagram, and X early. Back your calls with virtual credits and rise on the reputation leaderboard.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleHeroSubmit} className="mt-8 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 rounded-2xl sm:rounded-full border border-white/15 bg-black/60 p-2 shadow-2xl backdrop-blur-xl focus-within:border-emerald-500/60 transition-all">
              <input
                id="hero-url-input"
                type="text"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="Paste any link from YouTube, TikTok, Instagram, or X..."
                className="flex-1 bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                id="hero-predict-btn"
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-xs sm:text-sm font-bold text-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
              >
                <span>Predict it</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-zinc-500 font-medium">
              Supports YouTube Shorts, TikTok, Instagram Reels & X Posts • Non-monetary play credits
            </p>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Platform Selector Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          <button
            onClick={() => setActivePlatform('all')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activePlatform === 'all'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>All Platforms</span>
          </button>

          <button
            onClick={() => setActivePlatform('youtube')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activePlatform === 'youtube'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Youtube className="h-3.5 w-3.5 text-red-400" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => setActivePlatform('tiktok')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activePlatform === 'tiktok'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Music className="h-3.5 w-3.5 text-cyan-400" />
            <span>TikTok</span>
          </button>

          <button
            onClick={() => setActivePlatform('instagram')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activePlatform === 'instagram'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Instagram className="h-3.5 w-3.5 text-pink-400" />
            <span>Instagram</span>
          </button>

          <button
            onClick={() => setActivePlatform('x')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activePlatform === 'x'
                ? 'bg-zinc-200 text-black shadow-sm'
                : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Twitter className="h-3.5 w-3.5 text-zinc-300" />
            <span>X (Twitter)</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none mb-6">
          <div className="flex items-center gap-2">
            <button
              id="filter-trending-btn"
              onClick={() => setActiveFilter('trending')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'trending'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span>🔥 Trending Markets</span>
            </button>

            <button
              id="filter-early-btn"
              onClick={() => setActiveFilter('early')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'early'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>🌱 Early Calls</span>
            </button>

            <button
              id="filter-divided-btn"
              onClick={() => setActiveFilter('divided')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'divided'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Swords className="h-3.5 w-3.5 text-purple-400" />
              <span>⚔️ Most Divided</span>
            </button>

            <button
              id="filter-closing-btn"
              onClick={() => setActiveFilter('closing')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'closing'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              <span>⏳ Closing Soon</span>
            </button>
          </div>

          <button
            onClick={() => onSelectTab('discover')}
            className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span>View All Markets</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#12141a] p-12 text-center my-8">
            <Sparkles className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
            <h3 className="text-base font-bold text-white">No markets found in this category</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Found a YouTube Short that's about to blow up? Be the first to create a prediction market for it.
            </p>
            <button
              onClick={() => onSelectTab('create')}
              className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition-all"
            >
              Create Prediction Market
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelect={onSelectMarket}
                onTradeQuick={onTradeQuick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
