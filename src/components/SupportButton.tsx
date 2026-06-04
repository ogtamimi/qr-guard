import React from 'react';

const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/NKZHVG2EE5TEQ';

function PaymentIcon({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
      aria-label={label}
      title={label}
    >
      {children}
    </span>
  );
}

export default function SupportButton() {
  return (
    <>
      <style>{`@keyframes glow-pulse{0%,100%{box-shadow:0 0 20px -10px rgba(99,102,241,0.25),0 0 60px -30px rgba(99,102,241,0.3)}50%{box-shadow:0 0 30px -5px rgba(99,102,241,0.45),0 0 60px -20px rgba(99,102,241,0.4)}}.glow-btn{animation:glow-pulse 3s ease-in-out infinite}`}</style>
    <a
      href={PAYPAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'group relative block w-full sm:w-auto',
        'rounded-2xl',
      ].join(' ')}
      onClick={(e) => {
        // Keep default anchor behavior (new tab). This handler exists to avoid any accidental SPA routing.
        e.stopPropagation();
      }}
    >
      <div
        className={[
          'rounded-2xl p-[1.5px]',
          'bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500',
          'glow-btn',
          'transition-transform duration-300 ease-out',
          'group-hover:scale-[1.02]',
        ].join(' ')}
      >
        <div
          className={[
            'h-full',
            'rounded-2xl',
            'bg-white/70 dark:bg-white/5 backdrop-blur-xl',
            'border border-white/60 dark:border-white/10',
            'p-4 sm:p-5',
            'transition-shadow duration-300 ease-out',
            'group-hover:shadow-xl group-hover:shadow-indigo-200/40 dark:group-hover:shadow-indigo-900/40',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-700 dark:text-indigo-400">
                  <span aria-hidden="true" className="text-base">
                    💜
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="text-sm sm:text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                    Support QR Guard
                  </div>
                  <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 leading-relaxed">
                    Keeps the protection engine running
                  </div>
                </div>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-sm">
              <span aria-hidden="true">→</span>
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <PaymentIcon label="Credit / Debit Cards">
                <span aria-hidden="true" className="text-slate-900 dark:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </span>
              </PaymentIcon>

              <PaymentIcon label="Apple Pay">
                <span aria-hidden="true" className="text-slate-900 dark:text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </span>
              </PaymentIcon>

              <PaymentIcon label="PayPal">
                <span aria-hidden="true" className="text-slate-900 dark:text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                  </svg>
                </span>
              </PaymentIcon>

              <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                Trusted payment methods
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
            Opens PayPal in a new tab
          </div>
        </div>
      </div>
    </a>
    </>
  );
}
