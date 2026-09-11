import React from 'react';
import { Home, Compass, PlusCircle, Trophy, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0b0e]/95 backdrop-blur-lg px-2 py-1">
      <div className="flex items-center justify-around">
        <button
          id="bottom-nav-home"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center py-2 px-3 text-[10px] font-medium transition-colors ${
            currentTab === 'home' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5 mb-1" />
          <span>Home</span>
        </button>

        <button
          id="bottom-nav-discover"
          onClick={() => onSelectTab('discover')}
          className={`flex flex-col items-center py-2 px-3 text-[10px] font-medium transition-colors ${
            currentTab === 'discover' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Compass className="h-5 w-5 mb-1" />
          <span>Discover</span>
        </button>

        {/* Center Create Action */}
        <button
          id="bottom-nav-create"
          onClick={onOpenCreate}
          className="flex flex-col items-center -mt-4 p-2"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
            <PlusCircle className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1">Create</span>
        </button>

        <button
          id="bottom-nav-leaderboard"
          onClick={() => onSelectTab('leaderboard')}
          className={`flex flex-col items-center py-2 px-3 text-[10px] font-medium transition-colors ${
            currentTab === 'leaderboard' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="h-5 w-5 mb-1" />
          <span>Ranks</span>
        </button>

        <button
          id="bottom-nav-profile"
          onClick={() => {
            if (user) {
              onSelectTab('profile');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center py-2 px-3 text-[10px] font-medium transition-colors ${
            currentTab === 'profile' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <User className="h-5 w-5 mb-1" />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>
    </nav>
  );
};
