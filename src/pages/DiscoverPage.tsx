import React, { useState, useEffect } from 'react';
import { Search, Flame, Sparkles, Swords, Clock, CheckCircle, Filter, Globe, Youtube, Music, Instagram, Twitter } from 'lucide-react';
import { Market, Platform } from '../types/index.ts';
import { MarketCard } from '../components/MarketCard.tsx';

interface DiscoverPageProps {
  initialSearch?: string;
  onSelectMarket: (market: Market) => void;
  onTradeQuick: (market: Market, side: 'YES' | 'NO') => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  initialSearch = '',
  onSelectMarket,
  onTradeQuick,
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState('all');
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filter !== 'all') queryParams.set('filter', filter);
        if (platform !== 'all') queryParams.set('platform', platform);
        if (search.trim()) queryParams.set('search', search.trim());

        const res = await fetch(`/api/markets?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMarkets(data);
        }
      } catch (err) {
        console.error('Failed to search markets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [filter, platform, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Discover Markets</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Explore internet attention markets across YouTube, TikTok, Instagram, and X, or search for specific creators and topics.
        </p>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {[
          { id: 'all', label: 'All Platforms', icon: Globe, color: 'text-zinc-300' },
          { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400' },
          { id: 'tiktok', label: 'TikTok', icon: Music, color: 'text-cyan-400' },
          { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
          { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'text-zinc-200' },
        ].map((p) => {
          const Icon = p.icon;
          const isSelected = platform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-black' : p.color}`} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            id="discover-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by creator, title or video ID..."
            className="w-full rounded-2xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'trending', label: 'Trending' },
            { id: 'early', label: 'Early Calls' },
            { id: 'divided', label: 'Divided' },
            { id: 'closing', label: 'Closing' },
            { id: 'resolved', label: 'Resolved' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-white text-black shadow'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#12141a] p-12 text-center my-8">
          <Filter className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-bold text-white">No matching markets found</h3>
          <p className="text-xs text-zinc-400 mt-1">Try another search query or clear filters.</p>
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
  );
};
