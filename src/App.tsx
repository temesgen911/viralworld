import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DiscoverPage } from './pages/DiscoverPage.tsx';
import { MarketDetailPage } from './pages/MarketDetailPage.tsx';
import { CreateMarketPage } from './pages/CreateMarketPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { CreditsWalletPage } from './pages/CreditsWalletPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import { TradeModal } from './components/TradeModal.tsx';
import { ShareCardModal } from './components/ShareCardModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { Market, Position, Trade } from './types/index.ts';

function AppContent() {
  const { user, profile, showOnboarding, setShowOnboarding } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null);

  // Modals State
  const [tradeModalMarket, setTradeModalMarket] = useState<Market | null>(null);
  const [tradeModalSide, setTradeModalSide] = useState<'YES' | 'NO'>('YES');
  const [userPositionForTrade, setUserPositionForTrade] = useState<Position | null>(null);

  const [shareModalMarket, setShareModalMarket] = useState<Market | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createInitialUrl, setCreateInitialUrl] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // URL Hash routing listener for direct links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('market/')) {
        const id = hash.replace('market/', '');
        setCurrentTab(`market:${id}`);
      } else if (hash.startsWith('user/')) {
        const uid = hash.replace('user/', '');
        setViewProfileUserId(uid);
        setCurrentTab('profile');
      } else if (['discover', 'leaderboard', 'create', 'wallet', 'admin', 'legal'].includes(hash)) {
        setCurrentTab(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab: string) => {
    if (tab === 'home') {
      setSelectedMarket(null);
      setViewProfileUserId(null);
      window.location.hash = '';
    } else if (tab === 'profile') {
      setViewProfileUserId(user?.uid || null);
      window.location.hash = user ? `user/${user.uid}` : '';
    } else if (!tab.startsWith('market:') && !tab.startsWith('search:')) {
      window.location.hash = tab;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMarket = (market: Market) => {
    setSelectedMarket(market);
    window.location.hash = `market/${market.slug || market.id}`;
    setCurrentTab(`market:${market.id}`);
  };

  const handleOpenTrade = async (market: Market, side: 'YES' | 'NO') => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setTradeModalMarket(market);
    setTradeModalSide(side);

    // Fetch existing position for this market if any
    try {
      const res = await fetch(`/api/positions/${user.uid}`);
      if (res.ok) {
        const positions: Position[] = await res.json();
        const existing = positions.find((p) => p.marketId === market.id);
        setUserPositionForTrade(existing || null);
      }
    } catch {
      setUserPositionForTrade(null);
    }
  };

  const handleTradeSuccess = (trade: Trade, updatedMarket: Market) => {
    showToast(`You're in. ${trade.side} at ${Math.round(trade.averagePrice * 100)}%.`);
    // Update active market view if current
    if (selectedMarket && selectedMarket.id === updatedMarket.id) {
      setSelectedMarket(updatedMarket);
    }
  };

  const handleNavigateCreateWithUrl = (url: string) => {
    setCreateInitialUrl(url);
    handleSelectTab('create');
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-[#12141a]/95 px-4 py-3 text-xs font-bold text-emerald-400 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCreate={() => {
          if (!user) setAuthModalOpen(true);
          else handleSelectTab('create');
        }}
        onOpenWallet={() => handleSelectTab('wallet')}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            onSelectMarket={handleSelectMarket}
            onTradeQuick={handleOpenTrade}
            onNavigateCreateWithUrl={handleNavigateCreateWithUrl}
            onSelectTab={handleSelectTab}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverPage
            onSelectMarket={handleSelectMarket}
            onTradeQuick={handleOpenTrade}
          />
        )}

        {currentTab.startsWith('search:') && (
          <DiscoverPage
            initialSearch={currentTab.replace('search:', '')}
            onSelectMarket={handleSelectMarket}
            onTradeQuick={handleOpenTrade}
          />
        )}

        {currentTab === 'new' && (
          <DiscoverPage
            onSelectMarket={handleSelectMarket}
            onTradeQuick={handleOpenTrade}
          />
        )}

        {currentTab === 'closing' && (
          <DiscoverPage
            onSelectMarket={handleSelectMarket}
            onTradeQuick={handleOpenTrade}
          />
        )}

        {currentTab.startsWith('market:') && (
          <MarketDetailPage
            marketIdOrSlug={currentTab.replace('market:', '')}
            onOpenTrade={(side) => {
              if (selectedMarket) handleOpenTrade(selectedMarket, side);
            }}
            onOpenShare={() => {
              if (selectedMarket) setShareModalMarket(selectedMarket);
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onViewCreator={(creatorId) => {
              handleSelectTab(`search:${creatorId}`);
            }}
          />
        )}

        {currentTab === 'create' && (
          <CreateMarketPage
            initialUrl={createInitialUrl}
            onMarketCreated={(m) => {
              showToast('Market successfully launched!');
              handleSelectMarket(m);
            }}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectExistingMarket={handleSelectMarket}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardPage
            onViewProfile={(uid) => {
              setViewProfileUserId(uid);
              handleSelectTab('profile');
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            userId={viewProfileUserId || user?.uid}
            onSelectMarket={handleSelectMarket}
            onOpenWallet={() => handleSelectTab('wallet')}
          />
        )}

        {currentTab === 'wallet' && <CreditsWalletPage />}

        {currentTab === 'admin' && <AdminPage />}

        {currentTab === 'legal' && <LegalPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0b0e] py-8 px-4 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 font-black text-black text-xs">
              V
            </div>
            <span className="font-bold text-white">VIRAL</span>
            <span className="text-zinc-600">|</span>
            <span>The Prediction Market for Internet Content</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button onClick={() => handleSelectTab('legal')} className="hover:text-zinc-300 transition-colors">
              Market Rules
            </button>
            <button onClick={() => handleSelectTab('legal')} className="hover:text-zinc-300 transition-colors">
              Terms & Privacy
            </button>
            <button onClick={() => handleSelectTab('legal')} className="hover:text-zinc-300 transition-colors">
              Responsible Play
            </button>
            <button onClick={() => handleSelectTab('admin')} className="hover:text-emerald-400 transition-colors">
              Admin Ops
            </button>
          </div>

          <div className="text-[10px] text-zinc-600 text-center sm:text-right">
            Virtual play credits only • No real money gambling • No cash redemption value
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenCreate={() => {
          if (!user) setAuthModalOpen(true);
          else handleSelectTab('create');
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Modals */}
      {tradeModalMarket && (
        <TradeModal
          market={tradeModalMarket}
          initialSide={tradeModalSide}
          position={userPositionForTrade}
          onClose={() => setTradeModalMarket(null)}
          onTradeSuccess={handleTradeSuccess}
          onOpenShare={() => setShareModalMarket(tradeModalMarket)}
        />
      )}

      {shareModalMarket && (
        <ShareCardModal
          market={shareModalMarket}
          userPositionSide={tradeModalSide}
          entryMetric={shareModalMarket.currentMetric}
          onClose={() => setShareModalMarket(null)}
        />
      )}

      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
