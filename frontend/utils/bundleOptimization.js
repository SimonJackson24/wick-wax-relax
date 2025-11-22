// Bundle optimization utilities for code splitting and performance

// Dynamic imports for route-based code splitting
export const loadPage = (pageName) => {
  return import(`../pages/${pageName}`);
};

// Component lazy loading with preloading
export const lazyLoadComponent = (importFunc, preload = false) => {
  const Component = lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load component:', error);
      return {
        default: () => (
          <div className="error-fallback">
            Component failed to load. Please refresh the page.
          </div>
        )
      };
    })
  );

  // Preload critical components
  if (preload && Component.preload) {
    Component.preload();
  }

  return Component;
};

// Preload critical routes on app start
export const preloadCriticalRoutes = () => {
  // Preload home page components
  import('../pages/index.js');
  import('../components/Navigation.js');
  import('../components/Hero.js');

  // Preload commonly accessed pages
  setTimeout(() => {
    import('../pages/products.js');
    import('../pages/account/login.js');
  }, 2000);
};

// Bundle analysis utilities
export const getBundleMetrics = () => {
  if (typeof window === 'undefined') return null;

  const resources = performance.getEntriesByType('resource');
  const scripts = resources.filter(r => r.name.includes('.js'));
  const styles = resources.filter(r => r.name.includes('.css'));

  return {
    totalScripts: scripts.length,
    totalStyles: styles.length,
    scriptSizes: scripts.map(s => ({
      name: s.name.split('/').pop(),
      size: s.transferSize,
      duration: s.duration
    })),
    styleSizes: styles.map(s => ({
      name: s.name.split('/').pop(),
      size: s.transferSize,
      duration: s.duration
    }))
  };
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(entry.startTime)
          });
        }
      }
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID:', entry.processingStart - entry.startTime);
    }
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
    console.log('CLS:', clsValue);
  }).observe({ entryTypes: ['layout-shift'] });
};

// Resource hints for performance
export const addResourceHints = () => {
  if (typeof document === 'undefined') return;

  const hints = [
    // Preconnect to external domains
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },

    // DNS prefetch for external resources
    { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
    { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },

    // Preload critical resources
    { rel: 'preload', href: '/fonts/roboto.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.keys(hint).forEach(key => {
      link.setAttribute(key, hint[key]);
    });
    document.head.appendChild(link);
  });
};

// Service worker for caching
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available, notify user
            console.log('New content available, please refresh.');
          }
        });
      }
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined' || !performance.memory) return;

  setInterval(() => {
    const memInfo = performance.memory;
    const usedPercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;

    if (usedPercent > 80) {
      console.warn('High memory usage detected:', {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        percentage: usedPercent.toFixed(2) + '%'
      });

      // Trigger garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }
  }, 30000); // Check every 30 seconds
};

// Initialize all optimizations
export const initializeOptimizations = () => {
  if (typeof window === 'undefined') return;

  // Preload critical routes
  preloadCriticalRoutes();

  // Track web vitals
  trackWebVitals();

  // Add resource hints
  addResourceHints();

  // Register service worker
  registerServiceWorker();

  // Monitor memory usage
  monitorMemoryUsage();

  // Log bundle metrics
  setTimeout(() => {
    const metrics = getBundleMetrics();
    if (metrics) {
      console.log('Bundle metrics:', metrics);
    }
  }, 3000);
};