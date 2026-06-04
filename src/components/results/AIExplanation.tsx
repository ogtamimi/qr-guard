/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, ArrowDownCircle, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import { ScanResult } from '../../types';

interface AIExplanationProps {
  scan: ScanResult;
}

export default function AIExplanation({ scan }: AIExplanationProps) {
  const { aiSummary, aiRecommendation, reasons } = scan;

  const isHighRisk = scan.status === 'DANGEROUS' || scan.status === 'SUSPICIOUS';

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
      {/* Decorative gradient corner aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
        <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
        <div>
          <h3 id="ai-rep-hdr" className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Smart Cybersecurity Report (QR Guard AI)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Structured linguistic and semantic threat assessment powered by Groq Llama AI models.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Summary Block */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-300 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-white">Security Scan Summary:</span>
          </div>
          <div className="text-[12.5px] leading-relaxed text-slate-300 font-normal bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            {aiSummary || 'Drafting custom AI threat report...'}
          </div>
        </div>

        {/* 2. Recommendation Block */}
        <div className={`p-4 rounded-xl border ${
          isHighRisk 
            ? 'bg-red-950/20 border-red-900/50 text-red-100' 
            : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-100'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            {isHighRisk ? (
              <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="text-xs font-bold text-white">Immediate Security Recommendation:</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            {aiRecommendation || 'Always verify the final domain name in your address bar.'}
          </p>
        </div>

        {/* 3. AI Flags Bullets */}
        {reasons.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-slate-300 mb-2">
              <ArrowDownCircle className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-white">Technical Evidence & Indicators:</span>
            </div>
            <ul className="space-y-1.5">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed bg-slate-950/20 px-3 py-2 rounded-lg border border-slate-800/40">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Trust Sign off */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Scan Reference ID: {scan.id}</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Fully Secured & Stable
        </span>
      </div>
    </div>
  );
}
