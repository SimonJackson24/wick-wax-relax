import React from 'react';
import { Box, Container, Typography, Link, useTheme } from '@mui/material';
import { LocalShipping as ShippingIcon, ShoppingBag as ShopIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const FreeShippingBanner = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.text.primary,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.secondary.main}`
      }}
    >
      <Container maxWidth="lg">
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <ShippingIcon sx={{ fontSize: 20 }} />
          <Typography
            variant="body2"
            component="span"
            sx={{ fontWeight: 500, letterSpacing: '0.02em' }}
          >
            FREE UK DELIVERY ON ORDERS OVER £40
          </Typography>
          <Typography
            variant="body2"
            component="span"
            sx={{ opacity: 0.9, mx: 1 }}
          >
            |
          </Typography>
          <Link
            href="/products"
            underline="hover"
            sx={{
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { opacity: 0.8 }
            }}
          >
            <ShopIcon sx={{ fontSize: 16 }} />
            <Typography
              variant="body2"
              component="span"
              sx={{
                fontWeight: 500,
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
            >
              Shop Now
            </Typography>
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default FreeShippingBanner;