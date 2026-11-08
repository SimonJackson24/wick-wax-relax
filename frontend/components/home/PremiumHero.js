import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, Button, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useCart } from '../CartContext';

const gbp = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value) || 0);

// Film grain — a subtle noise layer over photography. Cheap, but it is the
// single most effective way to stop stock imagery reading as stock: it
// removes the flat digital-cleanliness and gives the page a printed feel.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

/**
 * Premium hero — a large, full-bleed product photograph bleeding off the
 * right edge of the viewport, with the product card floating over the
 * image's lower-left corner, cross-fading between products.
 *
 * Composition is deliberately asymmetric: copy occupies the left ~42%,
 * the image runs past the container to the screen edge. Nothing is
 * centred; the grid is broken on purpose.
 *
 * The photograph carries a warm brand grade (plum→amber multiply with a
 * soft-light pass) plus film grain, so a set of unrelated stock photos
 * reads as one art-directed campaign.
 */
const PremiumHero = ({ products = [], interval = 6500 }) => {
  const { addToCart } = useCart();
  const slides = products.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [adding, setAdding] = useState(false);

  const count = slides.length;

  const go = useCallback((next) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const t = setInterval(() => go(index + 1), interval);
    return () => clearInterval(t);
  }, [count, index, paused, interval, go]);

  if (count === 0) {
    // No products (first launch, or the API was unreachable) — still show a
    // full premium hero rather than a bare text block. A half-built page is
    // worse than an elegant one.
    return (
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          // LCP CRITICAL: explicit dimensions via inline style, NOT MUI sx.
          // sx styles are injected by emotion during React hydration, so a
          // sx-only minHeight left the next/image fill container at 0px
          // until ~400KB of JS downloaded + executed on Slow 4G — LCP was
          // 6.5-8.5s because the image couldn't paint pre-hydration.
          // A raw inline style is in the static HTML from the first byte,
          // giving the fill-layout image its dimensions immediately.
          minHeight: { xs: 'auto', md: '78vh' },
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#2A1D2A',
          style: { minHeight: '78vh' },
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0 }}>
          {/* LCP PRE-HYDRATION FALLBACK: a raw <img> with inline styles
              paints from the static HTML the moment the first byte arrives
              — it doesn't wait for React, MUI, or the next/image
              optimizer. The optimized next/image replaces it on hydration
              (higher quality, responsive srcset). Both are in the DOM
              because the fallback has position:absolute + zIndex:0 and the
              Image sits above it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero2-opt.jpg"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 72%',
              zIndex: 0,
            }}
          />
          {/* next/image: replaces the fallback on hydration with the
              optimized responsive version */}
          <Image
            src="/images/hero2-opt.jpg"
            alt="Hand-poured candles in a warm-lit room"
            fill
            priority
            sizes="100vw"
            quality={72}
            style={{ objectFit: 'cover', objectPosition: 'center 72%' }}
          />
          <Box
            sx={{
              position: 'absolute', inset: 0,
              background:
                'linear-gradient(95deg, rgba(28,22,28,0.88) 0%, rgba(28,22,28,0.62) 45%, rgba(28,22,28,0.15) 100%)',
            }}
          />
          {/* Warm candle-glow wash on the dark text side — the flat plum
              read as a SaaS gradient; a soft amber radial (like light from
              a flame off-frame) gives the copy side the warmth the
              photography already has. */}
          <Box
            sx={{
              position: 'absolute', inset: 0,
              background:
                'radial-gradient(55% 80% at 6% 85%, rgba(230,200,138,0.14) 0%, rgba(230,200,138,0) 60%)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'relative', zIndex: 2, width: '100%', maxWidth: 1440, mx: 'auto',
            px: { xs: 2.5, md: 5 }, py: { xs: 8, md: 12 }, color: '#F4EFE7',
          }}
        >
          <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2 }}>
            Hand-poured in small batches
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Playfair Display", serif', fontWeight: 500,
              fontSize: 'clamp(3rem, 6.2vw, 5.25rem)', lineHeight: 0.98,
              letterSpacing: '-0.03em', mb: 2.5, color: '#FFFFFF',
            }}
          >
            Light, scent and stillness.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(244,239,231,0.84)', maxWidth: 440, mb: 4 }}>
            Soy candles and wax melts, poured by hand in Sussex. Clean-burning,
            plastic-free, made to slow the room down.
          </Typography>
          <Button
            component={Link}
            href="/products"
            variant="contained"
            size="large"
            sx={{ bgcolor: '#F4EFE7', color: '#2A1D2A', '&:hover': { bgcolor: '#FFFFFF' } }}
          >
            Shop the collection
          </Button>
        </Box>
      </Box>
    );
  }

  const slide = slides[index];
  const price = slide.variants?.[0]?.price ?? slide.base_price;
  const rrp = slide.rrp;
  const stock = slide.variants?.length
    ? slide.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0)
    : 0;
  const notes = slide.scent_profile
    ? Object.entries(slide.scent_profile)
        .filter(([, v]) => typeof v === 'string' && v)
        .slice(0, 3)
        .map(([, v]) => v)
        .join(' · ')
    : '';
  const image = slide.image_url || slide.image ||
    (slide.images && slide.images[0] && (slide.images[0].image_url || slide.images[0])) ||
    '/images/candles-hero.svg';

  const handleQuickAdd = async () => {
    const variant = slide.variants?.[0];
    if (!variant) return;
    setAdding(true);
    await addToCart({
      productId: slide.id,
      variantId: variant.id,
      name: slide.name,
      price: variant.price,
      image,
      quantity: 1,
    });
    setAdding(false);
  };

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#F7F3EC',
        backgroundImage:
          'radial-gradient(90% 70% at 18% 30%, rgba(200,182,219,0.26) 0%, rgba(247,243,236,0) 62%)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Full-bleed photograph — runs past the container to the screen edge */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: { xs: '100%', md: '58%' },
          overflow: 'hidden',
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              initial={{ scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 9, ease: 'linear' }}
              style={{ width: '100%', height: '100%' }}
            >
              <Box
                component="img"
                src={image}
                alt={slide.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 72%', display: 'block' }}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Brand grade — warm plum/amber duotone so any photo sits in one world */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(200deg, rgba(61,43,61,0.20) 0%, rgba(230,200,138,0.10) 55%, rgba(201,132,107,0.10) 100%)',
            mixBlendMode: 'soft-light',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            backgroundSize: '160px 160px',
            opacity: 0.10,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
        {/* Soften the photograph's own left edge so it meets the panel cleanly */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(95deg, rgba(42,29,42,0.5) 0%, rgba(42,29,42,0) 26%)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* The dark editorial panel spans the WHOLE hero (not just the image
          side) so the display type sits on plum rather than on the pale
          page background — legible and premium. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(95deg, #2A1D2A 0%, #2A1D2A 26%, rgba(42,29,42,0.86) 44%, rgba(42,29,42,0.18) 63%, rgba(42,29,42,0) 76%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, md: 5 },
          pt: { xs: 6, md: 7 },
          pb: { xs: 8, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 42%) minmax(0, 1fr)' },
          alignItems: 'center',
          minHeight: { md: '78vh' },
        }}
      >
        <Box sx={{ maxWidth: 520, order: { xs: 2, md: 1 } }}>
          {/* NO entrance animation here. The headline is the LCP element:
              framer-motion starts it at opacity 0 and only reveals it after
              hydration + animation, which pushed mobile LCP to 8.5s. The
              copy renders immediately; slide changes swap content in place
              with a light CSS fade. */}
          <Box key={slide.id} sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: 'wwr-copy-in 0.4s ease both' } }}>
              <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: 2.5 }}>
                {slide.scent_profile?.mood || 'Hand-poured in small batches'}
              </Typography>

              <Typography
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 500,
                  fontSize: 'clamp(3rem, 6.2vw, 5.25rem)',
                  lineHeight: 0.98,
                  letterSpacing: '-0.03em',
                  mb: 2.5, color: '#FFFFFF',
                }}
              >
                {slide.name.replace(/^Showcase:\s*/, '')}
              </Typography>

              {notes && (
                <Typography
                  variant="body1"
                  sx={{ color: 'rgba(244,239,231,0.88)', mb: 1.5, fontSize: '1.0625rem', letterSpacing: '0.01em' }}
                >
                  {notes}
                </Typography>
              )}

              <Typography
                variant="body2"
                sx={{ color: 'rgba(244,239,231,0.76)', maxWidth: 440, mb: 3.5, lineHeight: 1.85 }}
              >
                {slide.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 3.5, flexWrap: 'wrap' }}>
                <Typography
                  sx={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 500, color: '#FFFFFF' }}
                >
                  {gbp(price)}
                </Typography>
                {rrp && Number(rrp) > Number(price) && (
                  <>
                    <Typography sx={{ textDecoration: 'line-through', color: 'rgba(244,239,231,0.6)' }}>
                      {gbp(rrp)}
                    </Typography>
                    <Chip
                      size="small"
                      label={`Save ${Math.round((1 - Number(price) / Number(rrp)) * 100)}%`}
                      sx={{
                        bgcolor: '#E6C88A',
                        color: '#2A1D2A',
                        fontWeight: 700,
                        height: 24,
                      }}
                    />
                  </>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 4.5 }}>
                <Button
                  component={Link}
                  href={`/product/${slide.slug || slide.id}`}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: '1.1rem !important' }} />}
                  sx={{ bgcolor: '#F4EFE7', color: '#2A1D2A', '&:hover': { bgcolor: '#FFFFFF' } }}
                >
                  Shop this scent
                </Button>
                {slide.variants?.[0] && stock > 0 && (
                  <Button
                    size="large"
                    onClick={handleQuickAdd}
                    disabled={adding}
                    startIcon={<AddIcon sx={{ fontSize: '1.1rem !important' }} />}
                    sx={{
                      // Same gold language as the glass card's Shop button:
                      // one accent, one primary, no third dialect.
                      bgcolor: 'transparent',
                      border: '1px solid rgba(230,200,138,0.55)',
                      color: '#E6C88A',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(230,200,138,0.10)', borderColor: '#E6C88A' },
                    }}
                  >
                    {adding ? 'Adding…' : 'Quick add'}
                  </Button>
                )}
              </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
            {['Free 30-day returns', 'Plastic-free packaging', 'Made in the UK'].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckIcon sx={{ fontSize: 15, color: 'tertiary.main' }} />
                <Typography variant="caption" sx={{ color: 'rgba(244,239,231,0.78)' }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right column — the card floats over the full-bleed photograph.
            Positioning lives on a wrapper Box (sx) because framer-motion's
            style prop does not understand responsive breakpoint objects. */}
        <Box sx={{ order: { xs: 1, md: 2 }, position: 'relative', height: { md: '100%' } }}>
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 16, md: -20 },
              bottom: { xs: 16, md: 40 },
              zIndex: 3,
              width: { xs: 'calc(100% - 32px)', md: 268 },
            }}
          >
            <Box key={slide.id} sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: 'wwr-copy-in 0.4s ease both' } }}>
                {/* Editorial glass card — dark plum glass with gold accent,
                    native to the hero's world. The previous white
                    drop-shadowed card read as a foreign Shopify widget
                    pasted onto the photography. */}
                <Box
                  sx={{
                    backgroundColor: 'rgba(30, 20, 32, 0.66)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(230, 200, 138, 0.28)',
                    borderRadius: 2,
                    p: 2.5,
                    boxShadow:
                      '0 2px 6px rgba(12, 8, 14, 0.22), 0 18px 40px rgba(12, 8, 14, 0.30)',
                  }}
                >
                  <Typography variant="overline" sx={{ color: '#E6C88A', fontSize: '0.625rem', letterSpacing: '0.14em' }}>
                    {slide.scent_profile?.mood ? 'Now pouring' : 'Bestseller'}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      mb: 0.25,
                      lineHeight: 1.25,
                      color: '#F7F1E8',
                    }}
                  >
                    {slide.name.replace(/^Showcase:\s*/, '')}
                  </Typography>
                  {notes && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontSize: '0.6875rem', color: 'rgba(247, 241, 232, 0.72)' }}>
                      {notes}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E6C88A' }}>
                      {gbp(price)}
                    </Typography>
                    {rrp && Number(rrp) > Number(price) && (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'rgba(247, 241, 232, 0.55)' }}>
                        {gbp(rrp)}
                      </Typography>
                    )}
                    <Button
                      component={Link}
                      href={`/product/${slide.slug || slide.id}`}
                      size="small"
                      sx={{
                        ml: 'auto',
                        bgcolor: '#E6C88A',
                        color: '#2A1D2A',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#F0D6A0' },
                      }}
                    >
                      Shop
                    </Button>
                  </Box>
                </Box>
            </Box>
          </Box>

          {/* Slide indicators — editorial thin lines */}
          {count > 1 && (
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 16, md: 28 },
                top: { xs: 20, md: 32 },
                display: 'flex',
                gap: 1,
                zIndex: 3,
              }}
            >
              {slides.map((s, i) => (
                <Box
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Show ${s.name}`}
                  onClick={() => go(i)}
                  onKeyDown={(e) => e.key === 'Enter' && go(i)}
                  sx={{
                    width: i === index ? 30 : 14,
                    height: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: i === index ? '#3D2B3D' : 'rgba(28,26,31,0.22)',
                    transition: 'width 400ms cubic-bezier(0.4,0,0.2,1), background-color 300ms ease-out',
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PremiumHero;
