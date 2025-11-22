// PWA utility functions for offline data management and PWA features

/**
 * IndexedDB wrapper for offline data storage
 */
class OfflineStorage {
  constructor(dbName = 'wick-wax-offline', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores for different data types
        if (!db.objectStoreNames.contains('offlineActions')) {
          const offlineActionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
          offlineActionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          offlineActionsStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cachedDataStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cachedDataStore.createIndex('timestamp', 'timestamp', { unique: false });
          cachedDataStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'key' });
        }
      };
    });
  }

  // Store offline action
  async storeOfflineAction(action) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');

      const offlineAction = {
        id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: action.type,
        data: action.data,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };

      const request = store.add(offlineAction);
      request.onsuccess = () => resolve(offlineAction);
      request.onerror = () => reject(request.error);
    });
  }

  // Get offline actions
  async getOfflineActions(type = null) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineActions'], 'readonly');
      const store = transaction.objectStore('offlineActions');

      let request;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update offline action status
  async updateOfflineAction(id, updates) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          const updatedAction = { ...action, ...updates };
          const putRequest = store.put(updatedAction);
          putRequest.onsuccess = () => resolve(updatedAction);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Action not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Remove offline action
  async removeOfflineAction(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');

      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all offline actions
  async clearOfflineActions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');

      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store cached data
  async storeCachedData(key, data, type = 'general') {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');

      const cachedItem = {
        key,
        data,
        type,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      const request = store.put(cachedItem);
      request.onsuccess = () => resolve(cachedItem);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');

      const request = store.get(key);
      request.onsuccess = () => {
        const item = request.result;
        if (item && item.expiresAt > Date.now()) {
          resolve(item.data);
        } else {
          // Remove expired item
          if (item) {
            store.delete(key);
          }
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Store user preference
  async setUserPreference(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userPreferences'], 'readwrite');
      const store = transaction.objectStore('userPreferences');

      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get user preference
  async getUserPreference(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userPreferences'], 'readonly');
      const store = transaction.objectStore('userPreferences');

      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

/**
 * PWA feature detection and utilities
 */
export const pwaUtils = {
  // Check if running as PWA
  isRunningAsPWA: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  },

  // Check PWA capabilities
  getPWACapabilities: () => {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      periodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'PushManager' in window,
      backgroundFetch: 'serviceWorker' in navigator && 'backgroundFetch' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      webShareTarget: 'serviceWorker' in navigator && 'launchQueue' in window,
      fileSystem: 'showSaveFilePicker' in window,
      wakeLock: 'wakeLock' in navigator,
      screenWakeLock: 'wakeLock' in navigator && 'request' in navigator.wakeLock,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      paymentRequest: 'PaymentRequest' in window,
      credentialManagement: 'credentials' in navigator,
      webAuthn: 'credentials' in navigator && 'get' in navigator.credentials,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      nfc: 'nfc' in window,
      webRTC: 'RTCPeerConnection' in window,
      webGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch (e) {
          return false;
        }
      })(),
      webGL2: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
        } catch (e) {
          return false;
        }
      })(),
      webAssembly: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
      indexedDB: 'indexedDB' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      cookies: navigator.cookieEnabled,
      onlineStatus: 'onLine' in navigator,
      connection: 'connection' in navigator,
      battery: 'getBattery' in navigator,
      memory: 'deviceMemory' in navigator,
      hardwareConcurrency: 'hardwareConcurrency' in navigator,
      platform: 'platform' in navigator,
      userAgent: 'userAgent' in navigator,
      language: 'language' in navigator,
      languages: 'languages' in navigator,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touch: 'ontouchstart' in window,
      pointer: 'PointerEvent' in window,
      gamepad: 'getGamepads' in navigator,
      midi: 'requestMIDIAccess' in navigator,
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      webSpeech: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      webVR: 'getVRDisplays' in navigator,
      webXR: 'xr' in navigator,
      mediaDevices: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices,
      permissions: 'permissions' in navigator,
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      serviceWorker: 'serviceWorker' in navigator,
      caches: 'caches' in window,
      fetch: 'fetch' in window,
      webSockets: 'WebSocket' in window,
      eventSource: 'EventSource' in window,
      webWorkers: 'Worker' in window,
      sharedWorkers: 'SharedWorker' in window,
      webCrypto: 'crypto' in window && 'subtle' in window.crypto,
      webAnimations: 'animate' in document.createElement('div'),
      intersectionObserver: 'IntersectionObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
      reportingObserver: 'ReportingObserver' in window,
      layoutShift: 'layoutShift' in window.PerformanceObserver.supportedEntryTypes,
      largestContentfulPaint: 'largest-contentful-paint' in window.PerformanceObserver.supportedEntryTypes,
      firstInput: 'first-input' in window.PerformanceObserver.supportedEntryTypes,
      navigationTiming: 'navigation' in window.PerformanceObserver.supportedEntryTypes,
      resourceTiming: 'resource' in window.PerformanceObserver.supportedEntryTypes,
      paintTiming: 'paint' in window.PerformanceObserver.supportedEntryTypes,
      longTask: 'longtask' in window.PerformanceObserver.supportedEntryTypes
    };
  },

  // Get device information
  getDeviceInfo: () => {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      vendor: navigator.vendor,
      product: navigator.product,
      appVersion: navigator.appVersion,
      appName: navigator.appName,
      appCodeName: navigator.appCodeName,
      productSub: navigator.productSub,
      vendorSub: navigator.vendorSub,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      touch: 'ontouchstart' in window,
      pointer: 'PointerEvent' in window,
      orientation: screen.orientation?.type || 'unknown'
    };
  },

  // Get network information
  getNetworkInfo: () => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        downlinkMax: connection.downlinkMax,
        rtt: connection.rtt,
        type: connection.type,
        saveData: connection.saveData
      };
    }
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  },

  // Get battery information
  getBatteryInfo: async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level
        };
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
    return null;
  },

  // Request wake lock
  requestWakeLock: async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
        return wakeLock;
      } catch (error) {
        console.warn('Wake lock request failed:', error);
      }
    }
    return null;
  },

  // Vibrate device
  vibrate: (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // Share content
  share: async (data) => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.warn('Share failed:', error);
      }
    }
    return false;
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Check notification permission
  getNotificationPermission: () => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  },

  // Show notification
  showNotification: (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, options);
    }
    return null;
  },

  // Register for background sync
  registerBackgroundSync: async (tag = 'background-sync') => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
    return false;
  },

  // Register for periodic sync
  registerPeriodicSync: async (tag = 'content-sync', options = {}) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('periodicSync' in registration) {
          await registration.periodicSync.register(tag, {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
            ...options
          });
          console.log('Periodic sync registered:', tag);
          return true;
        }
      } catch (error) {
        console.warn('Periodic sync registration failed:', error);
      }
    }
    return false;
  },

  // Check if app can be installed
  canInstall: () => {
    return 'beforeinstallprompt' in window ||
           window.matchMedia('(display-mode: standalone)').matches;
  },

  // Get install prompt
  getInstallPrompt: () => {
    return new Promise((resolve) => {
      const handler = (event) => {
        event.preventDefault();
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(event);
      };
      window.addEventListener('beforeinstallprompt', handler);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(null);
      }, 5000);
    });
  },

  // Install PWA
  installPWA: async (prompt) => {
    if (!prompt) return false;

    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      return outcome === 'accepted';
    } catch (error) {
      console.warn('PWA install failed:', error);
      return false;
    }
  },

  // Check if running in standalone mode
  isStandalone: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  },

  // Get display mode
  getDisplayMode: () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: browser)').matches) {
      return 'browser';
    }
    return 'unknown';
  },

  // Get app version
  getAppVersion: () => {
    return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  },

  // Get build info
  getBuildInfo: () => {
    return {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH || 'unknown'
    };
  }
};

