import React from 'react';
import Link from 'next/link';
import { Box, Typography, Container, Divider, useTheme } from '@mui/material';
import Navigation from './Navigation';
import Footer from './Footer';
import SEOHead from './SEOHead';

// Shared layout for legal/policy pages. Content sections arrive as
// { heading, body[] } — body entries are paragraphs. LLM-reviewed
// placeholders are marked [LAWYER REVIEW] for solicitor sign-off.
const LegalPage = ({ title, description, updated, sections }) => (
  <>
    <SEOHead title={`${title} — Wick Wax Relax`} description={description} />
    <Navigation />
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Last updated: {updated} · Wick Wax & Relax, United Kingdom
      </Typography>

      {sections.map((section, i) => (
        <Box key={i} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{section.heading}</Typography>
          {section.body.map((para, j) => (
            <Typography key={j} variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 1.5 }}>
              {para}
            </Typography>
          ))}
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />
      <Typography variant="body2" color="text.secondary">
        Questions about this policy? Email <Link href="mailto:info@wickwaxrelax.co.uk">info@wickwaxrelax.co.uk</Link>.
        See also our{' '}
        <Link href="/terms">Terms</Link>, <Link href="/privacy">Privacy</Link>,{' '}
        <Link href="/returns">Returns</Link>, <Link href="/shipping">Shipping</Link> and{' '}
        <Link href="/cookies">Cookie</Link> policies.
      </Typography>
    </Container>
    <Footer />
  </>
);

export default LegalPage;
