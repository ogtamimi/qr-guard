import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.status(200).json({
    status: 'ok',
    apiStatus: {
      groqConnected: !!process.env.GROQ_API_KEY,
      virusTotalConnected: !!process.env.VIRUSTOTAL_API_KEY,
      googleSafeBrowsingConnected: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
      urlHausConnected: true,
    },
  });
  res.status(405).json({ error: 'Method not allowed' });
}