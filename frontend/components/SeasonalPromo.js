import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const SPRING_COLLECTION_LINK = '/products?category=spring';

const calculateTimeLeft = () => {
  const stored = localStorage.getItem('spring_promo_end_date');
  const endDate = stored ? new Date(stored) : (() => { const d = new Date(); d.setDate(d.getDate() + 14); localStorage.setItem('spring_promo_end_date', d.toISOString()); return d; })();
  const difference = +endDate - +new Date();
  if (difference <= 0) {
    localStorage.removeItem('spring_promo_end_date');
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
};

const CountdownTimer = ({ timeLeft }) => {
  const timerComponents = [];
  const isUrgent = timeLeft.days < 3;
  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && interval !== 'days') return;
    timerComponents.push(
      <Box key={interval} sx={{ textAlign: 'center', mx: { xs: 0.5, sm: 1 } }}>
        <Typography
          variant="h4" component="span"
          sx={{
            fontWeight: 'bold', color: isUrgent ? '#ff6b6b' : '#ffffff',
            backgroundColor: 'rgba(230, 200, 138, 0.8)', borderRadius: 2,
            px: { xs: 1.5, sm: 2 }, py: { xs: 0.5, sm: 1 },
            minWidth: { xs: '50px', sm: '60px' }, display: 'inline-block',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          {String(timeLeft[interval]).padStart(2, '0')}
        </Typography>
        <Typography
          variant="body2" display="block"
          sx={{ mt: 1, color: '#ffffff', textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' }, letterSpacing: '0.05em' }}
        >
          {interval}
        </Typography>
      </Box>
    );
  });
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
      {timerComponents.length ? timerComponents : <Typography variant="h6" sx={{ color: '#ffffff' }}>Offer Ended</Typography>}
    </Box>
  );
};

const SeasonalPromo = () => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.values(newTimeLeft).every(v => v === 0)) localStorage.removeItem('spring_promo_end_date');
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Box sx={{ py: { xs: 6, md: 8 }, backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.5)), url(/images/spring-collection-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(200, 182, 219, 0.1)', zIndex: 1 }} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'inline-block', backgroundColor: theme.palette.secondary.main, color: theme.palette.text.primary, px: 3, py: 1, borderRadius: 50, mb: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
              Limited Time Offer
            </Box>
          </motion.div>
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Spring Collection Sale
          </Typography>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Typography variant="h4" gutterBottom sx={{ color: theme.palette.secondary.main, textShadow: '1px 1px 2px rgba(0,0,0,0.5)', mb: 3, fontWeight: 600, fontSize: { xs: '1.5rem', md: '2rem' } }}>
              20% Off All Floral Scents
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', mb: 2, maxWidth: '600px', mx: 'auto', fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              Embrace the fresh scents of the season with our handcrafted floral collection.
              Lavenders, peonies, rose & geranium — all made with ethically sourced beeswax
              and sustainable ingredients.
            </Typography>
          </motion.div>
          <Box sx={{ mb: 4, mt: 4 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Offer Ends In:
              </Typography>
              <CountdownTimer timeLeft={timeLeft} />
            </motion.div>
          </Box>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.6 }}>
            <Button variant="contained" size="large" href={SPRING_COLLECTION_LINK} component={motion.button} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} sx={{ backgroundColor: theme.palette.secondary.main, color: theme.palette.text.primary, px: { xs: 4, md: 5 }, py: { xs: 1.5, md: 2 }, fontSize: { xs: '1rem', md: '1.1rem' }, borderRadius: 50, fontWeight: 600, boxShadow: '0 4px 12px rgba(230, 200, 138, 0.4)', '&:hover': { backgroundColor: theme.palette.secondary.dark, boxShadow: '0 6px 16px rgba(230, 200, 138, 0.5)' } }}>
              Shop Spring Collection
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.8 }}>
            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
              * Discount applied at checkout. Cannot be combined with other offers.
            </Typography>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SeasonalPromo;