import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Link } from '@mui/material';

const COOKIE_NAME = 'wwr-consent';
const CONSENT_VERSION = '1.0';

const CATEGORIES = [
  { id: 'essential', label: 'Essential', description: 'Required for the site to function. Always on.', required: true },
  { id: 'analytics', label: 'Analytics', description: 'Anonymous usage data so we can improve the site.' },
  { id: 'marketing', label: 'Marketing', description: 'Personalised ads and re-engagement emails.' },
];

/**
 * UK PECR + GDPR cookie consent banner.
 *
 * Stores a JSON consent record in a 1-year first-party cookie. The consent is
 * versioned so we can re-prompt when our policy materially changes. The
 * non-essential categories (analytics, marketing) default to false — no
 * scripts that depend on them (GA, Meta Pixel) should load until consent is
 * granted.
 *
 * The script loader in each third-party integration should check
 * `getConsent('analytics')` / `getConsent('marketing')` before injecting.
 */
export function getConsent(category) {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  if (!match) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (parsed.version !== CONSENT_VERSION) return false;
    return Boolean(parsed.categories && parsed.categories[category]);
  } catch {
    return false;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [prefs, setPrefs] = useState({ essential: true, analytics: false, marketing: false });

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
    if (!match) setVisible(true);
  }, []);

  function save(granted) {
    const payload = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      categories: {
        essential: true,
        analytics: granted.includes('analytics'),
        marketing: granted.includes('marketing'),
      },
    };
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Paper
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1300,
        p: 3,
        maxWidth: 720,
        mx: 'auto',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" gutterBottom>Cookies on Wick Wax &amp; Relax</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        We use essential cookies to make the site work. With your consent we also use analytics and
        marketing cookies. You can change your choice at any time. See our{' '}
        <Link href="/privacy" underline="always">privacy policy</Link>.
      </Typography>

      <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
        {CATEGORIES.map((c) => (
          <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="checkbox"
              id={`cookie-${c.id}`}
              checked={c.required ? true : Boolean(prefs[c.id])}
              disabled={c.required}
              onChange={(e) => setPrefs({ ...prefs, [c.id]: e.target.checked })}
            />
            <label htmlFor={`cookie-${c.id}`}>
              <strong>{c.label}</strong> — {c.description}
            </label>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={() => save([])}>Reject non-essential</Button>
        <Button variant="outlined" onClick={() => save(Object.keys(prefs).filter((k) => prefs[k]))}>
          Save preferences
        </Button>
        <Button variant="contained" onClick={() => save(['analytics', 'marketing'])}>
          Accept all
        </Button>
      </Box>
    </Paper>
  );
}
