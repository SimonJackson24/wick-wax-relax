import React from 'react';
import axios from 'axios';
import { Box, Container, Typography } from '@mui/material';
import SEOHead from '../components/SEOHead';
import { SITE_URL } from '../utils/siteConfig';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import FreeShippingBanner from '../components/FreeShippingBanner';
import TrustBadges from '../components/TrustBadges';
import FeaturedProducts from '../components/FeaturedProducts';
import CategoryShowcase from '../components/CategoryShowcase';
import SeasonalPromo from '../components/SeasonalPromo';
import Testimonials from '../components/Testimonials';
import NewCustomerCTA from '../components/NewCustomerCTA';

const HomePage = ({ featuredInitial }) => (
  <>
    <SEOHead title="Wick Wax Relax — Premium Home Fragrance Products" description="Hand-crafted soy wax candles, wax melts, bath bombs and reed diffusers. Ethically sourced, eco-friendly packaging, made in the UK. Free UK delivery on orders over £25." keywords="wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy, UK, hand-crafted" url={SITE_URL} type="website" />
    <Navigation />
    <Hero />
    <FreeShippingBanner />
    <TrustBadges />
    <FeaturedProducts initialProducts={featuredInitial} />
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

// Server-render the home page's featured products so the storefront's
// most important page ships real product HTML (names, prices, links) in
// the first response — the last page of the SSR sweep.
export async function getServerSideProps() {
  const apiBase = process.env.API_URL || 'http://localhost:3001';
  try {
    const res = await axios.get(`${apiBase}/api/products/featured`, { timeout: 3000 });
    return { props: { featuredInitial: (res.data && res.data.products) || [] } };
  } catch {
    // Backend briefly unreachable: render the shell; client fetch fills in.
    return { props: { featuredInitial: null } };
  }
}
