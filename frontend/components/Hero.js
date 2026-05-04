import React, { useState, useEffect, useRef } from 'react';
import { Box, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Benefit-first approach for slides
const categorySlides = [
  {
    id: 'candles',
    tagline: 'Transform Your Evening Routine',
    name: 'Candles',
    description: 'Premium beeswax & soy candles with wooden wicks. Handcrafted in the UK with ethically sourced wax and lasting, clean-burning fragrances.',
    customerBenefit: 'Longer burn time, cleaner air, better wellbeing',
    backgroundImage: '/images/candles-hero.svg',
    ctaText: 'Shop Candles',
    ctaLink: '/products?category=candles',
    colorScheme: { primary: '#E6C88A', secondary: '#C8B6DB', accent: '#B2C8BA' }
  },
  {
    id: 'wax-melts',
    tagline: 'Scents That Last 50+ Hours',
    name: 'Wax Melts',
    description: 'Hand-poured premium wax melts in biodegradable glassine bags. Eco-friendly labels, unlimited scent combinations for your electric warmer.',
    customerBenefit: 'Snappable cubes, endless variety, plastic-free packaging',
    backgroundImage: '/images/wax-melts-hero.svg',
    ctaText: 'Shop Wax Melts',
    ctaLink: '/products?category=wax-melts',
    colorScheme: { primary: '#C8B6DB', secondary: '#E6C88A', accent: '#B2C8BA' }
  },
  {
    id: 'bath-bombs',
    tagline: 'Spa Day, Every Day',
    name: 'Bath Bombs',
    description: 'Fizzy, 100% vegan bath bombs with therapeutic essential oils. Handmade in the UK with nourishing, skin-loving ingredients.',
    customerBenefit: 'Skin-softening, aromatic, Instagram-worthy',
    backgroundImage: '/images/bath-bombs-hero.svg',
    ctaText: 'Shop Bath Bombs',
    ctaLink: '/products?category=bath-bombs',
    colorScheme: { primary: '#B2C8BA', secondary: '#C8B6DB', accent: '#E6C88A' }
  },
  {
    id: 'diffusers',
    tagline: 'Continuous Fragrance, Zero Effort',
    name: 'Diffusers',
    description: 'Elegant reed diffusers with sustainably sourced rattan. Fills your home with subtle, constant fragrance for months.',
    customerBenefit: 'Set it, forget it, enjoy it',
    backgroundImage: '/images/diffusers-hero.svg',
    ctaText: 'Shop Diffusers',
    ctaLink: '/products?category=diffusers',
    colorScheme: { primary: '#C8B6DB', secondary: '#B2C8BA', accent: '#E6C88A' }
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const playButtonRef = useRef(null);

  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % categorySlides.length);
      }, 4500);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlaying, isHovered]);

  const goToSlide = (index) => setCurrentSlide(index);
  const goToNextSlide = () => setCurrentSlide((prev) => (prev + 1) % categorySlides.length);
  const goToPrevSlide = () => setCurrentSlide((prev) => (prev - 1 + categorySlides.length) % categorySlides.length);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowLeft') { goToPrevSlide(); prevButtonRef.current?.focus(); }
      else if (event.key === 'ArrowRight') { goToNextSlide(); nextButtonRef.current?.focus(); }
      else if (event.key === ' ') {
        event.preventDefault();
        setIsAutoPlaying(!isAutoPlaying);
        playButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAutoPlaying]);

  const currentSlideData = categorySlides[currentSlide];

  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      sx={{
        position: 'relative',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        minHeight: { xs: '90vh', sm: '85vh', md: '90vh', lg: '95vh', xl: '100vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        mt: 0,
        height: { xs: '90vh', sm: '85vh', md: '90vh', lg: '95vh', xl: '100vh' },
        paddingTop: { xs: '15vh', md: '10vh', lg: '8vh' }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product category showcase"
      id="main-content"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${currentSlideData.backgroundImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 1
          }}
          aria-hidden="true"
        />
      </AnimatePresence>

      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `linear-gradient(135deg,
            rgba(0,0,0,0.6) 0%,
            rgba(0,0,0,0.4) 30%,
            rgba(0,0,0,0.3) 60%,
            rgba(0,0,0,0.5) 100%)`,
          zIndex: 2
        }}
        aria-hidden="true"
      />

      <Box
        component="div"
        sx={{
          position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px',
          overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0
        }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentSlideData.name}, {currentSlideData.description}
      </Box>

      <Box
        component={motion.div}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        sx={{
          position: 'relative', zIndex: 5, textAlign: 'center', width: '100vw',
          height: { xs: '90vh', sm: '85vh', md: '90vh', lg: '95vh', xl: '100vh' },
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 0, margin: 0
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              width: '100%', maxWidth: '1200px', padding: '0 2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontSize: 'clamp(0.875rem, 1.5vw, 1.1rem)',
                fontWeight: '600', lineHeight: '1.4',
                color: currentSlideData.colorScheme.secondary,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                textTransform: 'uppercase', letterSpacing: '0.15em',
                textAlign: 'center', margin: 0
              }}
            >
              {currentSlideData.tagline}
            </motion.p>

            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontFamily: '"Playfair Display", "Dancing Script", "Great Vibes", "Allura", "Satisfy", serif',
                fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: '400', lineHeight: '1.1',
                color: '#ffffff', textShadow: '3px 3px 6px rgba(0,0,0,0.7)',
                marginBottom: '1rem', textAlign: 'center', margin: 0
              }}
            >
              {currentSlideData.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)', fontWeight: '400', lineHeight: '1.6',
                color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                maxWidth: '650px', textAlign: 'center', marginBottom: '1rem', margin: 0
              }}
            >
              {currentSlideData.description}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: '400', lineHeight: '1.6',
                color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                maxWidth: '600px', textAlign: 'center', marginBottom: '2rem', margin: 0,
                fontStyle: 'italic'
              }}
            >
              {currentSlideData.customerBenefit}
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ scale: 1.05, boxShadow: `0 12px 35px ${currentSlideData.colorScheme.primary}80` }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'inline-block' }}
            >
              <Button
                component={Link}
                href={currentSlideData.ctaLink}
                variant="contained"
                size="large"
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  px: { xs: 4, md: 5, lg: 6 },
                  py: { xs: 2, md: 2.5, lg: 3 },
                  fontSize: { xs: '1.1rem', md: '1.2rem', lg: '1.3rem' },
                  fontWeight: 500,
                  borderRadius: '50px',
                  background: `linear-gradient(45deg, ${currentSlideData.colorScheme.primary} 30%, ${currentSlideData.colorScheme.secondary} 90%)`,
                  color: '#ffffff',
                  border: `2px solid ${currentSlideData.colorScheme.accent}`,
                  textTransform: 'none',
                  boxShadow: `0 8px 25px ${currentSlideData.colorScheme.primary}60`,
                  minWidth: { xs: '220px', md: '240px', lg: '260px' },
                  maxWidth: { xs: '300px', md: '320px', lg: '340px' },
                  width: 'auto',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transition: 'left 0.6s',
                  },
                  '&:hover::before': { left: '100%' },
                  '&:hover': {
                    background: `linear-gradient(45deg, ${currentSlideData.colorScheme.secondary} 30%, ${currentSlideData.colorScheme.primary} 90%)`,
                    borderColor: currentSlideData.colorScheme.secondary,
                    boxShadow: `0 12px 35px ${currentSlideData.colorScheme.primary}100`,
                    transform: 'translateY(-3px)',
                  },
                  '&:active': { transform: 'translateY(0px)' }
                }}
                aria-label={`Shop ${currentSlideData.name}`}
              >
                {currentSlideData.ctaText}
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: '2rem', md: '3rem' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 2, md: 3 },
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '50px',
          padding: { xs: '0.5rem 1rem', md: '0.75rem 1.5rem' },
          border: '1px solid rgba(255,255,255,0.2)'
        }}
        role="group"
        aria-label="Carousel controls"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevSlide}
          ref={prevButtonRef}
          style={{
            background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer',
            padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          aria-label="Previous slide"
        >
          ‹
        </motion.button>

        <Box sx={{ display: 'flex', gap: 1 }} role="tablist">
          {categorySlides.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => goToSlide(index)}
              style={{
                width: currentSlide === index ? '12px' : '8px',
                height: currentSlide === index ? '12px' : '8px',
                borderRadius: '50%', border: 'none',
                backgroundColor: currentSlide === index ? '#ffffff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.3s ease'
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={currentSlide === index}
              role="tab"
            />
          ))}
        </Box>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNextSlide}
          ref={nextButtonRef}
          style={{
            background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer',
            padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          aria-label="Next slide"
        >
          ›
        </motion.button>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: { xs: '1rem', md: '2rem' },
          right: { xs: '1rem', md: '2rem' },
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '0.5rem 1rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          ref={playButtonRef}
          style={{
            background: 'none', border: 'none', color: '#ffffff', fontSize: '0.9rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
          aria-label={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
        >
          {isAutoPlaying ? '⏸️' : '▶️'}
          <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
        </motion.button>
      </Box>
    </Box>
  );
};

export default Hero;