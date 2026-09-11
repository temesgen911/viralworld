import { calculateBuyShares, calculateSellShares, getYesPrice, getNoPrice, lmsrCost, DEFAULT_B } from '../services/marketMaker/lmsr.ts';
import { YouTubeProvider } from '../services/content/youtubeProvider.ts';
import { suggestThresholds } from '../services/thresholds/suggestThresholds.ts';
import { calculateViralScore, isEarlyViralCall } from '../services/reputation/viralScore.ts';
import { ServerStore } from '../server/db.ts';

export async function runTests() {
  console.log('--- RUNNING VIRAL CORE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. YouTube URL parsing
  const yt = new YouTubeProvider();
  const shortsUrl = yt.parseUrl('https://www.youtube.com/shorts/07d2dXHYb94');
  assert(shortsUrl?.contentId === '07d2dXHYb94', 'Parse YouTube Shorts URL');

  const watchUrl = yt.parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
  assert(watchUrl?.contentId === 'dQw4w9WgXcQ', 'Parse YouTube Watch URL with query params');

  const youtuBeUrl = yt.parseUrl('https://youtu.be/7ghhRHRP6t4?si=abc');
  assert(youtuBeUrl?.contentId === '7ghhRHRP6t4', 'Parse youtu.be short URL');

  const invalidUrl = yt.parseUrl('https://example.com/not-youtube');
  assert(invalidUrl === null, 'Reject non-YouTube URL');

  // 2. Threshold suggestions
  const suggestions = suggestThresholds(32000, 'views');
  assert(suggestions.length === 4, 'Suggests 4 progressive milestones');
  assert(suggestions[0].target > 32000, 'All suggested thresholds strictly exceed current views');
  assert(new Date(suggestions[0].deadlineIso).getTime() > Date.now(), 'Threshold deadlines are in the future');

  // 3. LMSR Pricing
  const initialYesPrice = getYesPrice(0, 0, DEFAULT_B);
  assert(Math.abs(initialYesPrice - 0.5) < 0.01, 'Initial LMSR price with equal shares is ~50%');

  const buyYesQuote = calculateBuyShares('YES', 100, 0, 0, DEFAULT_B);
  assert(buyYesQuote.shares > 0, 'Buying YES yields positive shares');
  assert(buyYesQuote.priceAfter > buyYesQuote.priceBefore, 'Buying YES shifts probability upwards');
  assert(buyYesQuote.credits === 100, 'Credits spent equals requested budget');

  const buyNoQuote = calculateBuyShares('NO', 100, buyYesQuote.newQYes, buyYesQuote.newQNo, DEFAULT_B);
  assert(buyNoQuote.shares > 0, 'Buying NO yields positive shares');
  assert(buyNoQuote.priceAfter > buyNoQuote.priceBefore, 'Buying NO shifts NO probability upwards');

  // 4. Selling shares
  const sellQuote = calculateSellShares('YES', 50, buyYesQuote.newQYes, buyYesQuote.newQNo, DEFAULT_B);
  assert(sellQuote.credits > 0, 'Selling shares returns positive credits');
  assert(sellQuote.priceAfter < sellQuote.priceBefore, 'Selling YES shifts probability downwards');

  // 5. Viral Score & Early Viral Call calculation
  const isEarly = isEarlyViralCall(42000, 1000000); // 4.2% <= 10%
  assert(isEarly === true, 'Entry at 4.2% of target qualifies as Early Viral Call');

  const notEarly = isEarlyViralCall(250000, 1000000); // 25% > 10%
  assert(notEarly === false, 'Entry at 25% of target does NOT qualify as Early Viral Call');

  const scoreNewbie = calculateViralScore({ resolvedMarkets: 0, profitableCalls: 0, viralCalls: 0, virtualROI: 0 });
  assert(scoreNewbie === 10, 'New predictor starts with baseline viral score');

  const scoreVeteran = calculateViralScore({ resolvedMarkets: 25, profitableCalls: 20, viralCalls: 5, virtualROI: 45 });
  assert(scoreVeteran > 70, 'High accuracy & viral calls produce high reputation score');

  // 6. Server-authoritative trade & balances
  const testUserId = `test_user_${Date.now()}`;
  const user = await ServerStore.getUserProfile(testUserId);
  assert(user.virtualCreditsBalance === 5000, 'New user receives 5,000 welcome credits');

  const markets = await ServerStore.getMarkets();
  const testMarket = markets[0];

  const tradeResult = await ServerStore.executeTrade({
    marketId: testMarket.id,
    userId: testUserId,
    username: 'test_trader',
    side: 'YES',
    action: 'BUY',
    amount: 250,
  });

  assert(tradeResult.newBalance === 4750, 'User balance deducted correctly after 250 credit spend');
  assert(tradeResult.position.yesShares > 0, 'Position holds acquired YES shares');

  const ledger = await ServerStore.getLedger(testUserId);
  assert(ledger.length >= 2, 'Wallet ledger recorded both welcome bonus and trade');

  console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  return { passed, failed };
}

// If run directly via node/tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
