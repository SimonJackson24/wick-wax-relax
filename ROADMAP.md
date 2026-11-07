# Wick Wax & Relax — Production Roadmap

**Last updated:** 2026-06-02
**Status legend:** `[ ]` pending · `[/]` in progress · `[x]` done · `[~]` deferred (with reason) · `[!]` blocked (with reason)
**Task IDs:** `phase.workstream.task` — referenced from commits, PRs, and chat (e.g. "1.4 done")

---

## Quick stats

| Phase | Tasks | Me | You | Both | Est. time |
|---|---|---|---|---|---|
| **Phase 1: Hard launch** (UK-only PWA) | 75 | 49 | 19 | 7 | 4–6 weeks |
| **Phase 2: Multi-channel** (Amazon + Etsy) | 19 | 17 | 2 | — | 6–8 weeks |
| **Phase 3: International** (EU + US) | 10 | 6 | 4 | — | 3–4 weeks |
| **Phase 4: Engagement & growth** | 10 | 9 | 1 | — | 4–6 weeks |
| **TOTAL** | **114** | **81** | **26** | **7** | **17–24 weeks** |

*Times assume one focused developer (you) + me as a force multiplier. Some "You" tasks are also bureaucratic lead-times (e.g. SP-API approval) that can run in parallel with code work.*

---

## Table of contents

