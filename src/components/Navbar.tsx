import React, { useState } from 'react';
import { Flame, Compass, PlusCircle, Trophy, User as UserIcon, Bell, Search, Shield, Coins, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenCreate: () => void;
  onOpenWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenCreate,
  onOpenWallet,
}) => {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectTab(`search:${searchQuery.trim()}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0b0e]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Nav items */}
        <div className="flex items-center gap-8">
          <button
            id="nav-logo-btn"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 text-black shadow-lg shadow-emerald-500/20 font-black tracking-tighter text-xl">
              V
            </div>
            <div>
              <span className="text-xl font-black tracking-wider text-white">VIRAL</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/10 text-emerald-400">
                Play Credits
              </span>
            </div>
          </button>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-discover-link"
              onClick={() => onSelectTab('discover')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentTab === 'discover'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Discover
            </button>
            <button
              id="nav-new-link"
              onClick={() => onSelectTab('new')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentTab === 'new'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Early Calls
            </button>
            <button
              id="nav-closing-link"
              onClick={() => onSelectTab('closing')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentTab === 'closing'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Closing Soon
            </button>
            <button
              id="nav-leaderboard-link"
              onClick={() => onSelectTab('leaderboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentTab === 'leaderboard'
                  ? 'text-white bg-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Leaderboard
            </button>
          </nav>
        </div>

        {/* Center: Search input */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              id="nav-search-input"
              type="text"
              placeholder="Search creator, title or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:bg-black/60 focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Right: Credits, Create, Profile */}
        <div className="flex items-center gap-3">
          <button
            id="nav-create-btn"
            onClick={onOpenCreate}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <PlusCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Create Market</span>
          </button>

          {user && profile ? (
            <>
              {/* Virtual Credits Balance Pill */}
              <button
                id="nav-credits-pill-btn"
                onClick={onOpenWallet}
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                title="Virtual Credits — No Cash Value"
              >
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono">{profile.virtualCreditsBalance.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-400 font-normal">pts</span>
              </button>

              {/* Profile Avatar / Link */}
              <button
                id="nav-profile-btn"
                onClick={() => onSelectTab('profile')}
                className="flex items-center gap-2 rounded-full p-1 text-zinc-300 hover:text-white transition-colors focus:outline-none"
              >
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.username}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-white/20 text-xs font-bold text-emerald-400">
                    {profile.username?.substring(0, 2).toUpperCase() || 'TR'}
                  </div>
                )}
              </button>
            </>
          ) : (
            <button
              id="nav-login-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
