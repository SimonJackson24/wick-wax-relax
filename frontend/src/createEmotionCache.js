import createCache from '@emotion/cache';

// This is the client-side Emotion cache.
export default function createEmotionCache() {
  return createCache({ key: 'css' });
}