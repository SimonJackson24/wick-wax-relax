import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Rating, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeProductCard from './HomeProductCard';
import { SECTION_PY, GUTTER } from '../../src/layoutTokens';

/**
 * Best sellers — Amazon's trust engine wearing boutique clothes.
 *
 * Prices, scent notes, ratings and stock urgency are all visible without a
 * click: showing price on the homepage is the single biggest conversion
 * lever the old design was missing.
 */
const BestSellers = ({ products = [], title = 'Most loved', eyebrow = 'Best sellers' }) => (
  <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: GUTTER }}>
      <Box
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          gap: 2, mb: { xs: 3, md: 4 }, flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'tertiary.ink', display: 'block', mb: 1.5 }}>
            02 &nbsp;—&nbsp; {eyebrow}
          </Typography>
          <Typography variant="h2" component="h2">{title}</Typography>
        </Box>
        <Button
          component={Link}
          href="/products"
          variant="outlined"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1.05rem !important' }} />}
          sx={{ minHeight: 44 }}
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
        /* Mobile: a scroll-snapped rail showing ~1.3 cards. Two columns on
           a 375px screen left 165px per card, which truncated the scent
           names and clipped the price. Desktop keeps the four-up grid. */
        <Box
          role="group"
          aria-label="Best sellers — scroll for more"
          tabIndex={0}
          sx={{
            display: { xs: 'flex', md: 'grid' },
            gridTemplateColumns: { md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, md: 2.5 },
            overflowX: { xs: 'auto', md: 'visible' },
            scrollSnapType: { xs: 'x mandatory', md: 'none' },
            scrollPaddingLeft: { xs: 0, md: 'auto' },
            scrollbarWidth: 'none',
            // Bleed to the screen edge so the next card peeks in. The
            // bleed cancels the container's gutter exactly, so it has to
            // track the GUTTER token (it was hard-coded to 16px).
            mx: { xs: -GUTTER.xs, md: 0 },
            px: { xs: GUTTER.xs, md: 0 },
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {products.slice(0, 8).map((product) => (
            <Box
              key={product.id}
              sx={{
                flex: { xs: '0 0 78%', md: 'initial' },
                scrollSnapAlign: { xs: 'start', md: 'none' },
                display: 'flex',
              }}
            >
              <Box sx={{ flex: 1, display: 'flex' }}>
                <HomeProductCard product={product} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  </Box>
);

export default BestSellers;
