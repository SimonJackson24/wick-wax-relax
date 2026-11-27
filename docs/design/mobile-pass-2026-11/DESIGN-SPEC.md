# Mobile-first polish pass — Design Spec

**Client:** Wick Wax & Relax (marketing site) · **Date:** 2026-11-26
**Type:** REDESIGN (existing design carried forward) · **Scope:** design +
responsive layout only. No product names, product images, prices or copy are
changed.

---

## 1. Boundaries (redesign §1)

**Preserved**
- Brand identity: plum `#3D2B3D` / plum-deep `#2A1D2A` / paper `#FDFCFA` /
  sand `#F4EFE7` / ink `#1C1A1F` / clay `#C9846B` / lavender `#C8B6DB` /
  gold `#E6C88A`.
- Type: Playfair Display (display) + Montserrat (UI/body), self-hosted.
- The "The Ritual" homepage order and every section's content.
- The warm brand grade (plum→amber soft-light) + film grain over photography.
- Product names, notes, prices, RRP, ratings, stock, images, reviews.

**Open to change**
Everything else: token layer, type scale, spacing scale, layout, component
behaviour, tap targets, heading hierarchy, motion rules.

**What makes it weak (the single reason)**
The mobile build is a squeezed desktop build: a 6-item trust grid and an
over-long hero push the CTA below the fold, two dark sections render their
own text in dark ink (invisible), and the product cards are too narrow for
their own content. The desktop is composed; the phone is stacked.

**Direction**
Carried forward from the client's own system: *Editorial Serif + Cinematic*,
inflected by the brand's own artefacts (the pour, the cure, the CLP label).
This pass does **not** introduce a new direction — per the owner's brief the
existing visual identity is kept and the work is mobile craft.

---

## 2. Business-type mapping (DESIGN-MAPPING §4)

**4.18 Independent retail / e-commerce + 4.20 craft brand.**
- **Feel:** curated, tactile, brand-led (and: hand-made, patient, honest).
- **Decides on:** product imagery, price clarity, ease of purchase.
- **Safe zone:** price + RRP visible, delivery/returns, ingredients and
  compliance (CLP, allergens), real reviews, no invented claims.
- **Avoid:** template Shopify look, tiny images, identical cards with no
  hierarchy, pastel wellness gradients.
- **Primary CTA:** *Shop this scent* / *Add to basket*.
- **Positioning modifiers:** premium price tier → more space, fewer colours,
  larger imagery, slower motion; **mostly-mobile consumer audience** →
  mobile is the primary surface; considered purchase → storytelling depth.

---

## 3. Brand DNA → design decisions

| Design element | Derived from | Decision |
|---|---|---|
| Palette | existing brand colour | unchanged; **on-dark text tokens added** (see §4) |
| Display type | the house serif | Playfair Display — kept (client-owned identity) |
| Body type | the house sans | Montserrat — kept; body2 raised to 16px |
| Motif | the pour + the flame | gold `#E6C88A` accent on plum; brand grade over photos |
| Texture | the studio | film grain + soft-light grade — kept |
| Layout metaphor | the shelf / the label | grid + hairline borders (no shadow-heavy cards) |
| Photography | the real range | existing images only — nothing swapped |
| Voice | "made to slow the room down" | copy untouched |

---

## 4. Tokens (the colour bug, fixed at token level)

**Root cause.** `theme.palette.text.primary` (`#1C1A1F`) and the `body1`
colour (`#3A3740`) are the *light-surface* inks. On the dark plum surfaces
(`#3D2B3D`) they render at ~1.05:1 — invisible. Typography set its own colour
from the theme, so a parent `color: '#F4EFE7'` was ignored.

**Fix — one variable flip per dark surface.**

```css
:root {
  --wwr-type-ink:        #3A3740;                     /* default body ink   */
  --wwr-type-ink-soft:   #6B6570;                     /* secondary body     */
  --wwr-type-ink-muted:  #8A8494;                     /* caption / overline */
  --wwr-plum:            #3D2B3D;
  --wwr-plum-deep:       #2A1D2A;
  --wwr-cream:           #F4EFE7;
  --wwr-cream-soft:      rgba(244,239,231,0.82);
  --wwr-cream-muted:     rgba(244,239,231,0.78);
  --wwr-gold:            #E6C88A;
}
.wwr-dark-surface {                /* any plum surface */
  --wwr-type-ink:       #F4EFE7;   /* 9.6:1 on plum */
  --wwr-type-ink-soft:  rgba(244,239,231,0.82);  /* 8.2:1 */
  --wwr-type-ink-muted: rgba(244,239,231,0.78);  /* 7.5:1 */
}
```

