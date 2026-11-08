import React from 'react';
import axios from 'axios';
import SEOHead from '../components/SEOHead';
import { SITE_URL } from '../utils/siteConfig';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

import AnnouncementBar from '../components/home/AnnouncementBar';
import PremiumHero from '../components/home/PremiumHero';
import CinematicBand from '../components/home/CinematicBand';
import ScentMarquee from '../components/home/ScentMarquee';
import MoodTiles from '../components/home/MoodTiles';
import BestSellers from '../components/home/BestSellers';
import EditorialSplit from '../components/home/EditorialSplit';
import TransparencyStrip from '../components/home/TransparencyStrip';
import ReviewsBand from '../components/home/ReviewsBand';
import SubscribeBand from '../components/home/SubscribeBand';

/**
 * "The Ritual" homepage — editorial, gallery-led, Amazon's conversion
 * spine in Wick Wax & Relax's own skin.
 *
 * Section order is deliberate:
 *   1. trust strip (above fold)
 *   2. one statement + price/quick-add visible without scrolling
 *   3. mood tiles (sell by occasion, not product type — the differentiator)
 *   4. best sellers with prices, ratings, urgency, quick-add (conversion)
 *   5. editorial story (justifies the premium)
 *   6. transparency strip (compliance as a marketing asset)
 *   7. reviews band (the one dark moment — social proof)
 *   8. subscription (recurring revenue)
 */
const HomePage = ({ featuredInitial }) => {
  const products = featuredInitial || [];

  return (
    <>
      <SEOHead
        title="Wick Wax Relax — Hand-Poured Soy Candles & Wax Melts"
        description="Hand-poured soy candles, wax melts and bath bombs made in small batches in Sussex. Vegan, plastic-free, EU CLP-labelled and allergen-declared. Free UK delivery over £25."
        keywords="wax melts, candles, home fragrance, essential oils, soy wax, aromatherapy, UK, hand-crafted"
        url={SITE_URL}
        type="website"
      />

      <AnnouncementBar />

      <Navigation />

      <PremiumHero products={products} />

      <ScentMarquee items={products.map((p) => p.name.replace(/^Showcase:\s*/, ''))} />

      <MoodTiles />

      <BestSellers products={products} />

      <CinematicBand />

      <EditorialSplit />

      <TransparencyStrip />

      <ReviewsBand />

      <SubscribeBand />

      <Footer />
    </>
  );
};

export default HomePage;

// Server-render the home page's featured products so the storefront's most
// important page ships real product HTML (names, prices, links) in the
// first response.
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
