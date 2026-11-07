import React from 'react';
import LegalPage from '../components/LegalPage';

// 1.26 scaffold. [LAWYER REVIEW] markers + [PLACEHOLDERS] before launch.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      description="The terms governing purchases from Wick Wax & Relax."
      updated="7 November 2026"
      sections={[
        { heading: 'About these terms', body: [
          'These terms govern purchases made at wickwaxrelax.co.uk. By placing an order you agree to them. [LAWYER REVIEW: entity name + company/registration number]',
          'Our contact details: info@wickwaxrelax.co.uk, [ADDRESS], [PHONE].',
        ]},
        { heading: 'Orders and acceptance', body: [
          'Your order is an offer to buy; the contract forms when we dispatch the goods — the confirmation email is acknowledgement, not acceptance.',
          'We may decline orders (pricing errors, stock unavailability) and will refund any payment taken. Prices include VAT where applicable under our current registration status.',
        ]},
        { heading: 'Your consumer rights', body: [
          'Nothing in these terms limits your statutory rights under the Consumer Rights Act 2015, including the 14-day cancellation right in our Returns Policy.',
          'Gift cards may have different cancellation rules where the law permits. [LAWYER REVIEW]',
        ]},
        { heading: 'Liability and governing law', body: [
          'We are responsible for foreseeable loss caused by our breach; not for events outside our reasonable control. Your statutory rights are unaffected. [LAWYER REVIEW: liability cap wording]',
          'These terms are governed by the laws of England and Wales. [LAWYER REVIEW: jurisdiction]',
        ]},
      ]}
    />
  );
}
