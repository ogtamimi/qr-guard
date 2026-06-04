/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Globe, Loader2 } from 'lucide-react';

interface URLInputProps {
  onScanUrl: (url: string, type: 'QR_IMAGE' | 'DIRECT_URL') => void;
  isLoading: boolean;
}

export default function URLInput({ onScanUrl, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [errorWord, setErrorWord] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorWord(null);

    const targetUrl = url.trim();
    if (!targetUrl) {
      setErrorWord('Please enter a valid link or domain name to scan first.');
      return;
    }

    // Basic syntax look
    const isDomainOrUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,8})(\/.*)?$/i.test(targetUrl) ||
                         // Raw IP Check
                         /^(\d{1,3}\.){3}\d{1,3}(\/.*)?$/.test(targetUrl);

    if (!isDomainOrUrl) {
      setErrorWord('Invalid link format. Please enter a real web address (e.g., example.com).');
      return;
    }

    onScanUrl(targetUrl, 'DIRECT_URL');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2">
        <label htmlFor="url-field" className="text-xs font-bold text-slate-500 ml-1 block">
          Enter Direct Link or Domain Name (URL)
        </label>
        
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Globe className="h-5 w-5" />
          </div>

          <input
            id="url-field"
            type="text"
            dir="ltr"
            placeholder="https://example.com/login"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errorWord) setErrorWord(null);
            }}
            disabled={isLoading}
            className={`w-full pl-12 pr-32 py-3.5 bg-white border rounded-2xl text-sm font-mono placeholder:font-sans focus:outline-none focus:ring-2 transition-all ${
              errorWord
                ? 'border-red-300 focus:ring-red-100'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />

          <div className="absolute right-2.5">
            <button
              id="submit-scan-btn"
              type="submit"
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/15"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Scan Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorWord && (
          <p className="text-xs text-red-500 font-bold ml-1.5 mt-1 animate-fade-in">
            ⚠️ {errorWord}
          </p>
        )}

        <div className="mt-4 flex items-center gap-1.5 justify-start flex-wrap">
          <span className="text-xs text-slate-450 font-semibold">Quick Example:</span>
          <button
            type="button"
            onClick={() => {
              setUrl('google.com');
              setErrorWord(null);
            }}
            className="text-[11px] font-mono bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
          >
            google.com
          </button>
          <button
            type="button"
            onClick={() => {
              setUrl('http://verification-paypal-secure-portal.info/login');
              setErrorWord(null);
            }}
            className="text-[11px] font-mono bg-slate-50 hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
          >
            paypal-secure.info
          </button>
        </div>
      </div>
    </form>
  );
}
