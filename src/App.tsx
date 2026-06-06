import React, { useState, useEffect, useCallback } from 'react';
import { ClerkProvider, useUser, useClerk, UserButton } from '@clerk/clerk-react';

import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2, Globe, History,
  Trash2, Terminal, Settings, HelpCircle, Lock, Unlock, Check,
  Sparkles, BookOpen, Copy, Plus, Coins, Github, Linkedin, Mail,
  ExternalLink, Sun, Moon
} from 'lucide-react';

import { ScanResult, UserStats, UserPlan, PricingPlan } from './types';
import QRScanner from './components/scanner/QRScanner';
import URLInput from './components/scanner/URLInput';
import RiskScore from './components/results/RiskScore';
import ThreatDetails from './components/results/ThreatDetails';
import AIExplanation from './components/results/AIExplanation';
import ScanHistory from './components/dashboard/ScanHistory';
import UsageStats from './components/dashboard/UsageStats';
import ClerkAuth from './components/auth/ClerkAuth';
import LandingPage from './components/dashboard/LandingPage';
import PaymentRedirectModal from './components/dashboard/PaymentRedirectModal';
import SupportButton from './components/SupportButton';

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'Trial Plan',
    nameAr: 'Free Trial',
    price: '$0',
    pricePeriod: 'Lifetime',
    dailyScans: 3,
    features: ['3 scans per day', 'Basic URL redirect tracking', 'Heuristics checking', 'Local browser history'],
    featuresAr: ['3 scans per day', 'Basic URL redirect tracking', 'Heuristics checking', 'Local browser history']

  },
  {
    id: 'PRO',
    name: 'Pro Plan',
    nameAr: 'Pro',
    price: '$5',
    pricePeriod: 'Monthly',
    dailyScans: 500,
    features: ['500 scans per day', 'Advanced Groq Llama-3 AI auditing', 'VirusTotal database integration', 'Persistent security vaults'],

    featuresAr: ['500 scans per day', 'Advanced Groq Llama-3 AI auditing', 'VirusTotal database integration', 'Persistent security vaults'],

    popular: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    nameAr: 'Business',
    price: '$100',
    pricePeriod: 'Monthly',
    dailyScans: 99999,
    features: ['Unlimited daily scanning', 'Full Google Safe Browsing / URLhaus integrates', 'Developer API Access keys', 'Slack & Webhook instant notifications'],
    featuresAr: ['Unlimited daily scanning', 'Full Google Safe Browsing / URLhaus integrates', 'Developer API Access keys', 'Slack & Webhook instant notifications']
  }
];

const CLERK_PUBLISHABLE_KEY = ((import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string) || '';

export default function App() {
  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkProviderWrapper />
      </ClerkProvider>
    );
  }
  return <AppContent userEmailProp={null} isClerkConfigured={false} onLogOutProp={null} />;
}

function ClerkProviderWrapper() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const email = isLoaded && user ? user.primaryEmailAddress?.emailAddress || null : null;
  return (
    <AppContent
      userEmailProp={email}
      isClerkConfigured={true}
      onLogOutProp={signOut}
    />
  );
}

