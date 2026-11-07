import React from 'react';
import LegalPage from '../components/LegalPage';

// 1.29 scaffold. [PLACEHOLDERS] confirmed once Royal Mail rates go live.
export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      description="Delivery options, timescales and costs across the UK."
      updated="7 November 2026"
      sections={[
        { heading: 'Where we ship', body: [
          'UK mainland, Highlands & Islands, and Northern Ireland. International shipping is coming — join the newsletter to hear first.',
        ]},
        { heading: 'Options and costs', body: [
          'Royal Mail Tracked 48: £[X.XX] — usually 2–3 working days.',
          'Royal Mail Tracked 24: £[X.XX] — usually 1–2 working days.',
          'Free shipping on orders over £[XX]. [CONFIRM when the Royal Mail integration is live]',
        ]},
        { heading: 'Processing and delays', body: [
          'Orders placed before [TIME] on working days dispatch the same or next working day; tracking arrives by email the moment your parcel ships.',
          'Working days exclude weekends and bank holidays. If your parcel is late or lost, contact us — we work with Royal Mail to resolve it and replace or refund as appropriate.',
        ]},
      ]}
    />
  );
}
