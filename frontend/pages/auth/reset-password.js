import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, TextField, Button, Box, Alert, Paper, useTheme, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ResetPassword() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [resetComplete, setResetComplete] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      await axios.get(`/api/auth/verify-reset-token/${token}`);
      setTokenValid(true);
    } catch (error) {
      console.error('Token verification error:', error);
      setMessage('This password reset link is invalid or has expired.');
      setMessageType('error');
      setTokenValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) setConfirmPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password
      });

      setMessage(response.data.message);
      setMessageType('success');
      setResetComplete(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage(error.response?.data?.error || 'Failed to reset password. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.secondary.main }} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verifying reset link...
        </Typography>
      </Container>
    );
  }

  if (!tokenValid) {
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
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: theme.custom.typography.h4.fontWeight,
                mb: 2,
                color: theme.palette.error.main,
              }}
            >
              Invalid Reset Link
            </Typography>

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

            <Typography variant="body1" sx={{ mb: 3 }}>
              This password reset link is invalid or has expired. Please request a new one.
            </Typography>

            <Button
              component={Link}
              href="/auth/forgot-password"
              variant="contained"
              sx={{
                borderRadius: theme.custom.shape.borderRadius.pill,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.accent.main} 30%, ${theme.palette.secondary.main} 90%)`,
                }
              }}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  if (resetComplete) {
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
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: theme.palette.success.main,
                mb: 2,
              }}
            />

            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: theme.custom.typography.h4.fontWeight,
                mb: 2,
                color: theme.palette.success.main,
              }}
            >
              Password Reset Successful!
            </Typography>

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

            <Typography variant="body1" sx={{ mb: 3 }}>
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </Typography>

            <Button
              component={Link}
              href="/auth/login"
              variant="contained"
              sx={{
                borderRadius: theme.custom.shape.borderRadius.pill,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.accent.main} 30%, ${theme.palette.secondary.main} 90%)`,
                }
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </motion.div>
      </Container>
    );
  }

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
              Set New Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your new password below.
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
              label="New Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              error={!!passwordError}
              helperText={passwordError}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: theme.custom.shape.borderRadius.pill,
                }
              }}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
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
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}