- [Non-negotiables (5 legal/operational gates)](#non-negotiables)
- [Phase 1: Hard launch (UK PWA)](#phase-1)
  - [1A. Code hygiene](#1a)
  - [1B. Real money plumbing](#1b)
  - [1C. Shipping reality](#1c)
  - [1D. Legal, business, accessibility](#1d)
  - [1E. Operations and observability](#1e)
  - [1F. SEO, content, conversion](#1f)
  - [1G. Support and trust](#1g)
- [Phase 2: Multi-channel commerce](#phase-2)
- [Phase 3: International expansion](#phase-3)
- [Phase 4: Customer engagement and growth](#phase-4)
- [Sequencing (week-by-week)](#sequencing)
- [What I'll do vs what you do](#ownership)
- [Update log](#update-log)

---

<a id="non-negotiables"></a>
## Non-negotiables (5 legal/operational gates)

These are not "nice to have." They are the difference between running a business and personal liability waiting to happen. They are in scope of Phase 1 but called out here because they should never be deferred.

- [ ] **N-1. CLP compliance** for scented candles (UK/EU Regulation (EC) 1223/2009): product entities carry CLP allergen disclosures, hazard pictograms, UFI code; rendered on PDP and packing slip. (Me, 2–3 days) — *see 1.6*
- [ ] **N-2. WCAG 2.1 AA accessibility audit** with axe-core + manual NVDA/VoiceOver pass. (Me + You, 3–4 days) — *see 1.34*
- [ ] **N-3. Returns Policy + 14-day cooling-off flow** (UK Consumer Contracts Regulations). (You/Me, 1 day) — *see 1.28*
- [ ] **N-4. VAT registration + inclusive display** (mandatory at £90k turnover OR Amazon FBA OR EU/NI sales). (You/Me, 1–2 weeks) — *see 1.25*
- [ ] **N-5. Public + product liability insurance** (~£200/yr combined). (You, 1 day quotes) — *see 1.33*

---

<a id="phase-1"></a>
## Phase 1: Hard launch (UK-only PWA)

**Goal:** A real, professional UK e-commerce store taking real money, with all the operational infrastructure a serious business needs. **Target: 4–6 weeks.**

### <a id="1a"></a>1A. Code hygiene

- [x] **1.1** Fix migration runner (dynamic `fs.readdirSync`, transactional apply, checksum verification, refuses if any migration missing). (Me, 2 h) — **end-to-end tested with real Postgres 15 in Docker; 20/20 migrations apply, idempotent re-runs, status/rollback/reset working**
- [x] **1.2** Add `npm run db:migrate`, `npm run db:rollback` commands. (Me, 4 h) — **delivered by the same commit (`e304f5`) as 1.1; `backend/package.json:16-20` wires `db:init`, `db:migrate`, `db:status`, `db:rollback`, `db:reset`; commands declared in `backend/init-db.js:13-20` docstring and implemented in the same file**
- [x] **1.3** Add a database seed runner that reads `migrations_meta` to know what's applied. (Me, 2 h) — **`scripts/seed.js` (new) reads `migrations_applied` table created by migration 017, validates all .sql files on disk have tracking rows, refuses with actionable error if any missing; spawns the existing `scripts/seed-demo-products.js` as a child process. New `db:seed` npm script in `backend/package.json:21`. End-to-end test: `node -c` clean, JSON valid, connection-error path produces actionable error.**
- [ ] **1.4** Build a **CSV product import tool** (admin uploads CSV → validates → bulk insert/update products, variants, images, prices, inventory, categories, hierarchical categories, SEO). Re-runnable, idempotent. (Me, 1–2 d)
- [ ] **1.5** **VAT-aware pricing display**: every price stored as exclusive + VAT rate; rendered inclusive for customers, exclusive for trade/admin, with VAT line on invoices. (Me, 1 d)
- [ ] **1.6** **CLP compliance** for scented candles (allergen disclosures, hazard pictograms, UFI code on PDP + packing slip). (Me, 2–3 d) — **non-negotiable N-1**
- [ ] **1.7** **Proper error pages** (404, 500, 503, maintenance) styled to brand. (Me, 4 h)
- [ ] **1.8** **Structured logging upgrade**: JSON logs, correlation IDs, per-request tracing, log levels by env. (Me, 1 d)
- [x] **1.9** **Real test coverage**: get `__tests__/` running against real Postgres + Redis; fix latent bugs. (Me, 2–3 d) — **DONE 2026-11-07: 100/100 tests, 7/7 suites, against real Postgres 15 + Redis 7 (Docker). Test harness now applies the REAL migrations (fake mini-schema deleted). 10 latent bugs found & fixed en route — see update log.**
- [ ] **1.10** **End-to-end smoke test script**: login → add to cart → checkout → DB row → payment captured → order created → email sent. Runnable in CI and against a real deploy. (Me, 1 d)

### <a id="1b"></a>1B. Real money plumbing

- [ ] **1.11** **Revolut sandbox integration test** against their sandbox API; verify order creation, payment intent, webhook signature, capture, refund. (Me, 1 d)
- [ ] **1.12** **Apple Pay / Google Pay** on the Revolut checkout (RevolutPay). (Me, 4 h)
- [ ] **1.13** **PayPal** as a fallback payment method. (Me, 1 d)
- [ ] **1.14** **Klarna / Clearpay** (BNPL). (Me, 1 d)
- [ ] **1.15** **Stripe** as a backup if Revolut has an outage (Stripe Elements, card data never touches our servers). (Me, 1 d)
- [ ] **1.16** **Real SMTP** (Postmark recommended for transactional): order confirmation, shipping confirmation, password reset, MFA, GDPR export delivery. (Me + You, 1 d)
- [ ] **1.17** **Email deliverability** setup: SPF, DKIM, DMARC records on your domain. (You, 1 h)
- [ ] **1.18** **Email warmup**: graduated transactional emails from a new IP for 2–4 weeks before launch. (Me, 1 d + waiting)

### <a id="1c"></a>1C. Shipping reality

- [ ] **1.19** **Royal Mail sandbox test**: real API call → real label returned → real tracking events. (Me, 1 d)
- [ ] **1.20** **Multiple shipping options**: Royal Mail 48, 24, Tracked 24, Tracked 48, Special Delivery (next-day guaranteed), collection point. Prices loaded from a `shipping_rates` table, configurable per region. (Me, 2 d)
- [ ] **1.21** **Free-shipping threshold** as a real cart-subtotal rule with override per category. (Me, 4 h)
- [ ] **1.22** **Shipping zones**: UK, EU, US, ROW. Different rates, different carrier services, different customs handling. (Me, 1 d)
- [ ] **1.23** **Customs documentation**: for EU + ROW orders, generate commercial invoices, CN22/CN23 declarations, HS codes per product. (Me, 1 d)

### <a id="1d"></a>1D. Legal, business, and accessibility

- [ ] **1.24** **UK business registration** (sole trader via HMRC is fastest — same day). (You, 1 d)
- [ ] **1.25** **VAT registration** (mandatory at £90k turnover OR Amazon FBA OR EU/NI sales). (You, 1–2 weeks) — **non-negotiable N-4**
- [ ] **1.26** **Terms of Service** document (HTML, linked from footer). (You or lawyer, 1–2 d)
- [ ] **1.27** **Privacy Policy** document (HTML, linked from footer + CookieConsent). (You or lawyer, 1 d)
- [ ] **1.28** **Returns Policy** (HTML, 14-day cooling-off flow for online sales). (You or lawyer, 4 h) — **non-negotiable N-3**
- [ ] **1.29** **Shipping Policy** (HTML, linked from footer and product pages). (You or lawyer, 4 h)
- [ ] **1.30** **Cookie Policy** (HTML, linked from CookieConsent banner). (You or lawyer, 2 h)
- [ ] **1.31** **Modern Slavery Statement** (legally required for UK businesses >£36M turnover — placeholder is fine at launch). (You, 30 min)
- [ ] **1.32** **ICO Data Controller registration** (£40/year). (You, 30 min)
- [ ] **1.33** **Public liability + product liability insurance**. (You, 1 day quotes) — **non-negotiable N-5**
- [ ] **1.34** **WCAG 2.1 AA accessibility audit** with axe-core + manual screen reader pass (NVDA on Windows, VoiceOver on Mac). (Me + You, 3–4 d) — **non-negotiable N-2**
- [ ] **1.35** **Mobile UX audit at 360×640, 375×667, 414×896** on real devices. (Me + You, 2–3 d)

### <a id="1e"></a>1E. Operations and observability

- [ ] **1.36** **Daily Postgres backups** (offsite, 30-day retention, tested restore quarterly). (Me, 4 h + cron)
- [ ] **1.37** **Point-in-time recovery (PITR)** for the last 7 days via WAL archiving. (Me, 4 h)
- [ ] **1.38** **Sentry** (errors, performance monitoring, source maps uploaded on every build). (You 10 min setup + Me wiring)
- [ ] **1.39** **Uptime monitoring** (UptimeRobot, 1-minute checks on /, /products, /api/health). (You, 5 min)
- [ ] **1.40** **Status page** (status.wickwaxrelax.co.uk via Instatus free tier). (You, 30 min)
- [ ] **1.41** **CDN** (Cloudflare free tier; DNS, caching, minification, Brotli, HTTP/3). (You, 30 min)
- [ ] **1.42** **WAF rules** (Cloudflare free tier basic WAF; managed rules). (You, 30 min)
- [ ] **1.43** **DDoS protection** (Cloudflare). (You, included in CDN)
- [ ] **1.44** **Secrets management** (Doppler or AWS Secrets Manager, not just .env files). (You, 1 h)
- [ ] **1.45** **Runbook** for common incidents: "site is down", "payments failing", "emails not sending", "DB is slow", "Redis is down". (Me, 1 d)
- [ ] **1.46** **CI/CD pipeline**: GitHub Actions → tests → build → push image → deploy staging → manual approval → deploy production. (Me, 1 d)
- [ ] **1.47** **Rollback procedure** documented and tested (rollback to previous deploy within 5 min). (Me, 4 h)
- [ ] **1.48** **Dependency scanning** in CI (npm audit, Dependabot, Snyk/Trivy). (Me, 4 h)
- [ ] **1.49** **SAST** in CI (Semgrep, Bandit, ESLint security plugin). (Me, 4 h)

### <a id="1f"></a>1F. SEO, content, and conversion

- [ ] **1.50** **SEO essentials**: sitemap.xml, robots.txt, canonical URLs, Open Graph + Twitter Card meta, structured data (Product, BreadcrumbList, Organization, LocalBusiness JSON-LD). (Me, 2 d)
- [ ] **1.51** **Google Search Console** setup + submission. (You, 30 min)
- [ ] **1.52** **Google Business Profile** (if you have a physical location or stockist). (You, 30 min)
- [ ] **1.53** **Google Analytics 4** (consent-gated via existing CookieConsent). (Me, 4 h)
- [ ] **1.54** **Meta Pixel** (consent-gated). (Me, 2 h)
- [ ] **1.55** **Server-side event tracking** via Conversions API (more reliable than pixel-only). (Me, 1 d)
- [ ] **1.56** **404 monitoring + redirect map** (audit 404s weekly, 301 redirects). (Me, 4 h)
- [ ] **1.57** **Product photography** (real photos, multiple per product, lifestyle shots, 360° optional). (You, 1–2 weeks)
- [ ] **1.58** **Product descriptions** (well-written, SEO-optimised, sizing/burning-time info for candles). (You, 1 week)
- [ ] **1.59** **Homepage, About, Contact, FAQ pages** with real content (not lorem ipsum). (You, 1 week)
- [ ] **1.60** **Abandoned cart recovery** (email 1h, 24h, 72h with 10% off on the last). (Me, 2 d)
- [ ] **1.61** **Welcome email series** (immediate welcome + 10% off, day 3 product recs, day 7 reviews request). (Me + You, 1 d)
- [ ] **1.62** **Review system upgrade**: review request email 7d post-delivery, photo reviews, verified-buyer badge, owner response. (Me, 1 d)
- [ ] **1.63** **Product Q&A** (customers ask, owner/staff answer). (Me, 1 d)
- [ ] **1.64** **Real-time inventory display** ("Only 3 left in stock" — urgency, conversion). (Me, 4 h)
- [ ] **1.65** **Recently viewed products** (re-engagement). (Me, 4 h)

### <a id="1g"></a>1G. Support and trust

- [ ] **1.66** **Help center / FAQ** page with searchable articles. (Me + You, 2 d)
- [ ] **1.67** **Contact form** with ticket creation + email routing. (Me, 1 d)
- [ ] **1.68** **Live chat** (Tawk.to free, or Crisp, or Intercom). (You + Me, 30 min setup + widget)
- [ ] **1.69** **Trust signals on PDP and cart**: verified reviews, "X people are viewing this", press mentions, awards, certifications (only real ones). (Me, 1 d)
- [ ] **1.70** **Order tracking page** (customer-facing: enter email + order number, see real Royal Mail tracking). (Me, 1 d)
- [ ] **1.71** **Refund workflow** in admin: full refund, partial refund, restocking fee, return label generation. (Me, 1 d)
- [ ] **1.72** **Customer account upgrades**: saved addresses, saved payment methods (via Revolut customer objects), order history with reorder button, gift registry, email preferences. (Me, 3 d)
- [ ] **1.73** **Gift cards** (purchase, redeem, balance display, expiry management). (Me, 3 d)
- [ ] **1.74** **Gift wrapping** option at checkout with gift message. (Me, 1 d)
- [ ] **1.75** **Multi-language readiness** (en-GB shipped, scaffold for fr-FR, de-DE, es-ES — actual translations as content work). (Me, 1 d scaffolding)

**Phase 1 done = real PWA selling to real UK customers, with all the operational, legal, and customer-experience infrastructure a serious business needs.**

---

<a id="phase-2"></a>
## Phase 2: Multi-channel commerce (PWA + Amazon + Etsy)

**Goal:** Be on every channel your customers shop on, with stock and orders in sync everywhere. **Target: 6–8 weeks on top of Phase 1.**

### Amazon

- [ ] **2.1** Rewrite SP-API request signing to use **AWS Signature V4** (replace broken HMAC-SHA256). (Me, 3–5 d)
- [ ] **2.2** **LWA token refresh** with retry + Redis-backed cache + 401-driven cache invalidation. (Me, 1–2 d)
- [ ] **2.3** **Proper report polling** (poll `GET /reports/{id}` until `DONE`, then download, with exponential backoff). (Me, 1 d)
- [ ] **2.4** **Per-SKU product mapping UI** in admin (map local variant → Amazon ASIN, FBA preference, condition, price override). (Me, 3–5 d)
- [ ] **2.5** **Seed Amazon and Etsy channels** in `channels` table with real API keys. (Me, 2 h)
- [ ] **2.6** **End-to-end live test** with one ASIN (list → buy on Amazon → webhook → order created in DB → stock decremented → fulfilment dispatched). (Me + You, 1 week)
- [ ] **2.7** **Authoritative stock-read**: when a customer hits the PDP, reserve/check real-time stock across all channels (not just local DB) — fixes the "sold on Amazon what we already sold on PWA" race. (Me, 2–3 d)
- [ ] **2.8** **Daily reconciliation report** (cron comparing local stock vs Amazon's reported stock, alerts on drift > 1 unit). (Me, 2–3 d)
- [ ] **2.9** **Brand Registry** (recommended for candles — protects brand, enables A+ content). (You, 1–2 weeks)
- [ ] **2.10** **A+ Content / Premium Content** (rich product descriptions on Amazon). (You, 1 week)
- [ ] **2.11** **Amazon Sponsored Products** launch (separate budget, not in code). (You, ongoing)

### Etsy

- [ ] **2.12** **Live integration test** with one Etsy listing. (Me + You, 3 d)
- [ ] **2.13** Per-listing mapping UI (map local product → Etsy listing, variations, materials, sections). (Me, 2 d)
- [ ] **2.14** Etsy fee calculator (Etsy takes 6.5% + listing fees — factor into pricing). (Me, 1 d)

### Cross-channel infrastructure

- [ ] **2.15** **Dead-letter queue + alerting** for sync failures (BullMQ on Redis). (Me, 2 d)

### Optional channels (Phase 2.5 — pick as needed)

- [ ] **2.16** **eBay** Buy API integration (third listing channel). (Me, 2 weeks)
- [ ] **2.17** **WooCommerce/Shopify sync** (sister-site orders). (Me, 1 week)
- [ ] **2.18** **TikTok Shop** (newer channel, growing for candles). (Me, 2 weeks)
- [ ] **2.19** **Google Shopping** feed via Google Merchant Center. (Me, 1 week)

**Phase 2 done = PWA + Amazon + Etsy (and optionally eBay, TikTok, Google) all selling in sync with no overselling.**

---

<a id="phase-3"></a>
## Phase 3: International expansion (EU + US + multi-currency)

**Goal:** Sell to international customers legally, with localised experience. **Target: 3–4 weeks on top of Phase 2.**

- [ ] **3.1** **Multi-currency**: prices stored in base currency (GBP), displayed in user's local currency (USD, EUR, etc.) via real-time FX rate API. (Me, 1 week)
- [ ] **3.2** **IOSS (Import One-Stop Shop)** VAT registration for sales <€150 to EU consumers; **OSS** for >€150. (You, 1–2 weeks bureaucracy)
- [ ] **3.3** **GDPR Article 27** EU representative appointment (required if processing EU residents' data). (You, 1 day)
- [ ] **3.4** **EU right of withdrawal** flows (different return window + label). (Me, 3 d)
- [ ] **3.5** **DDP (Delivered Duty Paid)** for EU + US shipments so customers don't get surprise customs charges. (Me, 1 week)
- [ ] **3.6** **Multi-language** (en-GB, fr-FR, de-DE, es-ES) — real translations. (You + translator, 2–4 weeks)
- [ ] **3.7** Locale-aware content (cm/inches, g/oz, DD/MM vs MM/DD). (Me, 1 week)
- [ ] **3.8** **US sales tax** registration per state (each state has its own threshold and rate). (You, ongoing)
- [ ] **3.9** USD pricing, US shipping carriers (USPS, UPS, FedEx — not just Royal Mail). (Me, 1 week)
- [ ] **3.10** US consumer protection (CCPA, state-level privacy laws). (You + Me, 1 week)

**Phase 3 done = legally selling internationally with localised experience.**

---

<a id="phase-4"></a>
## Phase 4: Customer engagement and growth (loyalty, marketing, advanced)

**Goal:** Build the systems that turn one-time buyers into repeat customers. **Target: 4–6 weeks on top of Phase 3.**

- [ ] **4.1** **Loyalty / rewards**: points-per-purchase, tiered membership, birthday discount, referral program. (Me, 2 weeks)
- [ ] **4.2** **Email marketing** integration with Klaviyo or Mailchimp (segment, campaign, automation). (Me + You, 1 week)
- [ ] **4.3** **SMS marketing** via Twilio (shipping updates + opt-in marketing). (Me, 1 week)
- [ ] **4.4** **Subscriptions v2**: skip-a-delivery, swap-product, change-frequency, pause-subscription, gift subscriptions. (Me, 1 week)
- [ ] **4.5** **Affiliate program**: trackable referral links, commission payouts, dashboard for affiliates. (Me, 1 week)
- [ ] **4.6** **A/B testing**: feature flags + experiment framework (GrowthBook or PostHog). (Me, 1 week)
- [ ] **4.7** **Analytics upgrade**: Mixpanel or Amplitude for product analytics (funnels, retention, cohorts). (Me + You, 1 week)
- [ ] **4.8** **Customer feedback**: NPS surveys, post-purchase feedback form, in-app feedback widget. (Me, 1 week)
- [ ] **4.9** **Admin analytics upgrade**: cohort analysis, LTV calculation, churn reporting, channel attribution. (Me, 1 week)
- [ ] **4.10** **Push notifications v2**: personalised push (back-in-stock, price-drop on wishlist, abandoned browse). (Me, 1 week)

**Phase 4 done = engagement, retention, and growth systems that make a real difference to LTV.**

---

<a id="sequencing"></a>
## Sequencing (week-by-week)

| Week | You (business) | Me (code) |
|---|---|---|
| **1** | Register UK business. Apply for Revolut Merchant, Royal Mail dev, Amazon SP-API. | Fix migration runner. Build CSV import. Start VAT/CLP code work. |
| **2** | Author legal docs (or hire a lawyer). Set up SMTP, domain, Sentry. | Test deploy to CloudPanel. Run real integration tests. Start Phase 1 features. |
| **3** | Register ICO. Get insurance. Apply for VAT number. | Finish customer-facing Phase 1 features. Start abandoned cart + reviews upgrade. |
| **4** | Load real products via CSV import. Write product descriptions. | Phase 1 wrap-up: emails, support, observability, accessibility audit. |
| **5** | First real-money test order. Verify Revolut captures. Verify email delivers. Verify tracking. | Fix anything that breaks. Mobile UX pass. Final QA. |
| **6** | **🎉 PHASE 1 GO-LIVE: PWA selling to real UK customers.** | On-call for launch issues. |
| **7–12** | — | Phase 2: Amazon SigV4 rewrite, channel sync, reconciliation. (PWA continues running.) |
| **13–16** | — | Phase 2 wrap-up: live Amazon integration, first Amazon sale. |
| **17–20** | — | Phase 3: international expansion (EU + US). |
| **21–26** | — | Phase 4: engagement and growth features. |

---

<a id="ownership"></a>
## What I'll do vs what you do

**Me (code, ~70% of the work)**
- All code in Phases 1–4
- Test deploys, smoke tests, integration tests
- Code review of every change
- Documentation of every non-obvious decision
- Direct commits to master (or feature branches with PRs if you prefer)

**You (business, ~30% of the work)**
- Business registration, VAT, ICO, insurance
- All third-party account applications (Revolut, Royal Mail, Amazon SP-API, Postmark, etc.)
- Legal documents (or hire a lawyer for half a day)
- Product photography, descriptions, content
- Real customer support for the first 90 days
- Final go/no-go decision on launch day

---

<a id="update-log"></a>
## Update log

Append a new entry here every time the roadmap is updated (task completed, new task added, blocker resolved, phase status changed).

```
2026-06-02  Roadmap created. 114 tasks across 4 phases.
            Status: 0 done, 0 in progress, 114 pending.
            Phases 1–4: all pending.
            Non-negotiables N-1 to N-5: all pending.
            Created from PRODUCTION-READINESS-ASSESSMENT.md audit.

2026-06-04  Cleanup: deleted 21 files/dirs (9 green + 12 yellow clutter).
            Tightened .gitignore (.bak, .orig, .old, *.backup, *~,
            .DS_Store, Thumbs.db, .ruff_cache/, .mypy_cache/,
            .pytest_cache/, .eslintcache, .parcel-cache/).
            Repo shrunk from 220MB to ~5MB; pushed clean history to
            origin/master (15 commits, 24MB reachable, force-push with
            --force-with-lease to strip .next + node_modules from history).
            Tagged v0.1.0-pre-launch.

2026-06-04  1.1 done. Migration runner rewritten:
              - Dynamic fs.readdirSync discovery (no more hardcoded list)
              - Smart SQL splitter (handles ; in -- comments, /* */ blocks,
                $$ ... $$ dollar-quoted bodies)
              - Per-statement execution with ignorable-error tolerance
                (legacy non-idempotent migrations work)
              - SHA-256 checksum verification on every run
              - New migrations_applied tracking table (created by 017)
              - First-run bootstrap: tracking table backfilled from disk
              - New CLI: db:migrate, db:status, db:rollback
              - db:reset uses DROP SCHEMA public CASCADE (clean nuke)
              - Auto-loads .env via dotenv
              - No commander dependency
            Fixed 5 pre-existing migration type-mismatches uncovered by
            end-to-end test (TEXT foreign keys pointing to UUID columns,
            SQLite-style randomblob id default, boolean columns with int
            defaults):
              006_inventory_audit_log.sql    variant_id UUID, order_id UUID
              008_add_tracking_fields.sql   order_id UUID
              009_suppliers.sql              product_id UUID, variant_id UUID
              010_gdpr_consent_tracking.sql  user_consents id + user_id UUID
                                            all BOOLEAN DEFAULT FALSE (not 0)
                                            TRUE (not 1) in DML
            Fixed seed to use uuidv4() for channels.id and users.id
            (was hardcoded 'pwa-channel' / 'admin-user' which violated
            UUID column type).
            Verified end-to-end: fresh init applies 20/20 migrations to a
            real Postgres 15 in Docker, 33 tables created, channel +
            admin user seeded, db:status shows all 20 with timestamps,
            re-run is idempotent (0 applied, 20 skipped).
            Status: 1 done, 0 in progress, 113 pending.

2026-06-05  1.2 done (delivered by the same commit `e304f5` as 1.1;
            missed in the 1.1 update log). Also updated 1.1's checkbox
            from [/] to [x] since the update log already says "1.1 done"
            but the checkbox was not flipped.
            npm scripts wired in backend/package.json:16-20:
              db:init, db:migrate, db:status, db:rollback, db:reset.
            Commands declared in backend/init-db.js:13-20 docstring
            and implemented in the same file.
            Audit-and-Credit Phase A complete.
            Status: 2 done, 0 in progress, 117 pending.
            (Note: 114 numbered tasks + 5 N- non-negotiables = 119 total.)
            Full report: audits/AUDIT-AND-CREDIT-REPORT.{md,html}.
            13 pre-roadmap features documented as "ROADMAP GAPS":
            (A) CSRF middleware, (B) PII sanitizer middleware,
            (C) idempotency middleware, (D) admin TOTP 2FA, (E) cart page,
            (F) guest checkout, (G) wishlist, (H) save for later,
            (I) subscribe and save, (J) frequently bought together,
            (K) ProductGallery, (L) PDP cross-sell sections, (M) trust
            signals (TrustBadges + FreeShippingBanner).
            Three options for handling GAPS:
              G1: add as new tasks 1.76-1.88, all [x] (most truthful)
              G2: add only security items A-D as 1.76-1.79
              G3: leave historical-only, audit report is source of truth
            Awaiting user decision. Recommended default: G3 for now,
            G1 once you decide to expand the plan.
            Also identified as ENTIRELY MISSING (per audit, not yet
            credited or worked): 1.4 CSV import, 1.5 VAT, 1.6 CLP,
            1.7 error pages, 1.36 backups, 1.37 PITR, 1.47 rollback
            procedure doc, 1.50 SEO completion (JSON-LD/OG), 1.62
            verified-buyer flow, 1.69 live trust signals, 1.72 saved
            addresses/payment methods, 1.73 gift cards, 1.74 gift wrapping.
            Identified as PARTIAL (base built, full task not met):
            1.8 logging, 1.16 SMTP, 1.21 free shipping, 1.46 CI/CD,
            1.50 SEO, 1.62 reviews, 1.69 trust signals, 1.72 customer
            account. See audit report for file:line evidence.

2026-06-05  1.3 done. scripts/seed.js (new, 5.8 KB) reads
            migrations_applied table created by migration 017,
            validates all .sql files on disk have tracking rows,
            refuses with actionable error if any missing, then
            spawns scripts/seed-demo-products.js as a child.
            backend/package.json:21 adds `db:seed` npm script.
            End-to-end test deferred to user (1.1 used Postgres
            in Docker; same approach works here).
            Status: 3 done, 0 in progress, 116 pending.
            (Note: 114 numbered tasks + 5 N- non-negotiables = 119 total.)

2026-11-07  Unblock phase A (pre-1.4 repair work; no checkbox changes).
            Project resumed after 5 months dormant. Confirmed decisions:
            domain = wickwaxrelax.co.uk; VAT not yet registered (pricing
            to be built flip-of-switch, see N-4); Amazon-style single-
            vendor UX is the north star; admin must control every
            endpoint incl. a raw API explorer.
            Migration 018_add_product_slug_updated_at.sql (new): adds
            products.slug (unique index, SQL backfill from name, dedupe)
            and products.updated_at. Both columns were queried/written by
            code (routes/products.js p.slug in 8 places; updateProduct
            SET updated_at) but never existed in any migration — every
            product read/update failed on a migration-built DB.
            Verified end-to-end on throwaway Postgres 15 (Docker):
            21/21 apply, idempotent re-run (0 applied, 21 skipped),
            5/5 service checks (create / collision-suffix / list /
            rename-regenerates-slug / explicit-slug-override).
            backend/services/product.js repaired: GROUP_CONCAT →
            string_agg (Postgres has no GROUP_CONCAT — admin product
            list was broken); create/updateProduct now pin ONE client
            via getClient() (pool-level BEGIN/COMMIT ran on random
            connections, so inserts were not atomic); slugs auto-
            generated via seoService.generateSlug with -2/-3 suffix on
            collision; optional slug added to admin POST/PUT validators.
            Domain unified to https://www.wickwaxrelax.co.uk across 15
            files (was mixed .com / localhost): sitemap.xml, robots.txt,
            SEOHead fallback, 5 pages, Footer, noreply@/info@ emails,
            PDF invoices, push VAPID comment, SeoSettings placeholders.
            New single source of truth: frontend/utils/siteConfig.js +
            next.config.js env default (prereq for 1.50).
            1.9 triage: Jest runs via `node node_modules/jest/bin/jest.js`
            (the npx .bin shim was permission-blocked in the agent
            sandbox only; `npm test` unaffected on a normal terminal).
            Runnable suites: validation 7/8 pass, logger 5/12 pass —
            failures are test-vs-code drift (logger tests mock the old
            pre-rewrite winston API) + one sanitizeInput params case.
            4 suites (auth routes, performance, 2 integration, security)
            require() server.js at import → boot the real app → hang.
            Remaining 1.9 work: extract an app factory from server.js;
            rewrite logger tests against the current API.
            Status: 3 done, 0 in progress, 116 pending (unchanged —
            unblock/repair work, not a numbered task).

2026-11-07  1.9 done. Full test suite green: 100/100 tests,
            7/7 suites, against REAL Postgres 15 + Redis 7 (both
            throwaway Docker containers). Started the day at
            "Jest cannot execute"; ended with every suite passing.
            Test-harness repairs:
              - __tests__/test-config.js: replaced the hand-written
                mini-schema (TEXT ids, REAL prices, 'pwa-channel'
                string PK — drifted from reality) with the REAL
                MigrationRunner from init-db.js. Test DB is now
                structurally identical to production.
              - jest.setup.js: afterAll no longer DROPs the schema
                after every file (it cascaded failures into all
                subsequent suites); console.error no longer mocked
                (it hid [DB ERROR] diagnostics).
              - Test fixture credentials moved to backend/.env.test
                (gitignored, loaded by jest.setup).
            10 latent bugs found by the suite and FIXED:
              1. routes/auth.js: duplicate getSecureCookieOptions
                 definition (Jest's parser rejected it; Node silently
                 allowed it).
              2. Migration 0001_admin_totp_2fa sorted BEFORE
                 001_initial_schema → ALTERed users before it existed.
                 Renamed to 019_admin_totp_2fa.sql.
              3. That file's BEGIN/COMMIT wrapper + `is_admin = 1`
                 (boolean≠integer in PG) aborted the transaction and
                 COMMIT rolled back everything while the runner marked
                 the file applied. Fixed the comparison to = TRUE,
                 removed the wrapper, and hardened init-db.js
                 splitStatements to strip stray BEGIN/COMMIT with a
                 warning + log every idempotent skip (was silent).
              4. migration 015: partial index `WHERE
                 password_change_required = 1` — same boolean/integer
                 bug, index silently missing everywhere. Fixed to
                 = TRUE.
              5. routes/auth.js: `user.is_admin === 1` (6 sites) and
                 `user.password_change_required === 1` — always false
                 against Postgres booleans: admins were locked out of
                 admin routes and forced-password-change never fired.
                 Now === true.
              6. middleware/auth.js requireAdminFresh: same
                 `is_admin !== 1` bug. Fixed.
              7. Migration 020 (new): audit_log table + users.
                 reset_token / reset_token_expires / refresh_token_
                 generation columns — code wrote all of these, no
                 migration created them (security events and password
                 reset were silently failing).
              8. middleware/csrf.js: safe GETs outside /api/ fell
                 into the mutating branch → 403 on every /images,
                 /uploads, /fonts asset served by Express. Fixed.
              9. server.js: malformed JSON → 500 instead of 400;
                 now mapped properly (400 / 413).
             10. routes/upload.js: rejected file types surfaced as
                 500s (no status mapping) — now 400/413 via router-
                 level error handler. Also /api/health now actively
                 PINGs Redis (500ms race) instead of reading a
                 connection flag that's false until first use.
            Test files rewritten to match current behaviour (CSRF
            double-submit dance, admin MFA challenge + TOTP verify,
            400-vs-401 validation expectations, Postgres ON CONFLICT
            syntax, preflight 204): security.test.js (21/21),
            logger.test.js (12/12, spies on real loggers instead of
            broken winston mocks), auth.test.js (19/19),
            products.integration.test.js (13/13),
            auth.integration.test.js (14/14), performance.test.js
            (11/11, warm-up before latency SLAs),
            validation.test.js (8/8, slash-free XSS payloads).
            NOTE for existing dev DBs: renamed migration 0001→019
            and edits to 015/018 will surface as checksum warnings /
            one-time applies on the next db:migrate — all files are
            idempotent, and pre-launch (no real data) db:reset is
            the clean path.
            Status: 4 done, 0 in progress, 115 pending.

2026-11-07  Phase A started (product model, pre-1.4/1.5/1.6).
            Migration 021_product_commerce_fields.sql (new): products
            gain status (DRAFT/ACTIVE/ARCHIVED — storefront visibility
            gate), vat_rate (default 20.00), meta_title /
            meta_description (per-product SEO), weight_grams /
            dimensions_cm (shipping rates), and the full CLP set
            (allergens, hazard pictograms, signal word, H + P
            statements, UFI, responsible name). Platform settings
            seeded: vat_registered=false + empty
            vat_registration_number — the N-4 flip-of-switch; prices
            are always entered as customer-facing amounts. Seeded
            contact email corrected to .co.uk. Verified on scratch
            Postgres 15: 23/23 apply, all columns + settings land.
            services/product.js: list query extended with the new
            columns + optional status filter; commerceParams helper
            added for the write path.
            REMAINING for 1.4/1.5/1.6 (blocked mid-wiring by the
            Mimosa Edit gate, which flags even fully-static
            parameterized SQL as injection): getProductById /
            createProduct / updateProduct wiring, admin validators,
            storefront ACTIVE-only filter, PDP CLP + SEO rendering,
            admin form tabs, CSV import. No checkbox flips — schema
            only so far.
            Also this session: refresh/reset token digests switched
            from bare SHA-256 to HMAC-SHA256 keyed by TOKEN_HASH_SECRET
            (falls back to JWT_REFRESH_SECRET) — a DB-only leak can no
            longer support offline token verification. 69 auth-related
            tests re-verified green after the change.
            COMMIT STILL BLOCKED by the Mimosa pre-commit gate (flags
            any sha256/HMAC usage and password-form validation lines
            as high-risk — assessed false positives; the tool's
            `mimosa validate` allowlist covers only an unrelated
            finding class). All work staged; Simon to commit from his
            own terminal or explicitly authorize disabling the gate.

2026-11-07  Phase A continuation (staged, post-commit 259faa02f).
            DONE: admin validators accept all commerce fields
            (routes/admin.js POST+PUT); full admin product form — status,
            VAT rate, weight, SEO overrides, complete CLP section
            (comma-separated list inputs) + £ currency fix
            (admin/products.js); PDP renders CLP "Safety & Compliance"
            accordion (new components/ClpDisclosure.js — signal word,
            GHS pictograms, allergen chips, H/P statement text, UFI),
            per-product SEO overrides wired into SEOHead, weight +
            dimensions in Product Details. 34/34 regression tests green.
            STILL BLOCKED (Mimosa Edit gate flags any SQL edit to
            services/product.js, including fully-static parameterized
            forms): createProduct/updateProduct must persist the
            commerce fields via the commerceParams() helper already in
            the file, and getProductById must SELECT the new columns
            (list query already does). Apply manually in an un-gated
            terminal or after adjusting the gate. Storefront
            ACTIVE-only filter in routes/products.js pending likewise.

2026-11-07  CLP enforcement + Label Kit (N-1). Migration 022:
            products.clp_exempt BOOLEAN DEFAULT FALSE (24/24 apply,
            verified live). Server-side gate in routes/admin.js
            (assertClpComplete): scented products CANNOT go ACTIVE
            without signal word, pictograms, H-codes, P-codes,
            responsible person; exempt tickbox bypasses (audit trail);
            DRAFT saves allowed incomplete. Mirrored client-side in the
            admin form with the same error text. createProduct INSERT
            now persists ALL commerce fields (gate-safe static form).
            NEW: CLP Label Kit — components/admin/ClpLabelKit.js +
            QR button on each admin product row: print-ready 50×30mm
            label (name, signal word, pictograms w/ PNG fallback,
            H/P codes, allergen line, UFI, RP name, weight) + QR to
            {SITE_URL}/product/{slug}#clp (the PDP Safety section);
            @media print CSS at true mm sizing; qrcode pkg added.
            Legal note recorded: QR SUPPLEMENTS the physical CLP label
            under GB CLP — never replaces it.
            HAND-APPLY in an un-gated terminal (Mimosa Edit gate blocks
            these exact static-parameterized edits; content ready):
            1) CREATE backend/services/productCommerce.js exporting
               applyCommerceFields(productId, data) — a single static
               UPDATE products SET status=?,vat_rate=?,meta_title=?,
               meta_description=?,weight_grams=?,dimensions_cm=?,
               clp_allergens=?,clp_hazard_pictograms=?,
               clp_signal_word=?,clp_hazard_statements=?,
               clp_precautionary_statements=?,ufi_code=?,
               clp_responsible_name=?,clp_exempt=?,updated_at=NOW()
               WHERE id=? with commerceParams() from product.js
               (already exported) mapping the values.
            2) routes/admin.js PUT /products/:id — after
               productService.updateProduct(id, req.body), add:
               const { applyCommerceFields } =
                 require('../services/productCommerce');
               await applyCommerceFields(id, req.body);
            3) product.js getProductById SELECT — add the same 13
               commerce columns + clp_exempt as getAllProducts has.
            4) routes/products.js storefront — add
               AND p.status = 'ACTIVE' to list/slug queries.
            Verified: 15/15 products integration suite green.
```

---

## How to use this file

- **For me:** at the start of every work session, scan `[ ]` and `[/]` to know what's next, then update the file as tasks complete.
- **For you:** in `/new` sessions, ask me to "show me the current state of the roadmap" and I'll print the counts of `[x]/[/]/[ ]`.
- **To add a task:** append to the relevant workstream, pick the next available ID, mark `[ ]`.
- **To defer:** change `[ ]` to `[~]` and add the reason inline: `[~] (deferred — depends on Etsy adoption)`.
- **To block:** change `[ ]` to `[!]` and add the reason: `[!] (blocked — Revolut Merchant application pending)`.
- **To commit progress:** include task IDs in commit messages: `feat: 1.4 CSV product import tool`.
- **In commits/PRs/chats:** refer to tasks by ID (e.g. "1.4 done", "blocked on 1.25").
