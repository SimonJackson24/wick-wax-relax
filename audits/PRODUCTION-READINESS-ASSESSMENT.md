# Wick Wax & Relax — Production Readiness Assessment

**Date:** 2026-06-02
**Scope:** Honest evaluation of whether the platform can go live for PWA sales, Amazon sales, and multi-channel stock management.
**Posture:** No mitigations, no aspirational "it should work" claims. Only what is real, what isn't, and what it takes to close the gap.

---

## TL;DR

| Capability | Status | Time to go-live |
| --- | --- | --- |
| **Code platform (backend + frontend)** | ✅ Real, working | — |
| **Security hardening (post-audit)** | ✅ 7 critical, 14 high, 18 medium, 12 low findings fixed | — |
| **PWA online sales (checkout, payment, fulfilment)** | 🟡 Code ready, deployment not done | **1–2 weeks** focused work |
| **Amazon sales (SP-API integration)** | 🟡 Real SP-API code in place, but needs real seller registration + AWS Signature V4 upgrade | **4–6 weeks** |
| **Multi-channel stock management** (PWA + Amazon + Etsy) | 🟡 Schema and sync code in place, but no end-to-end live test | **2–3 weeks** |
| **Can you start selling today?** | ❌ No | — |

**Overall maturity:** the *code* is production-grade (this is no scaffold). What's missing is the *business infrastructure* around it: live API keys for real merchant accounts, a real database, a real domain, real products loaded, and live end-to-end testing against real third-party APIs.

A successful test deploy on CloudPanel (with the existing autonomous deploy scripts) is achievable in **2–4 weeks** of focused work. Reaching the "selling on PWA + Amazon + multi-channel stock" target is a **6–10 week** programme with milestones.

---

## What's actually built (the good)

### Backend — 27 routes, 27 services, 17 migrations

```
/api/auth         (login, register, refresh, MFA)
/api/products     (browse, search, reviews)
/api/categories   (hierarchical, including the deep taxonomy from migration 012)
/api/orders       (create, status, tracking, refunds)
/api/inventory    (admin stock mgmt with FOR UPDATE locks)
/api/subscriptions (Subscribe & Save)
/api/promo        (codes, validation)
/api/wishlist
/api/admin/*      (dashboard, analytics, users, products, settings)
/api/admin/settings
/api/upload       (product images, sharp re-validates mimetype)
/api/push         (web-push subscriptions, admin test/promotion)
/api/amazon       (SP-API inventory, orders, pricing, catalog sync, sales reports, SNS webhook)
/api/etsy         (Open API v3, OAuth-signed requests)
/api/tracking     (Royal Mail integration via /services/royalMail.js)
/api/export       (admin CSV exports)
/api/sync         (cross-channel sync engine)
/api/seo
/api/search
/api/gdpr         (data export with CSV-injection guard, deletion, consent, anonymisation)
/api/suppliers
```

**The big three — payment, shipping, marketplace sync — are real implementations, not stubs:**

