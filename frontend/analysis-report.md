# Wick Wax Relax - Full Stack Audit Report

**Project:** Wick Wax Relax (E-commerce PWA)  
**Date:** May 2026  
**Auditor:** Hermes Agent (M2.7)  
**Scope:** Backend API, Frontend, Auth, Database, SEO, Security, Deployment  

---

## Executive Summary

Wick Wax Relax is a handcrafted candle and home fragrance e-commerce PWA with Node.js/Express backend, Next.js frontend, PostgreSQL database, JWT auth, Stripe-compatible payments, and subscription billing. The application has a solid architectural foundation with good security hygiene in most places, but contains **one critical auth bug that will break order confirmation for all users**, plus several deployment blockers, incomplete payment integration, and SEO gaps that need addressing before launch.

**Overall Verdict: NOT READY FOR PRODUCTION** (as of this audit)

| Dimension | Score | Status |
|-----------|-------|--------|
| Backend Architecture | 72/100 | MEDIUM - Issues exist |
| Security | 68/100 | MEDIUM - Critical gaps |
| Frontend / UX | 70/100 | MEDIUM - Critical auth bug |
| SEO | 58/100 | LOW - Major gaps |
| Performance | --/100 | UNKNOWN - Lighthouse 404 |
| Deployability | 55/100 | LOW - Multiple blockers |

---

## PART 1 — BACKEND ARCHITECTURE

### 1.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js / Express 4.x |
| Database | PostgreSQL via `pg` library (pool) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| ORM | Raw parameterized SQL (no Prisma) |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| Security Headers | helmet |
| Payments | Revolut (via revolutService.js) |
| Email | Nodemailer |
| File Storage | Local static (multer + express.static) |
| Logging | Winston |
| Monitoring | Sentry (v8) |
| Testing | Jest + Supertest |
| Redis | Configured in `.env.example` but **NOT USED** in code |

### 1.2 API Surface — All Endpoints

