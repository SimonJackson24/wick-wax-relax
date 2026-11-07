import React from 'react';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Link as MuiLink, IconButton, TextField, Button } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Rebuilt for "The Ritual" design system. The previous Footer existed but
// was never imported by any page — the homepage rendered its own inline
// footer instead, which is why the legal pages (Terms, Privacy, Returns,
// Shipping, Cookies) were unreachable and why the whole site had no
// navigation footer at all.

const SHOP_LINKS = [
  { name: 'Shop all', href: '/products' },
  { name: 'Candles', href: '/category/candles' },
  { name: 'Wax melts', href: '/category/wax-melts' },
  { name: 'Bath bombs', href: '/category/bath-bombs' },
  { name: 'Diffusers', href: '/category/diffusers' },
  { name: 'Subscribe & save', href: '/subscriptions' },
  { name: 'Gift cards', href: '/products' },
];

const HELP_LINKS = [
  { name: 'Contact us', href: '/contact' },
  { name: 'Order tracking', href: '/account/orders' },
  { name: 'Delivery & shipping', href: '/shipping' },
  { name: 'Returns & refunds', href: '/returns' },
  { name: 'Frequently asked', href: '/faq' },
  { name: 'Accessibility', href: '/accessibility' },
];

const POLICY_LINKS = [
  { name: 'Terms & Conditions', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Cookie Policy', href: '/cookies' },
  { name: 'Modern slavery statement', href: '/terms' },
];

const SOCIALS = [
  { icon: <InstagramIcon sx={{ fontSize: 18 }} />, href: 'https://instagram.com/wickwaxrelax', label: 'Instagram' },
  { icon: <FacebookIcon sx={{ fontSize: 18 }} />, href: 'https://facebook.com/wickwaxrelax', label: 'Facebook' },
  { icon: <MusicNoteIcon sx={{ fontSize: 18 }} />, href: 'https://tiktok.com/@wickwaxrelax', label: 'TikTok' },
];

const Column = ({ title, links }) => (
  <Box>
    <Typography
      variant="overline"
      sx={{ color: 'rgba(244,239,231,0.55)', display: 'block', mb: 2.5 }}
    >
      {title}
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {links.map((link) => (
        <MuiLink
          key={link.name}
          component={Link}
          href={link.href}
          underline="none"
          sx={{
            color: 'rgba(244,239,231,0.82)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            width: 'fit-content',
            transition: 'color 200ms ease-out',
            '&:hover': { color: '#E6C88A' },
          }}
        >
          {link.name}
        </MuiLink>
      ))}
    </Box>
  </Box>
);

const Footer = () => (
  <Box component="footer" sx={{ backgroundColor: '#3D2B3D', color: '#F4EFE7', pt: { xs: 7, md: 10 }, pb: 4 }}>
    <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 4 } }}>
      <Grid container spacing={{ xs: 5, md: 8 }}>
        {/* Brand + newsletter */}
        <Grid item xs={12} md={5}>
          <Typography
            sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 500, mb: 1.5 }}
          >
            Wick Wax &amp; Relax
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(244,239,231,0.72)', maxWidth: 380, mb: 3 }}>
            Hand-poured soy candles, wax melts and bath bombs made in small
            batches in Sussex. Plastic-free, vegan, and honestly labelled.
          </Typography>
          <Box sx={{ mb: 3, maxWidth: 400 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'rgba(244,239,231,0.9)' }}>
              10% off your first order
            </Typography>
            <Box
              component="form"
              onSubmit={(e) => e.preventDefault()}
              sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
            >
              <TextField
                type="email"
                required
                placeholder="Your email address"
                aria-label="Email address"
                size="small"
                sx={{
                  flex: '1 1 180px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#F4EFE7',
                    '& fieldset': { borderColor: 'rgba(244,239,231,0.28)' },
                    '&:hover fieldset': { borderColor: 'rgba(244,239,231,0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#E6C88A' },
                  },
                  '& input::placeholder': { color: 'rgba(244,239,231,0.5)', opacity: 1 },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  backgroundColor: '#E6C88A',
                  color: '#2A1D2A',
                  '&:hover': { backgroundColor: '#D9B85F' },
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {SOCIALS.map((social) => (
              <IconButton
                key={social.label}
                component="a"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                sx={{
                  border: '1px solid rgba(244,239,231,0.25)',
                  color: 'rgba(244,239,231,0.85)',
                  borderRadius: '50%',
                  width: 36, height: 36,
                  '&:hover': { borderColor: '#E6C88A', color: '#E6C88A', backgroundColor: 'transparent' },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Column title="Shop" links={SHOP_LINKS} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Column title="Help" links={HELP_LINKS} />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Column title="Legal" links={POLICY_LINKS} />
          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'rgba(244,239,231,0.55)' }}>
            Wick Wax &amp; Relax, [registered address], [company number]
            <br />
            VAT [GB000000000] · Made in the UK
          </Typography>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: { xs: 5, md: 7 },
          pt: 3,
          borderTop: '1px solid rgba(244,239,231,0.14)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(244,239,231,0.55)' }}>
          © {new Date().getFullYear()} Wick Wax &amp; Relax. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(244,239,231,0.55)' }}>
          Free UK delivery over £25 · 30-day returns
        </Typography>
      </Box>
    </Container>
  </Box>
);

export default Footer;
