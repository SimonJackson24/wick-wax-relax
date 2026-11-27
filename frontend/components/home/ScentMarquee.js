import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { copiesThatSpan, parseTranslateX } from '../../utils/scentMarquee';

// The scent band — one component, two behaviours.
//
// MOBILE (<768px): a slow marquee of scent chips — a round swatch from the
// product photograph and the scent's name, linking to each product. It moves
// RIGHT, the opposite way to the trust-badge marquee above the hero, so the
// two bands never read as one repeated effect. It stops the moment a finger
// or a pointer lands on it, can be dragged, carries on from wherever it was
// left, and stops while it is off-screen or the tab is hidden. No edge
// fade: chips simply slide off the screen edge.
//
// DESKTOP (>=768px): the name marquee, unchanged. Its edge fade is two
// overlays in the strip's own plum (never a mask-image, which showed the
// cream page through the band), pointer-events: none.
//
// prefers-reduced-motion: no animation at either size — a static, swipeable
// row with scroll-snap.

const DEFAULT_SCENTS = [
  { name: 'Lavender Dream', slug: 'lavender-dream', image: '/images/products/lavender-dream.jpg' },
  { name: 'Fireside Vanilla', slug: 'fireside-vanilla', image: '/images/products/fireside-vanilla.jpg' },
  { name: 'Midnight Jasmine', slug: 'midnight-jasmine', image: '/images/products/midnight-jasmine.jpg' },
  { name: 'Amber & Oak', slug: 'amber-and-oak', image: '/images/products/amber-and-oak.jpg' },
  { name: 'Sea Salt & Sage', slug: 'sea-salt-and-sage', image: '/images/products/sea-salt-and-sage.jpg' },
  { name: 'Blood Orange & Fig', slug: 'blood-orange-and-fig', image: '/images/products/blood-orange-and-fig.jpg' },
  { name: 'Rose Cashmere', slug: 'rose-cashmere', image: '/images/products/rose-cashmere.jpg' },
  { name: 'Sandalwood Smoke', slug: 'sandalwood-smoke', image: '/images/products/sandalwood-smoke.jpg' },
];

const PLUM = '#3D2B3D';

// Desktop: one loop ≈ the width of one copy. 26s keeps a name on screen
// long enough to read at this size.
const DESKTOP_LOOP_SECONDS = 26;

// Mobile marquee.
const MOBILE_SPEED = 35; // px per second, linear
const RESUME_DELAY = 2000; // ms after a release, a pointer leave or a blur
const DRAG_THRESHOLD = 6; // px before a press counts as a drag
const FOCUS_INSET = 8; // px the focused chip is kept inside the row by
const TRACK_KEYFRAMES = 'wwr-scent-track';

// One chip: a 34px round swatch from the product photograph plus the scent's
// name in italic Playfair. The design is pass 3's, unchanged.
const chipSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25, // 10px
  // 44px minimum tap target; 14–16px horizontal padding.
  minHeight: 44,
  pl: '5px',
  pr: 1.75,
  py: 0.5,
  flex: '0 0 auto',
  textDecoration: 'none',
  color: '#F4EFE7',
  backgroundColor: 'rgba(244,239,231,0.05)',
  border: '1px solid rgba(244,239,231,0.28)',
  borderRadius: 999,
  transition: 'background-color 200ms ease-out, border-color 200ms ease-out',
  '&:hover': {
    backgroundColor: 'rgba(244,239,231,0.11)',
    borderColor: 'rgba(244,239,231,0.55)',
  },
  '&:focus-visible': {
    outline: '2px solid #E6C88A',
    outlineOffset: 2,
    borderColor: '#E6C88A',
  },
};

