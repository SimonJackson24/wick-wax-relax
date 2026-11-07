// Single source of truth for the public site URL.
// Canonical domain is https://www.wickwaxrelax.co.uk — every sitemap, robots,
// canonical, OG, JSON-LD, email link, and PDF reference must use this.
// Override with NEXT_PUBLIC_SITE_URL for local development or previews.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wickwaxrelax.co.uk';
