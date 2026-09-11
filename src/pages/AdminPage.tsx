import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle2, Play, Activity } from 'lucide-react';
import { Market } from '../types/index.ts';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Void modal state
  const [selectedMarketForVoid, setSelectedMarketForVoid] = useState<Market | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Simulate boost state (to test immediate YES resolution)
  const [boostMarketId, setBoostMarketId] = useState<string>('');
  const [boostViews, setBoostViews] = useState<number>(1000000);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const sRes = await fetch('/api/admin/stats');
      if (sRes.ok) setStats(await sRes.json());

      const mRes = await fetch('/api/markets');
      if (mRes.ok) setMarkets(await mRes.json());
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTriggerPoll = async () => {
    setActionMsg('Triggering metric poll...');
    try {
      const res = await fetch('/api/admin/poll', { method: 'POST' });
      const data = await res.json();
      setActionMsg(`Poll complete: ${data.marketsPolled} markets polled, ${data.marketsResolved} settled.`);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(`Poll failed: ${err.message}`);
    }
  };

  const handleSimulateBoost = async () => {
    if (!boostMarketId) return;
    setActionMsg('Simulating view boost...');
    try {
      const res = await fetch(`/api/admin/markets/${boostMarketId}/metric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: boostViews }),
      });
      const data = await res.json();
      setActionMsg(`Boost applied! New view count: ${boostViews.toLocaleString()}. Settled: ${data.market.status}`);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(`Boost failed: ${err.message}`);
    }
  };

  const handleVoidMarket = async () => {
    if (!selectedMarketForVoid || !voidReason.trim()) return;
    setActionMsg('Voiding market and refunding traders...');
    try {
      const res = await fetch(`/api/admin/markets/${selectedMarketForVoid.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() }),
      });
      const data = await res.json();
      setActionMsg(`Market voided. ${data.refundsIssued} trader positions fully refunded.`);
      setSelectedMarketForVoid(null);
      setVoidReason('');
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(`Void failed: ${err.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="h-4 w-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">System Operations</h1>
        </div>

        <button
          onClick={handleTriggerPoll}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Trigger Metric Poll Now</span>
        </button>
      </div>

      {actionMsg && (
        <div className="mb-6 rounded-2xl bg-white/10 border border-white/20 p-4 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* System Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
          <span className="text-[10px] font-bold uppercase text-zinc-500">Active Markets</span>
          <div className="text-2xl font-black font-mono text-white mt-1">{stats?.activeMarkets || 0}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
          <span className="text-[10px] font-bold uppercase text-zinc-500">Total Traders</span>
          <div className="text-2xl font-black font-mono text-white mt-1">{stats?.activeTraders || 0}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
          <span className="text-[10px] font-bold uppercase text-zinc-500">Total Volume</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {stats?.totalVolumeCredits?.toLocaleString() || 0} pts
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4">
          <span className="text-[10px] font-bold uppercase text-zinc-500">YouTube Poller</span>
          <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active (15m cycle)</span>
          </div>
        </div>
      </div>

      {/* Simulator Tools (For testing immediate settlements) */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] p-6 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-400" />
          <span>Resolution Simulator & View Injector</span>
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Simulate a video reaching a target view count to verify immediate YES resolution and automated payout distribution.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={boostMarketId}
            onChange={(e) => setBoostMarketId(e.target.value)}
            className="rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Select an active market...</option>
            {markets
              .filter((m) => m.status === 'active')
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} (Target: {m.targetMetric.toLocaleString()})
                </option>
              ))}
          </select>

          <input
            type="number"
            value={boostViews}
            onChange={(e) => setBoostViews(parseInt(e.target.value, 10))}
            placeholder="Simulated View Count"
            className="rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
          />

          <button
            onClick={handleSimulateBoost}
            disabled={!boostMarketId}
            className="rounded-xl bg-white/10 hover:bg-white/20 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-40"
          >
            Inject Metric & Trigger Check
          </button>
        </div>
      </div>

      {/* Markets Table & Void Actions */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Market Management & Audit
          </h2>
        </div>

        <div className="divide-y divide-white/5 text-xs">
          {markets.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      m.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : m.status === 'resolved'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {m.status} {m.resolvedOutcome || ''}
                  </span>
                  <span className="font-bold text-white">{m.title}</span>
                </div>
                <div className="text-zinc-500 font-mono text-[11px] mt-1">
                  Views: {m.currentMetric.toLocaleString()} / {m.targetMetric.toLocaleString()} • Vol: {m.totalVolumeCredits.toLocaleString()} pts
                </div>
              </div>

              {m.status === 'active' && (
                <button
                  onClick={() => setSelectedMarketForVoid(m)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  Void & Refund
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Void Modal */}
      {selectedMarketForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#12141a] p-6 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Void Market Confirmation</span>
            </div>
            <p className="text-zinc-300 mb-4">
              Voiding "{selectedMarketForVoid.title}" will cancel all pending positions and issue 100% full refunds of cost basis to all traders.
            </p>

            <label className="block font-bold text-zinc-300 mb-1">Required Audit Reason</label>
            <textarea
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Video set to private by creator, or content deleted."
              className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 text-white mb-4 focus:border-rose-500 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMarketForVoid(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidMarket}
                disabled={!voidReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white disabled:opacity-50"
              >
                Confirm Void & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
