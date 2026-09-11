import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Users, HeartHandshake } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'terms' | 'rules' | 'privacy' | 'responsible'>('terms');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 pb-28">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Policies & Guidelines</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Legal & Integrity</h1>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {[
          { id: 'terms', label: 'Terms of Service', icon: FileText },
          { id: 'rules', label: 'Market Rules', icon: ShieldCheck },
          { id: 'responsible', label: 'Responsible Play', icon: HeartHandshake },
          { id: 'privacy', label: 'Privacy Policy', icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id as any)}
              className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                activeSection === t.id
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="rounded-3xl border border-white/10 bg-[#12141a] p-6 sm:p-8 text-xs text-zinc-300 leading-relaxed space-y-5">
        {activeSection === 'terms' && (
          <>
            <h2 className="text-lg font-black text-white uppercase">1. Terms of Service</h2>
            <p>
              Welcome to VIRAL. By using this service, you agree to these Terms. VIRAL is a social prediction market platform designed to gamify the discovery of internet culture, short-form video, and digital creators.
            </p>
            <h3 className="text-sm font-bold text-white uppercase">Play Money & Virtual Credits Only</h3>
            <p>
              VIRAL operates strictly with non-monetary virtual credits. These credits have NO CASH VALUE and cannot under any circumstance be converted into, exchanged for, or redeemed for fiat currency, cryptocurrency, gift cards, or real-world property.
            </p>
            <h3 className="text-sm font-bold text-white uppercase">Eligibility</h3>
            <p>
              Users must be at least 13 years of age. You agree to use the platform in compliance with all local laws and the YouTube Terms of Service.
            </p>
          </>
        )}

        {activeSection === 'rules' && (
          <>
            <h2 className="text-lg font-black text-white uppercase">2. Market Resolution Rules</h2>
            <p>
              Markets on VIRAL resolve deterministically based on verified metrics fetched via the official YouTube Data API v3.
            </p>
            <h3 className="text-sm font-bold text-white uppercase">Early Resolution (YES)</h3>
            <p>
              If a video's view count reaches or exceeds the target threshold at any time prior to the market deadline, the market settles as YES immediately. All YES shares convert to 1.00 credit each.
            </p>
            <h3 className="text-sm font-bold text-white uppercase">Deadline Expiration (NO)</h3>
            <p>
              If the deadline expires and the verified view count remains below the target, the market settles as NO. All NO shares convert to 1.00 credit each.
            </p>
            <h3 className="text-sm font-bold text-white uppercase">Private, Deleted, or Altered Content</h3>
            <p>
              If a video is deleted or made private, a 24-hour grace window is opened. If the official YouTube API continues to return unavailable errors after 24 hours, the market is voided and all traders are refunded 100% of their spent credits.
            </p>
          </>
        )}

        {activeSection === 'responsible' && (
          <>
            <h2 className="text-lg font-black text-white uppercase">3. Responsible Play & Disclaimers</h2>
            <p>
              VIRAL is not a gambling site, casino, or sportsbook. We are a cultural forecasting sandbox. No real money deposits or withdrawals are accepted or facilitated.
            </p>
            <p>
              We monitor for artificial metric manipulation, botting, and self-dealing. Creators who spam fake views to trigger resolution are subject to market voiding and permanent platform ban.
            </p>
          </>
        )}

        {activeSection === 'privacy' && (
          <>
            <h2 className="text-lg font-black text-white uppercase">4. Privacy Policy</h2>
            <p>
              We value your privacy. We only collect basic authentication details (email address, chosen username) and public YouTube video metadata via YouTube API services.
            </p>
            <p>
              We do not sell user data to third-party brokers. All trading records on VIRAL are public to ensure reputation auditability.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
