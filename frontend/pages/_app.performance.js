import Head from 'next/head';
import { useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PerformanceOptimizer from '../components/PerformanceOptimizer';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import { PWAProvider } from '../components/PWAContext';
import theme from '../utils/theme';
import { initializeOptimizations } from '../utils/bundleOptimization';

// Set axios base URL to point to backend
axios.defaults.baseURL = 'http://localhost:3001';
// Enable cookies for cross-origin requests
axios.defaults.withCredentials = true;

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize all performance optimizations
    initializeOptimizations();
  }, []);

  return (
    <ErrorBoundary>
      <PWAProvider>
        <AuthProvider>
          <CartProvider>
            <ThemeProvider theme={theme}>
              <PerformanceOptimizer>
                <Head>
                  <link rel="preconnect" href="https://fonts.googleapis.com" />
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                  <link
                    href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Allura&family=Satisfy&family=Roboto:wght@300;400;500;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                  />
                  <link rel="manifest" href="/manifest.json" />
                  <link rel="apple-touch-icon" href="/icon-192x192.png" />
                  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                  <meta name="apple-mobile-web-app-title" content="Wick Wax Relax" />

                  {/* Performance optimization meta tags */}
                  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
                  <meta name="theme-color" content="#1976d2" />
                  <meta name="msapplication-TileColor" content="#1976d2" />

                  {/* Preload critical resources */}
                  <link rel="preload" href="/images/hero-image.webp" as="image" />
                  <link rel="preload" href="/images/logo.webp" as="image" />

                  {/* DNS prefetch for external resources */}
                  <link rel="dns-prefetch" href="//www.google-analytics.com" />
                  <link rel="dns-prefetch" href="//www.googletagmanager.com" />
                </Head>
                <Component {...pageProps} />
              </PerformanceOptimizer>
            </ThemeProvider>
          </CartProvider>
        </AuthProvider>
      </PWAProvider>
    </ErrorBoundary>
  );
}

export default MyApp;