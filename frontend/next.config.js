const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  modularizeImports: {
    '@mui/material': { transform: '@mui/material/{{member}}' },
    '@mui/icons-material': { transform: '@mui/icons-material/{{member}}' },
  },
  images: {
    // Strict remote allow-list. Wildcards are a known SSRF / supply-chain
    // vector. The /uploads/** host is the backend origin, the rest are
    // explicit CDNs we use.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.wickwaxrelax.co.uk' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/images/**' },
    ],
  },
  // Security headers emitted by the server on every response. These
  // supplement the headers set by the Express backend (helmet) for the
  // pages Next.js renders itself. The Express layer still owns the API
  // headers.
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: isProd ? 'max-age=31536000; includeSubDomains; preload' : 'max-age=0',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              // Next.js requires 'unsafe-inline' during dev for HMR; tighten in prod.
              isProd ? "style-src 'self' 'unsafe-inline'" : "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.revolut.com https://www.google-analytics.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              isProd ? 'upgrade-insecure-requests' : '',
            ].filter(Boolean).join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