**Auth** (`/api/auth/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | No | Create account |
| POST | /login | No | Login |
| GET | /verify | Cookie | Verify token |
| GET | /profile | Cookie | Get profile |
| POST | /refresh | Cookie | Refresh tokens |
| POST | /logout | Optional | Logout |
| POST | /forgot-password | No | Request reset |
| POST | /reset-password | No | Reset with token |
| GET | /reset-verify | No | Verify reset token |

**Products** (`/api/products/`)
Public product browsing, admin CRUD, search, variants, bulk upload.

**Categories** (`/api/categories/`)
Hierarchical categories with tree structure.

**Orders** (`/api/orders/`)
Full order lifecycle: create, list, get one (with IDOR protection), status update (admin), tracking (Royal Mail), bulk status, analytics, notifications.

**Subscriptions** (`/api/subscriptions/`)
Full subscription lifecycle: plans (public), user subscriptions, pause/resume/cancel, admin plan management, order processing cron.

**Users** (`/api/users/`)
Profile management, admin user listing.

**Wishlist** (`/api/wishlist/`)
Add/remove/list wishlist items.

**Inventory** (`/api/inventory/`)
Stock tracking, supplier management.

**Admin** (`/api/admin/`, `/api/admin/settings/`)
Dashboard, analytics, system settings.

**Upload** (`/api/upload/`)
File/image upload via multer.

**Webhooks** (`/api/webhooks/`)
Revolut payment webhook with signature verification.

**Amazon** (`/api/amazon/`)
Amazon product integration.

**Etsy** (`/api/etsy/`)
Etsy sync integration.

**Tracking** (`/api/tracking/`)
Shipment tracking.

**Export** (`/api/export/`)
CSV order/item export.

**Sync** (`/api/sync/`)
Multi-channel sync.

**SEO** (`/api/seo/`)
SEO metadata management.

**Search** (`/api/search/`)
Product search with health/popular/filters endpoints.

**Push** (`/api/push/`)
Web push notifications.

### 1.3 Database Architecture

PostgreSQL pool connection (`backend/config/database.js:5-15`), parameterized queries throughout. MySQL-style `?` placeholders auto-converted to PostgreSQL `$N` format at `database.js:54`.

**FINDING [MEDIUM] — Mixed DB helper abstraction**  
`backend/config/database.js:65-107`
The file exports `query` (PostgreSQL pool), `run`, `get`, and `exec` helpers. However `run`, `get`, and `exec` reference an undefined `db` variable (the SQLite reference was never updated after switching to PostgreSQL pool). These helpers are dead code but could cause confusion if imported elsewhere.
```javascript
// Line 66: db is undefined
const runSingle = async (sql, params = []) => {
  if (!db) {  // ← db never defined in this file
    await initializeDb();
  }
  try {
    const result = await db.run(sql, params);  // ← db.run doesn't exist on pg pool
```
**Impact:** Low — currently unused, but if any future code imports these helpers it will fail at runtime.
**Fix:** Remove the dead `run`, `get`, `exec` helpers or reimplement them against the PostgreSQL pool.

---

## PART 2 — SECURITY

### 2.1 What's Working Well

- [x] JWT with explicit `HS256` algorithm on all token operations (`auth.js:121`, `auth.js:128`, `auth.js:310`)
- [x] Algorithm allowlist: `jwt.verify(..., { algorithms: ['HS256'] })` — prevents algorithm confusion attacks
- [x] Refresh tokens stored as one-way SHA-256 hashes in DB (`auth.js:132-133`, `auth.js:204`, `auth.js:338`)
- [x] Refresh token rotation on every use (`auth.js:364-365`)
- [x] httpOnly cookies with `secure: true` in production (`auth.js:49`)
- [x] `sameSite: 'strict'` in production (`auth.js:50`)
- [x] bcrypt password hashing with salt rounds of 12 (`auth.js:104`)
- [x] Auth rate limiting: 5 attempts/15min per IP+email (`auth.js:12-26`)
- [x] Password reset rate limiting: 3/hour per IP+email (`auth.js:28-40`)
- [x] Helmet security headers with CSP (`server.js:17-26`)
- [x] Global rate limiting: 100 req/15min prod, 500 dev (`server.js:76-97`)
- [x] Input validation on all auth and order endpoints via `express-validator`
- [x] IDOR protection on order access: `orders.js:127` verifies order belongs to user
- [x] Admin role checks on all admin endpoints: `requireAdmin` middleware
- [x] Webhook signature verification: `webhooks.js:14` checks Revolut signature
- [x] No hardcoded secrets in route/service files (grep confirmed clean)
- [x] No SQL injection in ORM — all queries use parameterized `?` → `$N` placeholders
- [x] No command injection (grep confirmed clean)
- [x] No eval or shell=True patterns found
- [x] CORS properly restricted to frontend URL in production

### 2.2 Critical Findings

**[CRITICAL] — Auth token stored in wrong location**  
`frontend/pages/order-confirmation.js:30`
```javascript
const token = localStorage.getItem('token');  // ← WRONG
```
The backend stores JWT as an **httpOnly cookie** (`auth.js:136-137`), not in localStorage. This means `order-confirmation.js` will ALWAYS fail to find a token and redirect every confirmed-order user to the login page, even though their order was just successfully placed.

The correct approach is to use the cookie-based auth that all other authenticated pages use via `AuthContext`. The order confirmation page needs to use the `/api/orders/:id` endpoint which reads the auth cookie — NOT a localStorage token.

**Impact:** Every customer who completes checkout gets kicked to login on the confirmation page. Massive UX failure.
**Fix:** Remove the localStorage token lookup entirely. The `orders.js` endpoint already reads `req.cookies.accessToken`. Either pass the orderId in the cookie context, or after a successful `checkout.js` POST to `/api/orders`, the response should include the order details so the redirect URL carries them without needing a separate fetch.

---

**[CRITICAL] — Duplicate route registration**  
`backend/server.js:114-120`
```javascript
app.use('/api/inventory', require('./routes/inventory'));   // line 114
app.use('/api/admin', require('./routes/admin'));           // line 116
app.use('/api/admin/settings', require('./routes/settings')); // line 117
app.use('/api/inventory', require('./routes/inventory'));   // ← DUPLICATE (line 118)
app.use('/api/admin', require('./routes/admin'));           // ← DUPLICATE (line 119)
app.use('/api/admin/settings', require('./routes/settings')); // ← DUPLICATE (line 120)
```
Routes are registered twice. Node.js/Express will handle this without erroring, but the second registration shadows the first, potentially causing route resolution issues in edge cases.

**Impact:** Unpredictable routing, particularly for `/api/admin/*` and `/api/inventory/*` — requests may hit the second registration, bypassing any middleware added between the two registrations.
**Fix:** Remove lines 118-120.

---

**[CRITICAL] — Payment integration is stubbed/incomplete**  
`frontend/pages/checkout.js:53`, `backend/routes/orders.js:65`

The checkout page hardcodes payment methods as `APPLE_PAY`, `GOOGLE_PAY`, `KLARNA`, `CLEARPAY` but the actual payment processing is never invoked. The order is created via `orderService.createOrder()` but there's no call to Stripe, Revolut, or any payment gateway to actually charge the customer. The `revolutService` exists but is only called in the webhook handler, not in the order creation flow.

**Impact:** Orders can be created with a "success" response without any money changing hands. This is a business-critical gap.
**Fix:** Integrate Stripe or Revolut payment intent creation before order confirmation.

---

### 2.3 High Findings

**[HIGH] — Reset token stored in plaintext**  
`backend/routes/auth.js:430-438`
```javascript
const resetToken = crypto.randomBytes(32).toString('hex');  // plaintext token
await query('UPDATE users SET reset_token = ?, reset_token_expires = ? ...',
  [resetToken, resetTokenExpires.toISOString(), user.id]);
```
Unlike refresh tokens (which are SHA-256 hashed before storage at `auth.js:132`), the password reset token is stored as plaintext in the database. If the database is compromised, attackers can use any reset token directly to change passwords.

**Impact:** Password reset tokens are bearer tokens — anyone with the token can reset the password. Storing them plaintext violates the principle of defense in depth.
**Fix:** Hash the reset token before storing: `crypto.createHash('sha256').update(resetToken).digest('hex')`. Verify by hashing the received token before DB lookup.

---

**[HIGH] — Redis configured but never used**  
`.env.example` defines `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` but the codebase has no Redis imports anywhere. The `enhancedCacheService.js` and `cacheService.js` files exist but appear to use in-memory caching or no caching at all based on the absence of `ioredis`/`redis` imports in the actual route handlers.

**Impact:** Environment is misconfigured. In production with multiple server instances, this will cause caching failures or use inconsistent in-memory caches.
**Fix:** Either implement Redis properly or remove the Redis configuration from `.env.example` to avoid confusion.

**[HIGH] — CSP `unsafe-inline` for styles weakens XSS protection**  
`backend/server.js:21`
```javascript
styleSrc: ["'self'", "'unsafe-inline'"],
```
The Content Security Policy allows inline styles, which enables CSS-based XSS attacks. For a modern Next.js/MUI app this is often unavoidable (MUI injects inline styles), but it should be documented and minimized.

**Impact:** Any XSS vulnerability is significantly worse because attackers can use inline style injection.
**Fix:** Consider `styleSrc: ["'self'", "'unsafe-hashes'"]` with a strict hash allowlist for MUI's critical inline styles, or use MUI's CSS-in-JS server-side extraction.

---

**[HIGH] — `order-confirmation.js` redirects to `/account/login` instead of `/auth/login`**  
`frontend/pages/order-confirmation.js:32`
```javascript
router.push('/account/login');  // ← 404, page is at /auth/login
```
The redirect target is wrong — the login page lives at `/auth/login`, not `/account/login`.

**Impact:** After a successful order, unauthenticated users who hit order-confirmation get redirected to a 404 page.
**Fix:** Change to `router.push('/auth/login')`.

---

**[HIGH] — `DATABASE_URL` in `.env.example` points to SQLite filename**  
`backend/.env.example:2`
```
DATABASE_URL=wick_wax_relax.db
```
But `backend/config/database.js:1-15` uses `pg` (PostgreSQL pool) with individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` environment variables. The `DATABASE_URL` variable is never read by the actual code.

**Impact:** Developer confusion. The `.env.example` implies SQLite but the code uses PostgreSQL with individual connection parameters.
**Fix:** Replace `DATABASE_URL` in `.env.example` with the correct PostgreSQL variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

### 2.4 Medium Findings

**[MEDIUM] — No GDPR consent tracking**  
`backend/routes/gdpr.js` exists (GDPR compliance routes: data export, deletion, consent retrieval) but there is no visible consent collection UI or middleware in the frontend registration/checkout flow.

**[MEDIUM] — GDPR data export uses console.error on failure**  
`backend/routes/gdpr.js:293`
```javascript
console.error('GDPR consent retrieval error:', error);
```
Should write to audit log, not stdout console.

**[MEDIUM] — Missing request ID / correlation ID**  
No request ID is generated at entry and propagated through logs. Makes debugging production issues difficult.

**[MEDIUM] — Sentry initialized in backend but no sampling rate**  
`backend/server.js` initializes Sentry but there's no `tracesSampleRate` set, meaning all transactions are captured — this can be expensive at scale.

**[MEDIUM] — Prometheus metrics endpoint not protected**  
`/metrics` is exposed at `server.js:66` with no authentication. Anyone can read server metrics.
**Fix:** Add IP allowlist or basic auth to the `/metrics` endpoint.

**[MEDIUM] — Refresh token stored as a hash but the hash algorithm isn't documented**  
`auth.js:132` uses SHA-256 for refresh token hashing (good), but the algorithm choice should be documented in a security design document. SHA-256 is appropriate here but argon2 or bcrypt would be more future-proof for stored tokens.

**[MEDIUM] — No CAPTCHA on registration or login**  
Despite having rate limiting, there's no CAPTCHA protection against automated bot registration or login attempts.

**[MEDIUM] — `order-confirmation.js` makes a separate API call when order data was already in the checkout response**  
`frontend/pages/checkout.js:109` — The checkout POST to `/api/orders` returns order data but `order-confirmation.js` discards it and makes a second fetch. This is wasteful and introduces a second auth failure point (the bug above).

---

## PART 3 — FRONTEND / CUSTOMER JOURNEY

### 3.1 Customer Journey Map

| Step | Page | Status | Notes |
|------|------|--------|-------|
| 1 | Landing (`/`) | WORKS | Hero, categories, featured products |
| 2 | Shop (`/products`) | WORKS | Product grid, search |
| 3 | Product detail (`/product/[id]`) | WORKS | Variants, add to cart |
| 4 | Cart (localStorage) | WORKS | Offline-aware cart context |
| 5 | Checkout (`/checkout`) | WORKS | Protected, form validation |
| 6 | Order POST | BLOCKER | No actual payment processing |
| 7 | Order confirmation | **BROKEN** | Token bug + wrong redirect URL |
| 8 | Login (`/auth/login`) | WORKS | Good UX, gradient split layout |
| 9 | Register (`/auth/signup`) | WORKS | But calls wrong endpoint |
| 10 | Account orders (`/account/orders`) | WORKS | Order history, export, search |
| 11 | Subscriptions (`/subscriptions`) | WORKS | Tabs, product selector, FAQ |
| 12 | Admin dashboard | EXISTS | Full admin panel |

### 3.2 Critical Frontend Issues

**[CRITICAL] — Auth token location mismatch**  
See Security section. `order-confirmation.js` reads `localStorage.getItem('token')` but the backend sets httpOnly cookies. This is the single most impactful bug in the application.

**[CRITICAL] — Checkout creates orders without payment**  
See Security section. The checkout flow creates an order record but never actually processes payment.

**[CRITICAL] — Wrong login redirect URL**  
`frontend/pages/order-confirmation.js:32` redirects to `/account/login` but the page is at `/auth/login`.

---

**[HIGH] — Signup calls `/api/auth/register` but the response isn't used to auto-login**  
`frontend/pages/auth/signup.js:82-89`
```javascript
const response = await axios.post('/api/auth/register', submitData);
setMessage('Account created successfully! You can now sign in.');
// Then manually redirects to login page after 2 seconds
```
The backend returns a user object in the register response (`auth.js:139-146`) but the frontend discards it and requires the user to log in again manually. This adds unnecessary friction to the registration flow.
**Fix:** After successful registration, call `login()` from `AuthContext` automatically and redirect to account instead of to the login page.

---

### 3.3 Working Well (Frontend)

- [x] Next.js pages router with proper `_app.js` and `_document.js`
- [x] Material-UI theming with custom lavender/gold/sage palette correctly applied
- [x] SEOHead component with comprehensive meta, OG, Twitter Card, JSON-LD
- [x] CartContext with full offline/online sync and localStorage persistence
- [x] AuthContext with proper cookie-based JWT verification on load
- [x] ProtectedRoute HOC guarding authenticated pages
- [x] PWA support with service worker, manifest, install prompt
- [x] OrderHistoryContext with pagination, search, filters, bulk actions
- [x] SubscriptionManager with full lifecycle management
- [x] Framer Motion animations on login page
- [x] Comprehensive form validation on all auth forms
- [x] Loading states, error states, empty states throughout
- [x] Keyboard navigation on orders page
- [x] CSV export for orders and order items
- [x] Accessibility: ARIA labels on login form inputs
- [x] `format-detection telephone=no` set in SEOHead
- [x] Mobile-responsive layout with breakpoints
- [x] Password visibility toggle on login page
- [x] Remember me checkbox (implemented but not wired to backend)
- [x] Duplicate Navigation components cleaned up (previously identified and fixed)

---

### 3.4 Medium Findings

**[MEDIUM] — `signup.js` password validation is weaker than backend**  
`frontend/pages/auth/signup.js:54-58`: Minimum 6 characters client-side.  
`backend/routes/auth.js:77-79`: Minimum 8 chars with uppercase, lowercase, number, special character.  
The mismatch means users can fill the signup form and submit, passing client validation, only to be rejected by the backend with a confusing error.

**[MEDIUM] — `rememberMe` checkbox has no effect**  
`frontend/pages/auth/login.js:38,308-318` — The `rememberMe` field is captured in form state but never sent to the API (`login.js:50` only sends `email` and `password`).

**[MEDIUM] — Cart total doesn't include shipping**  
`CartContext.js:117-119` calculates `price * quantity` sum but there's no shipping cost calculation anywhere in the cart or checkout flow.

**[MEDIUM] — No discount/coupon code support**  
Checkout has no coupon code field. No `discount_codes` table or route exists in the backend.

**[MEDIUM] — `seasonalPromo.js` uses synchronous localStorage writes**  
`frontend/components/SeasonalPromo.js:9-12` writes to localStorage synchronously on render which can cause layout shifts on hydration mismatch in SSR.

**[MEDIUM] — `DangerouslySetInnerHTML` in three locations**  
`frontend/components/SEOHead.js:160` — JSON-LD structured data (safe, intentional).  
`frontend/components/PerformanceOptimizer.js:98` — dynamic content injection.  
`frontend/pages/_document.js:80` — Emotion CSS extraction (safe, MUI pattern).  
**Note:** The SEOHead and _document uses are safe and standard MUI/Next.js patterns. The PerformanceOptimizer use should be audited.

---

## PART 4 — SEO

### 4.1 Technical SEO Status

| Element | Status | Location |
|---------|--------|---------|
| `<title>` tags | PASS | Per-page, unique |
| Meta descriptions | PASS | SEOHead, all pages |
| Canonical URLs | PASS | SEOHead:111 |
| H1/H2 hierarchy | REVIEW | Per-page audit needed |
| Image alt text | REVIEW | Not globally audited |
| JSON-LD structured data | PARTIAL | Only Organization schema; missing Product, FAQPage, BreadcrumbList |
| OG tags | PASS | Full Open Graph on all pages |
| Twitter Card | PASS | summary_large_image |
| Sitemap | PARTIAL | 6 URLs hardcoded; missing dynamic product/category pages |
| robots.txt | PASS | Allow all except `/api/` |
| hreflang | MISSING | No multi-language support configured |
| Schema.org Product markup | MISSING | Products don't have structured data |
| FAQPage schema | MISSING | Subscriptions FAQ section has no JSON-LD |
| BreadcrumbList schema | MISSING | Product and category pages lack breadcrumb structured data |

### 4.2 SEO Findings

**[HIGH] — No Product structured data on product pages**  
`SEOHead.js` generates Organization schema for all pages. Product pages (`/product/[id]`) should include `Product` JSON-LD with price, availability, rating, and brand. The `product` prop exists in `SEOHead` but is not passed from `product/[id].js`.

**[HIGH] — Sitemap only has 6 hardcoded URLs**  
`frontend/public/sitemap.xml` — Static entries only. Every product and category page needs its own entry for Google to discover them. Should use `next-sitemap` to auto-generate from the product database.

**[HIGH] — Subscriptions FAQ section has no FAQPage JSON-LD**  
`frontend/pages/subscriptions.js:309-342` — A 20-question FAQ section with no structured data means Google can't display these as rich snippets.

**[MEDIUM] — `theme-color` set correctly but `apple-mobile-web-app-status-bar-style` set to `default`**  
`SEOHead.js:180` — Should be `black-translucent` for a dark-themed PWA to fully embrace the lavender theme in the status bar.

**[MEDIUM] — No `next/image` optimization audit**  
Not confirmed whether all product images use Next.js `<Image>` component vs raw `<img>` tags. Raw `<img>` tags bypass Next.js image optimization pipeline, causing larger payloads and no WebP/AVIF conversion.

**[MEDIUM] — No `loading="lazy"` audit**  
Not confirmed whether below-fold images use `loading="lazy"`.

**[MEDIUM] — No `width`/`height` on images**  
Not confirmed whether images have explicit dimensions to prevent Cumulative Layout Shift (CLS).

**[MEDIUM] — Lighthouse report is a 404**  
The `lighthouse-report.json` shows `requestedUrl: "http://localhost:3001/"` — the audit was run against the backend server (port 3001) instead of the frontend (port 3000), resulting in zero metrics collected. All Lighthouse scores are `null` with `errorMessage: "Status code: 404"`.

---

## PART 5 — PERFORMANCE

### 5.1 Known Performance Characteristics

- Next.js SSR with pages router (not app router)
- Material-UI with Emotion CSS-in-JS
- `sharp` for server-side image optimization
- `sharp` for thumbnail generation
- Static file serving via Express for `/images`, `/uploads`, `/fonts`
- Prometheus metrics endpoint with `collectDefaultMetrics`
- Sentry APM tracing initialized

### 5.2 Performance Findings

**[HIGH] — Lighthouse never successfully ran**  
All Core Web Vitals are unknown because the Lighthouse audit was executed against port 3001 (backend) instead of port 3000 (frontend). The audit must be re-run against `http://localhost:3000`.

**[MEDIUM] — Google Fonts loaded blocking in `_document.js`**  
`frontend/pages/_document.js:17`
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/...Roboto..."/>
```
This is a render-blocking font request. Should be `preconnect` + `display=swap`.

**[MEDIUM] — No bundle size analysis**  
No data on JS bundle sizes per page. The presence of heavy dependencies (Framer Motion, MUI, multiple admin pages) suggests code splitting is critical.

**[MEDIUM] — Static files served by Express instead of CDN**  
`server.js:101-103` — Images and fonts served from the Express server's filesystem. In production these should be on a CDN (CloudFront, Cloudflare R2, etc.) with cache headers.

---

## PART 6 — DEPLOYMENT READINESS

### 6.1 Deployment Blockers

| # | Blocker | Severity |
|---|---------|----------|
| 1 | No actual payment processing (order creation is free) | CRITICAL |
| 2 | Order confirmation auth broken (all users redirected to login) | CRITICAL |
| 3 | Database configuration mismatch in `.env.example` | HIGH |
| 4 | Duplicate route registration in `server.js` | HIGH |
| 5 | Redis configured but unused | HIGH |
| 6 | No Lighthouse scores — unknown Core Web Vitals | HIGH |
| 7 | Sitemap missing dynamic product/category pages | HIGH |

### 6.2 What's Deployment-Ready

- [x] Docker Compose configuration exists
- [x] Jest test suite exists (auth, products, validation, performance, security tests)
- [x] Environment variables documented in `.env.example`
- [x] `npm run build` passes cleanly
- [x] Prometheus metrics for observability
- [x] Winston structured logging
- [x] Sentry error tracking
- [x] Health check endpoint: `GET /api/health`
- [x] JWT tokens with configurable expiry
- [x] Admin panel with full management capabilities

---

## FINDINGS SUMMARY

### Critical (Must Fix Before Launch)

1. **Auth token mismatch** — `order-confirmation.js` reads wrong storage location
2. **Duplicate route registration** — `server.js:118-120` shadows first registrations
3. **No payment processing** — Orders created without any payment being captured

### High (Fix Before Production)

4. **Password reset tokens stored in plaintext** — No hashing unlike refresh tokens
5. **Wrong login redirect URL** — `/account/login` vs `/auth/login`
6. **Signup form doesn't auto-login** — Unnecessary friction
7. **Signup password validation weaker than backend** — 6 chars vs 8+complexity
8. **CSP `unsafe-inline` for styles** — Weakens XSS defence
9. **Redis configured but unused** — Misleading environment
10. **DATABASE_URL points to SQLite** — Wrong in `.env.example`
11. **`/metrics` endpoint unprotected** — Exposes server internals
12. **No Product JSON-LD structured data** — SEO gap
13. **Sitemap missing all dynamic pages** — Google can't discover products
14. **Lighthouse audit was run on wrong port** — No performance data

### Medium (Fix in First Post-Launch Sprint)

15. Mixed SQLite/PostgreSQL helper abstraction in `database.js`
16. GDPR consent collection UI missing
17. GDPR audit logging uses `console.error` instead of structured logger
18. No CAPTCHA on auth forms
19. `rememberMe` implemented but not wired to backend
20. Cart total has no shipping calculation
21. No discount/coupon code support
22. Apple status bar style should be `black-translucent`
23. `seasonalPromo.js` synchronous localStorage on render
24. Fonts loaded blocking, not `preconnect`+`display=swap`
25. No CDN configuration for static assets
26. No `tracesSampleRate` set in Sentry

---

## RECOMMENDED ACTION PLAN

### Before First Deployment (Must Fix)

- [ ] Fix `order-confirmation.js` auth — use cookie-based auth properly
- [ ] Fix `server.js` duplicate route registrations (lines 118-120)
- [ ] Remove `/api/inventory`, `/api/admin`, `/api/admin/settings` duplicate registrations
- [ ] Integrate Stripe or Revolut payment intent into checkout flow
- [ ] Fix `order-confirmation.js` redirect URL: `/auth/login`
- [ ] Fix `.env.example` DATABASE_URL → DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
- [ ] Hash password reset tokens before storing (like refresh tokens)
- [ ] Protect `/metrics` endpoint or disable it
- [ ] Add `next-sitemap` to auto-generate sitemap from product DB
- [ ] Re-run Lighthouse against port 3000 and collect real Core Web Vitals

### First Post-Launch Sprint

- [ ] Auto-login after signup (call `AuthContext.login()` with new credentials)
- [ ] Align signup password validation: minimum 8 chars, uppercase, lowercase, number, special char
- [ ] Implement Redis or remove Redis config from `.env.example`
- [ ] Add Product JSON-LD to product detail pages
- [ ] Add FAQPage JSON-LD to subscriptions page
- [ ] Add BreadcrumbList JSON-LD to product/category pages
- [ ] Fix `apple-mobile-web-app-status-bar-style` to `black-translucent`
- [ ] Audit all images for explicit width/height (CLS prevention)
- [ ] Audit all images for `next/image` usage
- [ ] Remove dead SQLite helpers from `database.js`
- [ ] Add CAPTCHA to registration endpoint

### Medium-Term

- [ ] Implement discount/coupon codes
- [ ] Add shipping cost calculation to cart
- [ ] Set up CDN for static assets (images, fonts)
- [ ] Configure `tracesSampleRate` in Sentry
- [ ] Implement GDPR consent collection UI on checkout/registration
- [ ] Set up preconnect for Google Fonts with `display=swap`
- [ ] Run full bundle analysis and implement per-page code splitting