export function AppContent({
  userEmailProp,
  isClerkConfigured,
  onLogOutProp,
}: {
  userEmailProp: string | null;
  isClerkConfigured: boolean;
  onLogOutProp: (() => Promise<void>) | null;
}) {
  const [route, setRoute] = useState<string>(() => {

    try {
      const path = window.location.pathname;
      if (path.includes('/payment/success') || path.includes('/payment/cancel')) return '#dashboard';
      const hash = window.location.hash;
      if (hash && ['#dashboard', '#about', '#pricing'].includes(hash)) {
        return hash;
      }

    } catch {}
    return '#dashboard';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('qr_guard_theme');
      return (saved as 'dark' | 'light') || 'light';
    } catch { return 'light'; }
  });

  const navigateTo = useCallback((hash: string) => {
    setRoute(hash);
    try { window.location.hash = hash; } catch {}
  }, []);

  useEffect(() => {
    const onHash = () => {
      try { setRoute(window.location.hash || '#dashboard'); } catch {}
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [userPlan, setUserPlan] = useState<UserPlan>('FREE');
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [selectedPlanToPurchase, setSelectedPlanToPurchase] = useState<PricingPlan | null>(null);
  const [apiConfig, setApiConfig] = useState({
    groqConnected: false, virusTotalConnected: false,
    googleSafeBrowsingConnected: false, urlHausConnected: true,
    payPalConnected: false,
  });

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(data => {
      if (data && data.apiStatus) setApiConfig(data.apiStatus);
    }).catch(err => console.warn('Health check failed:', err));
  }, []);

  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem('qr_guard_auth_user');
      if (storedEmail) setUserEmail(storedEmail);
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  }, []);

  useEffect(() => {
    try {
      const userKey = userEmail || 'anonymous';
      const scansKey = `qr_guard_scans_history_${userKey}`;
      const storedScans = localStorage.getItem(scansKey);
      setScans(storedScans ? JSON.parse(storedScans) : []);
      const planKey = `qr_guard_user_plan_${userKey}`;
      const storedPlan = localStorage.getItem(planKey);
      setUserPlan((storedPlan as UserPlan) || 'FREE');
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isClerkConfigured) {
      setUserEmail(userEmailProp);
      if (userEmailProp) {
        localStorage.setItem('qr_guard_auth_user', userEmailProp);
        setIsAuthModalOpen(false);
      } else {
        localStorage.removeItem('qr_guard_auth_user');
      }
    }
  }, [userEmailProp, isClerkConfigured]);

  const handleLogOut = async () => {
    try {
      localStorage.removeItem('qr_guard_auth_user');
      setUserEmail(null);
      if (isClerkConfigured && onLogOutProp) await onLogOutProp();
      navigateTo('#dashboard');
    } catch (err) { console.error('Logout failed:', err); }
  };

  const handleAuthSuccess = (email: string) => {
    try {
      localStorage.setItem('qr_guard_auth_user', email);
      setUserEmail(email);
    } catch (err) { console.warn('Failed to save session:', err); }
  };

  const saveScansToLocalStorage = (updatedScans: ScanResult[]) => {
    setScans(updatedScans);
    try {
      const userKey = userEmail || 'anonymous';
      localStorage.setItem(`qr_guard_scans_history_${userKey}`, JSON.stringify(updatedScans));
    } catch (err) { console.warn('Failed to persist history:', err); }
  };

  const handleScanRequest = async (urlStr: string, inputType: 'QR_IMAGE' | 'DIRECT_URL') => {
    setIsLoading(true);
    setErrorText(null);
    setStatusMessage('Analyzing link path and tracking intermediate domain hops...');
    const today = new Date().toDateString();
    const scansToday = scans.filter(s => new Date(s.createdAt).toDateString() === today).length;
    const maxAllowed = userPlan === 'FREE' ? 5 : userPlan === 'PRO' ? 500 : 99999;
    if (scansToday >= maxAllowed) {
      setErrorText(`Daily scanning budget exhausted for your tier (${maxAllowed}/scan). Please upgrade or wait until tomorrow.`);
      setIsLoading(false); setStatusMessage(null);
      return;
    }
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlStr, inputType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Processing failed.');
      saveScansToLocalStorage([data, ...scans]);
      setCurrentScan(data);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorText(err.message || 'Connection error.');
    } finally {
      setIsLoading(false); setStatusMessage(null);
    }
  };

  const handleClearScanItem = (id: string) => {
    const next = scans.filter(s => s.id !== id);
    saveScansToLocalStorage(next);
    if (currentScan?.id === id) setCurrentScan(null);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const todayStr = new Date().toDateString();
  const scansTodayCount = scans.filter(s => new Date(s.createdAt).toDateString() === todayStr).length;
  const maxScansPerDay = userPlan === 'FREE' ? 3 : userPlan === 'PRO' ? 500 : 99999;


  const userStats: UserStats = {
    totalScans: scans.length,
    safeScans: scans.filter(s => s.status === 'SAFE').length,
    suspiciousScans: scans.filter(s => s.status === 'SUSPICIOUS').length,
    dangerousScans: scans.filter(s => s.status === 'DANGEROUS').length,
    remainingScansToday: Math.max(0, maxScansPerDay - scansTodayCount),
    scansTodayCount,
    maxScansPerDay,
  };

  const isSTANDALONE_ROUTE = ['#admin'].includes(route);

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 transition-colors duration-250 ${theme === 'dark' ? 'dark' : ''}`} dir="ltr">
      {!isSTANDALONE_ROUTE && (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-slate-850 tracking-tight">QR Guard <span className="text-indigo-600">Console</span></span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-lg font-bold">Secure Edition</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Real-time anti-phishing protection powered by advanced AI heuristics</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button id="nav-dashboard" onClick={() => navigateTo('#dashboard')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${route === '#dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-indigo-650 hover:bg-white/55'}`}>
              Scan Console
            </button>
            <button id="nav-about" onClick={() => navigateTo('#about')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${route === '#about' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-indigo-650 hover:bg-white/55'}`}>
              About
            </button>
            <button id="nav-pricing" onClick={() => navigateTo('#pricing')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${route === '#pricing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:text-indigo-650 hover:bg-white/55'}`}>
              Pricing Plans
            </button>

          </div>

          <div className="flex items-center gap-3">
            <button id="theme-toggle-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs text-slate-500 hover:text-indigo-600"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
            </button>

            {userEmail ? (

              <>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100 hidden sm:flex">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Engine Active</span>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-black text-slate-800 font-mono tracking-tight max-w-[120px] truncate">{userEmail}</span>
                  <span className="text-[9px] text-indigo-650 font-black tracking-wide bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100/50">
                    {PRICING_PLANS.find(p => p.id === userPlan)?.name}
                  </span>
                </div>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8.5 w-8.5" } }} />
              </>
            ) : (
              <div className="flex items-center gap-1.5 font-sans">
                <button
                  id="header-login-btn"
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-650 hover:text-indigo-650 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Sign up
                </button>
              </div>

            )}
          </div>
        </div>
      </header>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {route === '#dashboard' && (userEmail ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <UsageStats stats={userStats} plan={userPlan} />
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h2 id="auditor-title" className="text-base font-black text-slate-800">Automated QR & Link Scanning</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    Dissect QR codes from restaurant menus or verify digital receipts. Directly input deep link paths to reveal all server bounces.
                  </p>
                </div>
                <QRScanner onScanSuccess={handleScanRequest} isLoading={isLoading} />
                <div className="relative flex items-center justify-center my-2 text-xs text-slate-450 uppercase font-bold">
                  <div className="w-full h-px bg-slate-100 absolute top-1/2 left-0 -translate-y-1/2 z-0" />
                  <span className="bg-white px-3 relative z-10 text-slate-400 text-[10px]">Or enter the link manually</span>
                </div>
                <URLInput onScanUrl={handleScanRequest} isLoading={isLoading} />
              </div>

              {isLoading && statusMessage && (
                <div id="loading-alert" className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center gap-3 shadow-xs">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin flex-shrink-0" />
                  <p className="text-xs font-bold text-indigo-800">{statusMessage}</p>
                </div>
              )}

              {errorText && (
                <div id="error-alert" className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-750 animate-fade-in shadow-xs">
                  <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold">Technical Issue Detected</h4>
                    <p className="text-[11px] text-red-650/90 mt-1 leading-relaxed">{errorText}</p>
                  </div>
                  <button onClick={() => setErrorText(null)} className="text-red-400 hover:text-red-600 text-xs font-bold">Dismiss</button>
                </div>
              )}

              {currentScan ? (
                <div id="full-report-section" className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Inspected Domain Target</span>
                      <h3 className="text-sm font-black text-indigo-900 font-mono break-all mt-0.5">{currentScan.finalDomain}</h3>
                      <p className="text-[10px] text-slate-400 break-all truncate max-w-lg font-mono mt-0.5">{currentScan.url}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopyText(currentScan.url, 'url')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors font-bold">
                        <Copy className="h-3 w-3" /><span>{copiedKey === 'url' ? 'Link Copied!' : 'Copy Link URL'}</span>
                      </button>
                      <button onClick={() => setCurrentScan(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-650 bg-red-50 hover:bg-red-100 border border-red-150 rounded-xl transition-colors font-bold">
                        Dismiss Scan Report
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-2 space-y-6"><AIExplanation scan={currentScan} /></div>
                    <div className="space-y-6">
                      <RiskScore score={currentScan.riskScore} status={currentScan.status} />
                      <ThreatDetails scan={currentScan} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-2.5 text-indigo-600 opacity-80 stroke-[1.5]" />
                  <h3 className="text-sm font-black text-slate-800">Awaiting first scan</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Paste a web URL or upload a QR image to begin.</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <ScanHistory scans={scans} onSelectScan={(scan) => setCurrentScan(scan)} onClearScan={handleClearScanItem} />
              <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-indigo-100 border border-indigo-500 relative overflow-hidden">
                <Sparkles className="h-6 w-6 text-indigo-200 mb-3 animate-pulse" />
                <h4 className="text-sm font-black text-white leading-tight">AI Heuristics Integration</h4>
                <p className="text-xs leading-relaxed text-indigo-100/90 mt-2">
                  Advanced tracing heuristics and semantic Groq Llama-3 AI evaluations. Enable camera for immediate scanning.
                </p>
              </div>
              <SupportButton />
            </div>
          </div>
        ) : (
          <LandingPage onGetStarted={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }} onLogIn={() => { setAuthModalMode('signin'); setIsAuthModalOpen(true); }} />
        ))}

        {route === '#about' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-8 animate-fade-in text-left">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2.5 mb-1.5 text-slate-900 font-black">
                <Shield className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl tracking-tight">About QR Guard</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">High-clarity situational awareness against stealthy web threat vectors.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">The Platform</h3>
                  <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                    <p><strong className="text-slate-800">QR Guard</strong> unwraps shortened links and traces server-side redirects to keep you safe.</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">The Architect</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-650 to-emerald-500 p-0.5 flex items-center justify-center shadow-sm shrink-0">
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-extrabold text-indigo-600 font-sans">OT</div>
                    </div>
                    <div className="text-left">
                      <h4 id="author-name" className="text-sm font-black text-slate-800 tracking-tight">Omar Tamimi</h4>
                      <p className="text-[10px] text-indigo-650 font-black tracking-wider uppercase">Cyber Security Specialist</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-2">
                  <a id="author-github-btn" href="https://github.com/ogtamimi" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-black transition-all">GitHub</a>
                  <a id="author-linkedin-btn" href="https://linkedin.com/in/ogtamimi" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-black transition-all">LinkedIn</a>
                  <a id="author-email-btn" href="mailto:ogttamimi@gmail.com" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-xl text-xs font-black transition-all">Email Me</a>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Support QR Guard</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    Help keep the protection engine running — secure payments via PayPal.
                  </p>
                </div>
                <div className="sm:max-w-[360px]">
                  <SupportButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {route === '#pricing' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in text-left">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">INVEST IN DIGITAL SAFETY</span>
              <h2 className="text-2xl font-extrabold text-slate-950">Flexible Security Service Tiers</h2>
              <p className="text-xs text-gray-500 leading-relaxed">Upgrade to handle larger daily scan volumes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {PRICING_PLANS.map((planItem) => {
                const isActive = userPlan === planItem.id;
                return (
                  <div key={planItem.id} className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative ${planItem.popular ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/10' : 'border-slate-200 shadow-sm'}`}>
                    {planItem.popular && (
                      <span className="absolute -top-3 right-6 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular Choice</span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{planItem.name}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-extrabold text-gray-900">{planItem.price}</span>
                          <span className="text-xs text-gray-500">/ {planItem.pricePeriod}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-555 leading-relaxed font-semibold">
                        Daily Limit: <span className="font-mono text-indigo-600 font-bold">{planItem.dailyScans === 99999 ? 'Unlimited' : planItem.dailyScans.toLocaleString('en-US')}</span>
                      </p>
                      <div className="w-full h-px bg-slate-100 my-2" />
                      <ul className="space-y-2.5">
                        {planItem.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /><span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <button id={`pricing-btn-${planItem.id}`} onClick={() => {
                        if (!userEmail) { setAuthModalMode('signup'); setIsAuthModalOpen(true); return; }
                        if (planItem.id === 'FREE') {
                          setUserPlan(planItem.id);
                          try { localStorage.setItem(`qr_guard_user_plan_${userEmail || 'anonymous'}`, planItem.id); } catch {}
                          navigateTo('#dashboard');
                        } else {
                          setSelectedPlanToPurchase(planItem);
                          setIsPayPalModalOpen(true);
                        }
                      }} disabled={isActive && !!userEmail}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all ${isActive ? 'bg-gray-100 text-slate-400 border border-gray-100 cursor-default' : 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-sm cursor-pointer'}`}>
                        {isActive ? 'Your Active Plan' : planItem.id === 'FREE' ? 'Select Plan & Try' : 'Payments disabled'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {!isSTANDALONE_ROUTE && (
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-405" />
            © 2026 QR Guard. Cybersecurity Solutions.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-650 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-650 cursor-pointer">Refund Policy</span>
          </div>
        </div>
      </footer>
      )}

      <ClerkAuth isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} initialMode={authModalMode} isClerkConfigured={isClerkConfigured} />

      <PaymentRedirectModal isOpen={isPayPalModalOpen} onClose={() => setIsPayPalModalOpen(false)} plan={selectedPlanToPurchase} userEmail={userEmail || ''} onPaymentInitiated={() => {}} />


    </div>
  );
}
