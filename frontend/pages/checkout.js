import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  FormControl,
  Radio,
  RadioGroup,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';
import { useCart } from '../components/CartContext';
import RevolutPayment from '../components/RevolutPayment';

// Destination -> shipping zone (mirrors the backend mapping).
const shippingZoneForCountry = (country) => {
  const c = String(country || 'GB').trim().toUpperCase();
  if (c === 'GB' || c === 'UK') return 'UK';
  const EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
  if (EU.includes(c)) return 'EU';
  return 'WORLDWIDE';
};

function CheckoutContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cartItems, clearCart, getCartTotal, isOnline, offlineQueue, addToOfflineQueue } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [offlineOrder, setOfflineOrder] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [shippingLoading, setShippingLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [shippingAddress, setShippingAddress] = useState({
    email: '',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'United Kingdom'
  });

  const [paymentMethod, setPaymentMethod] = useState('APPLE_PAY');

  const total = getCartTotal();
  const selectedShippingRate = shippingRates.find((r) => r.methodCode === selectedShipping) || null;

  // Shipping options depend on the destination zone, so they refresh
  // whenever the country changes.
  useEffect(() => {
    let cancelled = false;
    const zone = shippingZoneForCountry(shippingAddress.country);
    setShippingLoading(true);
    axios.get(`/api/shipping/rates?zone=${zone}`)
      .then((res) => {
        if (cancelled) return;
        const rates = res.data.rates || [];
        setShippingRates(rates);
        setSelectedShipping(rates.length ? rates[0].methodCode : '');
      })
      .catch(() => { if (!cancelled) setShippingRates([]); })
      .finally(() => { if (!cancelled) setShippingLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingAddress.country]);

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cartItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        })),
        shippingAddress,
        paymentMethod,
        shippingMethod: selectedShipping || undefined
      };

      if (!isOnline) {
        // Handle offline order
        const offlineOrderData = {
          ...orderData,
          id: `offline_${Date.now()}`,
          timestamp: Date.now(),
          status: 'pending'
        };

        // Store offline order
        const existingOfflineOrders = JSON.parse(localStorage.getItem('offlineOrders') || '[]');
        existingOfflineOrders.push(offlineOrderData);
        localStorage.setItem('offlineOrders', JSON.stringify(existingOfflineOrders));

        setOfflineOrder(offlineOrderData);
        setSnackbar({
          open: true,
          message: 'Order saved offline. It will be processed when you\'re back online.',
          severity: 'info',
        });

        // Clear cart
        clearCart();

        setTimeout(() => {
          router.push('/');
        }, 3000);

      } else {
        // Online checkout — use guest endpoint for non-authed users, authenticated endpoint otherwise
        const endpoint = isAuthenticated ? '/api/orders' : '/api/orders/guest';
        const response = await axios.post(endpoint, orderData);

        // Stock is reserved at order creation; the payment step completes
        // the order. We keep the cart until payment succeeds so a failed
        // payment doesn't empty the basket.
        const { orderId, confirmToken, paymentIntent, total: orderTotal } = response.data;

        if (!paymentIntent || !paymentIntent.clientSecret) {
          // No payment intent (e.g. payments not configured yet) — fall
          // back to the order confirmation so the order isn't lost.
          clearCart();
          setSuccess(true);
          setTimeout(() => {
            router.push(`/order-confirmation?orderId=${orderId}`);
          }, 2000);
          return;
        }

        setPaymentStep({
          orderId,
          confirmToken,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          amount: orderTotal,
        });
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // Payment step — the order exists (stock reserved), the customer now
  // pays. On success we record the payment server-side and move on.
  const handlePaymentComplete = async () => {
    try {
      await axios.post(`/api/orders/${paymentStep.orderId}/confirm-payment`, {
        paymentIntentId: paymentStep.paymentIntentId,
        confirmToken: paymentStep.confirmToken,
      });
    } catch (err) {
      // The card WAS charged even if our bookkeeping call failed — still
      // send the customer to the confirmation page so they see their order.
      console.error('Payment confirmation bookkeeping failed:', err);
    }
    clearCart();
    setPaymentStep(null);
    setSuccess(true);
    setTimeout(() => {
      router.push(`/order-confirmation?orderId=${paymentStep.orderId}`);
    }, 1500);
  };

  if (paymentStep) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Complete your payment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Order {paymentStep.orderId.slice(0, 8)}… is reserved for you while you pay.
          </Typography>
          <RevolutPayment
            paymentIntentId={paymentStep.paymentIntentId}
            clientSecret={paymentStep.clientSecret}
            amount={paymentStep.amount}
            email={shippingAddress.email}
            onPaid={handlePaymentComplete}
            onError={(e) => console.error('Payment error:', e)}
          />
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1">
            Redirecting to order confirmation...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (offlineOrder) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <OfflineIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" color="warning.main" gutterBottom>
            Order Saved Offline
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your order has been saved and will be processed when you're back online.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Order ID: {offlineOrder.id}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/')}
            sx={{ mt: 3 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Online/Offline Status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
          label={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? 'success' : 'warning'}
          variant="outlined"
        />
        {!isOnline && (
          <Typography variant="body2" color="warning.main">
            You're offline. Your order will be saved and processed when you're back online.
          </Typography>
        )}
        {offlineQueue.length > 0 && (
          <Chip
            label={`${offlineQueue.length} pending operations`}
            color="info"
            size="small"
          />
        )}
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Checkout
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Order Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            {/* Shipping method */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Delivery method
              </Typography>
              {shippingLoading ? (
                <Typography variant="body2" color="text.secondary">Loading options…</Typography>
              ) : shippingRates.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No delivery options available for this destination — please contact us.
                </Typography>
              ) : (
                <FormControl fullWidth>
                  <RadioGroup
                    value={selectedShipping}
                    onChange={(e) => setSelectedShipping(e.target.value)}
                  >
                    {shippingRates.map((rate) => (
                      <FormControlLabel
                        key={`${rate.methodCode}-${rate.minWeightGrams ?? 'x'}-${rate.maxWeightGrams ?? 'x'}`}
                        value={rate.methodCode}
                        control={<Radio size="small" />}
                        label={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{rate.name}</Typography>
                              {rate.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {rate.description}
                                  {rate.estimatedDaysMin != null && (
                                    <> · {rate.estimatedDaysMin === rate.estimatedDaysMax
                                      ? `${rate.estimatedDaysMin} day${rate.estimatedDaysMin === 1 ? '' : 's'}`
                                      : `${rate.estimatedDaysMin}-${rate.estimatedDaysMax} days`}</>
                                  )}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" fontWeight={600}>
                              {rate.cost === 0 ? 'FREE' : `£${rate.price.toFixed(2)}`}
                            </Typography>
                          </Box>
                        }
                        sx={{ mr: 0, alignItems: 'flex-start', py: 0.5, width: '100%' }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {cartItems.map((item) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{item.productName} - {item.variantName}</Typography>
                  <Typography variant="body1">£{item.price}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {item.quantity}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Subtotal: £{(item.price * item.quantity).toFixed(2)}
                </Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">£{total.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2">
                {selectedShippingRate
                  ? (selectedShippingRate.cost === 0 ? 'FREE' : `£${selectedShippingRate.cost.toFixed(2)}`)
                  : '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">£{(total + (selectedShippingRate ? selectedShippingRate.cost : 0)).toFixed(2)}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Checkout Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shipping Address
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {/* Email field — required for both guest and authenticated users */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={shippingAddress.email}
                onChange={handleAddressChange}
                required
                sx={{ mb: 2 }}
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleAddressChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Address Line 1"
                name="addressLine1"
                value={shippingAddress.addressLine1}
                onChange={handleAddressChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Address Line 2"
                name="addressLine2"
                value={shippingAddress.addressLine2}
                onChange={handleAddressChange}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="City"
                name="city"
                value={shippingAddress.city}
                onChange={handleAddressChange}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={shippingAddress.postalCode}
                onChange={handleAddressChange}
                required
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="APPLE_PAY">Apple Pay</MenuItem>
                  <MenuItem value="GOOGLE_PAY">Google Pay</MenuItem>
                  <MenuItem value="KLARNA">Klarna</MenuItem>
                  <MenuItem value="CLEARPAY">Clearpay</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || cartItems.length === 0}
              >
                {loading ? 'Processing...' : isOnline ? `Pay £${total.toFixed(2)}` : 'Save Order Offline'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function Checkout() {
  return <CheckoutContent />;
}