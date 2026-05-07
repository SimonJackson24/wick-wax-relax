import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import SEOHead from '../components/SEOHead';
import NavigationWithCategories from '../components/NavigationWithCategories';
import Hero from '../components/Hero';
import FreeShippingBanner from '../components/FreeShippingBanner';
import TrustBadges from '../components/TrustBadges';
import FeaturedProducts from '../components/FeaturedProducts';
import CategoryShowcase from '../components/CategoryShowcase';
import SeasonalPromo from '../components/SeasonalPromo';
import Testimonials from '../components/Testimonials';
import NewCustomerCTA from '../components/NewCustomerCTA';

const HomePage = () => (
  <>
    <SEOHead title="Wick Wax Relax — Premium Home Fragrance Products" description="Hand-crafted soy wax candles, wax melts, bath bombs and reed diffusers. Ethically sourced, eco-friendly packaging, made in the UK. Free UK delivery on orders over £25." keywords="wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy, UK, hand-crafted" url="https://wickwaxrelax.com" type="website" />
    <NavigationWithCategories />
    <Hero />
    <FreeShippingBanner />
    <TrustBadges />
    <FeaturedProducts />
    <CategoryShowcase />
    <SeasonalPromo />
    <Testimonials />
    <NewCustomerCTA />
    <Box component="footer" sx={{ py: 6, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">© 2024 Wick Wax & Relax. All rights reserved.</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}><a href="/accessibility" style={{ color: 'inherit' }}>Accessibility Statement</a></Typography>
      </Container>
    </Box>
  </>
);

export default HomePage;