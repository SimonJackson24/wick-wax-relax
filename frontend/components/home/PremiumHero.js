import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useCart } from '../CartContext';

const gbp = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value) || 0);

/**
 * Premium hero — a large product photograph with the product card
 * overlapping and offset, cross-fading between products.
 *
 * Composition: editorial split (copy left, image right) with the card
 * floating over the image's lower-left edge, breaking the grid. Depth
 * comes from the layered shadow on that card, the tall crop of the
 * photograph, and a soft tinted wash behind the whole section.
 *
 * Transition: a slow opacity dissolve (1.4s) with a gentle Ken Burns
 * scale on the image — the Apple/Aesop treatment, not a slide.
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
    return (
      <Box
        sx={{
          py: { xs: 8, md: 14 },
          textAlign: 'center',
          px: 3,
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 2 }}>
          Hand-poured in small batches
        </Typography>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Light, scent and stillness.
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 460, mx: 'auto', mb: 4 }}>
          Soy candles and wax melts, poured by hand in Sussex. Clean-burning,
          plastic-free, made to slow the room down.
        </Typography>
        <Button component={Link} href="/products" variant="contained" size="large">
          Shop the collection
        </Button>
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
        // Soft tinted wash rather than flat cream — gives the section a
        // sense of light falling on it.
        background:
          'radial-gradient(120% 90% at 78% 18%, rgba(200,182,219,0.30) 0%, rgba(244,239,231,0) 58%), linear-gradient(180deg, #F7F3EC 0%, #FDFCFA 100%)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2.5, md: 5 },
          py: { xs: 6, md: 9 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.05fr)' },
          alignItems: 'center',
          gap: { xs: 4, md: 7 },
        }}
      >
        {/* Copy */}
        <Box sx={{ maxWidth: 540, order: { xs: 2, md: 1 } }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            >
              <Typography variant="overline" sx={{ color: 'tertiary.main', display: 'block', mb: 2 }}>
                {slide.scent_profile?.mood || 'Hand-poured in small batches'}
              </Typography>

              <Typography
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 500,
                  fontSize: 'clamp(2.75rem, 5.6vw, 4.5rem)',
                  lineHeight: 1.04,
                  letterSpacing: '-0.025em',
                  mb: 2,
                }}
              >
                {slide.name.replace(/^Showcase:\s*/, '')}
              </Typography>

              {notes && (
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', mb: 2, fontSize: '1.0625rem' }}
                >
                  {notes}
                </Typography>
              )}

              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', maxWidth: 460, mb: 3.5, lineHeight: 1.8 }}
              >
                {slide.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 3.5, flexWrap: 'wrap' }}>
                <Typography
                  sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 500 }}
                >
                  {gbp(price)}
                </Typography>
                {rrp && Number(rrp) > Number(price) && (
                  <>
                    <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {gbp(rrp)}
                    </Typography>
                    <Chip
                      size="small"
                      label={`Save ${Math.round((1 - Number(price) / Number(rrp)) * 100)}%`}
                      sx={{
                        bgcolor: 'rgba(61,43,61,0.08)',
                        color: 'primary.dark',
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
                >
                  Shop this scent
                </Button>
                {slide.variants?.[0] && stock > 0 && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleQuickAdd}
                    disabled={adding}
                    startIcon={<AddIcon sx={{ fontSize: '1.1rem !important' }} />}
                  >
                    {adding ? 'Adding…' : 'Quick add'}
                  </Button>
                )}
              </Box>
            </motion.div>
          </AnimatePresence>

          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
            {['Free 30-day returns', 'Plastic-free packaging', 'Made in the UK'].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckIcon sx={{ fontSize: 15, color: 'tertiary.main' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Large photograph with the offset product card */}
        <Box sx={{ order: { xs: 1, md: 2 }, position: 'relative', width: '100%' }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              aspectRatio: { xs: '4 / 3.6', md: '5 / 5.6' }, // tall crop = premium
              backgroundColor: '#F1EBE1',
              border: '1px solid rgba(28,26,31,0.07)',
              boxShadow: '0 24px 60px rgba(28,26,31,0.14)',
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
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 9, ease: 'linear' }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={slide.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* The offset card — overlaps the photograph's lower-left edge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -14, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -10, y: 6 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              style={{ position: 'absolute', left: { xs: 12, md: -34 }, bottom: { xs: 12, md: 34 } }}
            >
              <Box
                sx={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(28,26,31,0.08)',
                  borderRadius: 1.5,
                  p: { xs: 2, md: 2.5 },
                  minWidth: { xs: 200, md: 240 },
                  // Layered shadow: tight contact + wide ambient = physical depth
                  boxShadow:
                    '0 2px 4px rgba(28,26,31,0.06), 0 12px 28px rgba(28,26,31,0.10), 0 32px 64px rgba(28,26,31,0.12)',
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
                  {slide.scent_profile?.mood ? 'Now pouring' : 'Bestseller'}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.0625rem',
                    fontWeight: 500,
                    mb: 0.25,
                    lineHeight: 1.25,
                  }}
                >
                  {slide.name.replace(/^Showcase:\s*/, '')}
                </Typography>
                {notes && (
                  <Typography variant="caption" sx={{ display: 'block', mb: 1.25, fontSize: '0.6875rem' }}>
                    {notes}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {gbp(price)}
                  </Typography>
                  {rrp && Number(rrp) > Number(price) && (
                    <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {gbp(rrp)}
                    </Typography>
                  )}
                  <Button
                    component={Link}
                    href={`/product/${slide.slug || slide.id}`}
                    variant="contained"
                    size="small"
                    sx={{ ml: 'auto' }}
                  >
                    Shop
                  </Button>
                </Box>
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators — editorial thin lines */}
          {count > 1 && (
            <Box
              sx={{
                position: 'absolute',
                right: { xs: 14, md: 22 },
                top: { xs: 14, md: 22 },
                display: 'flex',
                gap: 1,
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
