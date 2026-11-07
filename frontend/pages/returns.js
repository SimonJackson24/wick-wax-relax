import React from 'react';
import LegalPage from '../components/LegalPage';

// N-3 scaffold: 14-day cooling-off flow per Consumer Contracts Regs 2013.
// [LAWYER REVIEW] markers + [PLACEHOLDERS] need completion before launch.
export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns & Refunds"
      description="Your 14-day right to cancel, how returns work, and when refunds arrive."
      updated="7 November 2026"
      sections={[
        { heading: 'Your 14-day right to cancel', body: [
          'Under the Consumer Contracts Regulations 2013 you may cancel any online order within 14 days of receiving it, for any reason — you do not need to give one.',
        ]},
        { heading: 'How to cancel and return', body: [
          'Email info@wickwaxrelax.co.uk with your order number within 14 days of delivery, then return the goods within 14 days of cancelling. [FORM LINK — to build in the support phase]',
        ]},
        { heading: 'Refunds', body: [
          'Full refund (including standard delivery) within 14 days of us receiving the returned goods.',
          'We may deduct for diminished value where handling beyond inspection occurred — for hygiene reasons, wax melts and bath products are best returned unopened. [LAWYER REVIEW: hygiene exemption wording]',
        ]},
        { heading: 'Faulty goods and postage', body: [
          'Faulty or damaged goods are repaired, replaced or refunded under the Consumer Rights Act 2015 — contact us with photos and your order number.',
          'You pay return postage for change-of-mind cancellations; we pay for faulty goods. [LAWYER REVIEW + decide: returns label provider]',
        ]},
      ]}
    />
  );
}
