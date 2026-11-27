import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { SECTION_PY, GUTTER } from '../../src/layoutTokens';

/**
 * Editorial split — the "why pay more" story. Premium prices need a
 * reason; small-batch making is the reason.
 */
const EditorialSplit = ({
  eyebrow = 'How we pour',
  title = 'Twelve candles a batch. Never more.',
  body = 'Each candle is hand-poured in small batches so every jar gets the same slow cure, the same clean burn, the same throw of scent. We wait fourteen days before we let a candle leave the studio — that patience is the difference between a scent that fades in an hour and one that stays all evening.',
  cta = { label: 'Read our story', href: '/about' },
  image = '/images/bath-scene.svg',
  reversed = false,
}) => (
  <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box
      sx={{
        maxWidth: 1440,
        mx: 'auto',
        px: GUTTER,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
        gap: { xs: 4, md: 8 },
        alignItems: 'center',
      }}
    >
      <Box sx={{ order: { xs: 1, md: reversed ? 2 : 1 } }}>
        <Box
          sx={{
            // The plum wash below is absolutely positioned inside this
            // frame — without a positioned ancestor it would cover the
            // whole page.
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            aspectRatio: { xs: '4 / 3', md: '5 / 4.2' },
            // Designed fallback behind the photograph.
            background:
              'linear-gradient(140deg, #4A3550 0%, #3D2B3D 45%, #6B4A46 78%, #C9846B 100%)',
            border: '1px solid rgba(28,26,31,0.07)',
            boxShadow: '0 20px 48px rgba(28,26,31,0.12)',
          }}
        >
          <Box
            component="img"
            src={image}
            alt="Pouring wax by hand in the studio"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            sx={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: 'grayscale(1) sepia(0.85) saturate(2.4) hue-rotate(-12deg) brightness(0.98) contrast(1.04)',
            }}
          />
          {/* Plum wash — same brand treatment as the cinematic band. */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, #6B4A46 0%, #3D2B3D 55%, #2A1D2A 100%)',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      <Box sx={{ order: { xs: 2, md: reversed ? 1 : 2 }, maxWidth: 540 }}>
        <Typography variant="overline" sx={{ color: 'tertiary.ink', display: 'block', mb: 1.5 }}>
          {eyebrow}
        </Typography>
        <Typography variant="h2" sx={{ mb: 2.5 }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3.5 }}>
          {body}
        </Typography>
        <Button
          component={Link}
          href={cta.href}
          variant="outlined"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1.05rem !important' }} />}
        >
          {cta.label}
        </Button>
      </Box>
    </Box>
  </Box>
);

export default EditorialSplit;
