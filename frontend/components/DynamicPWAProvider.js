import React from 'react';
import dynamic from 'next/dynamic';

const PWAProvider = dynamic(() => import('../utils/pwaUtils').then((mod) => mod.PWAProvider), {
  ssr: false,
});

const DynamicPWAProvider = ({ children }) => {
  return <PWAProvider>{children}</PWAProvider>;
};

export default DynamicPWAProvider;