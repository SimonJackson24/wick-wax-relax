import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import NavigationWithCategories from '../components/NavigationWithCategories';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import CategoryShowcase from '../components/CategoryShowcase';
import SeasonalPromo from '../components/SeasonalPromo';
import Testimonials from '../components/Testimonials';
import NewCustomerCTA from '../components/NewCustomerCTA';

const HomePage = () => {
  return (
    <>
      <NavigationWithCategories />
      <Hero />
      <FeaturedProducts />
      <CategoryShowcase />
      <SeasonalPromo />
      <Testimonials />
      <NewCustomerCTA />
      
      <Box component="footer" sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Wick Wax & Relax. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            <a href="/accessibility" style={{ color: 'inherit' }}>
              Accessibility Statement
            </a>
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;