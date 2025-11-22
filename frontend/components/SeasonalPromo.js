import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';

const calculateTimeLeft = () => {
  // Set the end date to 30 days from now for the promotion
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  
  const difference = +endDate - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return timeLeft;
};

const CountdownTimer = ({ timeLeft }) => {
  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <Box key={interval} sx={{ textAlign: 'center', mx: 1 }}>
        <Typography 
          variant="h4" 
          component="span" 
          sx={{ 
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: 'rgba(230, 200, 138, 0.8)',
            borderRadius: 2,
            px: 2,
            py: 1,
            minWidth: '60px',
            display: 'inline-block'
          }}
        >
          {String(timeLeft[interval]).padStart(2, '0')}
        </Typography>
        <Typography 
          variant="body2" 
          display="block" 
          sx={{ 
            mt: 1,
            color: '#ffffff',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: '0.05em'
          }}
        >
          {interval}
        </Typography>
      </Box>
    );
  });

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
      {timerComponents.length ? timerComponents : <Typography variant="h6" sx={{ color: '#ffffff' }}>Offer Expired</Typography>}
    </Box>
  );
};

const SeasonalPromo = () => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/seasonal-promo-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Overlay pattern for better text readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1
        }}
      />
      
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              mb: 2
            }}
          >
            Spring Collection Special
          </Typography>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                mb: 4,
                fontWeight: 300
              }}
            >
              20% Off All Floral Scents
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Typography 
              variant="body1" 
              sx={{
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                mb: 2,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Limited time offer on our entire spring collection. Embrace the fresh scents of the season!
            </Typography>
          </motion.div>

          <Box sx={{ mb: 5, mt: 4 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Typography 
                variant="body2" 
                sx={{
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              >
                Offer Ends In:
              </Typography>
              <CountdownTimer timeLeft={timeLeft} />
            </motion.div>
          </Box>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button
              variant="contained"
              size="large"
              href="/category/spring"
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.text.primary,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 50,
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(230, 200, 138, 0.3)',
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                  boxShadow: '0 6px 16px rgba(230, 200, 138, 0.4)'
                }
              }}
            >
              Shop Spring Collection
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SeasonalPromo;