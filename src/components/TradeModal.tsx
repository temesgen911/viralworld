import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, Share2, AlertCircle, Coins, Sparkles } from 'lucide-react';
import { Market, Position, Trade } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface TradeModalProps {
  market: Market;
  initialSide: 'YES' | 'NO';
  position: Position | null;
  onClose: () => void;
  onTradeSuccess: (trade: Trade, updatedMarket: Market) => void;
  onOpenShare: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  market,
  initialSide,
  position,
  onClose,
  onTradeSuccess,
  onOpenShare,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const [side, setSide] = useState<'YES' | 'NO'>(initialSide);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(100);
  const [customInput, setCustomInput] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [tradeCompleted, setTradeCompleted] = useState<Trade | null>(null);

  const ownedShares = position ? (side === 'YES' ? position.yesShares : position.noShares) : 0;
  const userBalance = profile?.virtualCreditsBalance || 0;

  // Fetch live LMSR quote
  useEffect(() => {
    let active = true;
    const fetchQuote = async () => {
      if (amount <= 0) {
        setQuote(null);
        return;
      }
      try {
        const res = await fetch('/api/trades/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: market.id,
            side,
            action,
            amount,
          }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setQuote(data);
          setError(null);
        } else if (active) {
          const err = await res.json();
          setError(err.error || 'Unable to fetch price calculation');
        }
      } catch (err: any) {
        if (active) setError(err.message);
      }
    };

    fetchQuote();
    return () => {
      active = false;
    };
  }, [market.id, side, action, amount]);

  const handleAmountChange = (val: number) => {
    setAmount(val);
    setCustomInput(val.toString());
  };

  const handleCustomInput = (text: string) => {
    setCustomInput(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleConfirmTrade = async () => {
    if (!user) {
      setError('Please sign in to place predictions');
      return;
    }
    if (action === 'BUY' && amount > userBalance) {
      setError(`Insufficient credits. You have ${userBalance.toLocaleString()} credits.`);
      return;
    }
    if (action === 'SELL' && amount > ownedShares) {
      setError(`Cannot sell more shares than you hold (${ownedShares} shares).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Haptic vibration feedback if device supports it
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([30, 40, 30]);
        } catch {}
      }

      const res = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          userId: user.uid,
          username: profile?.username || 'trader',
          side,
          action,
          amount,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Trade execution failed');
      }

      const data = await res.json();
      setTradeCompleted(data.trade);
      await refreshProfile();
      onTradeSuccess(data.trade, data.market);
    } catch (err: any) {
      setError(err.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div
        id="trade-bottom-sheet"
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Close Button */}
        <button
          id="trade-modal-close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {tradeCompleted ? (
          // Trade Completed Success State
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3 className="text-xl font-black text-white">You're in!</h3>
            <p className="mt-1 text-sm text-zinc-300">
              {side} at {Math.round(tradeCompleted.averagePrice * 100)}% ({tradeCompleted.sharesCount.toFixed(2)} shares)
            </p>

            <div className="my-6 rounded-2xl bg-white/5 p-4 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Credits {action === 'BUY' ? 'Spent' : 'Received'}:</span>
                <span className="font-mono text-white font-bold">{Math.abs(tradeCompleted.creditsSpent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>New Available Balance:</span>
                <span className="font-mono text-emerald-400 font-bold">{profile?.virtualCreditsBalance.toLocaleString()} credits</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Potential Outcome:</span>
                <span className="font-mono text-zinc-200">{tradeCompleted.sharesCount.toFixed(2)} credits if {side} wins</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                id="trade-share-call-btn"
                onClick={() => {
                  onClose();
                  onOpenShare();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <Share2 className="h-4 w-4" />
                <span>Share your call</span>
              </button>

              <button
                id="trade-done-btn"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Active Trade Form
          <div>
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Prediction Market</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono">
                  Virtual Credits Only
                </span>
              </div>
              <h2 className="text-lg font-black text-white line-clamp-1">{market.title}</h2>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Balance: <strong className="text-emerald-400 font-mono">{userBalance.toLocaleString()}</strong> credits</span>
                {ownedShares > 0 && (
                  <span className="font-mono text-zinc-300">Holding {ownedShares.toFixed(2)} {side}</span>
                )}
              </div>
            </div>

            {/* Buy / Sell Tabs */}
            {ownedShares > 0 && (
              <div className="mb-4 grid grid-cols-2 rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setAction('BUY')}
                  className={`py-1.5 rounded-lg transition-all ${
                    action === 'BUY' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setAction('SELL')}
                  className={`py-1.5 rounded-lg transition-all ${
                    action === 'SELL' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SELL (Take Profit)
                </button>
              </div>
            )}

            {/* YES / NO Side Selector */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                id="trade-select-yes"
                onClick={() => setSide('YES')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  side === 'YES'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/30'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-bold uppercase">Back YES</span>
                <span className="text-xl font-black text-white font-mono mt-0.5">
                  {Math.round(market.yesPrice * 100)}%
                </span>
              </button>

              <button
                id="trade-select-no"
                onClick={() => setSide('NO')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  side === 'NO'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400 ring-2 ring-rose-500/30'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-bold uppercase">Back NO</span>
                <span className="text-xl font-black text-white font-mono mt-0.5">
                  {Math.round(market.noPrice * 100)}%
                </span>
              </button>
            </div>

            {/* Amount Selector */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-zinc-400 mb-2">
                <span>{action === 'BUY' ? 'Spend Credits:' : 'Shares to Sell:'}</span>
                {action === 'BUY' && (
                  <button
                    onClick={() => handleAmountChange(userBalance)}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline"
                  >
                    Max ({userBalance.toLocaleString()})
                  </button>
                )}
                {action === 'SELL' && (
                  <button
                    onClick={() => handleAmountChange(ownedShares)}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline"
                  >
                    All ({ownedShares.toFixed(2)})
                  </button>
                )}
              </div>

              {/* Quick Amount Pills */}
              {action === 'BUY' && (
                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {[10, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleAmountChange(amt)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        amount === amt
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Input */}
              <div className="relative">
                <input
                  id="trade-amount-input"
                  type="number"
                  min="1"
                  max={action === 'BUY' ? userBalance : ownedShares}
                  value={customInput}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-base font-bold font-mono text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Custom amount"
                />
                <span className="absolute right-4 top-3 text-xs font-semibold text-zinc-500 uppercase">
                  {action === 'BUY' ? 'credits' : 'shares'}
                </span>
              </div>
            </div>

            {/* Live Calculation Preview from LMSR */}
            {quote && (
              <div className="mb-5 rounded-2xl bg-white/5 p-3.5 border border-white/10 text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Estimated shares:</span>
                  <span className="font-mono text-white font-bold">{quote.shares}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Average execution price:</span>
                  <span className="font-mono text-white">{Math.round(quote.averagePrice * 100)}%</span>
                </div>
                {action === 'BUY' && (
                  <>
                    <div className="flex justify-between text-zinc-400">
                      <span>If {side} wins:</span>
                      <span className="font-mono text-emerald-400 font-bold">{quote.shares} credits</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Potential virtual profit:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        +{Math.max(0, quote.shares - amount).toFixed(2)} credits
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-zinc-400 border-t border-white/5 pt-1.5 text-[11px]">
                  <span>Market after trade:</span>
                  <span className="font-mono text-zinc-300">
                    {side} {Math.round(quote.priceBefore * 100)}% → <strong className="text-white">{Math.round(quote.priceAfter * 100)}%</strong>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Confirm Button */}
            <button
              id="trade-confirm-btn"
              onClick={handleConfirmTrade}
              disabled={loading || !quote}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition-all ${
                side === 'YES'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed active:scale-98`}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    CONFIRM {action} {side}
                  </span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
