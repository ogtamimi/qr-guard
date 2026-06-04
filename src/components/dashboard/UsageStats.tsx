/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, TrendingDown, Check, Activity, Award } from 'lucide-react';
import { UserStats, UserPlan } from '../../types';

interface UsageStatsProps {
  stats: UserStats;
  plan: UserPlan;
}

export default function UsageStats({ stats, plan }: UsageStatsProps) {
  const {
    totalScans,
    safeScans,
    suspiciousScans,
    dangerousScans,
    remainingScansToday,
    scansTodayCount,
    maxScansPerDay,
  } = stats;

  const safePercentage = totalScans > 0 ? Math.round((safeScans / totalScans) * 100) : 100;
  const threatPercentage = totalScans > 0 ? Math.round(((suspiciousScans + dangerousScans) / totalScans) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* 1. Remaining Daily limits */}
      <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Daily Usage Limit</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-mono font-black text-slate-800">{remainingScansToday}</span>
            <span className="text-xs text-slate-500">/ {maxScansPerDay} left</span>
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">Scans Today</span>
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100">{scansTodayCount} scans</span>
        </div>
      </div>

      {/* 2. Total Audited Link Counts */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <span className="text-[10px] font-black text-indigo-600 block uppercase tracking-widest">Total Scans Audited</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-mono font-black text-indigo-600">{totalScans}</span>
            <span className="text-xs text-slate-500">links</span>
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">Scanner Status</span>
          <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-100">
            <Check className="h-3 w-3" /> Active
          </span>
        </div>
      </div>

      {/* 3. Safe domain ratio */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Safe Domain Ratio</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-mono font-black text-emerald-600">{safePercentage}%</span>
            <span className="text-xs text-slate-500">safe</span>
          </div>
        </div>
        {/* Simple inline progress bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${safePercentage}%` }} />
          </div>
        </div>
      </div>

      {/* 4. Dangers blocked */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Threats Blocked</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-mono font-black text-red-500">{dangerousScans + suspiciousScans}</span>
            <span className="text-xs text-slate-500">threats</span>
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">Risk Ratio</span>
          <span className="text-red-600 bg-red-50 font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-red-100">
            <ShieldAlert className="h-3 w-3" /> {threatPercentage}% risk
          </span>
        </div>
      </div>
    </div>
  );
}
