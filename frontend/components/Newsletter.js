import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import EmailIcon from '@mui/icons-material/Email';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

const Newsletter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setEmail('');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }, 1500);
  };

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
    setShowError(false);
  };

  return (
    <Box
      component="section"
      id="newsletter"
      sx={{
        py: { xs: 8, md: 12, lg: 16 },
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${theme.palette.secondary.main}08 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}08 0%, transparent 50%)
          `,
          zIndex: 1,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          textAlign="center"
          mb={{ xs: 8, md: 10, lg: 12 }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3rem', lg: '3.5rem' },
              color: theme.palette.text.primary,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Stay Connected with Us
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 400,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              lineHeight: 1.6,
            }}
          >
            Subscribe to our newsletter and be the first to know about new products, exclusive offers, and relaxation tips
          </Typography>
        </Box>

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          sx={{
            maxWidth: '600px',
            mx: 'auto',
            backgroundColor: theme.palette.background.paper,
            borderRadius: { xs: 3, md: 4 },
            boxShadow: `0 8px 25px ${theme.palette.shadow}`,
            border: `2px solid transparent`,
            p: { xs: 4, md: 5, lg: 6 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.accent.main})`,
            },
            '&:hover': {
              borderColor: `${theme.palette.secondary.main}40`,
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 35px ${theme.palette.secondary.main}30`,
            }
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <EmailIcon
                sx={{
                  fontSize: { xs: 48, md: 56 },
                  color: theme.palette.secondary.main,
                  mr: 2
                }}
              />
              <Typography
                variant="h5"
                component="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.4rem', md: '1.6rem' },
                  color: theme.palette.text.primary
                }}
              >
                Join Our Community
              </Typography>
            </Box>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                lineHeight: 1.7,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 400,
                mb: 2,
                textAlign: 'center'
              }}
            >
              Get 10% off your first order when you subscribe to our newsletter!
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
              <LocalOfferIcon
                sx={{
                  fontSize: { xs: 28, md: 32 },
                  color: theme.palette.accent.main,
                  mr: 1.5
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}
              >
                Exclusive discounts and early access to new collections
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
              <MarkEmailReadIcon
                sx={{
                  fontSize: { xs: 28, md: 32 },
                  color: theme.palette.accent.main,
                  mr: 1.5
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}
              >
                Monthly relaxation tips and aromatherapy insights
              </Typography>
            </Box>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter your email address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                  '& fieldset': {
                    borderColor: `${theme.palette.secondary.main}50`,
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: `${theme.palette.secondary.main}80`,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '16px 24px',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                mt: 2,
                px: { xs: 6, md: 8 },
                py: { xs: 3, md: 3.5 },
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                fontWeight: 600,
                borderRadius: '50px',
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                color: '#ffffff',
                border: `2px solid ${theme.palette.secondary.main}`,
                textTransform: 'none',
                boxShadow: `0 6px 20px ${theme.palette.secondary.main}40`,
                minWidth: { xs: '200px', md: '220px' },
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.accent.main} 30%, ${theme.palette.secondary.main} 90%)`,
                  borderColor: theme.palette.accent.main,
                  boxShadow: `0 8px 25px ${theme.palette.secondary.main}60`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: theme.palette.grey[400],
                  color: theme.palette.text.disabled,
                  border: `2px solid ${theme.palette.grey[400]}`,
                  transform: 'none',
                }
              }}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.8rem', md: '0.9rem' },
                mt: 1,
                textAlign: 'center',
                fontWeight: 400
              }}
            >
              We respect your privacy. Unsubscribe at any time.
            </Typography>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={showSuccess}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{
            width: '100%',
            backgroundColor: theme.palette.success.main,
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}
        >
          Thank you for subscribing! Check your email for your 10% discount code.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{
            width: '100%',
            backgroundColor: theme.palette.error.main,
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}
        >
          Something went wrong. Please try again later.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Newsletter;