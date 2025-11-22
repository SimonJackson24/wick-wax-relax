import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

const Hero = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const currentBg = heroBackgrounds[currentImageIndex];

  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: currentBg.gradient,
      }}
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Animated Background Overlay */}
      <AnimatePresence mode="wait">
        <Box
          key={currentImageIndex}
          component={motion.div}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: currentBg.overlay,
            zIndex: 1,
          }}
        />
      </AnimatePresence>

      {/* Ambient Lighting Effects */}
      <Box
        component={motion.div}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentBg.accentColor}20 0%, transparent 70%)`,
          filter: 'blur(20px)',
          zIndex: 2,
        }}
      />

      <Box
        component={motion.div}
        animate={{
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        sx={{
          position: 'absolute',
          bottom: '30%',
          right: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.15) 0%, transparent 70%)',
          filter: 'blur(15px)',
          zIndex: 2,
        }}
      />

      {/* Main Content */}
      <Box
        component={motion.div}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        sx={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          maxWidth: '800px',
          px: 3,
        }}
      >
        <Typography
          id="hero-title"
          component={motion.h1}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          sx={{
            fontFamily: '"Playfair Display", "Times New Roman", serif',
            fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
            fontWeight: 700,
            color: '#ffffff',
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            background: `linear-gradient(45deg, #ffffff 30%, ${currentBg.accentColor} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}
        >
          Welcome to Wick Wax & Relax
        </Typography>

        <Typography
          component={motion.p}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            color: '#f5f5f5',
            mb: 4,
            fontWeight: 300,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.4,
          }}
        >
          Indulge in premium soy wax melts and candles crafted for your ultimate relaxation experience
        </Typography>

        <Box
          component={motion.div}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              component={Link}
              href="/products"
              variant="contained"
              size="large"
              animate={{
                boxShadow: [
                  `0 0 20px ${currentBg.accentColor}40`,
                  `0 0 30px ${currentBg.accentColor}60`,
                  `0 0 20px ${currentBg.accentColor}40`,
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              sx={{
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 600,
                borderRadius: '50px',
                background: `linear-gradient(45deg, ${currentBg.accentColor} 30%, #ffb347 90%)`,
                color: '#1a1a1a',
                border: `2px solid ${currentBg.accentColor}`,
                textTransform: 'none',
                boxShadow: `0 4px 15px ${currentBg.accentColor}30`,
                '&:hover': {
                  background: `linear-gradient(45deg, #ffb347 30%, ${currentBg.accentColor} 90%)`,
                  borderColor: '#ffb347',
                  boxShadow: `0 6px 20px ${currentBg.accentColor}50`,
                },
              }}
              aria-label="Shop our premium collection of wax melts and candles"
            >
              Shop Now
            </Button>
          </motion.div>
        </Box>
      </Box>

      {/* Floating Particles Animation */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
            sx={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: currentBg.accentColor,
              left: `${5 + Math.random() * 90}%`,
              top: `${10 + Math.random() * 80}%`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </Box>

      {/* Background Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${currentBg.accentColor}10 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${currentBg.accentColor}10 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${currentBg.accentColor}05 0%, transparent 50%)
          `,
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default Hero;