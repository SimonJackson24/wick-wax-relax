import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert, 
  Paper, 
  useTheme, 
  Link as MuiLink,
  Grid,
  Divider,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon, 
  Lock as LockIcon,
  Spa as SpaIcon
} from '@mui/icons-material';
import { useAuth } from '../../components/AuthContext';

export default function Login() {
  const theme = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        setMessage('Login successful! Redirecting...');
        
        // Check if user is admin
        const isAdmin = response.user.isAdmin === true || response.user.isAdmin === 1;
        
        // Determine redirect URL based on user role and query params
        let redirectTo;
        
        if (isAdmin) {
          // Admin user - check if there's a specific admin redirect
          const adminRedirect = router.query.redirect;
          if (adminRedirect && adminRedirect.startsWith('/admin')) {
            redirectTo = adminRedirect;
          } else {
            redirectTo = '/admin';
          }
        } else {
          // Regular user - check if there's a specific redirect
          const userRedirect = router.query.redirect;
          if (userRedirect) {
            redirectTo = userRedirect;
          } else {
            redirectTo = '/account/profile';
          }
        }

        // Redirect after a short delay to show success message
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      } else {
        setMessage(response.error || 'Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Login failed. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
      }}
    >
      {/* Left side - Branding */}
      <Box
        sx={{
          flex: { md: 1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          sx={{ textAlign: 'center', zIndex: 2 }}
        >
          <Box sx={{ mb: 3 }}>
            <SpaIcon sx={{ fontSize: 80, color: 'white' }} />
          </Box>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Wick Wax & Relax
          </Typography>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 300 }}>
            Premium Scented Experiences
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 400, mx: 'auto', opacity: 0.9 }}>
            Discover our collection of handcrafted candles, wax melts, and bath products designed to transform your space into a sanctuary of relaxation.
          </Typography>
        </motion.div>
        
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', bottom: 20, left: 20, opacity: 0.3 }}>
          <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
        </Box>
        <Box sx={{ position: 'absolute', top: 40, right: 30, opacity: 0.2 }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
        </Box>
      </Box>

      {/* Right side - Login Form */}
      <Box
        sx={{
          flex: { md: 1 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          bgcolor: { xs: 'transparent', md: 'rgba(255,255,255,0.9)' },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ width: '100%', maxWidth: 450 }}
        >
          {/* Mobile Logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <SpaIcon sx={{ fontSize: 60, color: theme.palette.primary.main }} />
          </Box>

          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 2,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: theme.palette.primary.dark,
                }}
              >
                Sign In
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back to Wick Wax & Relax
              </Typography>
            </Box>

            {/* Message */}
            {message && (
              <Alert
                severity={message.includes('successful') ? 'success' : 'error'}
                sx={{
                  mb: 3,
                  borderRadius: 1,
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
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
                aria-label="Email Address"
                aria-describedby="email-helper-text"
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isSubmitting}
                aria-label="Password"
                aria-describedby="password-helper-text"
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="Remember me"
                />
                <MuiLink
                  component={Link}
                  href="/auth/forgot-password"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Forgot password?
                </MuiLink>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  mb: 3,
                  borderRadius: 1,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                  },
                  '&:disabled': {
                    background: theme.palette.grey[300],
                    color: theme.palette.text.disabled,
                  }
                }}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Links */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/signup"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Create Account
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
}