const Chip = ({ scent, inert, snap }) => (
  <Box
    component={Link}
    href={scent.slug ? `/product/${scent.slug}` : '/products'}
    tabIndex={inert ? -1 : undefined}
    // A native image/link drag would hijack a mouse drag on the row.
    draggable={false}
    sx={snap ? { ...chipSx, scrollSnapAlign: 'start' } : chipSx}
  >
    {scent.image ? (
      <Box
        component="img"
        src={scent.image}
        alt=""
        loading="lazy"
        width={34}
        height={34}
        draggable={false}
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
          // A hairline between the swatch and the chip.
          boxShadow: '0 0 0 1px rgba(244,239,231,0.35)',
        }}
      />
    ) : (
      <Box
        aria-hidden
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          flexShrink: 0,
          // No photograph: a quiet gold disc stands in.
          background: 'radial-gradient(circle at 35% 30%, #F0D6A0, #C9A24E)',
          boxShadow: '0 0 0 1px rgba(244,239,231,0.35)',
        }}
      />
    )}
    <Typography
      component="span"
      sx={{
        fontFamily: '"Playfair Display", serif',
        fontStyle: 'italic',
        fontSize: '1.0625rem', // 17px
        lineHeight: 1.15,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        color: 'inherit',
      }}
    >
      {scent.name}
    </Typography>
  </Box>
);

/**
 * The mobile row. Two structures share the chips:
 *  - marquee (default): row > track > two identical groups, the track moved
 *    by a CSS transform animation;
 *  - reduced motion: the static, swipeable row.
 *
 * All of the motion state lives in refs. A pointer move must not re-render,
 * and nothing here needs to be rendered — the track's animation and
 * transform are written to its inline style directly.
 */
