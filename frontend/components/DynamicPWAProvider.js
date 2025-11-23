import React from 'react';
import dynamic from 'next/dynamic';

const PWAProvider = dynamic(
  () =>
    import('./PWAContext').then((mod) => mod.PWAProvider || mod.default),
  { ssr: false }
);

const DynamicPWAProvider = ({ children }) => {
  return <PWAProvider>{children}</PWAProvider>;
};

export default DynamicPWAProvider;
