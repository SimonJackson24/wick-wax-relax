import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider
} from '@mui/material';
import Link from 'next/link';
import axios from 'axios';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/account/login');
        return;
      }

      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography>Loading order details...</Typography>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Order not found'}
        </Alert>
        <Button component={Link} href="/" variant="contained">
          Return to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            Order Confirmed!
          </Typography>
          <Typography variant="h6" gutterBottom>
            Thank you for your order
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Order #{order.external_id}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Order Details
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Order Date:</strong> {new Date(order.order_date).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {order.status}
          </Typography>
          <Typography variant="body2">
            <strong>Total:</strong> £{order.total}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom>
          Items Ordered
        </Typography>

        {order.items && order.items.map((item, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {item.product_name} - {item.variant_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quantity: {item.quantity} × £{item.unit_price}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Subtotal: £{item.total_price}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You will receive an email confirmation shortly with tracking information.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button component={Link} href="/" variant="contained">
              Continue Shopping
            </Button>
            <Button component={Link} href="/account/profile" variant="outlined">
              View Order History
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}