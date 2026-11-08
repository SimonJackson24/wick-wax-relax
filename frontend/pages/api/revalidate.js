// On-demand ISR revalidation. When Simon saves a product / category /
// shipping rate in admin, the backend POSTs to this endpoint so the
// homepage (and other static pages) pick up the change immediately
// instead of waiting for the 60-second background revalidation.
//
// Security: shared-secret token. The backend sends
//   Authorization: Bearer <REVALIDATE_SECRET>
// where REVALIDATE_SECRET is set in BOTH the Next.js and backend
// environments. Without it, the endpoint returns 401 — anonymous
// visitors cannot trigger rebuilds (which would be a cheap DoS).
//
// SSRF: no user-controllable URL is fetched here — res.revalidate only
// accepts a literal path from a fixed whitelist below.

import { NextResponse } from 'next/server';

// Pages that can be revalidated. Nothing outside this list.
const REVALIDATABLE = new Set(['/', '/products', '/subscriptions']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !token || token.length !== expected.length) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Constant-time comparison.
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (!require('crypto').timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { paths } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > 10) {
    return res.status(400).json({ error: 'paths must be a non-empty array (max 10)' });
  }

  const invalid = paths.filter((p) => !REVALIDATABLE.has(p));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Not revalidatable: ${invalid.join(', ')}` });
  }

  try {
    for (const path of paths) {
      await res.revalidate(path);
    }
    return res.json({ revalidated: paths, at: new Date().toISOString() });
  } catch (error) {
    console.error('Revalidation error:', error.message);
    return res.status(500).json({ error: 'Revalidation failed' });
  }
}
