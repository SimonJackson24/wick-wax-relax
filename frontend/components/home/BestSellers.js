import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Rating, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeProductCard from './HomeProductCard';

/**
 * Best sellers — Amazon's trust engine wearing boutique clothes.
 *
 * Prices, scent notes, ratings and stock urgency are all visible without a
 * click: showing price on the homepage is the single biggest conversion
 * lever the old design was missing.
 */
const BestSellers = ({ products = [], title = 'Most loved', eyebrow = 'Best sellers' }) => (
  <Box sx={{ py: { xs: 7, md: 12 }, backgroundColor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          gap: 2, mb: { xs: 3, md: 4 }, flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 1.5 }}>
            02 &nbsp;—&nbsp; {eyebrow}
          </Typography>
          <Typography variant="h2">{title}</Typography>
        </Box>
        <Button
          component={Link}
          href="/products"
          variant="outlined"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1.05rem !important' }} />}
        >
          Shop all
        </Button>
      </Box>

      {products.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 6,
            textAlign: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <Typography variant="h5" sx={{ mb: 1 }}>
            Our bestselling scents arrive here
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto', mb: 3 }}>
            We're pouring our first batch now. Every candle and melt is
            hand-made, so nothing sells out that wasn't made with care.
          </Typography>
          <Button component={Link} href="/products" variant="contained">
            Browse the collection
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, md: 2.5 },
          }}
        >
          {products.slice(0, 8).map((product) => (
            <HomeProductCard key={product.id} product={product} />
          ))}
        </Box>
      )}
    </Box>
  </Box>
);

export default BestSellers;
