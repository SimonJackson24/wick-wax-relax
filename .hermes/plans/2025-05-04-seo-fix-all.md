# SEO Fix Plan — Wick Wax Relax

## Goal
Fix all 14 SEO issues identified in the audit: wire SEOHead on all pages, add h1 headings, create sitemap.xml and robots.txt, fix manifest.json, fix next.config.js, remove broken font preload.

## Issues to fix (14 total)

### Critical (must fix before launch)
1. SEOHead not imported on any page → add to index.js, products.js, product/[id].js, category/[slug].js
2. No `<h1>` on any page → add Typography component="h1" to homepage Hero and products page header
3. sitemap.xml 404 → create public/sitemap.xml
4. robots.txt 404 → create public/robots.txt
5. next.config.js hardcodes localhost:3001 → use env var
6. PerformanceOptimizer JSON-LD is WebApplication (wrong) → fix to Organization

### High (should fix)
7. manifest.json wrong theme_color (#1976d2 → #C8B6DB lavender)
8. manifest.json wrong lang (en-US → en-GB)
9. manifest.json wrong background_color (#ffffff → #F5F2ED)
10. poweredByHeader not disabled in next.config.js

### Medium (nice to have)
11. Remove broken /fonts/roboto.woff2 preload from SEOHead.js
12. SEOHead sameAs social array empty (info only — can add later)

## Files to change
- frontend/pages/index.js — import SEOHead, add h1
- frontend/pages/products.js — import SEOHead, add h1
- frontend/pages/product/[id].js — import SEOHead
- frontend/pages/category/[slug].js — import SEOHead
- frontend/public/sitemap.xml — NEW
- frontend/public/robots.txt — NEW
- frontend/next.config.js — env var API URL, poweredByHeader
- frontend/public/manifest.json — theme_color, lang, background_color
- frontend/components/SEOHead.js — remove broken font preload
- frontend/components/PerformanceOptimizer.js — fix JSON-LD type

## Approach
Batch all file reads first, then batch all writes/patches in parallel.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sitemap.xml` → 200
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/robots.txt` → 200
- `curl http://localhost:3000/products | grep -i '<title\|og:title\|og:description'` → non-empty
- `grep -r 'SEOHead' frontend/pages/*.js` → 4+ imports
- `grep -r 'h1' frontend/components/ | grep -v node_modules` → h1 found
- `npm run build` → exit code 0
