import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Chip } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

/**
 * Editorial hero — one statement, one photograph, an overlapping product
 * card. Replaces the old auto-rotating carousel (a dated pattern; Amazon
 * doesn't use one either).
 *
 * The overlapping card is the Amazon "buy box" instinct rendered beautifully:
 * price + quick-add visible without scrolling past the fold.
 */
const HomeHero = ({
  eyebrow = 'Hand-poured in small batches',
  title = 'Light, scent and stillness.',
  subtitle = 'Soy candles and wax melts, poured by hand in Sussex. Clean-burning, plastic-free, made to slow the room down.',
  primaryCta = { label: 'Shop candles', href: '/products?category=candles' },
  secondaryCta = { label: 'Explore wax melts', href: '/products?category=wax-melts' },
  assurances = ['Free 30-day returns', 'Plastic-free packaging', 'Made in the UK'],
  image = '/images/candles-hero.svg',
  feature = null,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 6, md: 0 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          alignItems: 'center',
          gap: { xs: 5, md: 8 },
        }}
      >
        {/* Copy */}
        <Box sx={{ order: { xs: 2, md: 1 }, maxWidth: 560, pb: { xs: 2, md: 0 } }}>
          <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 2 }}>
            {eyebrow}
          </Typography>

          <Typography variant="h1" sx={{ mb: 3 }}>
            {title}
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', fontSize: '1.0625rem', maxWidth: 460, mb: 4 }}
          >
            {subtitle}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 5 }}>
            <Button
              component={Link}
              href={primaryCta.href}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon sx={{ fontSize: '1.1rem !important' }} />}
            >
              {primaryCta.label}
            </Button>
            <Button component={Link} href={secondaryCta.href} variant="outlined" size="large">
              {secondaryCta.label}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
            {assurances.map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckIcon sx={{ fontSize: 15, color: 'tertiary.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Photograph + overlapping product card */}
        <Box sx={{ order: { xs: 1, md: 2 }, position: 'relative', width: '100%' }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: { xs: 1, md: 2 },
              overflow: 'hidden',
              aspectRatio: { xs: '4 / 3.4', md: '5 / 5.2' },
              backgroundColor: '#F4EFE7',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              component="img"
              src={image}
              alt="Hand-poured soy candle in a warm-lit interior"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>

          {feature && (
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 12, md: -28 },
                bottom: { xs: 12, md: 28 },
                backgroundColor: '#FFFFFF',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                minWidth: 210,
                boxShadow: '0 12px 32px rgba(28,26,31,0.10)',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {feature.eyebrow || 'Bestseller'}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.0625rem', fontWeight: 500, mb: 0.5 }}
              >
                {feature.name}
              </Typography>
              {feature.notes && (
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  {feature.notes}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {feature.price}
                </Typography>
                {feature.rrp && (
                  <Typography
                    variant="body2"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                  >
                    {feature.rrp}
                  </Typography>
                )}
                <Button
                  component={Link}
                  href={feature.href || '/products'}
                  variant="contained"
                  size="small"
                  sx={{ ml: 'auto' }}
                >
                  {feature.ctaLabel || 'Shop'}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HomeHero;
