import React from 'react';
import Link from 'next/link';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { SECTION_PY, GUTTER } from '../src/layoutTokens';

// Our story. Every claim here is one the store already makes elsewhere
// (small batches, the fourteen-day cure, Sussex, plastic-free, vegan) —
// nothing new is invented. Demo-grade copy per the brief.

const NUMBERS = [
  { value: '12', label: 'candles in a batch — never more' },
  { value: '14', label: 'days every candle cures before it leaves the studio' },
  { value: '100%', label: 'vegan, and plastic-free packaging as standard' },
];

const AboutPage = () => (
  <>
    <SEOHead
      title="Our Story — Hand-Poured in Sussex"
      description="Wick Wax & Relax pours soy candles, wax melts and bath bombs by hand in small batches in Sussex — twelve candles at a time, cured for fourteen days."
      url="/about"
    />
    <Navigation />

    {/* Plum band — the page's opening statement */}
    <Box className="wwr-dark-surface" sx={{ bgcolor: '#3D2B3D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, px: GUTTER }}>
        <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2 }}>
          Our story
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Playfair Display", serif', fontWeight: 500,
            fontSize: { xs: '2.25rem', md: '3.5rem' }, lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#FFFFFF', mb: 3, mt: 0,
          }}
        >
          Twelve candles a batch.
          <Box component="span" sx={{ display: 'block' }}>Never more.</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(244,239,231,0.86)', maxWidth: 560, lineHeight: 1.9 }}>
          Wick Wax &amp; Relax is a small studio making soy candles, wax melts and
          bath bombs by hand — poured, labelled and packed in Sussex.
        </Typography>
      </Container>
    </Box>

    {/* The story */}
    <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default' }}>
      <Container maxWidth="md" sx={{ px: GUTTER }}>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid item xs={12} md={7}>
            <Typography variant="body1" sx={{ lineHeight: 2, mb: 3 }}>
              We pour every candle by hand, in batches of twelve. It is slower
              than a factory and deliberately so: small batches are how we keep
              the fragrance load right, the wick centred and the finish worth
              putting on a shelf.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 2, mb: 3 }}>
              Once poured, nothing leaves the studio for fourteen days. Curing
              is the unglamorous half of candle-making — two weeks of patience
              that turns a good scent into one that fills the room and stays
              there. If a batch does not burn cleanly, it does not ship.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 2 }}>
              Everything is made with vegan soy wax and packed plastic-free,
              and every candle and wax melt carries a CLP label with its
              allergens declared. What is on the label is what is in the jar.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 3, md: 4 }, backgroundColor: 'background.subtle' }}>
              <Typography variant="overline" sx={{ color: 'tertiary.ink', display: 'block', mb: 2 }}>
                At a glance
              </Typography>
              {['Hand-poured soy candles, wax melts and bath bombs',
                'Poured and packed in Sussex',
                'Cured for fourteen days before sale',
                'Plastic-free packaging as standard',
                'CLP-labelled, allergens declared'].map((line) => (
                  <Typography key={line} variant="body2" sx={{ display: 'flex', gap: 1.5, mb: 1.5, lineHeight: 1.6 }}>
                    <Box component="span" sx={{ color: 'tertiary.main' }}>—</Box>
                    {line}
                  </Typography>
                ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>

    {/* Numbers */}
    <Box sx={{ py: SECTION_PY, backgroundColor: 'background.subtle', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="md" sx={{ px: GUTTER }}>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          {NUMBERS.map((item) => (
            <Grid item xs={12} sm={4} key={item.value}>
              <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontSize: { xs: '3rem', md: '3.75rem' }, lineHeight: 1, color: 'primary.main' }}>
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7, maxWidth: 260 }}>
                {item.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>

    {/* Call to action */}
    <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default' }}>
      <Container maxWidth="md" sx={{ px: GUTTER, textAlign: 'center' }}>
        <Typography variant="h3" component="h2" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, mb: 2 }}>
          Smell what the patience is for
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mb: 4, lineHeight: 1.9 }}>
          Every scent on the site came out of the same twelve-candle batches.
          Try one and you will see what fourteen days does.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button component={Link} href="/products" variant="contained" size="large" sx={{ borderRadius: 3 }}>
            Shop the collection
          </Button>
          <Button component={Link} href="/faq" variant="outlined" size="large" sx={{ borderRadius: 3 }}>
            Read the FAQ
          </Button>
        </Box>
      </Container>
    </Box>

    <Footer />
  </>
);

export default AboutPage;
