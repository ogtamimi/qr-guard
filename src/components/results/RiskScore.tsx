/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';
import { ScanStatus } from '../../types';

interface RiskScoreProps {
  score: number;
  status: ScanStatus;
}

export default function RiskScore({ score, status }: RiskScoreProps) {
  // Determine color theme based on status
  let circleColor = 'stroke-emerald-500';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let titleColor = 'text-emerald-700';
  let statusText = 'Safe & Secure';
  let StatusIcon = Shield;

  if (status === 'DANGEROUS') {
    circleColor = 'stroke-red-500';
    badgeBg = 'bg-red-50 text-red-700 border-red-200';
    titleColor = 'text-red-700';
    statusText = 'Dangerous / Malicious';
    StatusIcon = ShieldX;
  } else if (status === 'SUSPICIOUS') {
    circleColor = 'stroke-amber-500';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    titleColor = 'text-amber-700';
    statusText = 'Suspicious / Untrusted';
    StatusIcon = ShieldAlert;
  } else if (status === 'ERROR') {
    circleColor = 'stroke-gray-400';
    badgeBg = 'bg-gray-50 text-gray-700 border-gray-200';
    titleColor = 'text-gray-700';
    statusText = 'Scan Failed';
    StatusIcon = HelpCircle;
  }

  // Circular gauge config
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  // Make stroke-dasharray progress
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
      <div className="relative flex items-center justify-center h-40 w-40 mb-4">
        {/* Animated Background Rings */}
        <div className={`absolute inset-0 rounded-full opacity-5 animate-ping duration-1000 ${
          status === 'DANGEROUS' ? 'bg-red-500' : status === 'SUSPICIOUS' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />

        <svg className="w-full h-full transform -rotate-90">
          {/* Static track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-gray-100 fill-none"
            strokeWidth="10"
          />
          {/* Progress gauge */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out ${circleColor}`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Floating details inside */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-gray-900 tracking-tight">{score}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Risk Rate</span>
        </div>
      </div>

      {/* Flag Badge */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badgeBg} mb-3`}>
        <StatusIcon className="h-3.5 w-3.5" />
        <span>{statusText}</span>
      </div>

      <div className="max-w-xs">
        <h3 className={`text-base font-bold ${titleColor}`}>
          {status === 'DANGEROUS' 
            ? 'Avoid visiting this link' 
            : status === 'SUSPICIOUS' 
            ? 'Proceed with extreme caution' 
            : 'Secure & Trusted Domain'}
        </h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {status === 'DANGEROUS'
            ? 'Our analysis confirms that this link contains malicious patterns and is flagged in cyber databases as a high-risk phishing threat.'
            : status === 'SUSPICIOUS'
            ? 'There are hidden redirect jumps or suspicious keywords in the URL structure. We advise against disclosing personal details.'
            : 'Our security engine did not find any fraudulent patterns or threats. You may proceed safely.'}
        </p>
      </div>
    </div>
  );
}
