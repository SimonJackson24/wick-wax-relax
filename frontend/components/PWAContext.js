import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext();

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('loading');
  const [cacheStatus, setCacheStatus] = useState('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Network status monitoring
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[PWA] Network status: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[PWA] Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker registration
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setServiceWorkerStatus('unsupported');
      return;
    }

    registerServiceWorker();
  }, []);

  // Install prompt handling
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event) => {
      console.log('[PWA] Install prompt available');
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('[PWA] Registering service worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setRegistration(registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Handle service worker state changes
      if (registration.active) {
        setServiceWorkerStatus('active');
        console.log('[PWA] Service worker active');
      } else if (registration.installing) {
        setServiceWorkerStatus('installing');
      } else if (registration.waiting) {
        setServiceWorkerStatus('waiting');
      }

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed');
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      setServiceWorkerStatus('error');
    }
  };

  // Install the PWA
  const installPWA = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[PWA] Install outcome:', outcome);
      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  };

  // Update service worker
  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      console.log('[PWA] Updating service worker...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Cache management
  const clearCache = async () => {
    try {
      setCacheStatus('clearing');

      if (registration && registration.active) {
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }

      // Also clear runtime caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      setCacheStatus('cleared');
      console.log('[PWA] Cache cleared');

      // Reset status after a delay
      setTimeout(() => setCacheStatus('idle'), 2000);
    } catch (error) {
      console.error('[PWA] Cache clear failed:', error);
      setCacheStatus('error');
    }
  };

  // Cache specific URL
  const cacheUrl = (url) => {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'CACHE_URL',
        data: { url }
      });
    }
  };

  // Remove URL from cache
  const uncacheUrl = (url) => {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'UNCACHE_URL',
        data: { url }
      });
    }
  };

  // Check if app is running as PWA
  const isRunningAsPWA = () => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  };

  // Get PWA capabilities
  const getPWACapabilities = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        serviceWorker: false,
        backgroundSync: false,
        periodicSync: false,
        pushNotifications: false,
        backgroundFetch: false,
        installPrompt: false,
        isInstalled: false,
        canInstall: false
      };
    }

    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator && window.ServiceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype,
      periodicSync: 'serviceWorker' in navigator && window.ServiceWorkerRegistration && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'PushManager' in window,
      backgroundFetch: 'serviceWorker' in navigator && window.ServiceWorkerRegistration && 'backgroundFetch' in window.ServiceWorkerRegistration.prototype,
      installPrompt: !!deferredPrompt,
      isInstalled: isRunningAsPWA(),
      canInstall: isInstallable
    };
  };

  // Get network information
  const getNetworkInfo = () => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return null;
    }

    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  };

  // Register for background sync
  const registerBackgroundSync = async (tag = 'background-sync') => {
    if (!registration) return false;

    try {
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  };

  // Register for periodic sync
  const registerPeriodicSync = async (tag = 'content-sync', options = {}) => {
    if (!registration || !('periodicSync' in registration)) return false;

    try {
      await registration.periodicSync.register(tag, {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
        ...options
      });
      console.log('[PWA] Periodic sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Periodic sync registration failed:', error);
      return false;
    }
  };

  const value = {
    // Status
    isOnline,
    isInstallable,
    serviceWorkerStatus,
    cacheStatus,
    updateAvailable,
    registration,

    // Capabilities
    capabilities: getPWACapabilities(),
    networkInfo: getNetworkInfo(),
    isRunningAsPWA: isRunningAsPWA(),

    // Actions
    installPWA,
    updateServiceWorker,
    clearCache,
    cacheUrl,
    uncacheUrl,
    registerBackgroundSync,
    registerPeriodicSync,

    // Deferred prompt (for custom install UI)
    deferredPrompt
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
};

export default PWAProvider;