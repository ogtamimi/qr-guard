import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Shield, X, Globe, Server, Code, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { isProbablyWebViewOrInAppBrowser } from '../../utils/webviewDetection';
import ExternalBrowserBlocked from './ExternalBrowserBlocked';


interface ClerkAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string) => void;
  initialMode?: 'signin' | 'signup';
  isClerkConfigured: boolean;
}

export default function ClerkAuth({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
  isClerkConfigured,
}: ClerkAuthProps) {
  const [clerkMode, setClerkMode] = useState<'signin' | 'signup'>(initialMode);
  const [sandboxEmail, setSandboxEmail] = useState('');

  if (!isOpen) return null;

  const clerkExternalAuthUrl = (() => {
    try {
      const origin = window.location.origin;

      // Ensure a secure external connection in production.
      // - Keep http://localhost as-is for local development.
      // - Upgrade http -> https for any non-localhost origin.
      const httpsOrigin = origin.startsWith('http://') && !origin.includes('localhost')
        ? origin.replace(/^http:\/\//i, 'https://')
        : origin;

      return `${httpsOrigin}/#signin`;
    } catch {
      return '/#signin';
    }
  })();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[480px] bg-slate-950 rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden relative animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors z-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {isClerkConfigured ? (
          isProbablyWebViewOrInAppBrowser() ? (
            <ExternalBrowserBlocked
              clerkAuthUrl={clerkExternalAuthUrl}
              onAfterOpen={() => onClose()}
            />
          ) : (
            /* REAL CLERK INSTANCE ROUTING WITH PRE-BUILT CLERK COMPONENTS */
            <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[500px]">
              <div className="text-center mb-6">

              <div className="inline-flex h-11 w-11 bg-indigo-600 rounded-2xl items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-3 animate-pulse">
                <Shield className="h-5.5 w-5.5 stroke-[2.5]" />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">QR Guard Secure Portal</h2>
              <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wide mt-1">Genuine Authentication by Clerk</p>
            </div>

            <div className="clerk-widget-container w-full flex justify-center scale-95 origin-center">
               {clerkMode === 'signin' ? (
                  <SignIn
                    routing="hash"
                    signUpUrl="/#signup"
                    afterSignInUrl="/"
                    appearance={{
                      theme: dark,
                      variables: {
                       colorBackground: '#0f172a',
                       colorText: '#f8fafc',
                       colorTextSecondary: '#94a3b8',
                       colorInputBackground: '#111827',
                       colorInputForeground: '#f8fafc',
                       colorBorder: '#475569',
                       colorRing: '#818cf8',
                      },
                     }}
                />
               ) : (
                  <SignUp
                    routing="hash"
                    signInUrl="/#signin"
                    afterSignUpUrl="/"
                    appearance={{
                      theme: dark,
                      variables: {
                       colorBackground: '#0f172a',
                       colorText: '#f8fafc',
                       colorTextSecondary: '#94a3b8',
                       colorInputBackground: '#111827',
                       colorInputForeground: '#f8fafc',
                       colorBorder: '#475569',
                       colorRing: '#818cf8',
                       colorPrimary: '#5b6cf7',
                       colorPrimaryForeground: '#ffffff',
                    },
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none border-none p-0 bg-transparent w-full',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      footerAction: 'text-indigo-400 font-bold hover:text-indigo-300',
                      formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-xs font-black py-2.5 rounded-xl',
                    },
                  }}
                />
              )}
            </div>

            {/* Footer switcher */}
            <div className="mt-4 border-t border-slate-800 pt-4 w-full text-center">
              <span className="text-xs text-slate-400">
                {clerkMode === 'signin' ? "Need to register? " : "Already registered? "}
              </span>
              <button
                type="button"
                onClick={() => setClerkMode(clerkMode === 'signin' ? 'signup' : 'signin')}
                className="text-xs font-bold text-indigo-300 hover:text-indigo-200 hover:underline cursor-pointer"
              >
                {clerkMode === 'signin' ? 'Create an account' : 'Sign in here'}
              </button>
            </div>
            </div>
          )
        ) : (

          /* NO CLERK ENVIRONMENT KEYS CONFIGURED: SYSTEM DECLARATORY MODE & CLEAR ACTION LIST */
          <div className="p-6 md:p-8 space-y-6">

            <div className="text-center">
              <div className="inline-flex h-11 w-11 bg-rose-50 border border-rose-200 rounded-2xl items-center justify-center text-rose-600 mb-3">
                <AlertCircle className="h-5.5 w-5.5 stroke-[2.2]" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Clerk Key Configuration Needed</h2>
              <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider mt-1">Local Sandbox / Non-Configured Mode</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Code className="h-4 w-4 text-indigo-600" />
                <span>How to link your Clerk account:</span>
              </h3>
              
              <ol className="space-y-3 text-xs text-slate-600 list-decimal pl-4 font-medium leading-relaxed">
                <li>
                  Create a free project at <a href="https://clerk.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5">clerk.com <ArrowRight className="h-2.5 w-2.5 inline" /></a>
                </li>
                <li>
                  Go to <strong className="text-slate-800 font-bold">API Keys</strong> inside your Clerk dashboard.
                </li>
                <li>
                  Copy the <strong className="text-slate-800 font-bold">Publishable Key</strong> (starts with <code className="bg-slate-200/60 px-1 py-0.5 rounded-sm font-mono text-[10px] text-slate-700">pk_test_</code>).
                </li>
                <li>
                  Go to the <strong className="text-slate-800 font-bold">QR Guard Settings (Secrets Panel)</strong>.
                </li>
                <li>
                  Declare a new variable with the key name <code className="bg-slate-200/60 px-1 py-0.5 rounded-sm font-mono text-[10px] font-bold text-indigo-700">VITE_CLERK_PUBLISHABLE_KEY</code> and paste your key.
                </li>
                <li>
                  Deploy the site or restart the development server to activate genuine secure login routes!
                </li>
              </ol>
            </div>

            {/* Simulated secure login to allow testing functional features during development */}
            <div className="border-t border-slate-100 pt-5 space-y-3.5">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Developer Bypass Console</span>
                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed px-4">
                  For development purposes, enter an email below to skip authentication and test the scanner, PayPal system, and safe results.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const finalEmail = sandboxEmail.trim() || 'ogttamimi@gmail.com';
                    onAuthSuccess(finalEmail);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Bypass</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info details */}
        <div className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-slate-400">
            <Globe className="h-3.5 w-3.5" />
            <span>Secure Connection</span>
          </span>
          <span className="font-mono text-slate-400">Powered by Clerk Auth</span>
        </div>
      </div>
    </div>
  );
}
