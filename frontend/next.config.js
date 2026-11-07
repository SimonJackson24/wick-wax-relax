const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Canonical domain default so any process.env.NEXT_PUBLIC_SITE_URL consumer
  // (SEOHead, utils/siteConfig.js) gets the right value even without a .env
  // file present. See frontend/utils/siteConfig.js.
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wickwaxrelax.co.uk',
  },
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
              // Playfair Display / Roboto / Dancing Script load from Google
              // Fonts: the stylesheet from googleapis (style-src) and the
              // font files from gstatic (font-src). MUI also needs
              // 'unsafe-inline' for its emotion styles.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
        // Next.js bakes rewrites at BUILD time — runtime env changes have
        // no effect. Default to the public API domain (stable across
        // redeploys, unlike Coolify's timestamped container names);
        // override NEXT_PUBLIC_API_URL at build time for other environments.
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wickwaxrelax.co.uk'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
