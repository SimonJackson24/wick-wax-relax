import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

/**
 * Shop by mood — the positioning move. Amazon sells by product type;
 * premium home-fragrance brands sell by occasion ("To Unwind", "To Wake").
 * This is the section a competitor's grid cannot copy.
 */
const MOODS = [
  {
    label: 'To Unwind',
    caption: 'Slow evenings, soft light',
    image: '/images/wax-melt.svg',
    href: '/products?category=wax-melts',
    tint: '#EDE6F2',
  },
  {
    label: 'To Wake',
    caption: 'Bright, citrus, morning',
    image: '/images/candles-hero.svg',
    href: '/products?category=candles',
    tint: '#F6EADB',
  },
  {
    label: 'To Celebrate',
    caption: 'Warm, spiced, golden',
    image: '/images/bath-bombs-hero.svg',
    href: '/products?category=bath-bombs',
    tint: '#F3E7E1',
  },
  {
    label: 'To Reset',
    caption: 'Clean, green, uncluttered',
    image: '/images/diffusers-hero.svg',
    href: '/products?category=diffusers',
    tint: '#E7EDE8',
  },
];

const MoodTiles = ({ moods = MOODS }) => (
  <Box sx={{ py: { xs: 7, md: 11 }, backgroundColor: 'background.default' }}>
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: { xs: 4, md: 5 }, maxWidth: 620 }}>
        <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 1.5 }}>
          Shop by mood
        </Typography>
        <Typography variant="h2">
          What does the room need tonight?
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, md: 2.5 },
        }}
      >
        {moods.map((mood) => (
          <Link key={mood.label} href={mood.href} style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                aspectRatio: { xs: '3 / 4', md: '4 / 5' },
                backgroundColor: mood.tint,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 320ms ease-out',
                '&:hover img': { transform: 'scale(1.04)' },
                '&:hover .mood-arrow': { opacity: 1, transform: 'translate(0, 0)' },
              }}
            >
              <Box
                component="img"
                src={mood.image}
                alt={mood.label}
                sx={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  transition: 'transform 600ms cubic-bezier(0.2,0,0,1)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(28,26,31,0.55) 0%, rgba(28,26,31,0.12) 45%, transparent 70%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  p: { xs: 1.5, md: 2.5 },
                  color: '#FFFFFF',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: { xs: '1.125rem', md: '1.5rem' },
                    fontWeight: 500,
                    lineHeight: 1.2,
                    mb: 0.25,
                  }}
                >
                  {mood.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: '0.6875rem', md: '0.75rem' } }}
                >
                  {mood.caption}
                </Typography>
              </Box>
              <Box
                className="mood-arrow"
                sx={{
                  position: 'absolute', top: 12, right: 12,
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transform: 'translate(-4px, 4px)',
                  transition: 'opacity 240ms ease-out, transform 240ms ease-out',
                }}
              >
                <ArrowOutwardIcon sx={{ fontSize: 15, color: '#1C1A1F' }} />
              </Box>
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  </Box>
);

export default MoodTiles;
