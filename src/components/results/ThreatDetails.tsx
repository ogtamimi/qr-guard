/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ShieldAlert, AlertTriangle, Key, ExternalLink, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { ScanResult } from '../../types';

interface ThreatDetailsProps {
  scan: ScanResult;
}

export default function ThreatDetails({ scan }: ThreatDetailsProps) {
  const {
    isHttps,
    redirectCount,
    redirectChain,
    finalDomain,
    suspiciousKeywords,
    virusTotalResult,
    safeBrowsingResult,
    urlHausResult,
  } = scan;

  return (
    <div className="space-y-5">
      {/* 1. SSL Connection Status */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isHttps ? 'bg-emerald-50/30 border-emerald-100 text-emerald-800' : 'bg-red-50/30 border-red-100 text-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {isHttps ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h4 id="ssl-hdr" className="text-xs font-bold">Encryption Status (SSL/TLS Connection)</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isHttps
                ? 'The website uses a secure, encrypted HTTPS protocol to protect passwords and sensitive data.'
                : 'Warning! This link does not use a secure HTTPS connection. Any data you enter could be exposed.'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          isHttps ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {isHttps ? 'HTTPS Active' : 'Unencrypted'}
        </span>
      </div>

      {/* 2. Redirection Chain Pathway */}
      <div className="p-4 bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-gray-500" />
          <h4 id="redirect-hdr" className="text-xs font-bold text-gray-900">Active Redirection Path (Steps Chain)</h4>
          {redirectCount > 0 && (
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
              {redirectCount} hops
            </span>
          )}
        </div>

        <div className="space-y-2 relative pl-3 border-l border-dashed border-gray-200 ml-2 py-1">
          {redirectChain.map((link, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === redirectChain.length - 1;
            let linkDomain = '';
            try {
              linkDomain = new URL(link).hostname;
            } catch {
              linkDomain = link;
            }

            return (
              <div key={idx} className="relative group">
                {/* Node dot icon */}
                <div className={`absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border ${
                  isLast 
                    ? scan.status === 'DANGEROUS' ? 'bg-red-500 border-red-300' : 'bg-emerald-500 border-emerald-300'
                    : 'bg-gray-300 border-white shadow-xs'
                }`} />

                <div className="flex flex-col">
                  <span className={`text-[11px] font-mono leading-none ${isLast ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                    {linkDomain} {isFirst && '(Input Link)'} {isLast && '(Final Domain)'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono break-all mt-0.5 max-w-full truncate block" title={link}>
                    {link}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Suspicious Keywords Alert */}
      {suspiciousKeywords.length > 0 && (
        <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h4 id="keywords-hdr" className="text-xs font-bold">Sensitive Brand/Keywords Detected in URL</h4>
          </div>
          <p className="text-[11.5px] text-gray-500 leading-relaxed mb-3">
            Detected keywords commonly associated with social engineering, phishing, or bank fraud lures:
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {suspiciousKeywords.map((word, index) => (
              <span key={index} className="text-[11px] font-mono bg-amber-100/50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Threat Intelligence Databases */}
      <div className="p-4 bg-white rounded-xl border border-gray-100">
        <h4 id="databases-hdr" className="text-xs font-bold text-gray-900 mb-3">Global Threat Intelligence Databases</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* VirusTotal Widget */}
          <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-600 block">VirusTotal Radar</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Aggregated antivirus scanning feed.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {virusTotalResult ? (
                <span className={`text-[11px] font-bold ${virusTotalResult.flagged ? 'text-red-600' : 'text-emerald-600'}`}>
                  {virusTotalResult.flagged ? `Malicious (${virusTotalResult.positives}/${virusTotalResult.total})` : 'Clean / Safe'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Key className="h-3 w-3" /> Inactive (No API Key)
                </span>
              )}
            </div>
          </div>

          {/* Google Safe Browsing Widget */}
          <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-600 block">Google Safe Browsing</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Official Google security database feed.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {safeBrowsingResult ? (
                <span className={`text-[11px] font-bold ${safeBrowsingResult.flagged ? 'text-red-600' : 'text-emerald-600'}`}>
                  {safeBrowsingResult.flagged ? 'Malicious / Blocked' : 'Clean / Safe'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Key className="h-3 w-3" /> Inactive (No API Key)
                </span>
              )}
            </div>
          </div>

          {/* URLhaus Widget */}
          <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-600 block">URLhaus Database</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">abuse.ch collaborative malware feed.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {urlHausResult ? (
                <span className={`text-[11px] font-bold ${urlHausResult.flagged ? 'text-red-600' : 'text-emerald-600'}`}>
                  {urlHausResult.flagged ? `Threat Detected (${urlHausResult.threat || 'malware'})` : 'Clean / Safe'}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  Query Failed
                </span>
              )}
            </div>
          </div>
        </div>

        {(!virusTotalResult || !safeBrowsingResult) && (
          <div className="mt-3 p-2.5 rounded bg-gray-50/95 flex items-start gap-2 text-gray-600">
            <span className="text-xs">💡</span>
            <p className="text-[10.5px] leading-relaxed text-gray-500">
              Note: URLhaus is scanned for all queries. You can activate VirusTotal or Google Safe Browsing by declaring API keys in the backend secrets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
