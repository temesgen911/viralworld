import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, Award, Clock, ShieldCheck } from 'lucide-react';
import { LeaderboardEntry } from '../types/index.ts';

interface LeaderboardPageProps {
  onViewProfile: (userId: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onViewProfile }) => {
  const [category, setCategory] = useState<'accuracy' | 'viralCalls' | 'virtualROI'>('accuracy');
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?category=${category}&timeframe=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category, timeframe]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <Trophy className="h-3.5 w-3.5" />
          <span>Global Predictor Rankings</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Hall of Predictors</h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          Spotters who backed viral content before the masses. Minimum 3 resolved markets required for accuracy rankings.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 rounded-2xl bg-white/5 p-1.5 border border-white/10 text-xs font-bold mb-4">
        <button
          id="lb-tab-accuracy"
          onClick={() => setCategory('accuracy')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
            category === 'accuracy' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Best Predictors</span>
        </button>

        <button
          id="lb-tab-viral-calls"
          onClick={() => setCategory('viralCalls')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
            category === 'viralCalls' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>Early Callers</span>
        </button>

        <button
          id="lb-tab-roi"
          onClick={() => setCategory('virtualROI')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
            category === 'virtualROI' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
          <span>Highest ROI</span>
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'today', label: 'Today' },
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: 'all', label: 'All Time' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTimeframe(t.id as any)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              timeframe === t.id
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5 sm:col-span-6">Predictor</div>
          <div className="col-span-3 sm:col-span-3 text-right">Viral Score</div>
          <div className="col-span-3 sm:col-span-2 text-right">
            {category === 'accuracy' ? 'Accuracy' : category === 'viralCalls' ? 'Viral Calls' : 'Virtual ROI'}
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No predictors have qualified yet for this timeframe.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <div
                  key={entry.userId}
                  onClick={() => onViewProfile(entry.userId)}
                  className="grid grid-cols-12 gap-2 px-6 py-3.5 items-center hover:bg-white/[0.03] transition-colors cursor-pointer text-xs"
                >
                  {/* Rank */}
                  <div className="col-span-1 font-black font-mono">
                    {entry.rank === 1 ? (
                      <span className="text-amber-400 text-base">🥇</span>
                    ) : entry.rank === 2 ? (
                      <span className="text-zinc-300 text-base">🥈</span>
                    ) : entry.rank === 3 ? (
                      <span className="text-amber-600 text-base">🥉</span>
                    ) : (
                      <span className="text-zinc-500">#{entry.rank}</span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="col-span-5 sm:col-span-6 flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                      {entry.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white truncate">@{entry.username}</div>
                      <div className="text-[10px] text-zinc-500">
                        {entry.resolvedMarkets} resolved • {entry.profitableCalls} wins
                      </div>
                    </div>
                  </div>

                  {/* Viral Score Gauge Pill */}
                  <div className="col-span-3 sm:col-span-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-black font-mono text-emerald-400">
                      <Flame className="h-3 w-3" />
                      {entry.viralScore}
                    </span>
                  </div>

                  {/* Metric Value */}
                  <div className="col-span-3 sm:col-span-2 text-right font-black font-mono">
                    {category === 'accuracy' && (
                      <span className="text-white">{Math.round(entry.predictionAccuracy)}%</span>
                    )}
                    {category === 'viralCalls' && (
                      <span className="text-orange-400 flex items-center justify-end gap-1">
                        <Flame className="h-3 w-3" />
                        {entry.viralCalls}
                      </span>
                    )}
                    {category === 'virtualROI' && (
                      <span className="text-emerald-400">+{Math.round(entry.virtualROI)}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
