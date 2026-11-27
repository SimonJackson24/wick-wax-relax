# The honeybee — icon spec (trust strip)

**Client:** Wick Wax & Relax · **Date:** 2026-11-27
**Scope:** one pictogram — the "Ethical Beeswax" badge in
`frontend/components/TrustBadges.js`, which renders on the homepage and the
product page. Nothing else on the page changes.
**Type:** an addition inside the existing "The Ritual" system. Direction,
palette, type, hero and signature move are carried forward unchanged, as in
the three entries before this one.

---

## 1. Brief

> "the ethical beeswax icon should be a honeybee icon" — Simon, 2026-11-27

**Finding.** The badge used MUI's `EnergySavingsLeaf` — the same icon as
"Sustainable Wax" directly beside it, so the six-badge strip showed five
different icons. MUI has no bee (`Hive`, `Hexagon` and `Api` are the nearest),
so the honeybee is drawn for this strip.

**What makes it hard.** The strip renders its icons at **17px**. A design
that reads at 200px can turn to fuzz at 17px on a standard display, so every
candidate was judged at real size, at 1x and at 2x, before anything else.

---

## 2. Brand DNA → decisions

| Element | Derived from | Decision |
|---|---|---|
| Subject | BRAND.md §3 *"Beeswax (ethical, queen bees' wings intact)"* and the badge's own tooltip, *"Queen bees kept with intact wings"* | The bee seen from above with **both wings held out whole** — the wings are the promise |
| Not this | BRAND.md §10 Avoid: *"Beeswax-clipart"*, *"Emoji as icons"* | No face, no smile, no flight path, no yellow-and-black. One colour, like its neighbours |
| Construction | The five icons already in the strip (Material, filled): the leaf with its bolt, the globe with its continents, the lock with its keyhole | **One solid silhouette with the stripes cut out** — not a bee assembled from parts |
| Colour | Existing brand colour | The strip's plum `#3D2B3D`, through `currentColor`. No new token |
| Grid | Material's 24-unit grid, 20-unit live area | Bounds x 2.8–21.2, y 1.4–21.7 (for scale: MUI's `Lock` spans y 1–23) |

---

## 3. Concepts pitched

| | **A — The Worker** (chosen) | B — The Forager | C — The Cell |
|---|---|---|---|
| Brand DNA | "Queen bees kept with intact wings" | The bee at work, as a field guide draws it | Beeswax = the comb: the bee inside its cell |
| View | From above, symmetric | Side profile, in flight | Cut out of a solid hexagon |
| Standard display (1x) | Body, wings and stripes read | **Blurs to a smudge** | Crispest of the three |
| Weight beside the other five | Closest match | Much lighter and smaller | Far heavier — a badge, not an icon |
| At 17px | A honeybee on every screen | A honeybee only on high-density screens | A honeycomb badge; the bee is a suggestion |

**Why A.** The only concept that is unmistakably a honeybee at 17px on every
screen density *and* built the same way as its five neighbours. C would make
"Ethical Beeswax" shout in a strip where all six promises are equal; B fails
on standard displays.

Sheet: `shots/honeybee-concepts.png`.

**References — principles only, no artwork copied. Every path is drawn from
scratch on the Material grid.**

| Reference | Observation | What was taken |
|---|---|---|
| The strip's own five icons | Each is one bold mass; detail comes from one or two negative-space cut-outs, nothing thinner than about one grid unit survives at 17px | Build the bee as one silhouette with the stripes as gaps |
| Carbon, gg (via Iconify) | A symmetric bee seen from above keeps its shape when small; a profile does not | Symmetry about the vertical axis |
| Icon Park (solid) | Teardrop wings read as a bee while the abdomen stays the dominant mass | Teardrop wings; the abdomen is the largest part |
| Fluent, high-contrast | Wings larger than the head; a tapered abdomen says honeybee rather than bumblebee | Wings wider than the head; a tapered, blunted rear |

Study sheet: `references/_industry/home-fragrance-candles/bee-pictograms.png`.

**Three dead ends worth recording.** Wings raised in a V (44°) read as a moth;
wings held out at 30° read as a bee. A bee built from separate discs (head
circle, thorax circle, striped bands) reads spindly and fly-like. Short thick
antennae read as ears; long thin ones read as antennae.

---

## 4. Anatomy (grid units on the 24-grid)

| Part | Measurement |
|---|---|
| Head | Dome, radius 1.95, top at y 3.2 |
| Antennae | Two round-capped strokes 1.3 wide, from inside the head to (±2.75, y 1.4) |
| Neck, waist | Soft notches — half-width 1.64 at y 6.95, 2.45 at y 10.9 |
| Thorax | Widest, half-width 2.7, at y 8.9 |
| Abdomen | Widest, half-width 3.8, at y 13.9 |
| Stripes | Two gaps 1.15 wide, centred at y 14.9 and y 17.6; each cut edge bows 0.3 toward the rear so every band reads as a segment |
| Rear | Rounded, radius 1.25 |
| Wings | Teardrops 6.3 long × 3.7 wide, held 30° above horizontal, 0.62 clear of the thorax — measured from the back of the wing's rounded base so the gap stays even |

