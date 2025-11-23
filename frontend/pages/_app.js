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
import DynamicPWAProvider from '../components/DynamicPWAProvider';
import { ToastProvider } from '../components/ToastContext';

// Configure axios once for the entire frontend
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
axios.defaults.withCredentials = true;

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <DynamicPWAProvider>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <PerformanceOptimizer>
                    <Component {...pageProps} />
                  </PerformanceOptimizer>
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </DynamicPWAProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;