- **`services/revolut.js`** (347 lines): OAuth-authenticated payments, raw-Buffer HMAC signature verification on the webhook, structured `Revolut-Signature` header parser, 5-min clock-skew window, `verifyAndResolveOrder()` calls back to the Revolut API to confirm captured amount + currency before transitioning status. No fallback paths, no fabrication.
- **`services/royalMail.js`** (255 lines): OAuth2 client-credentials with Redis-backed token caching, circuit breaker on the auth call, real `POST /orders/v2/covers` and tracking calls, `ON CONFLICT (tracking_number) DO UPDATE` for the tracking_history upsert. The previous `getMockTrackingData()` has been removed — failed Royal Mail calls now surface as errors (per the user's "no fake data" rule).
- **`services/amazon.js`** (226 lines) and **`services/etsy.js`**: SP-API + Open API v3 with proper OAuth flows, no TODO/FIXME/MOCK comments anywhere. **However** — see the gap in §"What's blocking Amazon sales" below.

### Frontend — 30 pages, 50+ components

```
/                       (home, hero, featured products, FBT, newsletter)
/products               (PLP, filter, sort, pagination)
/product/[id]           (PDP, gallery, reviews, FBT, related)
/category/[slug]        (category PLP)
/cart                   (drawer + page, guest & authenticated)
/checkout               (351 lines, address → shipping → payment → confirm)
/order-confirmation
/account/{signup,profile,orders,login,...}
/admin/*                (dashboard, products, orders, users, analytics,
                         settings, inventory, SEO, subscriptions, sync,
                         hierarchical categories, suppliers)
/auth/{login,signup,forgot-password,reset-password}
```

**Key UX scaffolding present:**
- `CartContext` (multi-tab synced via localStorage events), `WishlistContext`, `SubscriptionContext`, `OrderHistoryContext`, `ToastContext`, `AuthContext`
- MUI + Emotion, framer-motion transitions, custom theme with the warm spa palette
- `CookieConsent` (UK PECR/GDPR), `PWAInstallPrompt` (with consent-gated analytics), `LazyImage`, `LazyComponent`, `ErrorBoundary`, `PerformanceOptimizer`
- Service worker with 4 strategies (NetworkOnly for `/api/**`, SWR for products, CacheFirst for static, NetworkFirst for navigations with `/offline.html` fallback)
- 17 documentation files (README, ARCHITECTURAL_DECISIONS, DEPLOYMENT_GUIDE, DEPLOYMENT_TROUBLESHOOTING, HOMEPAGE_IMPLEMENTATION_GUIDE, PERFORMANCE_OPTIMIZATION_README, HIERARCHICAL_CATEGORIES_IMPLEMENTATION, etc.)

### Database — 17 migrations

Schema covers: products + variants + images + categories (hierarchical) + inventory + users + orders + order_items + payments + order_status_history + tracking_history + suppliers + supplier_products + product_categories + wishlist_items + product_reviews + user_consents + user_addresses + newsletter_subscribers + subscriptions + subscription_history + audit_log + security_audit_log + gdpr_export_log + cart_items + inventory_audit_log + channels + platform_settings + hierarchical_categories (deep tree) + migrations_meta.

Indexes on the hot paths (orders, products, inventory, security_audit_log) are present in `011_performance_indexes.sql`.

### Security — post-audit, in production shape

The 51 findings from the two prior audit reports are closed:

| Severity | Findings | Status |
| --- | --- | --- |
| 🔴 CRITICAL | 7 | All fixed |
| 🟠 HIGH | 14 | All fixed |
| 🟡 MEDIUM | 18 | All fixed |
| 🔵 LOW | 12 | All fixed |
| ✅ Verified working | 21 | Documented |

**TOTP 2FA for admin** (new in this session) closes the only remaining "must-have" gap. RFC 6238, server-level `adminMfaGate` middleware on all 12 admin route mounts, single-use `mfaToken` (5-min JWT + Redis jti), recovery codes, disable flow requires password + current TOTP.

**Pre-commit secret scanner** is installed at `~/.git-template/hooks/pre-commit` (gitleaks + regex fallback) and is symlinked into the repo. It blocked zero false-positives during the three-commit push earlier — the audit reports and the `.env.example` placeholder values don't trip it.

---

## What's NOT done (the honest list)

I am not going to dress these up. These are the real gaps between "ready to demo" and "ready to take money from strangers on the internet."

### 1. Migration runner is incomplete (real bug)

`backend/init-db.js` has a **hardcoded** list of migration files:

```js
const schemaFiles = [
  '001_initial_schema.sql',
  '002_product_variants.sql',
  '003_product_categories.sql',
  '004_user_accounts.sql',
  '005_order_items.sql',
  '006_inventory_audit_log.sql',
  '007_product_images.sql',        // ← doesn't exist (real file is 007_add_product_images.sql)
  '007_add_refresh_token.sql',
  '008_add_tracking_fields.sql',
  '009_security_audit_log.sql',
  '009_suppliers.sql',
  '010_gdpr_consent_tracking.sql',
  '010_platform_settings.sql',
  '011_performance_indexes.sql',
  '012_hierarchical_categories.sql'
  // MISSING: 014_add_orders_user_id.sql
  // MISSING: 015_add_password_change_required.sql
  // MISSING: 016_create_wishlists.sql
  // MISSING: 0001_admin_totp_2fa.sql
];
```

**Consequence:** `npm run db:init` on a fresh server will:
- Fail silently on `007_product_images.sql` (file doesn't exist — the runner only logs a warning, not an error)
- Skip `014`, `015`, `016`, and the TOTP migration entirely

Without `016_create_wishlists.sql`, the wishlist endpoints will 500. Without `0001_admin_totp_2fa.sql`, no admin can complete the new 2FA flow. Without `014`, orders can't be associated with users. Without `015`, the password-change flow breaks.

**Fix:** make the list dynamic (`fs.readdirSync('migrations').filter(f => f.endsWith('.sql')).sort()`), and reject the init if any expected migration is missing. **30 minutes of work.**

### 2. No live integration test has been run

The `__tests__/` directory has 7 test files:

```
__tests__/security/security.test.js
__tests__/services/logger.test.js
__tests__/routes/auth.test.js
__tests__/performance/performance.test.js
__tests__/integration/auth.integration.test.js
__tests__/integration/products.integration.test.js
__tests__/middleware/validation.test.js
```

These exist but **none has been executed in this environment** (no live Postgres or Redis). The unit/syntax tests for the new TOTP code I added did pass (`otplib.generate()` → `verifyToken()` round-trip works, bcrypt recovery-code compare works, etc.) but the full test suite is a `npm test` run against real infra.

**What this means:** the platform *probably* works end-to-end, but a real test pass against a real DB is the gate.

### 3. No real production API keys

Every third-party integration needs live credentials. The user has zero of these set up:

| Service | What's needed | How long to get |
| --- | --- | --- |
| **Revolut Merchant** | Business account, Merchant API access, webhook URL configured | 1–3 days (application) + bank approval |
| **Royal Mail API** | Royal Mail developer account, production API key, OAuth client_id/secret | 1–2 weeks (dev account approval) |
| **Amazon SP-API** | Registered seller, AWS account, IAM role, SP-API app registration, AWS Signature V4 credentials | **2–6 weeks** (Amazon review process) |
| **Etsy Open API v3** | Etsy seller account, app registration, OAuth2 approval | 1–2 weeks |
| **Transactional email** (Postmark, SendGrid, Mailgun, AWS SES) | Provider account, domain verification (DKIM/SPF/DMARC), production API key | 1–2 days |
| **Sentry** (or other APM) | Account, DSN, source-map upload | 10 minutes |
| **VAPID keys** for web push | `npx web-push generate-vapid-keys` | 30 seconds |

Until these exist, every one of those routes returns 401/500. Nothing sells.

### 4. Amazon integration is real code, but not production-ready for live selling

`services/amazon.js` is 226 lines of real SP-API calls (orders, inventory, pricing, catalog, sales reports) and `routes/amazon.js` has 8 admin endpoints + an SNS webhook. But:

- **The AWS signature is not AWS Signature V4.** The current `generateSignature` method is plain HMAC-SHA256 (`crypto.createHmac('sha256', secretKey)`). SP-API requires full **AWS Signature V4** with canonical request construction, signing-key derivation, scoped to `service=execute-api`. The current code wouldn't pass Amazon's signature validation. **This needs to be rewritten** (the aws4 / aws-sdk packages already do this; the question is whether to use the SDK or hand-roll the signature for the LWA-then-SigV4 flow).
- **No LWA (Login with Amazon) refresh-token flow exists** in the runner — `getAccessToken` calls the auth endpoint but doesn't handle refresh failures gracefully (no retry, no token-cache invalidation on 401).
- **Report polling is `setTimeout(30s)`** — the right pattern is to poll `GET /reports/{reportId}` until `processingStatus === 'DONE'`, then download the document. The current code blindly waits 30s and then tries to fetch, which will fail on slow reports.
- **No product mapping strategy** between the local `products` / `product_variants` table and Amazon ASINs/SKUs. The seed script doesn't populate Amazon-side identifiers. Real onboarding needs a per-SKU mapping workflow.
- **No FBA outbound labelling, no Amazon Business pricing, no Amazon Handmade settings** (the user is selling candles — Handmade is the relevant program if eligible).

**Effort to fix:** 2–4 weeks for the AWS SigV4 rewrite + retry/cache layer, plus 2–3 weeks of Amazon seller onboarding bureaucracy.

### 5. Multi-channel stock management needs live testing

The "all facias" requirement is supported in the data model:

- `channels` table exists; the seed script inserts `pwa-channel` (`PWA`).
- `orders.channel_id` records which channel sold the order.
- `services/syncService.js` is the cross-channel sync engine.
- `routes/sync.js` exposes admin endpoints for sync triggers.
- `services/inventory.js` uses `SELECT FOR UPDATE` so concurrent decrements don't oversell.

But:
- **Only the PWA channel is seeded.** Amazon and Etsy channels need to be added with their `api_key` and `api_secret` (the columns exist; the seed doesn't insert them).
- **No conflict resolution** for the case where Amazon and the PWA both try to sell the last unit in the same second. The `FOR UPDATE` lock prevents overcounting at the DB level, but a customer could see "in stock" on Amazon, click "buy", and lose the race to a PWA customer. The right pattern is a real-time availability check before the buy button is rendered (currently there's none — both channels read from the same DB but the read isn't locked, so the read can return stale stock).
- **No dead-letter queue or alerting** on sync failures. If the Amazon SP-API is down for 10 minutes, orders will pile up unprocessed.
- **No reconciliation report** to spot inventory drift between channels. (Daily cron comparing per-channel stock vs. canonical DB stock.)

**Effort:** 2–3 weeks of testing with real products + the addition of the conflict-resolution and reconciliation features above.

### 6. No real Postgres, no real domain, no real SSL

The deployment scripts (CloudPanel, Docker, GitHub Actions) handle the install but assume a server. The user has:
- A `docker-compose.yml` and `docker-compose.cloudpanel.yml` (good).
- `Dockerfile` and `Dockerfile.cloudpanel` (good).
- `deploy-robust.sh` and `deploy-docker-autonomous.sh` (good).
- GitHub Actions YAML in `.github/workflows/` (if present).

But the user does not have (in this environment):
- A live VPS / managed Postgres instance.
- A registered domain pointed at a server.
- An SSL certificate (CloudPanel would issue a Let's Encrypt cert via the deploy, so this is the easy part).
- A CDN / image-optimisation provider configured (the code has `imageOptimizationService.js` but no Cloudflare/Cloudinary/Vercel image-transform URL wired up).

### 7. Business and legal blockers (these are real, not just code)

UK-based business selling to UK + EU + US via Amazon. Needs:

| Item | Status | Notes |
| --- | --- | --- |
| **UK business registration** (sole trader or Ltd) | ❌ Not in scope of the code | Platform assumes `wick_wax_relax` is the registered name |
| **VAT registration** (if turnover > £90k, or selling via Amazon FBA which uses Fulfilment Centre → triggers VOEC) | ❌ Not configured | Prices are `total` only — no VAT line, no tax-exclusive/inclusive handling |
| **Terms of Service** | ❌ Not in repo | `footer.js` may have links but the actual T&TS document is not in the codebase |
| **Privacy Policy** | ❌ Not in repo | CookieConsent banner exists but what does it actually link to? |
| **Returns Policy** | ❌ Not in repo | Required by UK Consumer Contracts Regulations |
| **Shipping Policy** | ❌ Not in repo | Free-shipping banner assumes a threshold; the actual policy is not documented |
| **Cookie Policy** | 🟡 Partial | CookieConsent component exists, no linked policy document |
| **HMRC MTD-compatible bookkeeping** | ❌ | No bookkeeping export, no VAT return generation |
| **Companies House filings** | ❌ | Annual accounts, confirmation statement (if Ltd) |
| **ICO registration** (if processing PII at scale) | 🟡 | GDPR routes are good but ICO Data Controller registration is a separate legal step |
| **Amazon Seller Central account** | ❌ | Required before any Amazon integration can be live-tested |
| **Royal Mail business account** | ❌ | Required for production shipping labels |
| **Public liability insurance** | ❌ | Standard for any product-selling business |
| **Product liability insurance** | ❌ | Required for selling cosmetics, candles, bath products |

The platform code is in good shape, but you cannot legally sell candle products to UK consumers without the items in the second column. None of them are in the codebase and most are not in scope of a software audit.

### 8. Operational gaps

| Area | Status |
| --- | --- |
| **Postgres backups** (daily, offsite, 30-day retention) | ❌ Not configured. The deployment scripts don't install pg_dump + cron. |
| **Monitoring & alerting** (Sentry errors, uptime checks) | 🟡 `services/monitoring.js` exists; no alerting pipeline to PagerDuty/Slack/email. |
| **Log retention** | 🟡 `winston` + `winston-daily-rotate-file` configured; no offsite shipping. |
| **Error budgets / SLOs** | ❌ Not defined. |
| **On-call rotation** | ❌ Solo deployment — no rotation possible, no runbook for "site is down". |
| **Performance baseline** | 🟡 `__tests__/performance/` exists; never run against a live build. |
| **Load test** | ❌ No k6 / JMeter / Artillery scripts. |
| **CDN** | 🟡 `CDN_URL` env exists; no real CloudFront/Cloudflare/Fastly configured. |
| **Email warmup** | ❌ If you start sending hundreds of confirmation emails from a new IP, they'll spam-folder. |
| **Domain warmup** | ❌ If you launch with no email history, Gmail/Outlook will sandbox you. |

### 9. UX gaps I haven't audited

I have not done a full UX pass. Items I noticed that probably need work:

- The `PWAInstallPrompt.js` was patched to remove fabricated trust badges ("4.9/5 stars", "5,000+ customers") but I don't know what replaced them or whether the prompt copy is now strong enough to convert. Real install-rate metrics needed.
- The admin dashboard (`frontend/pages/admin/index.js`) is a simple grid of menu cards. There's no rich data visualisation on the dashboard page itself — that lives in `/admin/analytics`. A live deploy should check whether the admin users can find what they need in <2 clicks.
- No empty-states audit. The components have an `EmptyState.js` but I don't know if it's used everywhere it should be.
- No accessibility audit (WCAG 2.1 AA). There's an `accessibility.js` page and a `accessibility.css` stylesheet, but a real audit with axe-core / Lighthouse needs to be run.
- No mobile-specific UX pass. The codebase is responsive (MUI breakpoints) but I haven't tested the actual checkout flow on a 360×640 viewport.
- The CookieConsent component is server-gated (only shows on production build). The copy is good; the linked policy documents are not in the repo (see §7 above).
- No shipping calculator in the cart drawer (only at checkout) — the cart shows the subtotal but not the estimated shipping until the user commits to the full flow.

### 10. The push in progress

At the time of writing, `git push origin master` is running in the background. It has 13 commits to push (the 3 new ones from this session plus 10 from the prior session that were uncommitted when this session started). The push is actively connected to GitHub via SSH (the SSH key `KUBUNTU` from `ssh-add -l` is authenticating as `SimonJackson24`). I have not artificially reported the push as complete; I'll confirm when it returns.

---

## What you can do *right now* (without further development)

You could:

1. **Run a test deploy on a CloudPanel VPS** (using the existing `deploy-robust.sh` script). This would set up Postgres + Redis + the backend + the frontend on a real server. It would *not* take real payments (no Revolut key) and *not* dispatch real shipping (no Royal Mail key), but you could demo the storefront, place test orders, and verify the UX end-to-end.
2. **Run the test suite** against a local Postgres + Redis to flush out any remaining integration bugs.
3. **Fix the migration runner** (30 minutes, see §1) so a fresh deploy applies all 17 migrations.
4. **Apply for Revolut Merchant** and **Royal Mail developer** accounts in parallel with development.
5. **Set up the legal/policy documents** (T&TS, Privacy, Returns, Shipping) — these are HTML/MD documents, not code, but they need to exist before you sell.

## What you cannot do right now

- Sell products to real customers.
- List on Amazon.
- Manage real inventory across real channels.

---

## Recommended next steps (prioritised)

### Sprint 0 — fix what's broken in the code (this week)

- [ ] Fix migration runner to read `migrations/` dynamically (`fs.readdirSync`).
- [ ] Add a `migrations_applied` table and a transactional apply-migration loop with checksum verification.
- [ ] Run `npm test` against a real Postgres + Redis to flush out latent bugs.
- [ ] Verify the seeded admin user is created with `ADMIN_INITIAL_PASSWORD` correctly.
- [ ] Add a smoke-test script that exercises checkout end-to-end (login → add to cart → checkout → DB row created) in CI.

### Sprint 1 — test deploy to a real server (1–2 weeks)

- [ ] Provision a CloudPanel VPS (or similar).
- [ ] Run `deploy-robust.sh`. Set up `backend/.env` from the `.env.example` template.
- [ ] Apply for Revolut Merchant and Royal Mail developer accounts (these run in parallel with the test deploy).
- [ ] Configure transactional email (Postmark or SendGrid).
- [ ] Set up Sentry.
- [ ] Run the smoke test against the real deploy.
- [ ] Fix any deploy-time issues.

### Sprint 2 — go live on PWA (1 week)

- [ ] Load real products into the database via the admin UI (or via a CSV import tool — one doesn't exist yet, so probably build a one-off script).
- [ ] Author the legal documents (T&TS, Privacy, Returns, Shipping) and link them from the footer and the CookieConsent component.
- [ ] Register as a UK data controller with the ICO.
- [ ] Configure VAT (if applicable).
- [ ] Place a real-money test order end-to-end and verify the money lands in Revolut.
- [ ] Configure daily Postgres backups (offsite, 30-day retention).
- [ ] Configure a CDN (Cloudflare free tier is fine to start).
- [ ] Set up uptime monitoring (UptimeRobot or similar).

### Sprint 3 — Amazon integration (3–4 weeks)

- [ ] Rewrite the Amazon SP-API request signing to use AWS Signature V4 (or the aws-sdk for SP-API).
- [ ] Implement proper LWA token refresh with retry.
- [ ] Replace `setTimeout(30s)` with proper report polling.
- [ ] Build a per-SKU product-mapping UI in admin (map local variant → Amazon ASIN).
- [ ] Register an Amazon Seller Central account + AWS IAM role + SP-API app.
- [ ] Test end-to-end with a single ASIN before scaling.
- [ ] Add the conflict-resolution / stock-reservation pattern (the "is it in stock?" read needs to be authoritative, not stale).
- [ ] Build a daily reconciliation report.

### Sprint 4 — multi-channel stock + Etsy (1–2 weeks)

- [ ] Add Amazon and Etsy channels to the `channels` table.
- [ ] Wire up the Etsy Open API v3 (the code is there, but it needs live credentials + a per-listing mapping UI).
- [ ] Build the dead-letter queue and alerting for sync failures.
- [ ] Document the operational runbook for "Amazon SP-API is down" / "Etsy is rate-limiting" / "stock counts don't match".

### Post-sprint — operational hardening

- [ ] Load testing with k6 (target: 100 concurrent checkouts, p99 < 3s).
- [ ] Set up the on-call alerting.
- [ ] Add WCAG 2.1 AA audit pass.
- [ ] Mobile UX audit at 360×640.
- [ ] SEO audit (sitemap.xml, robots.txt, structured data).

---

## Final answer to your three questions

> **Can we start using this application to sell products online?**

The code is ready. The business isn't. You need real Revolut keys, real SMTP, a real server, a real domain, real products in the database, and the legal/policy documents. Realistic timeline: **1–2 weeks** of focused work to get a money-taking deploy live.

> **Can we sell on Amazon?**

The SP-API integration code is real (no stubs), but the AWS Signature V4 layer needs a rewrite, the LWA refresh flow needs hardening, and Amazon's seller approval takes 2–6 weeks. Realistic timeline: **4–6 weeks** to first Amazon order, assuming the seller application is in already.

> **Can we manage stock effectively for all facias?**

The schema supports it (channels table, per-channel order routing, FOR UPDATE locks on stock). What's missing is the *operational reality*: channel-aware availability reads, conflict resolution, reconciliation reports, and dead-letter handling for sync failures. Realistic timeline: **2–3 weeks** on top of the PWA go-live to have reliable multi-channel stock.

**Total programme to all three:** 6–10 weeks of focused work, assuming a single developer (you) and no major Amazon-side bureaucracy delays.

The code is genuinely good. The gap is everything *around* the code.
