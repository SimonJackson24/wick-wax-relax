import React from 'react';
import { Box, Typography } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import RecycleIcon from '@mui/icons-material/Recycling';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

/**
 * Transparency strip — compliance turned into a marketing asset.
 *
 * Every candle and melt is CLP-labelled and allergen-declared (EU Reg.
 * 1223/2009). Almost nobody at this price band can say that, so it
 * doubles as a differentiator and as trust.
 */
const CLAIMS = [
  { icon: <SpaIcon sx={{ fontSize: 20 }} />, title: 'Vegan soy wax', detail: 'No paraffin, no animal wax' },
  { icon: <RecycleIcon sx={{ fontSize: 20 }} />, title: 'Plastic-free', detail: 'Recycled glass, paper bands' },
  { icon: <VerifiedIcon sx={{ fontSize: 20 }} />, title: 'CLP labelled', detail: 'Allergens declared on every scent' },
  { icon: <LocalShippingIcon sx={{ fontSize: 20 }} />, title: 'Made in the UK', detail: 'Poured in Sussex by hand' },
];

const TransparencyStrip = ({ claims = CLAIMS }) => (
  <Box
    sx={{
      py: { xs: 4, md: 5 },
      backgroundColor: 'background.subtle',
      borderTop: '1px solid',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        maxWidth: 1440,
        mx: 'auto',
        px: { xs: 2, md: 4 },
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 3, md: 2 },
      }}
    >
      {claims.map((claim) => (
        <Box key={claim.title} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ color: 'tertiary.main', mt: 0.25, flexShrink: 0 }}>{claim.icon}</Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
              {claim.title}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {claim.detail}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

export default TransparencyStrip;
