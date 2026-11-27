import {
  Box,
  Typography,
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
// The original six-badge wording (Simon's preferred copy) is kept; the
// long descriptions live on as tooltips so no information is lost, but
// the strip stays a single tight row (~48px) instead of a 226px grid.

const trustBadges = [
  { id: 'ethical-beeswax', icon: EcoIcon, title: 'Ethical Beeswax', detail: 'Queen bees kept with intact wings' },
  { id: 'sustainable', icon: EcoIcon, title: 'Sustainable Wax', detail: 'Premium plant-based blend' },
  { id: 'handmade-uk', icon: UkIcon, title: 'Handmade in UK', detail: 'Handcrafted with care' },
  { id: 'vegan', icon: PetsIcon, title: '100% Vegan', detail: 'Cruelty-free products' },
  { id: 'eco-packaging', icon: RecyclingIcon, title: 'Eco Packaging', detail: 'Glassine bags & biodegradable labels' },
  { id: 'secure', icon: SecureIcon, title: 'Secure Checkout', detail: 'Protected payments' },
];

const TrustBadges = () => {
  const theme = useTheme();

  return (
    <Box
      component="section"
      aria-label="Our promises"
      sx={{
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.primary.main}20`,
        borderBottom: `1px solid ${theme.palette.primary.main}20`,
      }}
    >
      {/* Mobile: one swipeable row, scroll-snapped, every label in full.
          The old two-column grid truncated the labels with an ellipsis
          ("Ethical Beeswa…") and stacked six rows above the hero. Desktop
          keeps the single spread-out row. */}
      <Box
        role="group"
        aria-label="Our promises"
        tabIndex={0}
        sx={{
          display: 'flex',
          flexWrap: { xs: 'nowrap', md: 'nowrap' },
          justifyContent: { xs: 'flex-start', md: 'space-between' },
          alignItems: 'center',
          py: { xs: 1, md: 1 },
          gap: { xs: 2.5, md: 0 },
          maxWidth: { xs: '100%', md: 1200 },
          mx: 'auto',
          px: { xs: 2, md: 4 },
          overflowX: { xs: 'auto', md: 'visible' },
          scrollSnapType: { xs: 'x proximity', md: 'none' },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {trustBadges.map((badge) => {
          const IconComponent = badge.icon;
          return (
            <Box
              key={badge.id}
              title={badge.detail}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flex: { xs: '0 0 auto', md: '0 1 auto' },
                scrollSnapAlign: { xs: 'start', md: 'none' },
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
                  fontSize: { xs: '0.8125rem', md: '0.75rem' },
                  letterSpacing: '0.04em',
                  color: theme.palette.text.primary,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default TrustBadges;