/**
 * Offline queue for managing offline actions
 */
export class OfflineQueue {
  constructor() {
    this.storage = offlineStorage;
    this.isProcessing = false;
    this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Progressive retry delays
  }

  // Add action to offline queue
  async addAction(type, data) {
    const action = {
      type,
      data,
      timestamp: Date.now()
    };

    await this.storage.storeOfflineAction(action);
    console.log('Action added to offline queue:', type);

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  // Process offline queue
  async processQueue() {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const actions = await this.storage.getOfflineActions();

      for (const action of actions) {
        if (action.status === 'completed') continue;

        try {
          await this.processAction(action);
          await this.storage.updateOfflineAction(action.id, {
            status: 'completed',
            completedAt: Date.now()
          });
        } catch (error) {
          console.error('Failed to process offline action:', action.id, error);

          const retryCount = (action.retryCount || 0) + 1;
          if (retryCount < this.retryDelays.length) {
            await this.storage.updateOfflineAction(action.id, {
              retryCount,
              nextRetryAt: Date.now() + this.retryDelays[retryCount],
              lastError: error.message
            });
          } else {
            // Mark as failed after max retries
            await this.storage.updateOfflineAction(action.id, {
              status: 'failed',
              lastError: error.message
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual action
  async processAction(action) {
    switch (action.type) {
      case 'add_to_cart':
        await this.processAddToCart(action.data);
        break;
      case 'update_profile':
        await this.processUpdateProfile(action.data);
        break;
      case 'send_message':
        await this.processSendMessage(action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Process add to cart action
  async processAddToCart(data) {
    // Implementation depends on your cart API
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }
  }

  // Process profile update action
  async processUpdateProfile(data) {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
  }

  // Process send message action
  async processSendMessage(data) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  // Get queue status
  async getQueueStatus() {
    const actions = await this.storage.getOfflineActions();
    return {
      total: actions.length,
      pending: actions.filter(a => a.status === 'pending').length,
      completed: actions.filter(a => a.status === 'completed').length,
      failed: actions.filter(a => a.status === 'failed').length,
      processing: this.isProcessing
    };
  }

  // Clear completed actions
  async clearCompleted() {
    const actions = await this.storage.getOfflineActions();
    const completedActions = actions.filter(a => a.status === 'completed');

    for (const action of completedActions) {
      await this.storage.removeOfflineAction(action.id);
    }
  }

  // Clear failed actions
  async clearFailed() {
    const actions = await this.storage.getOfflineActions();
    const failedActions = actions.filter(a => a.status === 'failed');

    for (const action of failedActions) {
      await this.storage.removeOfflineAction(action.id);
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();

// Export offline storage instance
export { offlineStorage };

// Initialize offline storage on module load
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
}