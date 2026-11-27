import React from 'react';
import Link from 'next/link';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

// The scent band — one component, two behaviours.
//
// MOBILE (<768px): no marquee. A static, swipeable "Explore the scents" row
// of chips — a round swatch from the product photograph and the scent's name
// — linking to each product. A scrolling ticker of long serif names on a
// 375px screen was squashed, competed with the trust marquee directly above
// the hero, and did not help anyone choose. The last chip runs off the edge
// to say "there is more"; there is no edge fade at all on mobile.
//
// DESKTOP (>=768px): the marquee, kept. Its edge fade used to be a
// mask-image fading to transparent, which punched the cream page background
// through the plum strip and left pale smears at both ends. The fade is now
// two overlay elements that go from the strip's OWN plum to transparent, so
// the type dissolves into plum and never into cream. They are
// pointer-events: none, so the links beneath stay clickable.
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

  // Every chip is a link, so Tab already walks the row. The arrow keys only
  // move a horizontal overflow scroller ~40px natively, and Home/End do
  // nothing, so a keyboard user could not get along it quickly. This keeps
  // the focus on the row itself and scrolls it by a useful step.
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
    row.scrollTo({ left: next, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

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
      {/* MOBILE — the static, swipeable chip row                       */}
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
      <Box
        role="group"
        aria-label="Explore the scents — scroll for more"
        tabIndex={0}
        onKeyDown={onRowKeyDown}
        sx={{
          display: { xs: 'flex', md: 'none' },
          gap: 1.5, // 12px
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          // The first chip starts at the gutter; the row bleeds to the
          // screen edge so the last chip runs off it.
          px: 2.5,
          scrollPaddingLeft: 20,
          scrollSnapType: 'x proximity',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          '&:focus-visible': { outline: '2px solid #E6C88A', outlineOffset: -2 },
          '@media (prefers-reduced-motion: reduce)': { scrollBehavior: 'auto' },
        }}
      >
        {scents.map((scent) => (
          <Box
            key={scent.slug || scent.name}
            component={Link}
            href={scent.slug ? `/product/${scent.slug}` : '/products'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25, // 10px
              // 44px minimum tap target; 14–16px horizontal padding.
              minHeight: 44,
              pl: '5px',
              pr: 1.75,
              py: 0.5,
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
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
            }}
          >
            {scent.image ? (
              <Box
                component="img"
                src={scent.image}
                alt=""
                loading="lazy"
                width={34}
                height={34}
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
        ))}
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
