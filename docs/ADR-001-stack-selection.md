# ADR-001: Stack selection (retroactive draft)

**Status:** Retroactive — drafted 2026-11-11 by agent from repo evidence; **pending Simon's Inception Gate confirmation.**

- **Classification:** marketing-site (storefront) — evidence: public product pages, ISR, no app surface beyond /account
- **Ecosystem:** TypeScript end-to-end — Next.js frontend; external products API container
- **Rendering:** ISR/SSG — evidence: build fetches real products via API_URL build arg
- **UI:** semantic HTML + Tailwind/CSS, no component kit
- **Data:** external API owns product data; frontend owns nothing persistent
- **Hosting:** Coolify container; CI build in GitHub Actions
