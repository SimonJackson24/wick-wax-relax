import React from 'react';
import { PWAProvider } from './PWAContext';

// The PWA provider used to be loaded via next/dynamic with { ssr: false }.
// Because it wraps the ENTIRE app in _app.js, that setting made Next.js
// render NOTHING on the server — every page shipped an empty
// <div id="__next"></div> and the whole site's server-rendered HTML (the
// SSR sweep, JSON-LD, product names/prices in the source) was silently
// discarded. Google was served a blank shell.
//
// PWAContext is already SSR-safe: all state starts from safe defaults and
// every browser API (window, navigator, serviceWorker) is touched only
// inside useEffect with a typeof window guard. So it does not need
// ssr: false — and it must not have it while it wraps the app.
const DynamicPWAProvider = ({ children }) => <PWAProvider>{children}</PWAProvider>;

export default DynamicPWAProvider;
