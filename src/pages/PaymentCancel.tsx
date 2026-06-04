import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-500 shadow-lg shadow-red-100">
          <XCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment cancelled</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            You have cancelled the payment. No charges were applied to your account. You can return to pricing and try again, or continue with your current plan.
          </p>
        </div>

        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Return to Pricing
          </button>
        </a>
      </div>
    </div>
  );
}
