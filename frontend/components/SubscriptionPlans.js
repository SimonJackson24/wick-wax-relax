import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  ShoppingCart as CartIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { formatSubscriptionInterval, calculateSubscriptionSavings } from '../utils/subscriptionUtils';

const SubscriptionPlans = ({
  onSelectPlan,
  selectedProduct = null,
  showComparison = true,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United Kingdom'
  });
  const [subscribing, setSubscribing] = useState(false);

  // Load subscription plans
  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscriptions/plans');
      setPlans(response.data.plans || []);
    } catch (err) {
      console.error('Error loading subscription plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      setShowSubscribeDialog(true);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedProduct) {
      setError('Please select a plan and product');
      return;
    }

    try {
      setSubscribing(true);
      setError(null);

      const subscriptionData = {
        planId: selectedPlan.id,
        productId: selectedProduct.id,
        variantId: selectedProduct.variant_id || selectedProduct.variants?.[0]?.id,
        shippingAddress
      };

      const response = await axios.post('/api/subscriptions', subscriptionData);

      // Close dialog and show success
      setShowSubscribeDialog(false);
      setSelectedPlan(null);

      // You might want to redirect to a success page or show a success message
      alert('Subscription created successfully!');

    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err.response?.data?.error || 'Failed to create subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const calculateSavings = (plan, product) => {
    if (!product || !product.price) return null;

    return calculateSubscriptionSavings(
      product.price,
      plan.discount_percentage,
      plan.interval,
      12
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading subscription plans...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Subscription Plans
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Choose a subscription plan and save on your favorite products
      </Typography>

      <Grid container spacing={3}>
        {plans.map((plan) => {
          const savings = selectedProduct ? calculateSavings(plan, selectedProduct) : null;
          const isPopular = plan.discount_percentage >= 7; // Consider plans with 7%+ discount as popular

          return (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isPopular ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                  ...(isPopular && {
                    boxShadow: theme.shadows[8],
                  }),
                }}
              >
                {isPopular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      icon={<StarIcon />}
                      label="Most Popular"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                )}

                <CardContent sx={{ flex: 1, pt: isPopular ? 4 : 2 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {plan.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {plan.discount_percentage}% OFF
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatSubscriptionInterval(plan.interval)}
                    </Typography>
                  </Box>

                  {savings && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.contrastText">
                        Save £{savings.totalSavings.toFixed(2)} over 12 months
                      </Typography>
                      <Typography variant="caption" color="success.contrastText">
                        {savings.savingsPercentage.toFixed(1)}% savings
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckIcon sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                      Free delivery
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckIcon sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                      Cancel anytime
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                      Premium support
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={isPopular ? "contained" : "outlined"}
                    color="primary"
                    size="large"
                    onClick={() => handlePlanSelect(plan)}
                    startIcon={<CartIcon />}
                    disabled={!selectedProduct}
                  >
                    {selectedProduct ? 'Subscribe Now' : 'Select Product First'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Subscription Dialog */}
      <Dialog
        open={showSubscribeDialog}
        onClose={() => !subscribing && setShowSubscribeDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Subscribe to {selectedPlan?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPlan && selectedProduct && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Plan: {selectedPlan.name} ({formatSubscriptionInterval(selectedPlan.interval)})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Discount: {selectedPlan.discount_percentage}% off regular price
              </Typography>
            </Box>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Shipping Address
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={shippingAddress.full_name}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={shippingAddress.address_line1}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, address_line1: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={shippingAddress.address_line2}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, address_line2: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/County"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={shippingAddress.postal_code}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={shippingAddress.country}
                  label="Country"
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                >
                  <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                  <MenuItem value="Ireland">Ireland</MenuItem>
                  <MenuItem value="France">France</MenuItem>
                  <MenuItem value="Germany">Germany</MenuItem>
                  <MenuItem value="Spain">Spain</MenuItem>
                  <MenuItem value="Italy">Italy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSubscribeDialog(false)}
            disabled={subscribing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubscribe}
            variant="contained"
            disabled={subscribing || !shippingAddress.full_name || !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.postal_code}
          >
            {subscribing ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionPlans;