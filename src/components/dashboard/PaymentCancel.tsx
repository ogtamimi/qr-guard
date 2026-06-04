import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function PaymentCancel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6"
    >
      <div className="text-center space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <ExternalLink className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Payment Cancelled</h1>
        <p className="text-sm text-slate-600 max-w-md">
          If you cancelled by mistake, please contact our support team for assistance.
          You can always try upgrading again at any time.
        </p>
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => {
              window.location.href = '#/pricing';
            }}
            className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Pricing</span>
          </button>
          <p className="text-[10px] text-slate-500">
            Need help? Contact us at <a href="mailto:support@qrguard.com" className="underline">support@qrguard.com</a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}