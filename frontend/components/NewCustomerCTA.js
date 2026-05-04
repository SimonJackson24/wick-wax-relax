import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CardGiftcard as GiftIcon,
  Email as EmailIcon,
  LocalOffer as OfferIcon,
  Spa as SpaIcon
} from '@mui/icons-material';

const benefits = [
  { id: 'discount', icon: OfferIcon, text: '10% off your first order' },
  { id: 'early-access', icon: GiftIcon, text: 'Early access to new scents' },
  { id: 'exclusive', icon: SpaIcon, text: 'Exclusive subscriber-only offers' }
];

const NewsletterSignup = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setSuccessMessage('Welcome! Check your inbox for your 10% discount code.');
        setShowSuccess(true);
        setEmail('');
        setErrors({});
        setIsLoading(false);
      }, 1000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <Box sx={{ py: 8, bgcolor: theme.palette.background.default }}>
      <Container maxWidth="md">
        <Grid container spacing={4} alignItems="center">
          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Box
                sx={{
                  display: 'inline-block',
                  backgroundColor: `${theme.palette.secondary.main}20`,
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  mb: 2
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.secondary.dark,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Join the Family
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography
                variant="h3"
                component="h2"
                gutterBottom
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 400,
                  color: theme.palette.text.primary,
                  fontSize: { xs: '1.75rem', md: '2.25rem' }
                }}
              >
                Get 10% Off Your First Order
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
                Subscribe to our newsletter and be the first to know about new scents, 
                exclusive offers, and relaxation tips delivered straight to your inbox.
              </Typography>
            </motion.div>

            <List>
              {benefits.map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <motion.div key={benefit.id} variants={itemVariants}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: `${theme.palette.primary.main}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconComponent sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit.text}
                        primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                      />
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                backgroundColor: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <EmailIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                  Get Your 10% Off
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email below and we'll send your exclusive discount code right away.
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
                    '&:disabled': { backgroundColor: theme.palette.grey[300] }
                  }}
                >
                  {isLoading ? 'Sending...' : 'Get My 10% Off'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  No spam, ever. Unsubscribe anytime.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewsletterSignup;