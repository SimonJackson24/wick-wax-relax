import React, { useState, useEffect } from 'react';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Custom hook for typewriter effect
const useTypewriter = (text, speed = 150) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
};

// Hero background configurations with gradients
const heroBackgrounds = [
  {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    alt: 'Luxurious candle collection with flickering flames',
    title: 'Candle Serenity',
    overlay: 'rgba(255, 140, 0, 0.1)',
    accentColor: '#ffd700'
  },
  {
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #11998e 50%, #38ef7d 100%)',
    alt: 'Relaxing bath with dissolving bath bombs',
    title: 'Bath Bliss',
    overlay: 'rgba(56, 239, 125, 0.1)',
    accentColor: '#38ef7d'
  },
  {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    alt: 'Aromatic wax melts in elegant melter',
    title: 'Aromatic Escape',
    overlay: 'rgba(240, 147, 251, 0.1)',
    accentColor: '#f093fb'
  }
];

// Optimized SVG images for better performance and scalability
const heroImages = [
  {
    src: '/images/hero-image.svg',
    alt: 'Luxurious candle collection with flickering flames',
    title: 'Candle Serenity'
  },
  {
    src: '/images/bath-scene.svg',
    alt: 'Relaxing bath with dissolving bath bombs',
    title: 'Bath Bliss'
  },
  {
    src: '/images/wax-melt.svg',
    alt: 'Aromatic wax melts in elegant melter',
    title: 'Aromatic Escape'
  }
];

const Hero = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const typewriterText = useTypewriter('Welcome to Wick Wax & Relax', 150);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const currentBg = heroBackgrounds[currentImageIndex];
  const currentImage = heroImages[currentImageIndex];

  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      sx={{
        position: 'relative',
        minHeight: {
          xs: '80vh', // Reduced from 100vh for better mobile experience
          md: '85vh',
          lg: '90vh'
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: currentBg.gradient,
        mt: {
          xs: `${theme.custom?.spacing?.headerHeight?.mobile || 64}px`,
          md: `${theme.custom?.spacing?.headerHeight?.desktop || 80}px`
        },
        height: {
          xs: `calc(80vh - ${theme.custom?.spacing?.headerHeight?.mobile || 64}px)`,
          md: `calc(85vh - ${theme.custom?.spacing?.headerHeight?.desktop || 80}px)`,
          lg: `calc(90vh - ${theme.custom?.spacing?.headerHeight?.desktop || 80}px)`
        }
      }}
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Background Image Carousel */}
      <motion.div
        key={currentImageIndex}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 0.8, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${currentImage.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
        }}
      />

      {/* Gradient Overlay */}
      <Box
        component={motion.div}
        key={`overlay-${currentImageIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)',
          zIndex: 2,
        }}
      />

      {/* Main Content */}
      <Box
        component={motion.div}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        sx={{
          position: 'relative',
          zIndex: 5,
          textAlign: 'center',
          maxWidth: {
            xs: '95%',
            sm: '85%',
            md: '800px'
          },
          px: {
            xs: theme.custom?.spacing?.md || 2,
            md: theme.custom?.spacing?.lg || 3
          },
          mx: 'auto'
        }}
      >
        {/* Main Heading with Typewriter Effect */}
        <motion.div
          id="hero-title"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            fontFamily: theme.custom?.typography?.script?.fontFamily || 'serif',
            fontSize: {
              xs: 'clamp(2rem, 8vw, 3rem)',
              md: 'clamp(2.5rem, 6vw, 4rem)',
              lg: 'clamp(3rem, 5vw, 5rem)'
            },
            fontWeight: theme.custom?.typography?.script?.fontWeight || 700,
            marginBottom: {
              xs: theme.custom?.spacing?.lg || 2,
              md: theme.custom?.spacing?.xl || 3
            },
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            lineHeight: theme.custom?.typography?.script?.lineHeight || 1.2,
            minHeight: {
              xs: 'clamp(3rem, 10vw, 4rem)',
              md: 'clamp(4rem, 8vw, 5rem)',
              lg: 'clamp(5rem, 6vw, 6rem)'
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'pre',
            background: `linear-gradient(45deg, ${theme.palette?.text?.inverse || '#ffffff'} 30%, ${currentBg.accentColor} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {typewriterText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            style={{
              marginLeft: theme.custom?.spacing?.sm || 1,
              fontSize: 'inherit',
              fontFamily: 'inherit',
              background: `linear-gradient(45deg, ${theme.palette?.text?.inverse || '#ffffff'} 30%, ${currentBg.accentColor} 90%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            |
          </motion.span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          style={{
            fontSize: {
              xs: 'clamp(1rem, 4vw, 1.25rem)',
              md: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              lg: 'clamp(1.2rem, 2vw, 1.5rem)'
            },
            color: theme.palette?.text?.inverse || '#ffffff',
            marginBottom: {
              xs: theme.custom?.spacing?.xl || 3,
              md: theme.custom?.spacing?.xxl || 4
            },
            fontWeight: 300,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.4,
            padding: {
              xs: `0 ${theme.custom?.spacing?.md || 2}`,
              md: 0
            }
          }}
        >
          Indulge in premium soy wax melts and candles crafted for your ultimate relaxation experience
        </motion.p>

        {/* Call-to-Action Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              component={Link}
              href="/products"
              variant="contained"
              size="large"
              sx={{
                px: {
                  xs: theme.custom?.spacing?.lg || 3,
                  md: theme.custom?.spacing?.xl || 4,
                  lg: theme.custom?.spacing?.xxl || 5
                },
                py: {
                  xs: theme.custom?.spacing?.md || 1.5,
                  md: theme.custom?.spacing?.lg || 2,
                  lg: theme.custom?.spacing?.xl || 2.5
                },
                fontSize: {
                  xs: '1rem',
                  md: '1.1rem',
                  lg: '1.2rem'
                },
                fontWeight: theme.custom?.typography?.button?.fontWeight || 600,
                borderRadius: theme.custom?.shape?.borderRadius?.pill || '50px',
                background: `linear-gradient(45deg, ${currentBg.accentColor} 30%, ${theme.palette?.accent?.main || currentBg.accentColor} 90%)`,
                color: theme.palette?.text?.primary || '#000000',
                border: `2px solid ${currentBg.accentColor}`,
                textTransform: theme.custom?.typography?.button?.textTransform || 'none',
                boxShadow: `0 4px 15px ${currentBg.accentColor}30`,
                minWidth: {
                  xs: '160px',
                  md: '180px',
                  lg: '200px'
                },
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette?.accent?.main || currentBg.accentColor} 30%, ${currentBg.accentColor} 90%)`,
                  borderColor: theme.palette?.accent?.main || currentBg.accentColor,
                  boxShadow: `0 6px 20px ${currentBg.accentColor}50`,
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                }
              }}
              aria-label="Shop our premium collection of wax melts and candles"
            >
              Shop Now
            </Button>
          </motion.div>
        </motion.div>
      </Box>

      {/* Subtle Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${currentBg.accentColor}08 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${currentBg.accentColor}08 0%, transparent 50%)
          `,
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default Hero;