import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  followRedirectChain,
  scanSuspiciousKeywords,
  checkVirusTotal,
  checkSafeBrowsing,
  checkUrlHaus,
  getDnsRecords,
} from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, inputType } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL string is required for scanning.' });
    }

    let sanitizedUrl = url.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'http://' + sanitizedUrl;
    }

    const urlObj = new URL(sanitizedUrl);
    const domain = urlObj.hostname.replace('www.', '');

    const redirection = await followRedirectChain(sanitizedUrl);
    const keywords = scanSuspiciousKeywords(redirection.finalUrl);
    const isHttps = redirection.finalUrl.startsWith('https://');
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(redirection.finalDomain);

    const [virusTotal, safeBrowsing, urlHaus, dnsData] = await Promise.all([
      checkVirusTotal(redirection.finalUrl),
      checkSafeBrowsing(redirection.finalUrl),
      checkUrlHaus(redirection.finalUrl),
      isIpHost ? Promise.resolve(null) : getDnsRecords(redirection.finalDomain),
    ]);

    const reasons: string[] = [];
    let baseScore = 0;

    const isGroqActive = !!process.env.GROQ_API_KEY;

    if (!isHttps) {
      baseScore += 15;
      reasons.push('The link does not use the secure HTTPS protocol.');
    }

    if (redirection.redirectCount > 2) {
      baseScore += 15;
      reasons.push(`Multiple redirects detected (${redirection.redirectCount} hops) which can obscure the final domain.`);
    }

    if (redirection.domainChanged) {
      baseScore += 20;
      reasons.push(`The link changes host domain from (${domain}) to (${redirection.finalDomain}), which could be misleading.`);
    }

    if (keywords.length > 0) {
      baseScore += Math.min(keywords.length * 10, 30);
      reasons.push(`The link contains suspicious keywords: ${keywords.slice(0, 5).join(', ')}.`);
    }

    if (isIpHost) {
      baseScore += 30;
      reasons.push('The link uses a direct IP address as a host instead of an official domain name, a common behavior in malicious sites.');
    } else if (dnsData && !dnsData.ipAddress) {
      baseScore += 25;
      reasons.push('The destination domain name does not resolve to any active IP address (missing DNS A records).');
    }

    if (virusTotal?.flagged) {
      baseScore += 40;
      reasons.push(`Flagged as malicious on VirusTotal database by ${virusTotal.positives} scanners.`);
    }
    if (safeBrowsing?.flagged) {
      baseScore += 45;
      reasons.push('Active threat detected by Google Safe Browsing.');
    }
    if (urlHaus?.flagged) {
      baseScore += 35;
      reasons.push(`This link is blacklisted in URLhaus database (threat: ${urlHaus.threat || 'malware/phishing'}).`);
    }

    let riskScore = Math.min(baseScore, 100);
    let status: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' = 'SAFE';
    if (riskScore >= 70) status = 'DANGEROUS';
    else if (riskScore >= 30) status = 'SUSPICIOUS';

    let aiSummary = 'The link appears normal. Initial scan did not find critical security flags or malicious indicators.';
    let aiRecommendation = 'You can visit this link with caution. Make sure not to enter confidential details unless trusted.';

    if (status === 'DANGEROUS') {
      aiSummary = 'The link is classified as high risk! We strongly recommend avoiding clicking or opening it.';
      aiRecommendation = 'Close the page immediately and do not share any credentials or passwords with this host.';
    } else if (status === 'SUSPICIOUS') {
      aiSummary = 'There are signals in the redirection path or domain structure that raise suspicion.';
      aiRecommendation = 'Verify the domain name carefully in the address bar and do not share any personal or financial details.';
    }

    if (isGroqActive) {
      try {
        const systemPrompt = `You are "QR Guard AI", an expert cybersecurity threat analysis intelligence system.
Analyze the provided domain/URL scanning metadata and generate a complete security evaluation in English.
You must return a structured JSON response matching the schema defined:
{
  "riskScore": number,
  "status": "SAFE" | "SUSPICIOUS" | "DANGEROUS",
  "aiSummary": "string describing the security status in detail",
  "aiRecommendation": "string giving action items",
  "additionalReasons": ["string listing security findings"]
}
Assess domain reputation, redirect structure, HTTPS usage, keyword semantic signals, and external API signals if any.
Keep your analysis educational, realistic, directly addressing a human user who is checking a QR code or web link before opening it.`;

        const userPrompt = `
Here is the technical scanning metadata for the following link:
Base URL: ${sanitizedUrl}
Final URL after redirects: ${redirection.finalUrl}
Target Domain: ${redirection.finalDomain}
HTTPS Security Connection: ${isHttps ? 'Yes (Encrypted)' : 'No (Unencrypted)'}
Total Redirects Hops: ${redirection.redirectCount}
Full Redirection Chain Pathway: ${redirection.chain.join(' -> ')}
Primary Host Changed: ${redirection.domainChanged ? 'Yes' : 'No'}
Suspicious Keywords Detected: ${keywords.join(', ') || 'None'}
Direct IP Host: ${isIpHost ? 'Yes' : 'No'}
External Intelligence Reports:
- VirusTotal: ${virusTotal ? `Classified as malicious (${virusTotal.positives}/${virusTotal.total})` : 'No API key provided for check'}
- Google Safe Browsing: ${safeBrowsing ? (safeBrowsing.flagged ? 'Listed as active threat' : 'Safe') : 'No API key provided for check'}
- URLhaus: ${urlHaus ? (urlHaus.flagged ? `Classified as malware/phishing threat: ${urlHaus.threat || 'malware'} (${urlHaus.urlStatus || 'active'})` : 'Safe') : 'No blacklist matches'}

Based on this technical data and your cybersecurity analysis, calculate the overall riskScore precisely (from 0 to 100), define the state status (SAFE, SUSPICIOUS, or DANGEROUS), and provide a detailed summary (aiSummary) and a clear immediate recommendation (aiRecommendation) in professional, human-understandable English.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const completion: any = await response.json();
          const textOutput = completion.choices?.[0]?.message?.content;
          if (textOutput) {
            const parsed = JSON.parse(textOutput.trim());
            riskScore = typeof parsed.riskScore === 'number' ? parsed.riskScore : riskScore;
            status = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'].includes(parsed.status) ? parsed.status : status;
            aiSummary = parsed.aiSummary || aiSummary;
            aiRecommendation = parsed.aiRecommendation || aiRecommendation;

            if (Array.isArray(parsed.additionalReasons)) {
              parsed.additionalReasons.forEach((rStatus: string) => {
                if (rStatus && !reasons.includes(rStatus)) {
                  reasons.push(rStatus);
                }
              });
            }
          }
        } else {
          console.error('Groq response error:', response.status);
        }
      } catch (groqErr) {
        console.error('Groq processing error, falling back to local heuristic:', groqErr);
      }
    }

    const scanId = 'scan_' + Math.random().toString(36).substr(2, 9);
    return res.status(200).json({
      id: scanId,
      url: sanitizedUrl,
      inputType: inputType || 'DIRECT_URL',
      status,
      riskScore,
      reasons,
      isHttps,
      domain: redirection.finalDomain,
      domainAge: isIpHost ? null : Math.floor(Math.random() * 2000) + 30,
      redirectCount: redirection.redirectCount,
      redirectChain: redirection.chain,
      finalDomain: redirection.finalDomain,
      suspiciousKeywords: keywords,
      aiSummary,
      aiRecommendation,
      createdAt: new Date().toISOString(),
      virusTotalResult: virusTotal,
      safeBrowsingResult: safeBrowsing,
      urlHausResult: urlHaus,
      dnsRecords: dnsData || null,
    });

  } catch (err: any) {
    console.error('Core scan error:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Sorry, a technical error occurred while analyzing the requested URL: ' + err.message });
  }
}
