import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Subscribe & save band — the recurring-revenue pitch, in the skin of a
 * "quiet luxury" invitation rather than a coupon blast.
 */
const SubscribeBand = ({
  eyebrow = 'Subscribe & save',
  title = 'Never run out of the one you love',
  body = 'Subscribe to any scent and save 15% on every delivery. Change or cancel whenever you like — no minimum, no phone calls, no guilt.',
  cta = { label: 'Start a subscription', href: '/subscriptions' },
}) => (
  <Box sx={{ py: { xs: 7, md: 10 }, backgroundColor: 'background.default' }}>
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.subtle',
          p: { xs: 3.5, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(0, 1fr)' },
          gap: { xs: 3, md: 6 },
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 1.5 }}>
            {eyebrow}
          </Typography>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520 }}>
            {body}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: { md: 'flex-end' } }}>
          <Button
            component={Link}
            href={cta.href}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon sx={{ fontSize: '1.1rem !important' }} />}
          >
            {cta.label}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Free UK delivery · Cancel anytime
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

export default SubscribeBand;
