import { useEffect, useState } from 'react';
import Head from 'next/head';

const PerformanceOptimizer = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Mark when component is hydrated
    setIsLoaded(true);

    // Preload critical resources
    const preloadResources = () => {
      // Preload critical images
      const criticalImages = [
        '/images/hero-image.webp',
        '/images/logo.webp'
      ];

      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    // Optimize for Core Web Vitals
    const optimizeCoreWebVitals = () => {
      // Largest Contentful Paint (LCP) optimization
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
            // Send to analytics
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

      // First Input Delay (FID) optimization
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

      // Cumulative Layout Shift (CLS) optimization
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

    // Handle online/offline status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);

      if (!navigator.onLine) {
        // Show offline notification
        console.log('App is offline');
      } else {
        // Sync any pending data
        console.log('App is back online');
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Initialize optimizations
    preloadResources();
    optimizeCoreWebVitals();
    handleOnlineStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return (
    <>
      <Head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* Resource hints */}
        <link rel="prefetch" href="/api/products" />
        <link rel="prefetch" href="/api/categories" />


        {/* Optimize theme color */}
        <meta name="theme-color" content="#1976d2" />
        <meta name="msapplication-TileColor" content="#1976d2" />

        {/* Optimize viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* Optimize for search engines */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        {/* Structured data for SEO */}
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

      {/* Loading state */}
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

      {/* Offline indicator */}
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