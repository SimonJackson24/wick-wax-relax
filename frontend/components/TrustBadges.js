import { useState } from 'react';
import {
  Box,
  SvgIcon,
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

// The honeybee, drawn for this strip on the Material 24-grid so it sits with
// the Material icons beside it (MUI has no bee). One silhouette — head, thorax
// and abdomen — with the two stripes left as gaps, two whole wings held out
// and two antennae: "queen bees kept with intact wings" is this badge's own
// promise, so the wings are the point. Plum only, like its neighbours, and
// everything is currentColor, so the strip's sx still sizes and colours it.
const HoneybeeIcon = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3.2C13.077 3.2 13.95 4.073 13.95 5.15C13.95 5.75 13.64 6.35 13.64 6.95
        C13.64 7.6 14.7 8.25 14.7 8.9C14.7 9.567 14.45 10.233 14.45 10.9C14.45 11.9 15.8 12.9 15.8 13.9
        C15.8 14.046 15.796 14.188 15.788 14.325C13.591 14.725 10.409 14.725 8.212 14.325
        C8.204 14.188 8.2 14.046 8.2 13.9C8.2 12.9 9.55 11.9 9.55 10.9C9.55 10.233 9.3 9.567 9.3 8.9
        C9.3 8.25 10.36 7.6 10.36 6.95C10.36 6.35 10.05 5.75 10.05 5.15C10.05 4.073 10.923 3.2 12 3.2Z
        M15.618 15.475C15.397 16.366 15.003 17.029 14.598 17.611
        C13.091 17.425 10.909 17.425 9.402 17.611C8.997 17.029 8.603 16.366 8.382 15.475
        C10.48 15.875 13.52 15.875 15.618 15.475ZM14.194 18.175C13.684 18.88 13.25 19.531 13.25 20.45
        C13.25 21.14 12.69 21.7 12 21.7C11.31 21.7 10.75 21.14 10.75 20.45
        C10.75 19.531 10.316 18.88 9.806 18.175C11.079 18.575 12.921 18.575 14.194 18.175ZM9.248 7.043
        C8.73 7.941 8.13 8.535 7.329 8.072C4.856 6.687 3.798 5.369 2.798 3.32
        C5.073 3.161 6.743 3.418 9.179 4.868C9.98 5.33 9.766 6.146 9.248 7.043ZM14.752 7.043
        C14.234 6.146 14.02 5.33 14.821 4.868C17.257 3.418 18.927 3.161 21.202 3.32
        C20.202 5.369 19.144 6.687 16.671 8.072C15.87 8.535 15.27 7.941 14.752 7.043Z"
    />
    <path
      d="M11.22 4.05Q10.625 2.39 9.25 1.4M12.78 4.05Q13.375 2.39 14.75 1.4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
    />
  </SvgIcon>
);

const trustBadges = [
  { id: 'ethical-beeswax', icon: HoneybeeIcon, title: 'Ethical Beeswax', detail: 'Queen bees kept with intact wings' },
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
