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

- [ ] **1.1** Fix migration runner (dynamic `fs.readdirSync`, transactional apply, checksum verification, refuses if any migration missing). (Me, 2 h)
- [ ] **1.2** Add `npm run db:migrate`, `npm run db:rollback` commands. (Me, 4 h)
- [ ] **1.3** Add a database seed runner that reads `migrations_meta` to know what's applied. (Me, 2 h)
- [ ] **1.4** Build a **CSV product import tool** (admin uploads CSV → validates → bulk insert/update products, variants, images, prices, inventory, categories, hierarchical categories, SEO). Re-runnable, idempotent. (Me, 1–2 d)
- [ ] **1.5** **VAT-aware pricing display**: every price stored as exclusive + VAT rate; rendered inclusive for customers, exclusive for trade/admin, with VAT line on invoices. (Me, 1 d)
- [ ] **1.6** **CLP compliance** for scented candles (allergen disclosures, hazard pictograms, UFI code on PDP + packing slip). (Me, 2–3 d) — **non-negotiable N-1**
- [ ] **1.7** **Proper error pages** (404, 500, 503, maintenance) styled to brand. (Me, 4 h)
- [ ] **1.8** **Structured logging upgrade**: JSON logs, correlation IDs, per-request tracing, log levels by env. (Me, 1 d)
- [ ] **1.9** **Real test coverage**: get `__tests__/` running against real Postgres + Redis; fix latent bugs. (Me, 2–3 d)
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
