import { useEffect } from 'react';
import '../styles/globals.css';
import '../styles/accessibility.css';
import Head from 'next/head';
import axios from 'axios';
import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import createEmotionCache from '../src/createEmotionCache';
import theme from '../src/theme';
import ErrorBoundary from '../components/ErrorBoundary';
import PerformanceOptimizer from '../components/PerformanceOptimizer';
import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import { WishlistProvider } from '../components/WishlistContext';
import { SubscriptionProvider } from '../components/SubscriptionContext';
import DynamicPWAProvider from '../components/DynamicPWAProvider';
import { ToastProvider } from '../components/ToastContext';
import CookieConsent from '../components/CookieConsent';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

// Axios: same-origin in production, configurable in development.
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
axios.defaults.withCredentials = true;

// CSRF: include the X-CSRF-Token header on every mutating request.
// The server's double-submit-cookie middleware issues the token on the first
// safe request; we read it back here and echo it on POST/PUT/PATCH/DELETE.
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
axios.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = getCookie('csrfToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

const clientSideEmotionCache = createEmotionCache();

function ServiceWorkerRegistrar() {
  // Register the production service worker for offline product/category
  // pages. We do NOT register during development because Next's HMR
  // connection collides with the SW fetch handler and bricks the dev
  // server tab. Production-only check is `process.env.NODE_ENV`.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const onUpdate = (reg) => {
      // The new SW has installed. Tell it to take over and refresh.
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => onUpdate(reg));
        // Periodic check — once an hour is plenty. If a new SW is waiting
        // (e.g. user kept the tab open across a deploy), reload to pick it up.
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((err) => {
        // Service worker failure is non-fatal — the app still works online.
        // eslint-disable-next-line no-console
        console.warn('[sw] registration failed', err);
      });

    // Refresh the page once when a new SW takes over.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}

function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content={theme.palette.primary.main} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Security meta — these are the only ones browsers enforce in-document
            without a CSP header. The full set lives in next.config.js so they
            are emitted by the server. */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </Head>
      <ServiceWorkerRegistrar />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <DynamicPWAProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <SubscriptionProvider>
                    <ToastProvider>
                      <PerformanceOptimizer>
                        <Component {...pageProps} />
                        <PWAInstallPrompt />
                        <CookieConsent />
                      </PerformanceOptimizer>
                    </ToastProvider>
                  </SubscriptionProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </DynamicPWAProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;
