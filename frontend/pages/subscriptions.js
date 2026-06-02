import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Grid, Button, Divider,
  TextField, Alert, CircularProgress, IconButton, Paper,
  FormControl, InputLabel, Select, MenuItem, Card,
  CardContent, Chip,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  Add as AddIcon, Remove as RemoveIcon, CheckCircle as CheckIcon,
  Star as StarIcon, Loyalty as LoyaltyIcon, ShoppingCart as CartIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useSubscription } from '../components/SubscriptionContext';
import { useAuth } from '../components/AuthContext';
import SEOHead from '../components/SEOHead';

const FREQUENCY_LABELS = {
  WEEKLY: 'Every week',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Every month',
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    subscriptionItems, removeFromSubscription, updateQuantity,
    clearSubscription, getSubscriptionTotal,
  } = useSubscription();
  const { isAuthenticated } = useAuth();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [frequency, setFrequency] = useState('MONTHLY');
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '', address_line1: '', address_line2: '',
    city: '', postal_code: '', country: 'United Kingdom',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/subscriptions'));
      return;
    }
    loadPlans();
  }, [isAuthenticated]);

  const loadPlans = async () => {
    try {
      const res = await axios.get('/api/subscriptions/plans');
      setPlans(res.data.plans || []);
      if (res.data.plans?.length > 0) {
        const best = res.data.plans.reduce((a, b) =>
          a.discount_percentage >= b.discount_percentage ? a : b
        );
        setSelectedPlan(best);
        setFrequency(best.interval);
      }
    } catch (e) {
      setError('Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const subtotal = getSubscriptionTotal();
  const discountPct = selectedPlan?.discount_percentage || 0;
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;

  const handleSubmit = async () => {
    if (!selectedPlan || subscriptionItems.length === 0) return;
    if (!shippingAddress.full_name || !shippingAddress.address_line1 ||
        !shippingAddress.city || !shippingAddress.postal_code) {
      setError('Please fill in all required shipping address fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      for (const item of subscriptionItems) {
        await axios.post('/api/subscriptions', {
          planId: selectedPlan.id,
          productId: item.productId,
          variantId: item.variantId,
          shippingAddress,
        });
      }
      clearSubscription();
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  if (plansLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
        <Typography sx={{ mt: 2 }}>Loading subscription plans...</Typography>
      </Container>
    );
  }

  return (
    <>
      <SEOHead
        title="Subscribe & Save — Wick Wax Relax"
        description="Build your subscription basket and save on regular deliveries of your favourite wax melts and candles."
        url="https://wickwaxrelax.com/subscriptions"
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom
            sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
            Subscribe &amp; Save
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add products to your subscription as you shop, then choose your frequency and confirm — it is that simple.
          </Typography>
        </Box>

        {success ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>Subscription confirmed!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your subscription has been created. You will receive your first delivery based on your chosen schedule.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button component={Link} href="/account" variant="contained">
                Manage Subscriptions
              </Button>
              <Button component={Link} href="/products" variant="outlined">
                Continue Shopping
              </Button>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {/* LEFT: basket + shipping */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    <LoyaltyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Your Subscription Basket
                  </Typography>
                  {subscriptionItems.length > 0 && (
                    <Button size="small" color="error" onClick={clearSubscription}>
                      Clear all
                    </Button>
                  )}
                </Box>

                {subscriptionItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <LoyaltyIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Your subscription basket is empty
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      Browse products and tap "Subscribe" to add items here.
                    </Typography>
                    <Button component={Link} href="/products" variant="contained">
                      Browse Products
                    </Button>
                  </Box>
                ) : (
                  <>
                    {subscriptionItems.map(item => (
                      <Box key={item.id}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={600}>{item.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.variantName} — £{item.price.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography fontWeight={600} sx={{ minWidth: 60, textAlign: 'right' }}>
                          £{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                        <IconButton color="error" size="small" onClick={() => removeFromSubscription(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {subscriptionItems.reduce((s, i) => s + i.quantity, 0)} items
                      </Typography>
                      <Button component={Link} href="/products" size="small" startIcon={<CartIcon />}>
                        Add more items
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>

              {subscriptionItems.length > 0 && (
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Shipping Address</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Full Name" required
                        value={shippingAddress.full_name}
                        onChange={e => setShippingAddress(p => ({ ...p, full_name: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Address Line 1" required
                        value={shippingAddress.address_line1}
                        onChange={e => setShippingAddress(p => ({ ...p, address_line1: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Address Line 2"
                        value={shippingAddress.address_line2}
                        onChange={e => setShippingAddress(p => ({ ...p, address_line2: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="City" required
                        value={shippingAddress.city}
                        onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Postal Code" required
                        value={shippingAddress.postal_code}
                        onChange={e => setShippingAddress(p => ({ ...p, postal_code: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Country</InputLabel>
                        <Select value={shippingAddress.country} label="Country"
                          onChange={e => setShippingAddress(p => ({ ...p, country: e.target.value }))}>
                          {['United Kingdom', 'Ireland', 'France', 'Germany', 'Spain', 'Italy'].map(c => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Grid>

            {/* RIGHT: plan + summary */}
            <Grid item xs={12} md={5}>
              {subscriptionItems.length > 0 ? (
                <>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Choose Your Plan</Typography>
                    {plans.map(plan => {
                      const isSelected = selectedPlan?.id === plan.id;
                      return (
                        <Card key={plan.id} variant="outlined"
                          onClick={() => { setSelectedPlan(plan); setFrequency(plan.interval); }}
                          sx={{
                            mb: 1.5, cursor: 'pointer',
                            border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                            '&:hover': { borderColor: theme.palette.primary.main },
                          }}>
                          <CardContent sx={{ pb: '8px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography fontWeight={600}>{plan.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {FREQUENCY_LABELS[plan.interval] || plan.interval}
                                </Typography>
                              </Box>
                              <Chip
                                icon={isSelected ? <CheckIcon sx={{ fontSize: 16 }} /> : <StarIcon sx={{ fontSize: 16 }} />}
                                label={`${plan.discount_percentage}% off`}
                                color={isSelected ? 'primary' : 'default'}
                                size="small"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Paper>

                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Order Summary</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Subtotal</Typography>
                      <Typography>£{subtotal.toFixed(2)}</Typography>
                    </Box>
                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="success.main">
                          Subscription discount ({discountPct}%)
                        </Typography>
                        <Typography color="success.main">-£{discountAmount.toFixed(2)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Delivery</Typography>
                      <Typography color="success.main">FREE</Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontWeight={700}>Total per delivery</Typography>
                      <Typography fontWeight={700}>£{total.toFixed(2)}</Typography>
                    </Box>
                    {discountAmount > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.contrastText">
                          You save £{discountAmount.toFixed(2)} on every delivery!
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                  <Button fullWidth variant="contained" size="large" onClick={handleSubmit}
                    disabled={submitting || !selectedPlan || subscriptionItems.length === 0}
                    startIcon={<CheckIcon />}
                    sx={{ py: 1.5, fontWeight: 700, fontSize: '1.05rem', borderRadius: 3 }}>
                    {submitting ? 'Setting up...' : `Confirm Subscription — £${total.toFixed(2)}`}
                  </Button>

                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    Cancel or pause anytime. No lock-in.
                  </Typography>
                </>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <LoyaltyIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Nothing here yet</Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Add products to your subscription from the product pages, then come back to choose your plan.
                  </Typography>
                  <Button component={Link} href="/products" variant="contained">
                    Shop Products
                  </Button>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}
