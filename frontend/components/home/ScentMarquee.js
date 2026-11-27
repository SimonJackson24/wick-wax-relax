import React from 'react';
import Link from 'next/link';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

// Scrolling scent-name band. Signature beauty-brand move: adds motion,
// rhythm and a sense of a catalogue with range, and costs one thin strip
// of vertical space.
//
// Each name is a link to its product — the band is a catalogue, not
// decoration.
//
// The edge fade was a percentage of the strip, so on a 375px phone it ate
// 30px at each end and clipped the first and last letters of whatever was
// passing through. It is now a fixed 24px on mobile (and stays a soft
// percentage on the wide desktop strip, where there is room for it).

const DEFAULT_SCENTS = [
  { name: 'Lavender Dream', slug: 'lavender-dream' },
  { name: 'Fireside Vanilla', slug: 'fireside-vanilla' },
  { name: 'Midnight Jasmine', slug: 'midnight-jasmine' },
  { name: 'Amber & Oak', slug: 'amber-and-oak' },
  { name: 'Sea Salt & Sage', slug: 'sea-salt-and-sage' },
  { name: 'Blood Orange & Fig', slug: 'blood-orange-and-fig' },
  { name: 'Rose Cashmere', slug: 'rose-cashmere' },
  { name: 'Sandalwood Smoke', slug: 'sandalwood-smoke' },
];

const ScentMarquee = ({ items = [], speed }) => {
  const theme = useTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scents = items.length
    ? items.map((item) =>
        typeof item === 'string' ? { name: item, slug: null } : item
      )
    : DEFAULT_SCENTS;

  // One copy is enough under reduced motion (the strip becomes a swipeable
  // row); otherwise the list is duplicated so the -50% loop is seamless.
  const copies = reduceMotion ? 1 : 2;

  // One loop ≈ 1280px of travel. 15s on a phone puts the speed at ~85px/s,
  // so a name crosses a 375px screen in about four and a half seconds —
  // long enough to read, short enough to feel alive. The desktop loop is
  // slower: the same travel over 30s.
  const duration = speed || (reduceMotion ? 0 : isMobile ? 15 : 24);

  const itemGap = 4; // 32px around the separator

  return (
    <Box
      className="wwr-dark-surface"
      sx={{
        py: { xs: 2.5, md: 3 },
        bgcolor: '#3D2B3D',
        overflow: reduceMotion ? 'auto' : 'hidden',
        overflowY: 'hidden',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        scrollSnapType: reduceMotion ? 'x proximity' : 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        // Fixed 24px fade on a phone; a soft percentage on the wide strip.
        maskImage: {
          xs: 'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
          md: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        },
        WebkitMaskImage: {
          xs: 'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
          md: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
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
          animation: reduceMotion ? 'none' : `wwr-marquee ${duration}s linear infinite`,
          '@keyframes wwr-marquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transform: 'none',
          },
          '&:hover': { animationPlayState: reduceMotion ? 'running' : 'paused' },
        }}
      >
        {Array.from({ length: copies }).map((_, copyIndex) => (
          <Box
            key={copyIndex}
            aria-hidden={copyIndex > 0 ? 'true' : undefined}
            sx={{ display: 'flex', alignItems: 'center', gap: itemGap, paddingRight: itemGap }}
          >
            {scents.map((scent) => {
              const label = scent.name;
              const content = (
                <Typography
                  component="span"
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontStyle: 'italic',
                    fontSize: { xs: '1.3125rem', md: '1.625rem' },
                    lineHeight: 1.1,
                    fontWeight: 500,
                    color: 'rgba(244,239,231,0.94)',
                    letterSpacing: '0.01em',
                    textDecoration: 'none',
                    transition: 'color 200ms ease-out',
                    '&:hover': { color: '#E6C88A' },
                  }}
                >
                  {label}
                </Typography>
              );

              return (
                <Box
                  key={`${copyIndex}-${scent.slug || label}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: itemGap,
                    scrollSnapAlign: reduceMotion ? 'start' : 'none',
                  }}
                >
                  {scent.slug ? (
                    <Link
                      href={`/product/${scent.slug}`}
                      style={{ textDecoration: 'none' }}
                      tabIndex={copyIndex > 0 ? -1 : undefined}
                      aria-hidden={copyIndex > 0 ? 'true' : undefined}
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                  <Box
                    aria-hidden
                    sx={{
                      width: 5, height: 5, borderRadius: '50%',
                      bgcolor: '#E6C88A', flexShrink: 0,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ScentMarquee;
