import React, { useState } from 'react';
import { X, LogIn, Mail, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsGuest } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!username.trim()) throw new Error('Please choose a username');
        await registerWithEmail(email, password, username);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in cancelled or failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsGuest();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div
        id="auth-modal"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#12141a] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <button
          id="auth-close-btn"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-400 text-black font-black text-2xl shadow-lg shadow-emerald-500/20">
            V
          </div>
          <h2 className="text-2xl font-black text-white">Join VIRAL</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Get <strong className="text-emerald-400">5,000 free virtual credits</strong> to start predicting
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-bold mb-4">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'login' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'register' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Register (+5,000 pts)
          </button>
        </div>

        {/* Google One-Click Button */}
        <button
          id="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-3 text-xs font-bold text-white transition-all mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#12141a] px-2 text-[10px] uppercase font-bold text-zinc-500">or with email</span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Username</label>
              <input
                id="auth-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="early_predictor"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Email</label>
            <input
              id="auth-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Password</label>
            <input
              id="auth-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account & Claim 5,000 Credits'}
          </button>
        </form>

        {/* Quick Guest Preview Button */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            id="auth-guest-btn"
            onClick={handleGuest}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Instant Demo Preview (One-click Guest Mode)</span>
          </button>
        </div>

        {/* Prominent Virtual Credit Disclaimer */}
        <p className="mt-4 text-center text-[10px] text-zinc-500 leading-normal">
          Virtual credits only • No monetary value • Cannot be purchased, transferred, redeemed, or withdrawn
        </p>
      </div>
    </div>
  );
};
