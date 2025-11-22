import '../styles/globals.css';
import '../styles/accessibility.css';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../src/createEmotionCache';
import Head from 'next/head';
import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import DynamicPWAProvider from '../components/DynamicPWAProvider';
import theme from '../src/theme';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();


function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <meta name="description" content="Wick Wax & Relax - Premium scented candles, wax melts, and bath products for relaxation" />
        <title>Wick Wax & Relax</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#C8B6DB" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <CartProvider>
            <DynamicPWAProvider>
              {/* Add a skip to main content link at the top of the page */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Component {...pageProps} />
            </DynamicPWAProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default MyApp;