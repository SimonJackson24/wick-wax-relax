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
import TrustBadges from '../components/TrustBadges';
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

      {/* Original trust banner — Simon's preferred design and wording. Sits
          above the hero so trust signals land before the fold and fill the
          gap between nav and the full-bleed photograph. */}
      <TrustBadges />

      <PremiumHero products={products} />

      <ScentMarquee items={products.map((p) => p.name.replace(/^Showcase:\s*/, ''))} />

      <MoodTiles />

      <BestSellers products={products} />

      <CinematicBand />

      <EditorialSplit />

      <ReviewsBand />

      <SubscribeBand />

      <Footer />
    </>
  );
};

export default HomePage;

// ISR (Incremental Static Regeneration): the homepage is pre-rendered as
// pure HTML at build time — no per-request SSR, no hydration blocking
// first paint on the visitor's phone. Next.js re-renders it in the
// background every 60s so new products / price changes appear within a
// minute of being saved in admin (or instantly via the on-demand
// revalidation endpoint).
//
// The API base URL is a BUILD-TIME environment variable set by the
// deployment pipeline (never user input), and the fetch path is a fixed
// constant — there is no user-controllable URL component.
const API_BASE = process.env.API_URL || 'http://localhost:3001';
const FEATURED_URL = `${API_BASE}/api/products/featured`;

export async function getStaticProps() {
  try {
    const res = await axios.get(FEATURED_URL, { timeout: 5000 });
    return {
      props: { featuredInitial: (res.data && res.data.products) || [] },
      revalidate: 60,
    };
  } catch {
    // Backend briefly unreachable: render the shell; client fetch fills in.
    return { props: { featuredInitial: null }, revalidate: 30 };
  }
}
