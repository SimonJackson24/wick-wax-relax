import React from 'react';
import { Box, Container, Typography, Button, Accordion, AccordionSummary, AccordionDetails, Link as MuiLink } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { EmailLink } from '../components/EmailLink';
import { SECTION_PY, GUTTER } from '../src/layoutTokens';

// Frequently asked questions. Every answer restates what another page on
// the site already claims (delivery → /shipping, returns → /returns,
// subscriptions → /subscriptions, vegan & plastic-free → the footer and
// trust strip) — nothing new is promised here, and where the honest answer
// is "being confirmed", it says so.

const QUESTIONS = [
  {
    q: 'Where do you deliver?',
    a: <>Across the UK — mainland, the Highlands &amp; Islands and Northern Ireland. International delivery is on its way; join the newsletter to hear when it opens. Full details are on our <Link href="/shipping">shipping page</Link>.</>,
  },
  {
    q: 'How much does delivery cost, and how long does it take?',
    a: <>We send everything Royal Mail tracked: Tracked 48 (usually 2–3 working days) or Tracked 24 (usually 1–2 working days). Orders placed before the cutoff on a working day dispatch the same or the next working day. Current costs are on our <Link href="/shipping">shipping page</Link>.</>,
  },
  {
    q: 'What is your returns policy?',
    a: <>If something is not right, email us with your order number within 14 days of delivery, then return the goods within a further 14 days. The full policy is on our <Link href="/returns">returns page</Link>.</>,
  },
  {
    q: 'How do subscriptions work?',
    a: <>Pick the scents you love, add them to your subscription basket, and choose how often they arrive. Subscribers save on every delivery, and you can change, pause or cancel whenever you like — no minimum term, no phone calls. Start on the <Link href="/subscriptions">subscriptions page</Link>.</>,
  },
  {
    q: 'Are your products vegan?',
    a: <>Yes. Everything is made with vegan soy wax and is cruelty-free, and all of our packaging is plastic-free.</>,
  },
  {
    q: 'Are the candles CLP-labelled?',
    a: <>Every candle and wax melt carries a CLP label with its allergens declared, so you know exactly what is in it before you light it.</>,
  },
  {
    q: 'My question is not here.',
    a: <>Email us and we will help: <EmailLink />. If it is about an order, include your order number so we can find it quickly.</>,
  },
];

const FaqPage = () => (
  <>
    <SEOHead
      title="Frequently Asked Questions"
      description="Delivery, returns, subscriptions and our ingredients — the questions we are asked most about Wick Wax & Relax candles, wax melts and bath bombs."
      url="/faq"
    />
    <Navigation />

    <Box className="wwr-dark-surface" sx={{ bgcolor: '#3D2B3D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, px: GUTTER }}>
        <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2 }}>
          FAQ
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Playfair Display", serif', fontWeight: 500,
            fontSize: { xs: '2.25rem', md: '3.25rem' }, lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#FFFFFF', mt: 0,
          }}
        >
          Frequently asked
        </Typography>
      </Container>
    </Box>

    <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default' }}>
      <Container maxWidth="md" sx={{ px: GUTTER }}>
        {QUESTIONS.map((item, i) => (
          <Accordion
            key={item.q}
            defaultExpanded={i === 0}
            disableGutters
            elevation={0}
            sx={{
              mb: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.default',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontSize: '1.15rem' }}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.9, '& a': { textDecoration: 'underline', textUnderlineOffset: '2px', fontWeight: 500 } }}
              >
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Still stuck? We are an email away.
          </Typography>
          <Button component={Link} href="/contact" variant="contained" size="large" sx={{ borderRadius: 3 }}>
            Contact us
          </Button>
        </Box>
      </Container>
    </Box>

    <Footer />
  </>
);

export default FaqPage;
