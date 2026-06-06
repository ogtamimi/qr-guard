import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

export default function ExternalBrowserBlocked({
  clerkAuthUrl,
  primaryLabel = 'Open in browser',
  onAfterOpen,
}: {
  clerkAuthUrl: string;
  primaryLabel?: string;
  onAfterOpen?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const safeUrl = useMemo(() => {
    try {
      const url = new URL(clerkAuthUrl);

      // If we ever end up on an insecure origin (http) in production-like environments,
      // upgrade to https for external navigation compatibility.
      if (url.protocol === 'http:' && !url.hostname.includes('localhost')) {
        url.protocol = 'https:';
      }

      return url.toString();
    } catch {
      // If clerkAuthUrl is already relative/invalid for URL parsing, return as-is.
      return clerkAuthUrl;
    }
  }, [clerkAuthUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = safeUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // ignore
      }
    }
  };

  const openInBrowser = () => {
    // Mobile in-app browsers sometimes block location.assign navigation.
    // Try window.open first (user-gesture), then fall back to assign.
    try {
      const w = window.open(safeUrl, '_blank', 'noopener,noreferrer');
      if (w) {
        onAfterOpen?.();
        return;
      }
    } catch {
      // ignore and fall back
    }

    try {
      window.location.assign(safeUrl);
      onAfterOpen?.();
    } catch {
      // last resort: try setting href
      try {
        window.location.href = safeUrl;
        onAfterOpen?.();
      } catch {
        // ignore; user can still use copy link
      }
    }
  };

  // Improve UX: if we somehow render this on a page inside an iframe/webview,
  // still encourage full navigation.
  useEffect(() => {
    // no-op (placeholder for future)
  }, []);

  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex h-11 w-11 bg-rose-50 border border-rose-200 rounded-2xl items-center justify-center text-rose-600 mb-3">
          <ExternalLink className="h-5.5 w-5.5 stroke-[2.2]" />
        </div>
        <h2 className="text-lg font-black text-slate-100 tracking-tight">External Browser Required</h2>
        <p className="text-[12px] text-slate-300 font-bold mt-2 leading-relaxed">
          For security reasons, login must be completed in an external browser.
        </p>
      </div>

      <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 space-y-4">
        <button
          type="button"
          onClick={openInBrowser}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-colors shadow-sm"
        >
          {primaryLabel}
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-indigo-300" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>

        <div className="text-[10px] text-slate-400">
          If the button doesn’t work, use “Copy link” and open it in your browser.
        </div>
      </div>
    </div>
  );
}

