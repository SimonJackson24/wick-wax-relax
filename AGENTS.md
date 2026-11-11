# Project Instructions

## Standards binding

This project follows the engineering standards at `~/projects/standards`.

## Project classification

- **Surface type:** marketing-site (customer storefront for unauthenticated visitors)
- **Stack profile:** `~/projects/standards/stacks/marketing-site.md`
- **Domain standards in force:** docs/03-frontend.md, docs/04-marketing-sites.md
- **Standards version audited:** retroactive draft, 2026-11-11 — **gate with scheduled with Simon pending**
- **Selection record:** docs/ADR-001-stack-selection.md

## Architecture in one gate screen

- `frontend/` — Next.js storefront (self-hosted woff2 via next/font/local; ISR product pages; images in `frontend/public/images`)
- Products API is an external container — frontend proxies `/api/*` same-origin
- CI: GitHub Actions — build fetches real products via `API_URL` build arg (never localhost)

## Commands

- frontend: dev `npm run dev` · build `npm run build` · lint `npm run lint` · test `npm test` (jest)

## Project-specific rules

- Commit style: Conventional Commits with scopes (fix(account), chore(assets), fix(isr), fix(fonts))
- `/account` route must exist — the nav links to it (it was a 404 once)
- `completed-works/` is the hermes agent's session record — ignored, never commit
- Styling: **vanilla CSS** (no utility engine installed — not Tailwind). Per standards v1.1.0: pick the engine (UnoCSS default / Tailwind) at the next major frontend touch. **MUI deps are vestigial** (`frontend/src/theme.js` is the only import) — remove `@mui/*` from package.json at the next dependency pass (kit ban applies to new work; this is cleanup, not migration).

## Known deviations (ADR-bound)

- None recorded.
