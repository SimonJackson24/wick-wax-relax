# Scorecard — mobile-first polish pass (DESIGN-MAPPING §7)

Scored on the rendered screenshots, not on the code. Pass mark is 4 on every
line. Captures were taken at 1440, 1280, 414, 390, 375 and 360 px against a
production build, before and after; the before/after pairs that matter are in
`shots/` next to this file.

| Criterion | Score | Evidence |
|---|---|---|
| **Uniqueness** | 4 | The plum/cream + Playfair + gold-on-plum system, the scent marquee, the "now pouring" glass card and the mood-tile positioning are all this client's own; a competitor's logo could not be dropped in. Held at 4 because this pass deliberately preserved the identity instead of strengthening it — that was the brief. |
| **Fit** | 4 | At 360–414px the first screen states what it sells ("Hand-poured in small batches · Lavender Dream · Lavender · Clary sage · Vetiver, cedar"), shows £12.00 with the RRP and a "Save 20%" chip, and puts "Shop this scent" above the fold. Held at 4 by the demo artwork in "Made by hand" — a stock placeholder, not the studio photo. |
| **Typography** | 4 | Playfair display / Montserrat UI, one tracked eyebrow per section, prices in tabular sans, the hero stepping down to 2.25–2.9rem on a phone. The hero scent name and the card title are close enough in weight that the two compete slightly. |
| **Depth and craft** | 4 | Every photograph carries the soft-light brand grade + film grain; the plum duotone wash sits over the band and the split; hairline borders instead of shadows; the glass card on desktop. The placeholder artwork caps the depth in two sections. |
| **Layout variety** | 4 | Split hero → marquee → 2-up mood grid → snap rail → full-bleed band → editorial split → dark proof band → card → footer. No layout repeats twice in a row; the rail and the mood grid are both image-led. |
| **Motion** | 4 | Desktop hero cross-fade with the slow ken-burns, marquee, card lift + image zoom, arrow slide, native scroll-snap. Mobile is deliberately still (rotation off), so there is no orchestrated mobile load sequence. |
| **Finish** | 4 | axe-core clean at 375 and 1440 (0 violations, WCAG 2.0/2.1 A + AA + best practice), every measured tap target ≥44px, focus rings on, focusable scroll regions, one h1 per page, designed footer. /products still has no site header/footer (pre-existing) and its sheets are plain. |
| **Mobile** | 5 | CTA above the fold at 360/375/390/414 (CTA bottom 713/738/763/804 vs 780/812/844/896 viewports); hero 78vh; trust strip a swipeable row; best sellers a 1.3-card rail; 2-line names; full-width Add; no horizontal overflow anywhere; body copy ≥16px. |

**Automatic fails:** none — no centred hero with two buttons, no second row of
identical cards, no emoji icons, no invented testimonials or numbers, no grey
placeholder boxes in the built surfaces.

**Measured checks**

| Check | Result |
|---|---|
| Horizontal overflow | 0px at 360/375/390/414/1280/1440 (was 686px on /products at 375) |
| axe-core (WCAG A+AA+best practice) | 0 violations on / and /products at 375 and 1440 |
| Hero CTA visible without scrolling | 360 ✓ 375 ✓ 390 ✓ 414 ✓ |
| Tap targets | cart 48×48, menu 48×48, drawer close 44×44, slide indicators 44×44, hero CTA 250×58, product Add 44px tall — all ≥44 |
| Hero height | 78vh at every width (desktop unchanged) |
| Headings | exactly one h1 per page; h1 → h2 → h3, no skipped levels |

**Repo test suite**

`npm test` could not even start before this pass (`jest.config.js` pointed at
a `jest.accessibility.js` that was never committed, and the MUI barrel import
transform rewrote imports to deep paths the installed MUI 5.18 does not
have). Restored: the shared axe config now exists, the jsdom polyfills in
`jest.setup.js` are wired in, the Playwright e2e specs are no longer
collected by Jest, and the tests render the components with the app's real
theme. Result: **13/13 pass**, covering Navigation, PremiumHero and
ProductCard for axe violations, landmarks, ARIA and the focus ring.

