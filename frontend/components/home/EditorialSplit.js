import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
  <Box sx={{ py: { xs: 7, md: 12 }, backgroundColor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box
      sx={{
        maxWidth: 1440,
        mx: 'auto',
        px: { xs: 2, md: 4 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
        gap: { xs: 4, md: 8 },
        alignItems: 'center',
      }}
    >
      <Box sx={{ order: { xs: 1, md: reversed ? 2 : 1 } }}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            aspectRatio: { xs: '4 / 3', md: '5 / 4.2' },
            bgcolor: '#F1EBE1',
            border: '1px solid rgba(28,26,31,0.07)',
            boxShadow: '0 20px 48px rgba(28,26,31,0.12)',
          }}
        >
          <Box
            component="img"
            src={image}
            alt="Pouring wax by hand in the studio"
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>
      </Box>

      <Box sx={{ order: { xs: 2, md: reversed ? 1 : 2 }, maxWidth: 540 }}>
        <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 1.5 }}>
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
