import axios from 'axios';

// Dynamic sitemap — server-rendered on every request from the live
// catalogue (ACTIVE products + categories), plus the core pages. This
// replaces the old 6-URL static file; Google sees every product the
// moment it goes ACTIVE.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.wickwaxrelax.co.uk';
const API = process.env.API_URL || 'http://localhost:3001';

export async function getServerSideProps({ res }) {
  const urls = [
    { loc: `${SITE}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE}/products`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE}/subscriptions`, changefreq: 'weekly', priority: '0.6' },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      axios.get(`${API}/api/products?limit=500`, { timeout: 3000 }).catch(() => null),
      axios.get(`${API}/api/categories`, { timeout: 3000 }).catch(() => null),
    ]);

    const products = productsRes?.data
      ? (Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products || [])
      : [];
    for (const p of products) {
      if (p.slug) {
        urls.push({ loc: `${SITE}/product/${p.slug}`, changefreq: 'weekly', priority: '0.8' });
      }
    }

    const categories = categoriesRes?.data
      ? (Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.categories || [])
      : [];
    for (const c of categories) {
      if (c.slug) {
        urls.push({ loc: `${SITE}/category/${c.slug}`, changefreq: 'weekly', priority: '0.7' });
      }
    }
  } catch {
    // Core URLs still ship if the backend is briefly unreachable.
  }

  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.write(xml);
  res.end();

  return { props: {} };
}

// Never rendered as a page — the response IS the XML.
export default function Sitemap() {
  return null;
}
