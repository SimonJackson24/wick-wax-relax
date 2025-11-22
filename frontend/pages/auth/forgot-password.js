import { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ForgotPassword() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = async (e) => {
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
    setMessage('');

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage(error.response?.data?.error || 'Failed to send reset email. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: theme.custom.shape.borderRadius.xl,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Back to Login Link */}
          <Box sx={{ mb: 3 }}>
            <Button
              component={Link}
              href="/auth/login"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.secondary.main,
                }
              }}
            >
              Back to Login
            </Button>
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: theme.custom.typography.h4.fontWeight,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Reset Your Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {/* Message */}
          {message && (
            <Alert
              severity={messageType}
              sx={{
                mb: 3,
                borderRadius: theme.custom.shape.borderRadius.md,
              }}
            >
              {message}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.custom.shape.borderRadius.pill,
                }
              }}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: theme.custom.shape.borderRadius.pill,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                fontWeight: theme.custom.typography.button.fontWeight,
                fontSize: '1.1rem',
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.accent.main} 30%, ${theme.palette.secondary.main} 90%)`,
                },
                '&:disabled': {
                  background: theme.palette.grey[300],
                  color: theme.palette.text.disabled,
                }
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                style={{
                  color: theme.palette.secondary.main,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}