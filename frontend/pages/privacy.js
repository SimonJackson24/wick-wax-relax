import React from 'react';
import LegalPage from '../components/LegalPage';

// 1.27 scaffold (UK GDPR). [LAWYER REVIEW] + [PLACEHOLDERS] before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Wick Wax & Relax collects, uses and protects your personal data (UK GDPR)."
      updated="7 November 2026"
      sections={[
        { heading: 'Who we are', body: [
          'Wick Wax & Relax is the data controller for personal data collected at this store. Contact: info@wickwaxrelax.co.uk. ICO registration: [ICO NUMBER].',
        ]},
        { heading: 'What we collect and why', body: [
          'Account data (name, email), order data (addresses, purchases), and technical data (device, IP — via cookies you consent to).',
          'Lawful bases: contract fulfilment (orders, delivery); legal obligations (tax and consumer-law records); legitimate interests (fraud prevention, service improvement); consent (marketing emails, non-essential cookies).',
        ]},
        { heading: 'Your rights', body: [
          'Access, rectification, erasure, restriction, portability, objection — and the right to withdraw consent at any time. Requests to info@wickwaxrelax.co.uk; you can complain to the ICO at ico.org.uk.',
        ]},
        { heading: 'Retention and sharing', body: [
          'Order records are kept for 6 years (tax law); marketing data until consent is withdrawn.',
          'We share data only with processors needed to run the shop (payment, delivery, email) under data-processing terms. [LAWYER REVIEW: processor list]',
        ]},
      ]}
    />
  );
}
