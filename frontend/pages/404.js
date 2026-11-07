import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Navigation from '../components/Navigation';
import SEOHead from '../components/SEOHead';

// Branded 404 — real candles burn out, so do links.
const Custom404 = () => (
  <>
    <SEOHead
      title="Page Not Found — Wick Wax Relax"
      description="The page you're looking for has burnt out. Browse our hand-poured candles and wax melts instead."
      noindex
    />
    <Navigation />
    <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
      <Typography
        sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, fontSize: '6rem', lineHeight: 1, color: 'primary.main' }}
      >
        404
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, my: 2 }}>
        This one burnt out
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.8 }}>
        The page you're looking for doesn't exist or has been moved.
        Let's get you back to the good smells.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button component={Link} href="/" variant="contained" startIcon={<HomeIcon />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Back to Home
        </Button>
        <Button component={Link} href="/products" variant="outlined" sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Browse Products
        </Button>
      </Box>
    </Container>
  </>
);

export default Custom404;
