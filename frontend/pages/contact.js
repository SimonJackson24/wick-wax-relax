import React, { useState } from 'react';
import { Box, Container, Typography, Button, Grid, TextField, Paper } from '@mui/material';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { EmailLink } from '../components/EmailLink';
import { SECTION_PY, GUTTER } from '../src/layoutTokens';

// Contact. There is no message backend, so the form composes an email in
// the visitor's own mail app — nothing is stored or sent from the site,
// and the note under the button says exactly that. Demo-grade per the brief.

const Pointers = [
  { text: 'Questions about delivery, returns or a scent?', href: '/faq', label: 'Read the FAQ' },
  { text: 'Where is my order?', href: '/account/orders', label: 'Track it in your account' },
  { text: 'Costs and timescales', href: '/shipping', label: 'Delivery & shipping' },
  { text: 'Changed your mind?', href: '/returns', label: 'Returns & refunds' },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', order: '', message: '' });
  const [error, setError] = useState('');

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const compose = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    setError('');
    const subject = encodeURIComponent(`Website enquiry from ${form.name.trim()}`);
    const body = encodeURIComponent(
      [
        form.message.trim(),
        '',
        '—',
        form.name.trim(),
        form.order.trim() ? `Order number: ${form.order.trim()}` : null,
        form.email.trim(),
      ].filter(Boolean).join('\n')
    );
    // Assembled here, in the browser — the address is never in the server
    // HTML, so Cloudflare's email obfuscation cannot break it.
    window.location.href = `mailto:info@wickwaxrelax.co.uk?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <SEOHead
        title="Contact Us"
        description="Get in touch with Wick Wax & Relax — questions about orders, delivery, returns or our scents, answered by email."
        url="/contact"
      />
      <Navigation />

      <Box className="wwr-dark-surface" sx={{ bgcolor: '#3D2B3D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, px: GUTTER }}>
          <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2 }}>
            Contact
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Playfair Display", serif', fontWeight: 500,
              fontSize: { xs: '2.25rem', md: '3.25rem' }, lineHeight: 1.05,
              letterSpacing: '-0.02em', color: '#FFFFFF', mt: 0,
            }}
          >
            Get in touch
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: SECTION_PY, backgroundColor: 'background.default' }}>
        <Container maxWidth="md" sx={{ px: GUTTER }}>
          <Grid container spacing={{ xs: 4, md: 8 }}>
            <Grid item xs={12} md={5}>
              <Typography variant="body1" sx={{ lineHeight: 1.9, mb: 3 }}>
                Email is the fastest way to reach us. Write to{' '}
                <EmailLink /> and include your order number if your question
                is about a delivery.
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 3, backgroundColor: 'background.subtle' }}>
                <Typography variant="overline" sx={{ color: 'tertiary.ink', display: 'block', mb: 2 }}>
                  Answers to common questions
                </Typography>
                {Pointers.map((pointer) => (
                  <Box key={pointer.href} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{pointer.text}</Typography>
                    <Button component="a" href={pointer.href} size="small" sx={{ pl: 0, textTransform: 'none' }}>
                      {pointer.label}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: { xs: 3, md: 4 }, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Send us a message
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                  This form opens the message in your own email app — nothing
                  is stored on the site. Send it from the address you want us
                  to reply to.
                </Typography>
                <form onSubmit={compose} noValidate>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Your name" required value={form.name} onChange={set('name')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Your email" type="email" required value={form.email} onChange={set('email')} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Order number (optional)" value={form.order} onChange={set('order')} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Your message" required multiline minRows={5} value={form.message} onChange={set('message')} />
                    </Grid>
                    {error && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="error">{error}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 3, px: 4 }}>
                        Compose the email
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default ContactPage;
