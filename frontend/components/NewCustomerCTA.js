import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
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
  Star as StarIcon,
  LocalOffer as LocalOfferIcon,
  Cake as CakeIcon
} from '@mui/icons-material';

const NewCustomerCTA = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Handle registration logic
      console.log('Register with:', email, password);
      setSuccessMessage('Account created successfully! Welcome to Wick Wax Relax.');
      setShowSuccess(true);
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
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
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
                color: theme.palette.text.primary
              }}
            >
              Join the Wick Wax Relax Family
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create an account to enjoy exclusive benefits and be the first to know about new products and special offers.
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <StarIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Earn points with every purchase" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocalOfferIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Receive exclusive member discounts" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CakeIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Special birthday gift" />
              </ListItem>
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
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h5" gutterBottom>
                Create Your Account
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
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  error={!!errors.password}
                  helperText={errors.password}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  required
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark
                    }
                  }}
                >
                  Create Account
                </Button>

                <Divider sx={{ my: 2 }}>OR</Divider>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={motion.button}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSocialLogin('Google')}
                    sx={{ 
                      borderColor: theme.palette.primary.main, 
                      color: theme.palette.primary.main 
                    }}
                  >
                    Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    component={motion.button}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSocialLogin('Facebook')}
                    sx={{ 
                      borderColor: theme.palette.primary.main, 
                      color: theme.palette.primary.main 
                    }}
                  >
                    Facebook
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewCustomerCTA;