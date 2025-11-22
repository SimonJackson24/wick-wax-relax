import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useAuth } from '../../components/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import axios from 'axios';

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">
                {user.firstName} {user.lastName}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              fullWidth
            >
              Logout
            </Button>
          </Paper>
        </Grid>

        {/* Order History */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>

            {orders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No orders yet
              </Typography>
            ) : (
              orders.slice(0, 3).map((order) => (
                <Card key={order.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          Order #{order.external_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.order_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          £{order.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.status}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}

            {orders.length > 3 && (
              <Button
                component={Link}
                href="/account/orders"
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
              >
                View All Orders
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}