// Frontend revalidation trigger. When admin saves a product / category /
// shipping rate, this pings the Next.js /api/revalidate endpoint so the
// static homepage picks up the change immediately (ISR background
// revalidation still runs every 60s as a safety net).
//
// Config: set REVALIDATE_SECRET in the backend environment (same value
// as the Next.js container) and REVALIDATE_URL to the store's origin.

const axios = require('axios');

const REVALIDATE_URL = process.env.REVALIDATE_URL || '';
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || '';

// Fire-and-forget: a failed revalidation must never block or fail the
// admin save that triggered it — the 60s ISR sweep will catch up.
function revalidate(paths) {
  if (!REVALIDATE_URL || !REVALIDATE_SECRET) return;
  if (!Array.isArray(paths) || paths.length === 0) return;

  axios
    .post(
      `${REVALIDATE_URL}/api/revalidate`,
      { paths },
      {
        headers: { Authorization: `Bearer ${REVALIDATE_SECRET}` },
        timeout: 3000,
      }
    )
    .then(() => {})
    .catch(() => { /* logged at debug only — ISR is the safety net */ });
}

module.exports = { revalidate };