`MuiTypography.styleOverrides` now resolves every variant's colour through
those variables, so **any** typography on a dark surface becomes cream,
including captions and overlines — and any explicit `sx` colour still wins
(sx > styleOverrides in MUI v5). Dark surfaces carrying the class:
Reviews band, Footer, Announcement bar, Scent marquee, mobile drawer.

**Contrast audit on plum `#3D2B3D` (L = 0.0307):**

| Token | Effective colour | Ratio | Verdict |
|---|---|---|---|
| `--wwr-type-ink` | `#F4EFE7` | 9.6:1 | AAA |
| `--wwr-type-ink-soft` | `#D3CBC8` | 8.2:1 | AAA |
| `--wwr-type-ink-muted` | `#C8C0BD` | 7.5:1 | AAA |
| gold `#E6C88A` | — | 6.5:1 | AAA (large) |
| clay `#C9846B` (on plum) | — | 3.4:1 | **decorative only** — never body text on plum |
| old body ink `#3A3740` | — | 1.05:1 | **FAIL — eliminated** |

Clay is the brand's eyebrow/urgency accent and stays on light surfaces only;
on plum the eyebrow turns gold (`#E6C88A`, 6.5:1).

---

## 5. Spacing / type scale

**Section padding scale** (`src/layoutTokens.js`, one source of truth):

| Token | Mobile | Desktop |
|---|---|---|
| `SECTION_PY` (major sections) | 56px | 96px |
| `SECTION_PY_COMPACT` (bands) | 40px | 56px |
| `GUTTER` | 16px | 32px |

Every homepage section uses one of these two — no third value.

**Type scale** (unchanged display sizes; body raised)

| Role | Before | After |
|---|---|---|
| `body1` | 16px | 16px |
| `body2` (body copy) | 14px | **16px** (≥16px rule) |
| `caption` (meta) | 12px | **13px** |
| `overline` (tracked label) | 11px | 11px |
| Hero display | `clamp(3rem, 6.2vw, 5.25rem)` | mobile `clamp(2.5rem, 8.4vw, 3.25rem)`, desktop unchanged |

---

## 6. Section-by-section plan (mobile ≤768px)

| # | Section | Layout pattern | Change |
|---|---|---|---|
| 0 | Announcement bar | Single-row marquee | unchanged; the trust source on mobile |
| 1 | Header | Compact single row | ≥44×44 tap targets; wishlist added to the drawer; wordmark hidden <sm (kept the monogram) |
| 2 | Trust badges | **Horizontal snap-scroller** (one row, scroll-snap, no truncation) | replaces the 2-col truncated grid |
| 3 | Hero | Full-bleed photo + bottom-anchored copy | single primary CTA, 2-line description clamp, price row, "+ Add" beside it, trust ticks hidden, indicators moved to the hero root and made gold + 44px targets, auto-rotation paused on mobile, glass card dropped on mobile (fixes the clipped box) |
| 4 | Scent marquee | Horizontal band | unchanged (intentional overflow) |
| 5 | Shop by mood | 2-col grid, 4:5 tiles | gradient overlay to `rgba(0,0,0,0.65)`, cream title + subtitle bottom-left, no overlap, whole tile tappable |
| 6 | Best sellers | **Horizontal snap-carousel, 1.3 cards** | 2-line names, wrapping price row, full-width "+ Add" ≥44px, price/button aligned across the row |
| 7 | Made by hand | Full-bleed band | brand fallback gradient behind the image, broken image hides itself instead of showing alt text |
| 8 | Editorial split | Stacked | unchanged apart from the rhythm scale |
| 9 | Customer love | Dark band | cream type via the token flip; 4.9 and review titles now legible |
| 10 | Subscribe | Card band | rhythm scale |
| 11 | Footer | Dark | cream brand name via the token flip; 44px social buttons |

**Products listing (`/products`)**

- Control row: on mobile, two equal buttons — **Filters (n)** and **Sort: …
  —**; Sort opens a bottom sheet (same pattern as the filter sheet) listing the
  six sort orders. Desktop keeps the current inline row.
- Product cards: wishlist icon button 44×44 on mobile (was 30×30), "Add"
  button ≥44px tall.
- Horizontal overflow (measured 686px on a 375px viewport) eliminated.

---

## 7. Motion

- One easing curve everywhere: `cubic-bezier(0.4, 0, 0.2, 1)` (existing).
- Hero auto-rotation: **paused below 768px**; hover-pause on desktop; manual
  slide indicators always available; `prefers-reduced-motion` disables the
  ken-burns scale and the copy fade (already the case) and stops rotation.
- Scroll-snap carousellers use native scroll (no JS-driven scroll), so they
  respect reduced motion and work with touch.

---

## 8. Effect intensity

