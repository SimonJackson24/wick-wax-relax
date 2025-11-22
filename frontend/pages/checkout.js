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
import ProtectedRoute from '../components/ProtectedRoute';

function CheckoutContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cartItems, clearCart, getCartTotal, isOnline, offlineQueue, addToOfflineQueue } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [offlineOrder, setOfflineOrder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'United Kingdom'
  });

  const [paymentMethod, setPaymentMethod] = useState('APPLE_PAY');

  const total = getCartTotal();

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
        paymentMethod
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
        // Online checkout
        const response = await axios.post('/api/orders', orderData);

        // Clear cart after successful order
        clearCart();

        setSuccess(true);
        setTimeout(() => {
          router.push(`/order-confirmation?orderId=${response.data.orderId}`);
        }, 2000);
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">£{total.toFixed(2)}</Typography>
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
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}