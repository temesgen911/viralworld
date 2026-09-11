import React, { useState, useEffect } from 'react';
import { Coins, ArrowDownLeft, ArrowUpRight, ShieldCheck, History, Gift, CheckCircle, RefreshCw } from 'lucide-react';
import { WalletLedgerEntry } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const CreditsWalletPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/user/${user.uid}/ledger`);
        if (res.ok) {
          const data = await res.json();
          setLedger(data);
        }
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [user]);

  const balance = profile?.virtualCreditsBalance || 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Virtual Wallet</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Full transparent immutable audit ledger for your VIRAL play credits.
        </p>
      </div>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-[#12141a] p-6 sm:p-8 shadow-2xl mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-lg shadow-emerald-500/30">
          <Coins className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Available Credits</div>
        <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1">
          {balance.toLocaleString()}
        </div>

        {/* Prominent Legal Disclaimer */}
        <div className="mt-6 rounded-2xl bg-black/40 border border-white/10 p-3.5 text-xs text-zinc-400 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-300 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Virtual Currency Rules</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            VIRAL credits are non-monetary play currency. They have no cash value, cannot be purchased with real money, cannot be transferred or sold, and cannot be withdrawn or redeemed for goods, currency, or prizes.
          </p>
        </div>
      </div>

      {/* Immutable Ledger Section */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            <span>Transaction Ledger</span>
          </h2>
          <span className="text-[10px] text-zinc-500 font-mono">Real-time ledger</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : ledger.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">No transactions recorded yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {ledger.map((entry) => {
              const isPositive = entry.amount >= 0;
              return (
                <div key={entry.id} className="px-6 py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        entry.type === 'WELCOME_BONUS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isPositive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {entry.type === 'WELCOME_BONUS' ? (
                        <Gift className="h-4 w-4" />
                      ) : isPositive ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-white">{entry.description}</div>
                      <div className="text-[10px] text-zinc-500">
                        {new Date(entry.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {isPositive ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()} pts
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Balance: {entry.balanceAfter.toLocaleString()}
                    </div>
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
