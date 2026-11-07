import React from 'react';
import LegalPage from '../components/LegalPage';

// 1.30 scaffold. Cookie names must match what GA4/Meta actually set.
export default function CookiePage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description="What cookies this store uses and how to control them."
      updated="7 November 2026"
      sections={[
        { heading: 'What cookies are', body: [
          'Small text files stored by your browser. Strictly necessary cookies keep the shop working; analytics and marketing cookies load only with your consent.',
        ]},
        { heading: 'Strictly necessary (always on)', body: [
          'Session and cart cookies, CSRF protection, and login state — the checkout cannot function without these.',
        ]},
        { heading: 'Analytics and marketing (consent required)', body: [
          'Google Analytics 4: _ga, _ga_* — anonymous usage statistics, up to 2 years.',
          'Meta Pixel: _fbp — advertising measurement, up to 3 months. Both are only set after you accept in the cookie banner. [VERIFY: banner offers a re-open settings link]',
        ]},
        { heading: 'Managing cookies', body: [
          'Change your choices anytime via the cookie banner, or block cookies entirely in your browser settings.',
        ]},
      ]}
    />
  );
}
