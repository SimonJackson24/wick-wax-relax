import { useEffect, useState } from 'react';
import Head from 'next/head';

const PerformanceOptimizer = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsLoaded(true);
    const preloadResources = () => {
      const criticalImages = ['/images/hero-image.webp', '/images/logo.webp'];
      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };
    const optimizeCoreWebVitals = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'lcp', {
                value: Math.round(entry.startTime)
              });
            }
          }
        }
      });
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation not supported');
      }
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observation not supported');
      }
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        console.log('CLS:', clsValue);
      });
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observation not supported');
      }
    };
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        console.log('App is offline');
      } else {
        console.log('App is back online');
      }
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    preloadResources();
    optimizeCoreWebVitals();
    handleOnlineStatus();
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="prefetch" href="/api/products" />
        <link rel="prefetch" href="/api/categories" />
        <meta name="theme-color" content="#C8B6DB" />
        <meta name="msapplication-TileColor" content="#C8B6DB" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Wick Wax Relax",
              "description": "Premium wax products and relaxation solutions",
              "url": "https://wickwaxrelax.com",
              "applicationCategory": "ShoppingApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </Head>
      {!isLoaded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div>Loading...</div>
        </div>
      )}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ff9800',
          color: 'white',
          textAlign: 'center',
          padding: '8px',
          zIndex: 1000
        }}>
          You are currently offline. Some features may not be available.
        </div>
      )}
      {children}
    </>
  );
};

export default PerformanceOptimizer;