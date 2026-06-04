import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function isSuperAdmin(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  // Initial setup: use CLERK_SECRET_KEY + super-admin env to bootstrap
  // This is a write-only, one-time bootstrap endpoint
  const setupKey = req.headers['x-setup-key'] as string | undefined;
  if (setupKey !== process.env.SETUP_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isSuperAdmin(req, res))) {
    return;
  }

  try {
    const { userId, role } = req.body as {
      userId?: string;
      role?: 'admin' | 'user';
    };

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }

    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      return res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' });
    }

    const clerkRes = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_metadata: { role } }),
      }
    );

    if (!clerkRes.ok) {
      const errText = await clerkRes.text();
      return res.status(clerkRes.status).json({
        error: `Clerk update failed: ${clerkRes.status}`,
        details: errText,
      });
    }

    return res.status(200).json({ success: true, userId, role });
  } catch (err: any) {
    console.error('/api/admin/set-role error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}