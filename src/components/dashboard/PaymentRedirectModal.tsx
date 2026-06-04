import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { PricingPlan } from '../../types';

interface PaymentRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  userEmail: string;
  onPaymentInitiated: (paymentId: string, paypalUrl: string) => void;
}

export default function PaymentRedirectModal({
  isOpen,
  onClose,
  plan,
}: PaymentRedirectModalProps) {
  if (!isOpen || !plan) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col text-slate-800"
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Payments Disabled</h3>
                <p className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase">
                  Temporary maintenance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200/70 transition-colors text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
              <div className="text-[10px] uppercase font-extrabold text-indigo-500 tracking-wider">
                Plan Selected
              </div>
              <div className="text-sm font-black text-slate-900">{plan.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">/{plan.pricePeriod}</div>
            </div>

            <div className="text-[11px] text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
              Payments are temporarily disabled. Checkout and PayPal redirect flow will be rebuilt from
              scratch.
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
