import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';

/**
 * Cinematic band — a full-bleed, edge-to-edge moment that breaks the
 * rhythm of stacked sections. Scale contrast is what stops a long page
 * reading flat: one band that fills the viewport and runs to the edges
 * makes the surrounding sections feel composed rather than tiled.
 */
const CinematicBand = ({
  eyebrow = 'Made by hand',
  title = 'Fourteen days of patience in every jar',
  body = 'We pour in small batches and let each batch cure for a fortnight before it can be sold. It is slower, and it is the reason the scent lasts.',
  cta = { label: 'See how we pour', href: '/about' },
  image = '/images/bath-scene.svg',
  align = 'left',
}) => (
  <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: '72vh', md: '86vh' },
        minHeight: { xs: 460, md: 620 },
      }}
    >
      <Box
        component="img"
        src={image}
        alt="The Wick Wax & Relax studio"
        loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            align === 'left'
              ? 'linear-gradient(95deg, rgba(28,22,28,0.88) 0%, rgba(28,22,28,0.62) 42%, rgba(28,22,28,0.10) 100%)'
              : 'linear-gradient(265deg, rgba(28,22,28,0.88) 0%, rgba(28,22,28,0.62) 42%, rgba(28,22,28,0.10) 100%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(28,22,28,0.6) 0%, transparent 40%)',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
        }}
      >
        <Box
          sx={{
            maxWidth: 1440,
            width: '100%',
            mx: 'auto',
            px: { xs: 2.5, md: 5 },
            display: 'flex',
            justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
          }}
        >
          <Box sx={{ maxWidth: 560, color: '#F4EFE7' }}>
            <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2 }}>
              {eyebrow}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 500,
                fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                mb: 2.5,
                color: '#FFFFFF',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(244,239,231,0.82)', mb: 4, maxWidth: 480, lineHeight: 1.8 }}
            >
              {body}
            </Typography>
            <Button
              component={Link}
              href={cta.href}
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#F4EFE7',
                color: '#2A1D2A',
                '&:hover': { bgcolor: '#FFFFFF' },
              }}
            >
              {cta.label}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

export default CinematicBand;
