import React from 'react';
import { CheckCircle, ArrowLeft, Headphones } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100">
          <CheckCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment received successfully</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Thank you! We've received your payment. <strong className="text-slate-800">Account upgrade may take a few minutes</strong>
            while our team verifies and activates your subscription.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-800 leading-relaxed font-medium">
          <strong className="block font-black mb-1 text-[10px] uppercase tracking-widest">What's next?</strong>
          Your QR Guard account will be upgraded to the selected plan (Pro or Enterprise) manually by the support team.
          Once activated, you'll be able to use your new daily scan limits immediately.
        </div>

        <div className="space-y-3">
          <a
            href="/"
            onClick={() => {
              try {
                localStorage.removeItem('__qr_hash_route');
              } catch {}
            }}
            style={{ textDecoration: 'none' }}
          >
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </button>
          </a>

          <a
            href="mailto:ogttamimi@gmail.com"
            style={{ textDecoration: 'none' }}
          >
            <button className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Headphones className="h-4 w-4 text-indigo-600" />
              Contact Support
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
