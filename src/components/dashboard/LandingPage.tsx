/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Sparkles, 
  Upload, 
  Link, 
  Layers, 
  Cpu, 
  ArrowRight, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogIn: () => void;
}

export default function LandingPage({ onGetStarted, onLogIn }: LandingPageProps) {
  const [activePreviewType, setActivePreviewType] = useState<'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'>('SAFE');

  return (
    <div className="space-y-16 py-8 animate-fade-in text-left">
      
      {/* 1. Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 px-4">
        
        {/* Powered by text */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 rounded-full border border-indigo-100 transition-colors text-xs font-bold tracking-tight">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Powered by VirusTotal · Google Safe Browsing · URLhaus · AI</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] font-sans">
          Scan any QR code or URL. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-850">
            Know if it's safe instantly.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          QR Guard runs your links through four security engines and an AI model to give you a threat score, redirect analysis, and plain-English risk assessment — in seconds.
        </p>

        {/* CTA Actions */}
        <div className="pt-4 space-y-3">
          <button
            id="landing-cta-btn"
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-7 py-4 bg-indigo-605 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all cursor-pointer group bg-indigo-600"
          >
            <span>Start scanning for free</span>
            <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 pt-2">
            <p className="text-[11px] text-slate-400 font-bold tracking-wide">
              5 free scans/day · No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* 2. Core Service Capabilities - 3 Feature Column Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 pt-4">
        
        {/* Card 1: QR Code Upload */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 group-hover:scale-105 transition-transform duration-300">
              <Upload className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">QR Code Upload</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5 font-medium/90">
                Drop a QR image and we decode + scan the embedded URL automatically.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            Active Decoder <Check className="h-3 w-3" />
          </span>
        </div>

        {/* Card 2: URL Scanner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 group-hover:scale-105 transition-transform duration-300">
              <Link className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">URL Scanner</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5 font-medium/90">
                Paste any link. We follow redirects and check every hop for threats.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            Redirect Tracker <Check className="h-3 w-3" />
          </span>
        </div>

        {/* Card 3: 4-Engine Analysis */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650 group-hover:scale-105 transition-transform duration-300">
              <Layers className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">4-Engine Analysis</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5 font-medium/90">
                VirusTotal, Google Safe Browsing, URLhaus, and Groq Llama-3 AI all run in parallel.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase mt-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            Consolidated threat score <Check className="h-3 w-3" />
          </span>
        </div>

      </div>

      {/* 3. "What you'll see" Interactive Security Report Preview */}
      <div className="bg-slate-55 bg-gradient-to-b from-slate-50/50 via-slate-100/30 to-indigo-50/20 rounded-3xl border border-slate-200 p-6 sm:p-10 max-w-5xl mx-auto px-4 space-y-8">
        
        {/* Section Heading */}
        <div className="text-center space-y-1.5">
          <h2 id="preview-heading" className="text-xl font-black text-slate-900 tracking-tight">What you'll see</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Toggle the status buttons below to preview the high-clarity report generated for scanned link artifacts.
          </p>
        </div>

        {/* Static State Selector Row */}
        <div className="flex justify-center gap-2 max-w-xs sm:max-w-md mx-auto">
          <button
            onClick={() => setActivePreviewType('SAFE')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border shadow-3xs ${
              activePreviewType === 'SAFE'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-50'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Safe</span>
          </button>

          <button
            onClick={() => setActivePreviewType('SUSPICIOUS')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border shadow-3xs ${
              activePreviewType === 'SUSPICIOUS'
                ? 'bg-amber-550 bg-amber-500 text-white border-amber-450 shadow-sm shadow-amber-55'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Suspicious</span>
          </button>

          <button
            onClick={() => setActivePreviewType('DANGEROUS')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border shadow-3xs ${
              activePreviewType === 'DANGEROUS'
                ? 'bg-red-600 text-white border-red-500 shadow-sm shadow-red-50'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-55'
            }`}
          >
            <ShieldX className="h-4 w-4" />
            <span>Dangerous</span>
          </button>
        </div>

        {/* Live Mock Render Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left max-w-3xl mx-auto animate-fade-in">
          
          {/* Mock Header Info */}
          <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Scanned target domain</span>
              <span className="text-xs font-black text-slate-800 font-mono break-all leading-relaxed">
                {activePreviewType === 'SAFE' && 'https://www.localmenu-cafe.com/dinner'}
                {activePreviewType === 'SUSPICIOUS' && 'http://tr.im/3xz-auth-billing'}
                {activePreviewType === 'DANGEROUS' && 'http://securesignin-wellsfargo-update.info/login.html'}
              </span>
            </div>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg border ${
              activePreviewType === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              activePreviewType === 'SUSPICIOUS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-red-50 text-red-700 border-red-100'
            }`}>
              {activePreviewType === 'SAFE' && 'Trust level high'}
              {activePreviewType === 'SUSPICIOUS' && 'Caution high'}
              {activePreviewType === 'DANGEROUS' && 'Threat risk block'}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Metric score sphere */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-150 py-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Overall threat score</span>
              
              <div className="relative flex items-center justify-center">
                {/* Score badge circles */}
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    {...(activePreviewType === 'SAFE' ? { stroke: '#059669', strokeDasharray: '251', strokeDashoffset: '251' } : {})}
                    {...(activePreviewType === 'SUSPICIOUS' ? { stroke: '#D97706', strokeDasharray: '251', strokeDashoffset: '125' } : {})}
                    {...(activePreviewType === 'DANGEROUS' ? { stroke: '#DC2626', strokeDasharray: '251', strokeDashoffset: '15' } : {})}
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-2xl font-black font-mono leading-none ${
                    activePreviewType === 'SAFE' ? 'text-emerald-750' : 
                    activePreviewType === 'SUSPICIOUS' ? 'text-amber-700' : 
                    'text-red-700'
                  }`}>
                    {activePreviewType === 'SAFE' && '0'}
                    {activePreviewType === 'SUSPICIOUS' && '52'}
                    {activePreviewType === 'DANGEROUS' && '96'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">/100</span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase mt-3.5 tracking-wider ${
                activePreviewType === 'SAFE' ? 'text-emerald-650' :
                activePreviewType === 'SUSPICIOUS' ? 'text-amber-650' :
                'text-red-650'
              }`}>
                {activePreviewType === 'SAFE' && 'Perfectly Clear'}
                {activePreviewType === 'SUSPICIOUS' && 'Suspicious Flag'}
                {activePreviewType === 'DANGEROUS' && 'Danger Warning'}
              </span>
            </div>

            {/* AI Explanation and metadata diagnostics */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">AI Report Audit (Groq Llama-3 AI)</span>
                <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                  {activePreviewType === 'SAFE' && 'The destination is a reputable local dining menu site with zero history of social engineering. The domain is 4 years old, utilizes standard HTTPS security certificates, and resolving hops revealed no redirect vectors.'}
                  {activePreviewType === 'SUSPICIOUS' && 'This link contains a fast redirect chain through a shortened domain. High caution is advised: the target is attempting to mask its ultimate landing destination.'}
                  {activePreviewType === 'DANGEROUS' && 'CRITICAL EXPOSURE: This domain mimics financial banking portals. The database registered URLhaus alert records for this server path. This URL was blacklisted by safe browsing nodes just hours ago. Close the tab immediately.'}
                </p>
              </div>

              {/* Status table blocks */}
              <div className="space-y-2 pt-1 border-t border-slate-100 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">VirusTotal flagging rate</span>
                  <span className={`font-mono font-bold ${activePreviewType === 'SAFE' ? 'text-emerald-600' : activePreviewType === 'SUSPICIOUS' ? 'text-amber-600':'text-red-600'}`}>
                    {activePreviewType === 'SAFE' ? '0 / 92 engines' : activePreviewType === 'SUSPICIOUS' ? '4 / 92 engines' : '78 / 92 engines'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium font-sans">Google Safe Browsing</span>
                  <span className={`font-bold ${activePreviewType === 'SAFE' ? 'text-emerald-600' : activePreviewType === 'SUSPICIOUS' ? 'text-amber-500' : 'text-red-650'}`}>
                    {activePreviewType === 'SAFE' ? 'Safe Verified' : activePreviewType === 'SUSPICIOUS' ? 'Unrated' : 'Malicious Blacklist'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">URLhaus entry</span>
                  <span className="font-bold">
                    {activePreviewType === 'SAFE' ? 'Clear' : activePreviewType === 'SUSPICIOUS' ? 'Clear' : 'Exposure Flagged'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Mini call-to-action for the bottom */}
      <div className="text-center bg-indigo-900 text-white rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto px-6 relative overflow-hidden shadow-xl shadow-indigo-100/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative space-y-6 max-w-xl mx-auto">
          <h3 className="text-2xl font-black tracking-tight leading-none">Guard yourself today.</h3>
          <p className="text-xs text-indigo-150/90 leading-relaxed font-medium">
            Phishing links bypass firewalls, but they can't bypass real-time tracing. Activate QR Guard security profiles in under 30 seconds.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-white text-indigo-900 hover:bg-slate-50 font-black text-xs rounded-xl transition-all shadow-md shadow-indigo-950/20"
            >
              Get started free
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