**Path structure.** One `<path>` holding five filled sub-paths (the body above
the first stripe, the middle band, the rear, the two wings) and one stroked
`<path>` for both antennae — about 1.2 KB.

```jsx
const HoneybeeIcon = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="…five sub-paths…" />
    <path d="…both antennae…" fill="none" stroke="currentColor"
      strokeWidth={1.3} strokeLinecap="round" />
  </SvgIcon>
);
```

`{...props}` forwards the strip's `sx`, so the bee takes its 17px size and its
plum from exactly the line the five Material icons use.

---

## 5. Behaviour at size

The strip is the only place this icon is used, at 17px.

| Display | What reads |
|---|---|
| Standard (1x) | Body, both wings and both stripes. The antennae are thinner than a pixel and render faint — the same way the leaf's thin stem already does beside it |
| High-density (2x and up — most phones, all recent laptops) | Everything, including the antennae |

Checked by rasterising the real SVG at 17px on a 1x canvas and enlarging it
without smoothing, next to the leaf, the globe, the paw and the lock at the
same size.

---

## 6. Motion and accessibility

- **Decorative.** `aria-hidden="true"`, like the five MUI icons beside it; the
  label carries the meaning and the tooltip carries the detail.
- **Reduced motion.** The strip stops its marquee and becomes a swipeable row.
  Fixed in the same commit series: the row now sets
  `scroll-padding-left: 20px`. Each copy of the list snaps to the edge of the
  row, and that used to scroll straight past the track's 20px inset — and the
  first 20px is the edge fade — so the first badge sat flush against the
  screen edge, clipped and half transparent. The leaf had the same fault on the
  live site; the bee's wing made it obvious.

---

## 7. Verification

Production build of `d137945e4` + this change, built in an isolated copy of
the frontend (another session was using the checkout's `.next` at the time),
with real product data, served locally. Build id `HrPyym8tfffgQngplZ87B`.

| Check | Result |
|---|---|
| Jest | **34 / 34** — the 29 already there plus 5 new in `__tests__/trustBadges.test.js` |
| axe (WCAG 2.0 A/AA, 2.1 A/AA, best-practice), homepage | **0 violations** at 1440 and 390, with motion and with reduced motion |
| Layout | Bee 17 × 17 in the leaf's exact slot (x 152, y 125.8 at 1440); strip 37.5px before and after; no horizontal overflow at either width |
| Colour | Computed fill `rgb(61, 43, 61)` = plum `#3D2B3D` |
| Sustainable Wax | Still the leaf — the test asserts it |
| Reduced motion | First badge at x **20** on the homepage (was 0) and x **36** on the product page's inset strip (was 16) |
| Product page | Same axe violations before and after — colour contrast on cards, one heading order, landmarks — **none inside the trust strip** |

Before/after pairs: `shots/honeybee-{before,after}-strip-1440-2x.png` and
`shots/honeybee-{before,after}-strip-390.png`. Measurements:
`shots/honeybee-capture-report.json`.

---

## 8. Scorecard — DESIGN-MAPPING §7, on the 1440 and 390 screenshots

Pass mark is 4 on every line.

| Criterion | Score | Evidence |
|---|---|---|
| Uniqueness | 4 | "What does the room need tonight?", the cure story and "Twelve candles a batch. Never more." are this brand's own. The generic "Bath Bliss" placeholder artwork on two sections is what keeps it off a 5 |
| Fit | 4 | First screen at 1440: candle-lit plum hero, "Hand-poured in small batches", the price and one call to action — premium home fragrance. The bee now makes the beeswax promise literal |
| Typography | 4 | Playfair display at roughly 80px against 11px tracked overlines. Unchanged in this pass |
| Depth and craft | 4 | Layered card shadows, the dark glass card over the photograph, film grain, hairline strip borders. Unchanged |
| Layout variety | 4 | Hero split → four mood tiles → product row → full-bleed band → editorial split → dark proof band. Five best sellers wrap 4 + 1 on desktop and leave one card alone (pre-existing) |
| Motion | 4 | Hero cross-fade, trust marquee and scroll reveals unchanged. Under reduced motion the strip is now a still row that starts at the gutter |
| Finish | 4 | Six badges, six different icons — it was five, because the leaf did two jobs. The bee is drawn in the same filled, single-colour family. Antennae are faint on a 1x display |
| Mobile | 5 | Composed for the phone: stacked hero with the call to action above the fold at 390 × 844 (its bottom edge measured at 827.9), a 1.3-card rail. With reduce-motion on, the bee is whole at the 20px gutter — it was clipped at 0 |

**Automatic fails:** none. No emoji as icons; no invented content added.

---

## 9. Seen, not touched

Pre-existing, outside this change, and already known unless marked new:

- `/images/bath-scene.svg` — placeholder artwork reading "Bath Bliss /
  Therapeutic Bath Experience" — still backs the "Made by hand" band and the
  "How we pour" image. Flagged in the first mobile pass; it needs the real
  studio photo.
- Product page axe violations (section 7): colour contrast on the cards, one
  heading order, missing main landmark, unlabelled regions.
- Footer placeholders: `[registered address]`, `[company number]`,
  `VAT [GB000000000]`.
- Five best sellers wrap 4 + 1 on desktop.
