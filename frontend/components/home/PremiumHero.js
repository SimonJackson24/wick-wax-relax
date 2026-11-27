import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Typography, Button, Chip, useMediaQuery, useTheme } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useCart } from '../CartContext';

const gbp = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value) || 0);

// Where the subject sits in each product photograph, as a CSS
// object-position. The catalogue is demo data today, so this map is where a
// CMS focal-point field lands: `object_position` (or focal_x / focal_y)
// from the API wins, then this map, then the centre.
//
// The desktop split has its own tuned crop ("center 72%", the wide bath
// scene) and is left alone — these values are for the tight mobile crop,
// where a portrait 1024x1536 photograph was being sliced into a phone-wide
// strip and the candle was cropped out of frame entirely.
const FOCAL_POINTS = {
  'lavender-dream': '38% 45%',
  'fireside-vanilla': '58% 52%',
  'midnight-jasmine': 'center 50%',
  'amber-and-oak': '45% 50%',
};

const focalPointFor = (slide) => {
  if (slide.object_position) return slide.object_position;
  if (typeof slide.focal_x === 'number' || typeof slide.focal_y === 'number') {
    return `${slide.focal_x ?? 50}% ${slide.focal_y ?? 50}%`;
  }
  return FOCAL_POINTS[slide.slug] || 'center';
};

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const reduceMotion = useReducedMotion();
  const slides = products.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [adding, setAdding] = useState(false);

  const count = slides.length;

  const go = useCallback((next) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  }, [count]);

  // Auto-rotation is a desktop luxury and a mobile liability: on a phone it
  // moves the scent (and therefore the price and the CTA target) under the
  // visitor's thumb while they are reading. Below 768px the hero is static
  // and the slide indicators drive it by hand. Reduced motion stops it
  // everywhere.
  const rotationAllowed = !isMobile && !reduceMotion;

  useEffect(() => {
    if (count <= 1 || paused || !rotationAllowed) return undefined;
    const t = setInterval(() => go(index + 1), interval);
    return () => clearInterval(t);
  }, [count, index, paused, interval, go, rotationAllowed]);

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

  // Self-hosted files go through next/image (right-sized crops); anything
  // on another host keeps the plain <img>, because next/image would need
  // that host in its remotePatterns allow-list.
  const isLocalImage = image.startsWith('/');
  const objectPosition = focalPointFor(slide);

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
        // Mobile: the hero is a STACKED composition — photograph on top,
        // copy on plum underneath it. The plum has to be the root colour
        // now, because the copy no longer sits over the photograph.
        backgroundColor: { xs: '#2A1D2A', md: '#F7F3EC' },
        backgroundImage: {
          xs: 'none',
          md: 'radial-gradient(90% 70% at 18% 30%, rgba(200,182,219,0.26) 0%, rgba(247,243,236,0) 62%)',
        },
        borderBottom: '1px solid',
        // The hero ends in plum on mobile (copy under the photograph), so a
        // light theme divider here drew a cream rule between two plum
        // surfaces. Plum-to-plum gets a near-invisible hairline.
        borderColor: { xs: 'rgba(255,255,255,0.08)', md: 'divider' },
      }}
    >
      {/* Full-bleed photograph — runs past the container to the screen edge */}
      <Box
        sx={{
          // Mobile: a real block at the top of the hero, not a full-bleed
          // background behind the copy. The photograph is 1024x1536
          // portrait; cropped into a phone-wide strip it was an unreadable
          // blur. 4:5 keeps the scene, capped at 52vh so the CTA still
          // clears the fold. Desktop: unchanged, bleeding off the right.
          position: { xs: 'relative', md: 'absolute' },
          top: { md: 0 },
          right: { md: 0 },
          bottom: { md: 0 },
          width: { xs: '100%', md: '58%' },
          height: { xs: 'auto', md: '100%' },
          // NOTE: a responsive value that is only set at xs keeps applying
          // at every larger breakpoint — both of these have to be reset at
          // md or the desktop photo is squashed to the mobile crop.
          aspectRatio: { xs: '4 / 5', md: 'none' },
          maxHeight: { xs: '44vh', md: 'none' },
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
              {isLocalImage ? (
                /* Self-hosted file: next/image serves a right-sized crop
                   (sizes) instead of the full 1024x1536 file on a phone. */
                <Image
                  src={image}
                  alt={slide.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                  priority={index === 0}
                  quality={72}
                  style={{ objectFit: 'cover', objectPosition }}
                />
              ) : (
                <Box
                  component="img"
                  src={image}
                  alt={slide.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
                />
              )}
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
        {/* Soften the photograph's own left edge so it meets the panel
            cleanly — desktop split only. */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: { xs: 'none', md: 'block' },
            background: 'linear-gradient(95deg, rgba(42,29,42,0.5) 0%, rgba(42,29,42,0) 26%)',
            pointerEvents: 'none',
          }}
        />
        {/* Mobile: the photograph melts into the plum panel it sits on. */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: { xs: 140, md: 0 },
            display: { xs: 'block', md: 'none' },
            background:
              'linear-gradient(to top, #2A1D2A 0%, rgba(42,29,42,0.55) 45%, rgba(42,29,42,0) 100%)',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* The dark editorial panel spans the WHOLE hero (not just the image
          side) so the display type sits on plum rather than on the pale
          page background — legible and premium.
          On mobile the panel becomes a vertical wash (photograph clear at
          the top, plum deep at the bottom) because the copy is stacked
          under the image instead of beside it. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          // Desktop only: on a phone the copy sits on the plum panel
          // below the photograph, not over it.
          display: { xs: 'none', md: 'block' },
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
          pt: { xs: 2.5, md: 7 },
          pb: { xs: 3.5, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 42%) minmax(0, 1fr)' },
          alignItems: { xs: 'stretch', md: 'center' },
          // Desktop sets the hero height (the photograph is absolute).
          // On a phone the hero is photograph + copy stacked, so the grid
          // takes only the height of the copy.
          minHeight: { md: '78vh' },
        }}
      >
        <Box sx={{ maxWidth: 520, order: { xs: 1, md: 1 }, width: '100%' }}>
          {/* Screen-reader announcement for the slide that is on screen.
              The hero rotates on desktop, so a blind visitor needs to be
              told that the scent (and the price) has changed. */}
          <Box
            component="p"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {slide.name.replace(/^Showcase:\s*/, '')} — {gbp(price)}
          </Box>
          {/* NO entrance animation here. The headline is the LCP element:
              framer-motion starts it at opacity 0 and only reveals it after
              hydration + animation, which pushed mobile LCP to 8.5s. The
              copy renders immediately; slide changes swap content in place
              with a light CSS fade. */}
          <Box key={slide.id} sx={{ '@media (prefers-reduced-motion: no-preference)': { animation: 'wwr-copy-in 0.4s ease both' } }}>
              <Typography variant="overline" sx={{ color: '#E6C88A', display: 'block', mb: { xs: 1.5, md: 2.5 } }}>
                {slide.scent_profile?.mood || 'Hand-poured in small batches'}
              </Typography>

              <Typography
                component="h2"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 500,
                  fontSize: { xs: 'clamp(2rem, 8.6vw, 2.6rem)', md: 'clamp(3rem, 6.2vw, 5.25rem)' },
                  lineHeight: { xs: 1.02, md: 0.98 },
                  letterSpacing: '-0.03em',
                  mb: { xs: 1.5, md: 2.5 }, color: '#FFFFFF', mt: 0,
                }}
              >
                {slide.name.replace(/^Showcase:\s*/, '')}
              </Typography>

              {notes && (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(244,239,231,0.88)', mb: { xs: 1, md: 1.5 },
                    fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                    letterSpacing: '0.01em',
                  }}
                >
                  {notes}
                </Typography>
              )}

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(244,239,231,0.82)', maxWidth: 440, mb: { xs: 1.5, md: 3.5 },
                  lineHeight: 1.7,
                  // Two lines on mobile — the description must never push
                  // the CTA below the fold.
                  display: { xs: '-webkit-box', md: 'block' },
                  WebkitLineClamp: { xs: 2, md: 'none' },
                  WebkitBoxOrient: 'vertical',
                  overflow: { xs: 'hidden', md: 'visible' },
                }}
              >
                {slide.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: { xs: 2, md: 3.5 }, flexWrap: 'wrap' }}>
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: { xs: '1.75rem', md: '2rem' },
                    fontWeight: 500, color: '#FFFFFF',
                  }}
                >
                  {gbp(price)}
                </Typography>
                {rrp && Number(rrp) > Number(price) && (
                  <>
                    <Typography sx={{ textDecoration: 'line-through', color: 'rgba(244,239,231,0.7)' }}>
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

              {/* One primary action on mobile: "Shop this scent" takes the
                  row and quick-add becomes a compact secondary beside it,
                  so both are reachable without scrolling. */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  href={`/product/${slide.slug || slide.id}`}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: '1.1rem !important' }} />}
                  sx={{
                    bgcolor: '#F4EFE7', color: '#2A1D2A',
                    flex: { xs: '1 1 auto', md: '0 0 auto' },
                    minHeight: 48, whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#FFFFFF' },
                  }}
                >
                  Shop this scent
                </Button>
                {slide.variants?.[0] && stock > 0 && (
                  <Button
                    size="large"
                    onClick={handleQuickAdd}
                    disabled={adding}
                    startIcon={<AddIcon sx={{ fontSize: '1.1rem !important' }} />}
                    aria-label={`Add ${slide.name.replace(/^Showcase:\s*/, '')} to basket`}
                    sx={{
                      // Same gold language as the glass card's Shop button:
                      // one accent, one primary, no third dialect.
                      bgcolor: 'transparent',
                      border: '1px solid rgba(230,200,138,0.55)',
                      color: '#E6C88A',
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 48,
                      // On a phone the quick-add is an icon button so it sits
                      // on the same row as the primary action instead of
                      // wrapping onto a second line.
                      minWidth: { xs: 0, md: 'auto' },
                      px: { xs: 1.25, md: 3 },
                      '& .MuiButton-startIcon': { mr: { xs: 0.75, md: 1 } },
                      '&:hover': { bgcolor: 'rgba(230,200,138,0.10)', borderColor: '#E6C88A' },
                    }}
                  >
                    <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                      {adding ? 'Adding…' : 'Add'}
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                      {adding ? 'Adding…' : 'Quick add'}
                    </Box>
                  </Button>
                )}
              </Box>
          </Box>

          {/* The trust ticks are desktop furniture — on mobile the
              announcement bar and the trust scroller above the hero already
              say all of this, and the CTA needs the room. */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: { md: 3 }, flexWrap: 'wrap', mt: { md: 4.5 } }}>
            {['Free 30-day returns', 'Plastic-free packaging', 'Made in the UK'].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckIcon sx={{ fontSize: 15, color: '#E6C88A' }} />
                <Typography variant="caption" sx={{ color: 'rgba(244,239,231,0.82)' }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right column — the glass card floats over the full-bleed
            photograph on desktop. On mobile it is removed: it repeated the
            scent name, notes and price that the copy above already
            carries, and because the column has no height on a phone it was
            clipped by the hero's top edge.
            Positioning lives on a wrapper Box (sx) because framer-motion's
            style prop does not understand responsive breakpoint objects. */}
        <Box sx={{ order: { xs: 2, md: 2 }, position: 'relative', height: { md: '100%' }, display: { xs: 'none', md: 'block' } }}>
          <Box
            sx={{
              position: 'absolute',
              left: { md: -20 },
              bottom: { md: 40 },
              zIndex: 3,
              width: { md: 268 },
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
                  <Typography variant="overline" sx={{ color: '#E6C88A', fontSize: '0.6875rem', letterSpacing: '0.14em' }}>
                    {slide.scent_profile?.mood ? 'Now pouring' : 'Bestseller'}
                  </Typography>
                  <Typography
                    component="p"
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      mb: 0.25,
                      lineHeight: 1.25,
                      color: '#F7F1E8',
                      mt: 0,
                    }}
                  >
                    {slide.name.replace(/^Showcase:\s*/, '')}
                  </Typography>
                  {notes && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontSize: '0.75rem', color: 'rgba(247, 241, 232, 0.78)' }}>
                      {notes}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E6C88A' }}>
                      {gbp(price)}
                    </Typography>
                    {rrp && Number(rrp) > Number(price) && (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'rgba(247, 241, 232, 0.62)' }}>
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
          </Box>
        </Box>

      {/* Slide indicators — editorial thin lines in gold on the dark
          photograph. They live on the hero root (not inside the media
          column) so they keep their position on every breakpoint and are
          never clipped by a zero-height column. Each is a 44px-tall tap
          target with a hairline drawn inside it. */}
      {count > 1 && (
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 12, md: 28 },
            top: { xs: 12, md: 32 },
            display: 'flex',
            alignItems: 'center',
            zIndex: 4,
          }}
        >
          {slides.map((s, i) => (
            <Box
              key={s.id}
              component="button"
              type="button"
              aria-label={`Show ${s.name.replace(/^Showcase:\s*/, '')}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                p: 0,
                border: 0,
                background: 'none',
                cursor: 'pointer',
                '&:focus-visible': { outline: '2px solid #E6C88A', outlineOffset: -2 },
              }}
            >
              <Box
                sx={{
                  width: i === index ? 28 : 14,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: i === index ? '#E6C88A' : 'rgba(244,239,231,0.45)',
                  transition: 'width 400ms cubic-bezier(0.4,0,0.2,1), background-color 300ms ease-out',
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PremiumHero;
