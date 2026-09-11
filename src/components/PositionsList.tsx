import React from 'react';
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { Position, Market } from '../types/index.ts';

interface PositionCardProps {
  position: Position;
  market: Market;
  onTrade: (side: 'YES' | 'NO', action: 'BUY' | 'SELL') => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({ position, market, onTrade }) => {
  const isYes = position.yesShares > 0;
  const shares = isYes ? position.yesShares : position.noShares;
  const side = isYes ? 'YES' : 'NO';
  const currentPrice = isYes ? market.yesPrice : market.noPrice;
  const currentValue = shares * currentPrice;
  const unrealizedPnL = currentValue - position.totalCostCredits;
  const isProfitable = unrealizedPnL >= 0;

  if (shares <= 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12141a] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Position</span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-black font-mono ${
              side === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {side}
          </span>
        </div>

        {position.settled && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
            Settled ({position.settledPayoutCredits?.toFixed(1)} pts)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-white/5 text-xs font-mono">
        <div>
          <div className="text-zinc-500 text-[10px]">Shares Held</div>
          <div className="text-white font-bold text-sm mt-0.5">{shares.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-zinc-500 text-[10px]">Cost Basis</div>
          <div className="text-zinc-300 text-sm mt-0.5">{position.totalCostCredits.toLocaleString()} pts</div>
        </div>

        <div>
          <div className="text-zinc-500 text-[10px]">Current Value</div>
          <div className="text-white font-bold text-sm mt-0.5">{Math.round(currentValue).toLocaleString()} pts</div>
        </div>

        <div>
          <div className="text-zinc-500 text-[10px]">Unrealized P&L</div>
          <div
            className={`flex items-center gap-1 text-sm font-bold mt-0.5 ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isProfitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {isProfitable ? '+' : ''}
              {Math.round(unrealizedPnL)} pts
            </span>
          </div>
        </div>
      </div>

      {!position.settled && market.status === 'active' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onTrade(side, 'BUY')}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white/10 hover:bg-white/15 py-2 text-xs font-bold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add to {side}</span>
          </button>

          <button
            onClick={() => onTrade(side, 'SELL')}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
            <span>Sell Position</span>
          </button>
        </div>
      )}
    </div>
  );
};
