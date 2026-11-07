import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

// Branded error page — Next renders this for 500s in production (and for
// dev errors when an Error component is defined). In production the stack
// is never shown to the shopper.
const Error = ({ statusCode }) => (
  <>
    <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
      <Typography
        sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, fontSize: '6rem', lineHeight: 1, color: 'primary.main' }}
      >
        {statusCode || 500}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, my: 2 }}>
        {statusCode === 404 ? "This one burnt out" : "Something melted"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.8 }}>
        {statusCode === 404
          ? "The page you're looking for doesn't exist or has been moved."
          : "Something went wrong on our side — it's been logged and we're on it. Please try again in a moment."}
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
