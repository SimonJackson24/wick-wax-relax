import React from 'react';
import { Box, Typography } from '@mui/material';

// Scrolling scent-name band. Signature beauty-brand move: adds motion,
// rhythm and a sense of a catalogue with range, and costs one thin strip
// of vertical space.
const ScentMarquee = ({ items = [], speed = 42 }) => {
  const words = items.length ? items : [
    'Lavender Dream', 'Fireside Vanilla', 'Midnight Jasmine', 'Amber & Oak',
    'Sea Salt & Sage', 'Blood Orange & Fig', 'Rose Cashmere', 'Sandalwood Smoke',
  ];

  // Duplicated so the loop is seamless.
  const strip = [...words, ...words];

  return (
    <Box
      sx={{
        py: 2,
        bgcolor: '#3D2B3D',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        // Edge fades — words previously appeared/vanished clipped mid-letter
        // at the container edges; the mask makes entries/exits feel
        // intentional instead of broken.
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 5,
          whiteSpace: 'nowrap',
          animation: `wwr-marquee ${speed}s linear infinite`,
          '@keyframes wwr-marquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {strip.map((word, i) => (
          <Box key={`${word}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontSize: { xs: '1.125rem', md: '1.375rem' },
                fontWeight: 500,
                color: 'rgba(244,239,231,0.92)',
                letterSpacing: '0.01em',
              }}
            >
              {word}
            </Typography>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#E6C88A', flexShrink: 0 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ScentMarquee;
