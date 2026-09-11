import React, { useState } from 'react';
import { ArrowRight, Sparkles, TrendingUp, Award, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { user, profile, updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(profile?.username || '');
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!username.trim()) {
      setError('Please choose a username');
      return;
    }
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean.length < 3) {
      setError('Username must be at least 3 alphanumeric characters');
      return;
    }

    try {
      if (user) {
        await updateProfileData({
          username: clean,
          displayName: clean,
        });
        localStorage.setItem(`viral_onboarded_${user.uid}`, 'true');
      }
      onComplete();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div
        id="onboarding-modal"
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#12141a] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center"
      >
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-emerald-400' : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
              Think you know what goes viral?
            </h2>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              Spot fresh Shorts and YouTube videos before the algorithm pushes them to millions. Back your call and prove you saw it first.
            </p>

            <button
              id="onboard-next-1"
              onClick={() => setStep(2)}
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/25 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-black tracking-tight text-white uppercase">
              Crowdsourced Attention Markets
            </h2>

            <div className="my-5 rounded-2xl bg-white/5 p-4 border border-white/10 text-left text-xs">
              <div className="text-[11px] text-zinc-400 font-medium mb-1">Example Market:</div>
              <div className="font-bold text-white mb-2">"Will this Short hit 1M views in 7 days?"</div>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  YES 34%
                </div>
                <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold">
                  NO 66%
                </div>
              </div>

              <p className="mt-3 text-[11px] text-zinc-400 leading-normal">
                Prices adjust dynamically based on trader beliefs. When content hits the threshold before deadline, YES wins!
              </p>
            </div>

            <button
              id="onboard-next-2"
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/25 transition-all"
            >
              <span>Next: Claim 5,000 Credits</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-400 text-black shadow-lg shadow-emerald-500/25">
              <Coins className="h-8 w-8 stroke-[2.5]" />
            </div>

            <h2 className="text-xl font-black tracking-tight text-white uppercase">
              Prove You Were Early
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Build your reputation, rack up Viral Calls, and climb the global leaderboards.
            </p>

            <div className="my-5 text-left">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Choose your predictor username:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500 font-mono text-sm">@</span>
                <input
                  id="onboard-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="trend_hunter"
                  className="w-full rounded-xl border border-white/20 bg-black/50 py-2.5 pl-8 pr-4 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
            </div>

            <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-400 font-medium">
              🎁 Welcome Bonus: <strong>+5,000 VIRAL Credits</strong> credited automatically!
              <div className="text-[10px] text-zinc-400 mt-0.5">Virtual credits — No cash value</div>
            </div>

            <button
              id="onboard-finish-btn"
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 py-3.5 text-sm font-black text-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <span>START WITH 5,000 CREDITS</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