**Known limits (content, not design)**

- `/images/bath-scene.svg` is a stock placeholder — a violet gradient with the
  words "Bath Bliss / Therapeutic Bath Experience" — used for both the
  "Made by hand" band and the editorial split. It is now duotoned into the
  brand and degrades to a designed plum/amber panel if it fails to load, but
  it still needs the real studio photograph.
- Product names carry the seed prefix "Showcase: " because the catalogue is
  demo data and content was out of scope for this pass.
- `/products` renders no site header or footer (pre-existing, not introduced
  here) — worth a separate fix.


---

# Pass 4 (2026-11-27) — mobile "Explore the scents" marquee

Scored on the rendered build at 375px (filmstrip, five-stage stills and an
11-second recording in `shots/pass4-*`), plus 1280px to confirm no change.

| Criterion | Score | Evidence |
|---|---|---|
| Uniqueness | 4 | Unchanged: the client's own system. The row now moves the opposite way to the trust band, which is a deliberate pairing rather than a stock ticker. |
| Fit | 4 | Five scents drift past at reading pace; a finger stops them instantly and can drag them; a tap opens the product. |
| Typography | 4 | Unchanged: italic Playfair 17px chips, measured on the built page. |
| Depth and craft | 4 | Unchanged chip design; motion is a single composited transform with no edge treatment. |
| Layout variety | 4 | Unchanged section order. The two bands between header and content now read as a pair moving in counterpoint: cream and leftward, plum and rightward. |
| Motion | 5 | 34.6–35.1 px/s measured, linear, steady; rightward while the trust marquee goes left. Pauses on press, hover, focus, off-screen and hidden tab; drag follows the finger 1:1 and resumes from that exact offset; no backward step across a cold load and a whole loop. |
| Finish | 4 | Focus brings its own chip on screen (8px inset); reduced motion falls back to the swipeable row; axe clean at 375, 390, 414, 1280 and under reduced motion; 68 browser checks and 29 jest tests pass. Held at 4: real-device iOS/Safari was not available, so WebKit behaviour is reasoned from the spec and unit tests, not observed. |
| Mobile | 5 | Chips 44px, swatch 34px, 12px at every gap including the loop seam, no horizontal overflow at 360/375/390/414/767. |

**Automatic fails:** none.

**Measured**

| Check | Result |
|---|---|
| Loop | two identical groups (936.2px each); track exactly two groups wide; 12px between chips, at the copy seam and after the last chip |
| Speed and direction | 34.6–35.1 px/s, every step forward; chips travel left to right; trust marquee travels left |
| Press (mouse, in a gap) | held at −925.7px for 1.3s; still at 1.5s after release; moving by 2.8s from that same offset |
| Touch drag on a chip | −910.5 → −174.3 for a 200px left drag (exact); no link followed; page did not scroll; still for 2s; then carried on from −174.3 |
| Keyboard | Tab focused "Lavender Dream", froze the track, chip at 8–188px; a chip 578px off-screen was brought to 207–367px |
| Off-screen / hidden tab | paused, no creep, resumed |
| Tap | opened the product page |
| Reduced motion | no animation anywhere on the page; one list of chips; swipe scrolls it |
| Short list (1 and 2 scents) | group repeats 1–4× as the width requires; 35.0 px/s; never an empty edge across a whole loop; exactly the real scents tabbable |
| Desktop 1280 | mobile row hidden and never animated; name marquee unchanged (26s, 26px, 10 links, no mask, 72px plum fades) |

**Bugs this pass found and fixed in its own work before shipping**

1. Every drag jumped: the start position was read before the track was parked.
2. Keyboard focus revealed a chip's identical twin instead of the focused chip, leaving no visible focus ring.
3. Short lists would have scrolled 2–4× too fast: the loop period was taken as one copy rather than one group.
4. On WebKit every pause would have snapped the row back: the transform parser counted the "3" in `matrix3d`.
5. A cold load snapped the row back ~24px: the start could fire twice and restart a moving track from a stale offset.
6. Repeats inside the first group were in the tab order.
