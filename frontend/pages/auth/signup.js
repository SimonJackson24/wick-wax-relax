import { useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, TextField, Button, Box, Alert, Paper, useTheme, Link as MuiLink } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';

export default function Signup() {
  const theme = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) newErrors.password = 'Must include uppercase, lowercase, number and special character';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const { confirmPassword, ...submitData } = formData;
      await axios.post('/api/auth/register', submitData);
      await axios.post('/api/auth/login', { email: submitData.email, password: submitData.password });
      router.push('/account');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: theme.custom.shape.borderRadius.xl, backgroundColor: theme.palette.background.paper }}>
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
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Wick Wax & Relax for premium relaxation products
            </Typography>
          </Box>

          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3, borderRadius: theme.custom.shape.borderRadius.md }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: theme.custom.shape.borderRadius.pill } }}
                disabled={isSubmitting}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: theme.custom.shape.borderRadius.pill } }}
                disabled={isSubmitting}
              />
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: theme.custom.shape.borderRadius.pill } }}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: theme.custom.shape.borderRadius.pill } }}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: theme.custom.shape.borderRadius.pill } }}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                mb: 2,
                borderRadius: theme.custom.shape.borderRadius.pill,
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.accent.main} 90%)`,
                fontWeight: theme.custom.typography.button.fontWeight,
                fontSize: '1.1rem',
                '&:hover': { background: `linear-gradient(45deg, ${theme.palette.accent.main} 30%, ${theme.palette.secondary.main} 90%)` },
                '&:disabled': { background: theme.palette.grey[300], color: theme.palette.text.disabled }
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink component={Link} href="/auth/login" sx={{ color: theme.palette.secondary.main, textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                Sign in here
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}