**Quiet-to-balanced** (premium consumer retail): depth comes from the brand
grade, grain, hairline borders and the plum/cream surface changes — no
new decorative motion, no new shadows.

---

## 9. Minimum bar checklist

- [x] Signature move preserved (the pour / the flame gold accent on plum).
- [x] Hero is not centred-headline-and-two-buttons (asymmetric split, one CTA).
- [x] ≥5 distinct section layouts; no layout repeated twice in a row.
- [x] Depth techniques: film grain, soft-light brand grade, hairline borders,
      plum surface change, radial washes.
- [x] Load sequence (copy fade) + scroll/hover behaviours (card lift, image
      zoom, arrow slide, marquee, scroll-snap).
- [x] Motif (gold on plum) in ≥3 places.
- [x] One standout below the fold (the full-bleed "Made by hand" band).
- [x] Designed footer (kept).

---

## 10. Verification

Screenshots at **1440 / 1280 / 414 / 390 / 375 / 360** px, scored with the
DESIGN-MAPPING §7 rubric, plus a programmatic check for horizontal overflow
and console errors on every page captured.

---

# Pass 4 (2026-11-27) — mobile "Explore the scents" row becomes a marquee

**Owner-supplied concept** (no pitch needed): keep the chip design exactly as
shipped in pass 3 and make the row move. Direction carried forward unchanged.

## Behaviour spec (mobile, <768px)

| Aspect | Decision |
|---|---|
| Loop | Continuous and seamless: two identical groups; the track animates `translate3d(-50%) → 0`, so one cycle is exactly one group |
| Motion | CSS `transform` animation, linear, GPU-composited (`will-change: transform`). Never `scrollLeft` |
| Speed | 35 px/s (top of the 30–35 range, closest to the "~8–10 s to cross 375 px" target: 375 ÷ 35 ≈ 10.7 s) |
| Direction | Rightward (enters left, exits right) — the opposite of the trust-badge marquee above the hero, which travels left |
| Pause | pointer down on the row · hover (mouse) · keyboard focus inside the row · row off-screen (IntersectionObserver) · tab hidden |
| Resume | 2 s after release / pointer leave / blur; immediately when scrolled back into view or the tab is shown again |
| Drag | Follows the finger 1:1 (wraps around the loop); resumes from where it was left, via a negative `animation-delay`, so there is no jump |
| Tap vs drag | A press that moves ≥6 px is a drag: its click is swallowed. A tap navigates as before |
| Keyboard | Focus pauses the track and shifts it so the focused chip sits fully inside the row (8 px inset) |
| Edges | No mask-image, no overlay: chips simply slide off the screen edge |
| Reduced motion | No animation: the static, swipeable, scroll-snapped row from pass 3 (one list) |
| A11y | Region labelled "Explore the scents"; the second group is `aria-hidden` with its links at `tabindex=-1` |
| Desktop | Unchanged |

## Implementation notes (as built)

- Plain 2D transforms throughout (`translateX`), in the keyframes and when
  parked, so every browser reports the position in the same flat form. The
  parser reads only the numbers inside the brackets — fishing for digits in
  the whole string counts the "3" in `matrix3d`, which is what WebKit
  reports, and would have made every pause on an iPhone snap the row back.
- One cycle is one **group**. Its width is measured after the fonts settle
  and the duration is `groupWidth ÷ 35`. A group holds as many copies of
  the list as it needs to span the row (one copy for a normal list; two to
  four when the shop has only one or two scents), so the right edge never
  runs empty and the speed never changes.
- Only the very first copy of the list is exposed: the second group, and
  any repeat inside the first, are `aria-hidden` with `tabindex=-1` links.
- Pausing reads the track's computed transform and parks it there as an
  inline transform; resuming converts that offset into a negative delay.
- A track that is already moving is never restarted: a restart begins from
  the parked offset, which is stale once it is moving, and would snap it
  back to wherever it was last paused. (The row's start can fire twice —
  the fonts promise and a fallback timer — and did exactly that for a
  fraction of a second on a cold load before this rule.)
- The row uses `overflow: clip` (with `hidden` as fallback) so focus
  navigation cannot scroll it behind the transform's back.
- Keyboard focus shifts the track by the distance taken from the focused
  chip's own position, without wrapping round the loop, so the chip that
  holds the focus ring is the one on screen rather than its twin.
- A press parks the track *before* it records where the drag starts.
- With 12px gaps there is no way to touch the row without touching a chip:
  browsers retarget a tap within a few pixels of a link onto that link. A
  press that moves 6px or more is a drag, and its click is swallowed.
- Pure arithmetic lives in `frontend/utils/scentMarquee.js`
  (`parseTranslateX`, `copiesThatSpan`) and is unit-tested.