const MobileChipRow = ({ scents, reduceMotion }) => {
  const marquee = !reduceMotion;
  const rowRef = useRef(null);
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const copyRef = useRef(null);
  const periodRef = useRef(0); // width of one GROUP in px — the loop's period
  const repeatsRef = useRef(1); // copies of the list per group
  // Where the track is parked while paused. Normally in (-period, 0]; it may
  // sit just past 0 while parked for a focused chip.
  const xRef = useRef(0);
  const dragRef = useRef(null);
  const suppressRef = useRef(false); // swallow the click that follows a drag
  const suppressTimer = useRef(null);
  const resumeTimer = useRef(null);
  const holdUntilRef = useRef(0);
  const reducedRef = useRef(reduceMotion);
  // Everything that can stop the track.
  const flags = useRef({
    ready: false, inView: false, hidden: false, press: false, hover: false, focus: false,
  });
  const [repeats, setRepeats] = useState(1);

  // Keep a dragged offset inside one loop: (-period, 0]. Both ends look
  // identical because the two groups are the same.
  const wrap = useCallback((x) => {
    const period = periodRef.current;
    if (!period) return x;
    const into = ((-x) % period + period) % period;
    return -into;
  }, []);

  // Where the track is right now, read from its computed transform — this
  // includes the mid-animation position. Deliberately not wrapped: while it
  // is parked for a focused chip the track may legitimately sit just past
  // 0, and wrapping here would move that chip off-screen.
  const readX = useCallback(() => {
    const track = trackRef.current;
    if (!track) return xRef.current;
    const tx = parseTranslateX(window.getComputedStyle(track).transform);
    return tx === null ? xRef.current : tx;
  }, []);

  const park = useCallback((x) => {
    const track = trackRef.current;
    if (!track) return;
    xRef.current = x;
    track.style.transform = `translateX(${x}px)`;
  }, []);

  // Stop exactly where the track is. (Plain 2D transforms throughout, so
  // every browser reports the position in the same flat form.)
  const freeze = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const x = readX();
    track.style.animation = 'none';
    park(x);
  }, [readX, park]);

  // Carry on from where the track was parked: the parked offset becomes a
  // negative animation-delay, so nothing jumps.
  const play = useCallback(() => {
    const track = trackRef.current;
    const period = periodRef.current;
    if (!track || reducedRef.current || !period) return;
    const duration = period / MOBILE_SPEED;
    const elapsed = ((xRef.current + period) / period) * duration;
    track.style.animation = 'none';
    void track.offsetWidth; // flush, so the animation restarts cleanly
    track.style.animation = `${TRACK_KEYFRAMES} ${duration}s linear infinite`;
    track.style.animationDelay = `${-elapsed}s`;
  }, []);

  // True while the animation is applied (freeze() and stop() clear it).
  const isRunning = useCallback(() => {
    const track = trackRef.current;
    if (!track) return false;
    const name = track.style.animationName;
    return !!name && name !== 'none';
  }, []);

  const canRun = useCallback(() => {
    const f = flags.current;
    return f.ready && f.inView && !f.hidden && !f.press && !f.hover && !f.focus
      && !reducedRef.current && !dragRef.current;
  }, []);

  // Reconcile: run if allowed (after any hold), otherwise freeze.
  const sync = useCallback(() => {
    window.clearTimeout(resumeTimer.current);
    if (!canRun()) {
      freeze();
      return;
    }
    const wait = Math.max(0, holdUntilRef.current - Date.now());
    // Already moving? Leave it alone. play() starts from the parked offset,
    // which is stale while the track is running — restarting would snap it
    // back to wherever it was last paused.
    if (wait > 0) {
      freeze();
      resumeTimer.current = window.setTimeout(() => {
        if (canRun() && !isRunning()) play();
      }, wait);
      return;
    }
    if (!isRunning()) play();
  }, [canRun, freeze, play, isRunning]);

  const hold = useCallback((ms) => {
    holdUntilRef.current = Math.max(holdUntilRef.current, Date.now() + ms);
  }, []);

  const stop = useCallback(() => {
    window.clearTimeout(resumeTimer.current);
    window.clearTimeout(suppressTimer.current);
    suppressRef.current = false;
    dragRef.current = null;
    const track = trackRef.current;
    if (track) track.style.animation = 'none';
  }, []);

  // Measure the row. One copy's width decides how many times a group has to
  // repeat the list; the GROUP's width is the loop's period, so the duration
  // follows from it. Returns true when that period changed, in which case
  // the animation is restarted from the current spot.
  const measure = useCallback(() => {
    const group = groupRef.current;
    const copy = copyRef.current;
    const row = rowRef.current;
    if (!group || !copy || !row) return false;
    const copyWidth = copy.getBoundingClientRect().width;
    if (!copyWidth) return false; // not laid out (desktop, where the row is hidden)
    // A group has to span the whole row, or the right edge would run empty
    // for part of the loop when the list is short.
    const need = copiesThatSpan(row.clientWidth, copyWidth);
    if (need !== repeatsRef.current) {
      repeatsRef.current = need;
      setRepeats(need);
    }
    const period = group.getBoundingClientRect().width;
    const changed = Math.abs(period - periodRef.current) > 0.5;
    periodRef.current = period;
    return changed;
  }, []);

  // The number of repeats changed the group's width: measure again.
  useEffect(() => {
    if (!marquee) return;
    if (measure()) {
      freeze();
      sync();
    }
  }, [marquee, repeats, measure, freeze, sync]);

  // --- motion preference -------------------------------------------------
  useEffect(() => {
    reducedRef.current = reduceMotion;
    if (marquee) {
      measure();
      sync();
    } else {
      stop();
    }
  }, [marquee, reduceMotion, measure, sync, stop]);

  // --- start once the fonts have settled (they set the chips' widths) -----
  useEffect(() => {
    if (!marquee) return undefined;
    let cancelled = false;
    let settled = false;
    const settle = () => {
      // Both the fonts promise and the fallback timer end up here.
      if (cancelled || settled) return;
      settled = true;
      measure();
      flags.current.ready = true;
      sync();
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(settle, settle);
    }
    // If font loading never settles, start anyway.
    const fallback = window.setTimeout(settle, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [marquee, measure, sync]);

  // --- only move while the row is on screen ------------------------------
  useEffect(() => {
    if (!marquee) return undefined;
    const row = rowRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') {
      flags.current.inView = true;
      sync();
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        flags.current.inView = entry.isIntersecting;
        if (entry.isIntersecting) measure();
      });
      sync();
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [marquee, measure, sync]);

  // --- chip widths changed (font swap, orientation, resize) --------------
  useEffect(() => {
    if (!marquee) return undefined;
    const copy = copyRef.current;
    if (!copy || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (measure()) {
        freeze();
        sync();
      }
    });
    observer.observe(copy);
    return () => observer.disconnect();
  }, [marquee, measure, freeze, sync]);

  // --- only move while the tab is visible --------------------------------
  useEffect(() => {
    if (!marquee) return undefined;
    const onVisibility = () => {
      flags.current.hidden = document.hidden;
      sync();
    };
    flags.current.hidden = document.hidden;
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [marquee, sync]);

  useEffect(() => () => {
    window.clearTimeout(resumeTimer.current);
    window.clearTimeout(suppressTimer.current);
  }, []);

  // --- pointer ------------------------------------------------------------
  const onPointerDown = (event) => {
    if (!event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    window.clearTimeout(suppressTimer.current);
    suppressRef.current = false;
    // Park the track FIRST, so the drag is measured from where the track
    // really is (reading the parked offset before this would give a stale
    // one, and every drag would jump).
    freeze();
    dragRef.current = { id: event.pointerId, startX: event.clientX, baseX: xRef.current, moved: false };
    flags.current.press = true;
    sync();
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      drag.moved = true;
      const row = rowRef.current;
      row.dataset.dragging = 'true';
      try {
        // From here the pointer may leave the row without losing the drag.
        row.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an enhancement; the drag still works inside the row.
      }
    }
    park(wrap(drag.baseX + delta));
  };

  const endDrag = (event, cancelled) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const row = rowRef.current;
    if (row) delete row.dataset.dragging;
    flags.current.press = false;
    if (drag.moved && !cancelled) {
      // The browser still fires a click at the link the drag began on.
      suppressRef.current = true;
      window.clearTimeout(suppressTimer.current);
      suppressTimer.current = window.setTimeout(() => {
        suppressRef.current = false;
      }, 500);
    }
    // A drag wraps round the loop; put a chip that still holds the focus
    // back on screen.
    const active = row ? row.ownerDocument.activeElement : null;
    if (active && row && row.contains(active)) reveal(active);
    hold(RESUME_DELAY);
    sync();
  };

  const onPointerUp = (event) => endDrag(event, false);
  const onPointerCancel = (event) => endDrag(event, true);

  const onClickCapture = (event) => {
    if (!suppressRef.current) return;
    suppressRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  // --- hover (devices that can hover) -------------------------------------
  const onPointerEnter = (event) => {
    if (event.pointerType !== 'mouse') return;
    flags.current.hover = true;
    sync();
  };

  const onPointerLeave = (event) => {
    if (event.pointerType !== 'mouse') return;
    flags.current.hover = false;
    hold(RESUME_DELAY);
    sync();
  };

  // --- keyboard -------------------------------------------------------------
  // Bring a chip fully inside the row. The shift is worked out from the
  // chip's own position and applied WITHOUT wrapping round the loop, so the
  // chip that holds the focus (and its focus ring) is the one on screen —
  // not its identical twin in the other group.
  const reveal = useCallback((chip) => {
    const row = rowRef.current;
    if (!chip || !row) return;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    let shift = 0;
    if (chipBox.left < rowBox.left + FOCUS_INSET) {
      shift = rowBox.left + FOCUS_INSET - chipBox.left;
    } else if (chipBox.right > rowBox.right - FOCUS_INSET) {
      shift = rowBox.right - FOCUS_INSET - chipBox.right;
    }
    if (shift) park(xRef.current + shift);
  }, [park]);

  const onFocusCapture = (event) => {
    flags.current.focus = true;
    sync(); // freezes where the track is
    reveal(event.target.closest ? event.target.closest('a') : null);
  };

  const onBlurCapture = (event) => {
    const row = rowRef.current;
    // Focus moving between chips stays inside the row.
    if (row && event.relatedTarget && row.contains(event.relatedTarget)) return;
    flags.current.focus = false;
    hold(RESUME_DELAY);
    sync();
  };

  // Reduced motion: every chip is a link, so Tab already walks the row. The
  // arrow keys only move a horizontal overflow scroller ~40px natively, and
  // Home/End do nothing, so a keyboard user could not get along it quickly.
  // This keeps the focus on the row itself and scrolls it by a useful step.
  const onRowKeyDown = (event) => {
    const row = event.currentTarget;
    // Don't hijack keys pressed while a chip link is focused.
    if (event.target !== row) return;
    const step = Math.max(row.clientWidth * 0.8, 160);
    let next = null;
    if (event.key === 'ArrowRight') next = row.scrollLeft + step;
    else if (event.key === 'ArrowLeft') next = row.scrollLeft - step;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = row.scrollWidth;
    if (next === null) return;
    event.preventDefault();
    row.scrollTo({ left: next, behavior: 'auto' });
  };

  if (!marquee) {
    return (
      <Box
        data-scent-row
        role="group"
        aria-label="Explore the scents — scroll for more"
        tabIndex={0}
        onKeyDown={onRowKeyDown}
        sx={{
          display: 'flex',
          gap: 1.5, // 12px
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          // The first chip starts at the gutter; the row bleeds to the
          // screen edge so the last chip runs off it.
          px: 2.5,
          scrollPaddingLeft: 20,
          scrollSnapType: 'x proximity',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          '&:focus-visible': { outline: '2px solid #E6C88A', outlineOffset: -2 },
        }}
      >
        {scents.map((scent) => (
          <Chip key={scent.slug || scent.name} scent={scent} snap />
        ))}
      </Box>
    );
  }

  return (
    <Box
      ref={rowRef}
      data-scent-row
      role="group"
      aria-label="Explore the scents"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClickCapture={onClickCapture}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
      sx={{
        overflow: 'hidden',
        // `clip` also forbids being scrolled by focus navigation, which
        // would shift the track behind the transform's back.
        '@supports (overflow: clip)': { overflow: 'clip' },
        // Horizontal drags are ours; vertical swipes still scroll the page.
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        '&[data-dragging="true"] *': { cursor: 'grabbing' },
      }}
    >
      <Box
        ref={trackRef}
        data-scent-track
        sx={{
          display: 'flex',
          width: 'max-content',
          willChange: 'transform',
          // One cycle is exactly one group (-50% of the track), so the loop
          // has no seam. The track travels left to right.
          '@keyframes wwr-scent-track': {
            '0%': { transform: 'translateX(-50%)' },
            '100%': { transform: 'translateX(0)' },
          },
        }}
      >
        {[0, 1].map((group) => (
          <Box
            key={group}
            ref={group === 0 ? groupRef : undefined}
            aria-hidden={group === 1 ? 'true' : undefined}
            sx={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}
          >
            {Array.from({ length: repeats }).map((_, copyIndex) => {
              // Only the very first copy of the list is for everyone. When
              // the list is short a group repeats it, and those repeats —
              // like the whole second group — are duplicates: hidden from
              // assistive tech and out of the tab order.
              const duplicate = group !== 0 || copyIndex !== 0;
              return (
                <Box
                  key={copyIndex}
                  ref={group === 0 && copyIndex === 0 ? copyRef : undefined}
                  aria-hidden={duplicate ? 'true' : undefined}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5, // 12px
                    // The gap lives at the end of each copy, so the seam
                    // between copies is 12px like every other gap.
                    paddingRight: 1.5,
                  }}
                >
                  {scents.map((scent) => (
                    <Chip key={scent.slug || scent.name} scent={scent} inert={duplicate} />
                  ))}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const ScentMarquee = ({ items = [], speed }) => {
  const theme = useTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // The brief's breakpoint is 768px — MUI's `sm` starts at 600, so use
  // the same query the rest of the pass used rather than the theme key.
  const isMobile = useMediaQuery('(max-width: 767.95px)');

  const scents = (items.length ? items : DEFAULT_SCENTS).map((item) =>
    typeof item === 'string' ? { name: item, slug: null, image: null } : item
  );

  // One copy is enough when the strip is static; otherwise the list is
  // duplicated so the -50% loop is seamless.
  const copies = reduceMotion ? 1 : 2;
  const animate = !reduceMotion && !isMobile;
  const duration = speed || DESKTOP_LOOP_SECONDS;
  const itemGap = 4; // 32px around the separator

  return (
    <Box
      className="wwr-dark-surface"
      data-scent-strip
      component="section"
      aria-label="Explore the scents"
      sx={{
        // Mobile 20–24px / desktop 24px vertical.
        py: { xs: 2.5, md: 3 },
        bgcolor: PLUM,
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* ------------------------------------------------------------ */}
      {/* MOBILE — the chip marquee                                      */}
      {/* ------------------------------------------------------------ */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          // 20px side inset to line the label up with the page gutter.
          px: 2.5,
        }}
      >
        <Typography
          variant="overline"
          component="h2"
          sx={{ color: 'rgba(244,239,231,0.78)', display: 'block', mb: 1.5 }}
        >
          Explore the scents
        </Typography>
      </Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MobileChipRow scents={scents} reduceMotion={reduceMotion} />
      </Box>

      {/* ------------------------------------------------------------ */}
      {/* DESKTOP — the marquee                                         */}
      {/* ------------------------------------------------------------ */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          overflow: animate ? 'hidden' : 'auto',
          overflowY: 'hidden',
          scrollSnapType: animate ? 'none' : 'x proximity',
          scrollPaddingLeft: 32,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          // No mask-image: the fades below are overlays in the strip's own
          // colour, so nothing punches through to the cream page. They are
          // only needed on a moving track — when the strip is static the
          // first word starts at the left edge and would sit under one.
          '&::before, &::after': {
            content: animate ? '""' : 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 72,
            zIndex: 1,
            pointerEvents: 'none',
          },
          '&::before': {
            left: 0,
            background: `linear-gradient(to right, ${PLUM} 0%, rgba(61,43,61,0) 100%)`,
          },
          '&::after': {
            right: 0,
            background: `linear-gradient(to left, ${PLUM} 0%, rgba(61,43,61,0) 100%)`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            // The gap lives at the end of each copy so the -50% translation
            // lands exactly on the next copy — a seamless loop.
            gap: 0,
            whiteSpace: 'nowrap',
            width: animate ? 'max-content' : 'auto',
            animation: animate ? `wwr-marquee ${duration}s linear infinite` : 'none',
            '@keyframes wwr-marquee': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-50%)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transform: 'none',
            },
            '&:hover': { animationPlayState: animate ? 'paused' : 'running' },
          }}
        >
          {Array.from({ length: copies }).map((_, copyIndex) => (
            <Box
              key={copyIndex}
              aria-hidden={copyIndex > 0 ? 'true' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: itemGap,
                paddingRight: itemGap,
                paddingLeft: copyIndex === 0 ? 4 : 0,
              }}
            >
              {scents.map((scent) => {
                const content = (
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontStyle: 'italic',
                      fontSize: '1.625rem',
                      lineHeight: 1.1,
                      fontWeight: 500,
                      color: 'rgba(244,239,231,0.94)',
                      letterSpacing: '0.01em',
                      textDecoration: 'none',
                      transition: 'color 200ms ease-out',
                      '&:hover': { color: '#E6C88A' },
                    }}
                  >
                    {scent.name}
                  </Typography>
                );

                return (
                  <Box
                    key={`${copyIndex}-${scent.slug || scent.name}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: itemGap }}
                  >
                    {scent.slug ? (
                      <Link
                        href={`/product/${scent.slug}`}
                        style={{ textDecoration: 'none' }}
                        tabIndex={copyIndex > 0 ? -1 : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                    <Box
                      aria-hidden
                      sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#E6C88A', flexShrink: 0 }}
                    />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ScentMarquee;
