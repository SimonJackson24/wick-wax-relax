# ADR-001: Stack selection

- **Status:** Proposed — retroactive draft pending Simon's Inception Gate sign-off
- **Date:** 2026-11-11
- **Deciders:** Simon + agent (draft)
- **Standards version:** v1.0.0

## Context

wick-wax-relax is a live customer storefront (Next.js + ISR) built before the
standards; the gate records the incumbent stack and classifies the surface.

## Decision

Classify as **marketing-site** (storefront for unauthenticated visitors) on the
Next.js/TypeScript stack it already runs; products data stays owned by the
external API container, proxied same-origin.

## Alternatives considered

| Option | Assessment |
| --- | --- |
| Standard pick (`marketing-site.md` profile) | Matches: no app surface beyond /account |
| web-app-saas classification | Rejected: no authenticated tool surface |
| Move product data in-store | Rejected: API container already owns products; duplication |

## Consequences

- **Gain:** classification matches reality; no app-kit temptation on a content surface
- **Cost / risk:** /account edge (auth'd page inside a marketing surface) must not grow into an app
- **Revisit trigger:** if customer accounts gain real functionality → re-classify as web-app-saas

## Scope

This project only.
