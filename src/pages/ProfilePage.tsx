import React, { useState, useEffect } from 'react';
import { Flame, Trophy, TrendingUp, Award, Coins, CheckCircle, Clock, ExternalLink, Edit3 } from 'lucide-react';
import { UserProfile, Position, Market } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';

interface ProfilePageProps {
  userId?: string;
  onSelectMarket: (market: Market) => void;
  onOpenWallet: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  onSelectMarket,
  onOpenWallet,
}) => {
  const { user, profile: authProfile, logout, updateProfileData } = useAuth();
  const targetUid = userId || user?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [createdMarkets, setCreatedMarkets] = useState<Market[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'created'>('active');
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const isOwner = user?.uid === targetUid;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!targetUid) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/user/${targetUid}`);
        if (res.ok) {
          const uData = await res.json();
          setProfile(uData);
          setNewUsername(uData.username);
        }

        const posRes = await fetch(`/api/positions/${targetUid}`);
        if (posRes.ok) {
          const pData = await posRes.json();
          setPositions(pData);
        }

        const markRes = await fetch('/api/markets');
        if (markRes.ok) {
          const allMarks: Market[] = await markRes.json();
          setCreatedMarkets(allMarks.filter((m) => m.createdByUserId === targetUid));
        }
      } catch (err) {
        console.error('Failed to load user profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [targetUid]);

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    try {
      await updateProfileData({ username: newUsername.trim().toLowerCase(), displayName: newUsername.trim() });
      if (profile) setProfile({ ...profile, username: newUsername.trim().toLowerCase() });
      setEditingUsername(false);
    } catch (err) {
      console.error('Failed to save username:', err);
    }
  };

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 animate-pulse space-y-6">
        <div className="h-32 bg-white/5 rounded-3xl" />
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const activePositions = positions.filter((p) => !p.settled);
  const resolvedPositions = positions.filter((p) => p.settled);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#12141a] p-6 sm:p-8 shadow-xl mb-6">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-md">
              {profile.username.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="rounded-lg border border-emerald-500 bg-black/60 px-2 py-1 text-sm text-white font-mono"
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-black"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-black text-white">@{profile.username}</h1>
                    {isOwner && (
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-1">
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>

              {isOwner && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={onOpenWallet}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>{profile.virtualCreditsBalance.toLocaleString()} credits</span>
                  </button>

                  <button
                    onClick={() => logout()}
                    className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prominent Viral Score Gauge */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-black font-black text-xl shadow-lg shadow-emerald-500/30">
              <Flame className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">VIRAL SCORE</div>
              <div className="text-2xl font-black font-mono text-white leading-none mt-0.5">
                {profile.viralScore} <span className="text-xs font-normal text-zinc-500">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlighted Best Call Card */}
        {profile.bestCall && (
          <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1">
              <Flame className="h-4 w-4" />
              <span>Best Viral Call</span>
            </div>
            <div className="text-sm font-bold text-white">
              {formatMetricNumber(profile.bestCall.entryMetric)} → {formatMetricNumber(profile.bestCall.resolvedMetric)} views
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Backed YES on "{profile.bestCall.marketTitle}" when video had {profile.bestCall.entryMetric.toLocaleString()} views
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Predictions</span>
          <div className="text-xl font-black font-mono text-white mt-1">{profile.totalPredictions}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Accuracy</span>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {profile.resolvedMarkets > 0 ? `${Math.round(profile.predictionAccuracy)}%` : '—'}
          </div>
          <span className="text-[10px] text-zinc-500">{profile.profitableCalls} wins / {profile.resolvedMarkets}</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Viral Calls</span>
          <div className="text-xl font-black font-mono text-orange-400 mt-1 flex items-center justify-center gap-1">
            <Flame className="h-4 w-4" />
            <span>{profile.viralCalls}</span>
          </div>
          <span className="text-[10px] text-zinc-500">Early &lt;10% milestone</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Virtual ROI</span>
          <div className="text-xl font-black font-mono text-purple-400 mt-1">
            {profile.virtualROI >= 0 ? `+${Math.round(profile.virtualROI)}%` : `${Math.round(profile.virtualROI)}%`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'active'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Active Positions ({activePositions.length})
        </button>

        <button
          onClick={() => setActiveTab('resolved')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'resolved'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Resolved Positions ({resolvedPositions.length})
        </button>

        <button
          onClick={() => setActiveTab('created')}
          className={`pb-3 px-4 transition-colors border-b-2 ${
            activeTab === 'created'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Created Markets ({createdMarkets.length})
        </button>
      </div>

      {/* Positions Content */}
      <div className="space-y-3">
        {activeTab === 'active' && (
          activePositions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12141a] p-10 text-center text-xs text-zinc-500">
              No active prediction positions. Browse markets to back your first call.
            </div>
          ) : (
            activePositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-2xl border border-white/10 bg-[#12141a] p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                        pos.yesShares > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {pos.yesShares > 0 ? 'YES' : 'NO'}
                    </span>
                    <span className="text-xs font-bold text-white line-clamp-1">{pos.marketTitle}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Held: {(pos.yesShares || pos.noShares).toFixed(2)} shares • Cost: {pos.totalCostCredits} credits
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Active</span>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'resolved' && (
          resolvedPositions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12141a] p-10 text-center text-xs text-zinc-500">
              No resolved positions yet.
            </div>
          ) : (
            resolvedPositions.map((pos) => (
              <div
                key={pos.id}
                className="rounded-2xl border border-white/10 bg-[#12141a] p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white/10 text-white">
                      {pos.yesShares > 0 ? 'YES' : 'NO'}
                    </span>
                    <span className="text-xs font-bold text-white line-clamp-1">{pos.marketTitle}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Cost: {pos.totalCostCredits} credits • Payout: {pos.settledPayoutCredits?.toFixed(1)} credits
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold">
                  {(pos.settledPayoutCredits || 0) > pos.totalCostCredits ? (
                    <span className="text-emerald-400">
                      +{( (pos.settledPayoutCredits || 0) - pos.totalCostCredits).toFixed(1)} pts
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      {( (pos.settledPayoutCredits || 0) - pos.totalCostCredits).toFixed(1)} pts
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'created' && (
          createdMarkets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#12141a] p-10 text-center text-xs text-zinc-500">
              You haven't created any markets yet.
            </div>
          ) : (
            createdMarkets.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMarket(m)}
                className="rounded-2xl border border-white/10 bg-[#12141a] p-4 flex items-center justify-between hover:border-white/20 transition-all cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{m.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {formatMetricNumber(m.currentMetric)} / {formatMetricNumber(m.targetMetric)} views • {m.tradersCount} traders
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    YES {Math.round(m.yesPrice * 100)}%
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
