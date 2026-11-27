import { useState } from 'react';
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  EnergySavingsLeaf as EcoIcon,
  Public as UkIcon,
  Pets as PetsIcon,
  Recycling as RecyclingIcon,
  Lock as SecureIcon
} from '@mui/icons-material';

// Compact trust strip — one narrow banner, icon left of each label.
//
// Mobile (<900px): a single-row marquee. The six promises are wider than a
// phone, so the old two-column grid either truncated the labels with an
// ellipsis ("Ethical Beeswa…") or stacked them over three rows and pushed
// the hero down. The strip is now one calm ~36px row that scrolls on its
// own — full labels, never truncated — and pauses the moment a finger is
// on it.
//
// Reduced motion: no marquee at all. The row becomes a swipeable,
// scroll-snapped strip instead.
//
// Desktop (>=900px): the static, evenly spaced row — all six fit there
// without truncation, so no motion is needed.

const trustBadges = [
  { id: 'ethical-beeswax', icon: EcoIcon, title: 'Ethical Beeswax', detail: 'Queen bees kept with intact wings' },
  { id: 'sustainable', icon: EcoIcon, title: 'Sustainable Wax', detail: 'Premium plant-based blend' },
  { id: 'handmade-uk', icon: UkIcon, title: 'Handmade in UK', detail: 'Handcrafted with care' },
  { id: 'vegan', icon: PetsIcon, title: '100% Vegan', detail: 'Cruelty-free products' },
  { id: 'eco-packaging', icon: RecyclingIcon, title: 'Eco Packaging', detail: 'Glassine bags & biodegradable labels' },
  { id: 'secure', icon: SecureIcon, title: 'Secure Checkout', detail: 'Protected payments' },
];

const Badge = ({ badge, theme, separator }) => {
  const IconComponent = badge.icon;
  return (
    <>
      <Box
        title={badge.detail}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          flex: '0 0 auto',
          minWidth: 0,
        }}
      >
        <IconComponent
          sx={{ fontSize: 17, color: theme.palette.primary.main, flexShrink: 0 }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: '0.8125rem',
            letterSpacing: '0.04em',
            color: theme.palette.primary.main,
            whiteSpace: 'nowrap',
          }}
        >
          {badge.title}
        </Typography>
      </Box>
      {separator && (
        <Box
          aria-hidden
          sx={{
            mx: 2,
            color: theme.palette.primary.main,
            opacity: 0.45,
            fontSize: '0.6875rem',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          •
        </Box>
      )}
    </>
  );
};

const TrustBadges = () => {
  const theme = useTheme();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [touched, setTouched] = useState(false);

  // Two copies of the list, and the track translates exactly -50% of its
  // own width — one copy's worth — so the loop is seamless. Under reduced
  // motion there is no loop, so only one copy is rendered.
  const copies = reduceMotion ? 1 : 2;

  return (
    <Box
      component="section"
      aria-label="Our promises"
      sx={{
        // Cream, so the strip reads as a distinct band against the plum
        // announcement bar directly above it.
        backgroundColor: '#F4EFE7',
        borderTop: `1px solid ${theme.palette.primary.main}20`,
        borderBottom: `1px solid ${theme.palette.primary.main}20`,
      }}
    >
      {/* Mobile: the marquee */}
      <Box
        role="group"
        aria-label="Our promises"
        tabIndex={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          overflowX: reduceMotion ? 'auto' : 'hidden',
          overflowY: 'hidden',
          scrollSnapType: reduceMotion ? 'x proximity' : 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          // The items run off the edge as they pass; a short fixed fade
          // makes the entry and exit read as intentional.
          maskImage:
            'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: 'max-content',
            alignItems: 'center',
            py: 1,
            pl: 2.5,
            pr: 2.5,
            // The gap lives at the END of each copy, not between the two
            // copies, so the -50% translation lands exactly on the start
            // of the next copy and the loop has no seam.
            gap: 0,
            animation: reduceMotion ? 'none' : 'wwr-trust-marquee 34s linear infinite',
            animationPlayState: touched ? 'paused' : 'running',
            '@keyframes wwr-trust-marquee': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-50%)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transform: 'none',
            },
            '&:hover': {
              animationPlayState: reduceMotion ? 'running' : 'paused',
            },
          }}
          onPointerDown={() => setTouched(true)}
          onPointerUp={() => setTouched(false)}
          onPointerCancel={() => setTouched(false)}
          onPointerLeave={() => setTouched(false)}
        >
          {Array.from({ length: copies }).map((_, copyIndex) => (
            <Box
              key={copyIndex}
              sx={{
                display: 'flex',
                alignItems: 'center',
                paddingRight: 2.5,
                scrollSnapAlign: reduceMotion ? 'start' : 'none',
              }}
            >
              {trustBadges.map((badge, index) => (
                <Badge
                  key={`${copyIndex}-${badge.id}`}
                  badge={badge}
                  theme={theme}
                  separator={index < trustBadges.length - 1}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Desktop: the static row */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          gap: 2,
          maxWidth: 1200,
          mx: 'auto',
          px: 4,
        }}
      >
        {trustBadges.map((badge) => (
          <Badge key={badge.id} badge={badge} theme={theme} separator={false} />
        ))}
      </Box>
    </Box>
  );
};

export default TrustBadges;
