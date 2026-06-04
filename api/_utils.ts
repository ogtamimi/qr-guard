/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shared utility functions for QR Guard API routes
 */

import dns from 'dns';

// 1. Redirect Chain Follower (Active Probing)
export async function followRedirectChain(urlStr: string, limit = 8): Promise<{
  chain: string[];
  finalUrl: string;
  finalDomain: string;
  hasRedirects: boolean;
  redirectCount: number;
  domainChanged: boolean;
  error?: string;
}> {
  const chain: string[] = [urlStr];
  let currentUrl = urlStr;
  let count = 0;
  let domainChanged = false;

  try {
    const initialUrlObj = new URL(urlStr);
    const initialDomain = initialUrlObj.hostname.replace('www.', '');

    while (count < limit) {
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QRGuard/1.0',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) break;

          const resolvedNextUrl = new URL(location, currentUrl).toString();
          
          if (chain.includes(resolvedNextUrl)) {
            chain.push(`${resolvedNextUrl} (Circular Loop)`);
            break;
          }

          chain.push(resolvedNextUrl);
          currentUrl = resolvedNextUrl;
          count++;
        } else {
          break;
        }
      } catch (err: any) {
        break;
      }
    }

    const finalUrlObj = new URL(currentUrl);
    const finalDomain = finalUrlObj.hostname.replace('www.', '');
    domainChanged = finalDomain !== initialDomain;

    return {
      chain,
      finalUrl: currentUrl,
      finalDomain,
      hasRedirects: count > 0,
      redirectCount: count,
      domainChanged,
    };
  } catch (err: any) {
    return {
      chain,
      finalUrl: currentUrl,
      finalDomain: urlStr,
      hasRedirects: false,
      redirectCount: 0,
      domainChanged: false,
      error: err.message,
    };
  }
}

// 2. Keyword check
export function scanSuspiciousKeywords(urlStr: string): string[] {
  const SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification',
    'confirm', 'validate', 'wallet', 'bank', 'paypal', 'payment', 'billing',
    'password', 'account', 'credential', 'ssn', 'update', 'urgent', 'suspended',
    'locked', 'security', 'secure', 'support', 'helpdesk', 'claim', 'refund',
    'free', 'gift', 'prize', 'winner', 'bonus', 'cash', 'reward', 'crypto', 'coin'
  ];

  const found: string[] = [];
  try {
    const lowerUrl = urlStr.toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (lowerUrl.includes(kw)) {
        found.push(kw);
      }
    }
  } catch {}
  return found;
}

// 3. VirusTotal check
export async function checkVirusTotal(urlStr: string) {
  const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!vtApiKey) return null;

  try {
    const requestUrl = `https://www.virustotal.com/vtapi/v2/url/report?apikey=${encodeURIComponent(vtApiKey)}&resource=${encodeURIComponent(urlStr)}`;
    const response = await fetch(requestUrl, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    
    const data: any = await response.json();
    return {
      flagged: (data.positives || 0) > 0,
      positives: data.positives || 0,
      total: data.total || 0,
      permalink: data.permalink || null,
    };
  } catch (err) {
    console.error('VirusTotal lookup error:', err);
    return null;
  }
}

// 4. Safe Browsing check
export async function checkSafeBrowsing(urlStr: string) {
  const sbApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!sbApiKey) return null;

  try {
    const requestUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(sbApiKey)}`;
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'qrguard', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: urlStr }],
        },
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const matches = data.matches || [];
    const threats = matches.map((m: any) => m.threatType);

    return {
      flagged: threats.length > 0,
      threats,
    };
  } catch (err) {
    console.error('Safe Browsing lookup error:', err);
    return null;
  }
}

// 5. URLhaus check
export async function checkUrlHaus(urlStr: string) {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'QRGuard/1.0 (+https://qrguard.local)'
      },
      body: new URLSearchParams({ url: urlStr }).toString(),
      signal: AbortSignal.timeout(6000),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('URLhaus response parse error:', parseErr, 'status:', response.status);
      return null;
    }

    const queryStatus = data?.query_status || (response.ok ? 'ok' : 'error');

    if (queryStatus === 'ok') {
      return {
        flagged: true,
        status: queryStatus,
        threat: data.threat || data.malware_family || null,
        urlhausReference: data.urlhaus_reference || data.url_id || null,
        urlStatus: data.url_status || null,
      };
    }

    return {
      flagged: false,
      status: queryStatus,
      threat: null,
      urlhausReference: null,
      urlStatus: null,
    };
  } catch (err) {
    console.error('URLhaus lookup error:', err);
    return null;
  }
}

// 6. DNS Resolution Verification helper
export async function getDnsRecords(domainKey: string): Promise<{
  ipAddress: string | null;
  nameServers: string[] | null;
  mailServers: string[] | null;
}> {
  return new Promise((resolve) => {
    const results: { ipAddress: string | null; nameServers: string[] | null; mailServers: string[] | null } = {
      ipAddress: null,
      nameServers: null,
      mailServers: null,
    };

    dns.resolve4(domainKey, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        results.ipAddress = addresses[0];
      }
      dns.resolveNs(domainKey, (errNs, nsRecords) => {
        if (!errNs && nsRecords) {
          results.nameServers = nsRecords;
        }
        dns.resolveMx(domainKey, (errMx, mxRecords) => {
          if (!errMx && mxRecords) {
            results.mailServers = mxRecords.map(r => r.exchange);
          }
          resolve(results);
        });
      });
    });
  });
}

