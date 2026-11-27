import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { SECTION_PY, GUTTER } from '../../src/layoutTokens';

/**
 * Shop by mood — the positioning move. Amazon sells by product type;
 * premium home-fragrance brands sell by occasion ("To Unwind", "To Wake").
 * This is the section a competitor's grid cannot copy.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

const MOODS = [
  {
    label: 'To Unwind',
    caption: 'Slow evenings, soft light',
    image: '/images/hero2-opt.jpg',
    href: '/products?category=wax-melts',
    tint: '#EDE6F2',
  },
  {
    label: 'To Wake',
    caption: 'Bright, citrus, morning',
    image: '/images/hero1-opt.jpg',
    href: '/products?category=candles',
    tint: '#F6EADB',
  },
  {
    label: 'To Celebrate',
    caption: 'Warm, spiced, golden',
    image: '/images/mood-citrus.jpg',
    href: '/products?category=bath-bombs',
    tint: '#F3E7E1',
  },
  {
    label: 'To Reset',
    caption: 'Clean, green, uncluttered',
    image: '/images/wax-melts-opt.jpg',
    href: '/products?category=diffusers',
    tint: '#E7EDE8',
  },
];

const MoodTiles = ({ moods = MOODS }) => (
  <Box sx={{ py: SECTION_PY, backgroundColor: 'background.subtle', borderTop: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ maxWidth: 1440, mx: 'auto', px: GUTTER }}>
      <Box sx={{ mb: { xs: 4, md: 5 }, maxWidth: 620 }}>
        <Typography variant="overline" sx={{ color: 'tertiary.ink', display: 'block', mb: 1.5 }}>
          01 &nbsp;—&nbsp; Shop by mood
        </Typography>
        <Typography variant="h2" component="h2">
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
                // One ratio across every breakpoint — the tiles read as a
                // set of prints, not as four differently-shaped boxes.
                aspectRatio: '4 / 5',
                backgroundColor: mood.tint,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 320ms ease-out',
                '&:hover img': { transform: 'scale(1.04)' },
                '&:hover .mood-arrow': { opacity: 1, transform: 'translate(0, 0)' },
                '&:focus-visible': { outline: '2px solid #C9846B', outlineOffset: 2 },
              }}
            >
              <Box
                component="img"
                src={mood.image}
                alt={mood.label}
                loading="lazy"
                sx={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  transition: 'transform 600ms cubic-bezier(0.2,0,0,1)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute', inset: 0,
                  background:
                    'linear-gradient(200deg, rgba(61,43,61,0.18) 0%, rgba(230,200,138,0.10) 60%, rgba(201,132,107,0.10) 100%)',
                  mixBlendMode: 'soft-light',
                }}
              />
              <Box
                sx={{
                  position: 'absolute', inset: 0,
                  backgroundImage: GRAIN,
                  backgroundSize: '160px 160px',
                  opacity: 0.14,
                  mixBlendMode: 'overlay',
                }}
              />
              {/* Bottom gradient: the label sits on a designed dark base,
                  not on whatever the photograph happens to be doing. */}
              <Box
                sx={{
                  position: 'absolute', inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.38) 26%, rgba(0,0,0,0.10) 52%, transparent 72%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  p: { xs: 1.75, md: 2.5 },
                  color: '#FFFFFF',
                }}
              >
                <Typography
                  component="h3"
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    fontWeight: 500,
                    lineHeight: 1.2,
                    mb: 0.35,
                    color: '#FFFFFF',
                    mt: 0,
                    textShadow: '0 1px 12px rgba(0,0,0,0.45)',
                  }}
                >
                  {mood.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: { xs: '0.8125rem', md: '0.75rem' },
                    display: 'block',
                    textShadow: '0 1px 10px rgba(0,0,0,0.45)',
                  }}
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
