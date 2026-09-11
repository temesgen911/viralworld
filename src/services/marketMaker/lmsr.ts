/**
 * Logarithmic Market Scoring Rule (LMSR) Automated Market Maker
 * Pure deterministic mathematics with numerically stable log-sum-exp.
 */

export const DEFAULT_B = 1000;

export interface LMSRState {
  qYes: number;
  qNo: number;
  b: number;
}

export interface TradeCalculationResult {
  credits: number;        // Credits spent (positive) or received (negative for sell)
  shares: number;         // Shares bought or sold
  averagePrice: number;   // Average execution price (0 to 1)
  priceBefore: number;    // Market YES/NO probability before trade
  priceAfter: number;     // Market YES/NO probability after trade
  newQYes: number;
  newQNo: number;
}

/**
 * Numerically stable log-sum-exp: ln(e^x + e^y)
 */
export function logSumExp(x: number, y: number): number {
  const max = Math.max(x, y);
  if (max === -Infinity) return -Infinity;
  return max + Math.log(Math.exp(x - max) + Math.exp(y - max));
}

/**
 * LMSR Cost function: C(qYes, qNo) = b * ln(e^(qYes/b) + e^(qNo/b))
 */
export function lmsrCost(qYes: number, qNo: number, b: number = DEFAULT_B): number {
  return b * logSumExp(qYes / b, qNo / b);
}

/**
 * Spot price for YES (0 to 1)
 * P(YES) = 1 / (1 + e^((qNo - qYes)/b))
 */
export function getYesPrice(qYes: number, qNo: number, b: number = DEFAULT_B): number {
  const diff = (qNo - qYes) / b;
  if (diff > 100) return 0.001; // Cap extremes cleanly
  if (diff < -100) return 0.999;
  const price = 1 / (1 + Math.exp(diff));
  return Math.min(0.99, Math.max(0.01, price));
}

/**
 * Spot price for NO (0 to 1)
 */
export function getNoPrice(qYes: number, qNo: number, b: number = DEFAULT_B): number {
  return 1 - getYesPrice(qYes, qNo, b);
}

/**
 * Calculate shares acquired for a given credit spend using analytical LMSR + binary search validation.
 */
export function calculateBuyShares(
  side: 'YES' | 'NO',
  creditsToSpend: number,
  qYes: number,
  qNo: number,
  b: number = DEFAULT_B
): TradeCalculationResult {
  if (creditsToSpend <= 0) {
    throw new Error('Credits to spend must be greater than zero');
  }

  const priceBefore = side === 'YES' ? getYesPrice(qYes, qNo, b) : getNoPrice(qYes, qNo, b);
  const currentCost = lmsrCost(qYes, qNo, b);

  // Binary search for exact shares delta
  let low = 0;
  let high = creditsToSpend / Math.max(0.01, priceBefore) * 2 + 10;
  
  // Refine high bound
  while (true) {
    const testCost = side === 'YES' 
      ? lmsrCost(qYes + high, qNo, b)
      : lmsrCost(qYes, qNo + high, b);
    if (testCost - currentCost >= creditsToSpend) break;
    high *= 2;
  }

  let shares = 0;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const testCost = side === 'YES'
      ? lmsrCost(qYes + mid, qNo, b)
      : lmsrCost(qYes, qNo + mid, b);
    const diff = testCost - currentCost;
    
    if (Math.abs(diff - creditsToSpend) < 1e-6) {
      shares = mid;
      break;
    }
    if (diff < creditsToSpend) {
      low = mid;
    } else {
      high = mid;
    }
    shares = mid;
  }

  const newQYes = side === 'YES' ? qYes + shares : qYes;
  const newQNo = side === 'NO' ? qNo + shares : qNo;
  const priceAfter = side === 'YES' ? getYesPrice(newQYes, newQNo, b) : getNoPrice(newQYes, newQNo, b);
  const averagePrice = creditsToSpend / shares;

  return {
    credits: Math.round(creditsToSpend * 100) / 100,
    shares: Math.round(shares * 100) / 100,
    averagePrice: Math.min(1, Math.max(0.01, Math.round(averagePrice * 1000) / 1000)),
    priceBefore: Math.round(priceBefore * 1000) / 1000,
    priceAfter: Math.round(priceAfter * 1000) / 1000,
    newQYes: Math.round(newQYes * 100) / 100,
    newQNo: Math.round(newQNo * 100) / 100,
  };
}

/**
 * Calculate credits returned for selling shares
 */
export function calculateSellShares(
  side: 'YES' | 'NO',
  sharesToSell: number,
  qYes: number,
  qNo: number,
  b: number = DEFAULT_B
): TradeCalculationResult {
  if (sharesToSell <= 0) {
    throw new Error('Shares to sell must be greater than zero');
  }

  const currentCost = lmsrCost(qYes, qNo, b);
  const priceBefore = side === 'YES' ? getYesPrice(qYes, qNo, b) : getNoPrice(qYes, qNo, b);

  const newQYes = side === 'YES' ? Math.max(0, qYes - sharesToSell) : qYes;
  const newQNo = side === 'NO' ? Math.max(0, qNo - sharesToSell) : qNo;

  const newCost = lmsrCost(newQYes, newQNo, b);
  const creditsReturned = Math.max(0, currentCost - newCost);

  const priceAfter = side === 'YES' ? getYesPrice(newQYes, newQNo, b) : getNoPrice(newQYes, newQNo, b);
  const averagePrice = sharesToSell > 0 ? creditsReturned / sharesToSell : priceBefore;

  return {
    credits: Math.round(creditsReturned * 100) / 100,
    shares: Math.round(sharesToSell * 100) / 100,
    averagePrice: Math.min(1, Math.max(0.01, Math.round(averagePrice * 1000) / 1000)),
    priceBefore: Math.round(priceBefore * 1000) / 1000,
    priceAfter: Math.round(priceAfter * 1000) / 1000,
    newQYes: Math.round(newQYes * 100) / 100,
    newQNo: Math.round(newQNo * 100) / 100,
  };
}
