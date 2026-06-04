import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function PaymentSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
    >
      <div className="text-center space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <ExternalLink className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Payment Initiated Successfully</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Plan activation may take 1-2 minutes while our team confirms your payment.
          You'll receive an email confirmation once your plan is activated.
        </p>
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => {
              window.location.href = '#/dashboard';
            }}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Go to Dashboard</span>
          </button>
          <p className="text-[10px] text-slate-500">
            Need help? Contact us at <a href="mailto:support@qrguard.com" className="underline">support@qrguard.com</a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}