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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as ResumeIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  ShoppingCart as CartIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { formatSubscriptionInterval, getSubscriptionStatusColor } from '../utils/subscriptionUtils';

const SubscriptionManager = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Dialog states
  const [cancelDialog, setCancelDialog] = useState({ open: false, subscription: null });
  const [editDialog, setEditDialog] = useState({ open: false, subscription: null });
  const [cancelReason, setCancelReason] = useState('');

  // Load subscriptions
  useEffect(() => {
    loadSubscriptions();
  }, [userId]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/subscriptions?includeInactive=true');
      setSubscriptions(response.data.subscriptions || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async (subscriptionId) => {
    try {
      setActionLoading(subscriptionId);
      await axios.post(`/api/subscriptions/${subscriptionId}/pause`);

      // Update local state
      setSubscriptions(prev => prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, status: 'PAUSED' }
          : sub
      ));

      // Reload to get updated data
      await loadSubscriptions();
    } catch (err) {
      console.error('Error pausing subscription:', err);
      setError('Failed to pause subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      setActionLoading(subscriptionId);
      await axios.post(`/api/subscriptions/${subscriptionId}/resume`);

      // Update local state
      setSubscriptions(prev => prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, status: 'ACTIVE' }
          : sub
      ));

      // Reload to get updated data
      await loadSubscriptions();
    } catch (err) {
      console.error('Error resuming subscription:', err);
      setError('Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelDialog.subscription) return;

    try {
      setActionLoading(cancelDialog.subscription.id);
      await axios.post(`/api/subscriptions/${cancelDialog.subscription.id}/cancel`, {
        reason: cancelReason
      });

      // Update local state
      setSubscriptions(prev => prev.map(sub =>
        sub.id === cancelDialog.subscription.id
          ? { ...sub, status: 'CANCELLED' }
          : sub
      ));

      setCancelDialog({ open: false, subscription: null });
      setCancelReason('');

      // Reload to get updated data
      await loadSubscriptions();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return getSubscriptionStatusColor(status);
  };

  const isDueSoon = (nextOrderDate) => {
    const today = new Date();
    const dueDate = new Date(nextOrderDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading your subscriptions...
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

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
  const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'PAUSED');
  const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'CANCELLED');

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          My Subscriptions
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadSubscriptions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {activeSubscriptions.length}
              </Typography>
              <Typography variant="body2">
                Active Subscriptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {pausedSubscriptions.length}
              </Typography>
              <Typography variant="body2">
                Paused Subscriptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h4" component="div">
                {cancelledSubscriptions.length}
              </Typography>
              <Typography variant="body2">
                Cancelled Subscriptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
            Active Subscriptions
          </Typography>
          <Grid container spacing={3}>
            {activeSubscriptions.map((subscription) => (
              <Grid item xs={12} md={6} key={subscription.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {subscription.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subscription.product.variant_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={subscription.status}
                        color={getStatusColor(subscription.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CartIcon sx={{ mr: 1, fontSize: 16 }} />
                        {subscription.plan.name} ({formatSubscriptionInterval(subscription.plan.interval)})
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                        Next delivery: {formatDate(subscription.next_order_date)}
                        {isDueSoon(subscription.next_order_date) && (
                          <Chip label="Due Soon" color="warning" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      {subscription.shipping_address && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                          {subscription.shipping_address.city}, {subscription.shipping_address.country}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        Save {subscription.plan.discount_percentage}% • £{(subscription.product.price * subscription.plan.discount_percentage / 100).toFixed(2)} off per delivery
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<PauseIcon />}
                      onClick={() => handlePauseSubscription(subscription.id)}
                      disabled={actionLoading === subscription.id}
                    >
                      Pause
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => setEditDialog({ open: true, subscription })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setCancelDialog({ open: true, subscription })}
                    >
                      Cancel
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Paused Subscriptions */}
      {pausedSubscriptions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'warning.main' }}>
            Paused Subscriptions
          </Typography>
          <Grid container spacing={3}>
            {pausedSubscriptions.map((subscription) => (
              <Grid item xs={12} md={6} key={subscription.id}>
                <Card sx={{ opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {subscription.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subscription.product.variant_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={subscription.status}
                        color={getStatusColor(subscription.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {subscription.plan.name} ({formatSubscriptionInterval(subscription.plan.interval)})
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ResumeIcon />}
                      onClick={() => handleResumeSubscription(subscription.id)}
                      disabled={actionLoading === subscription.id}
                    >
                      Resume
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setCancelDialog({ open: true, subscription })}
                    >
                      Cancel
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Cancelled Subscriptions */}
      {cancelledSubscriptions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'error.main' }}>
            Cancelled Subscriptions
          </Typography>
          <Grid container spacing={3}>
            {cancelledSubscriptions.map((subscription) => (
              <Grid item xs={12} md={6} key={subscription.id}>
                <Card sx={{ opacity: 0.6 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {subscription.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subscription.product.variant_name}
                        </Typography>
                      </Box>
                      <Chip
                        label={subscription.status}
                        color={getStatusColor(subscription.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Cancelled on {formatDate(subscription.cancelled_at)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* No subscriptions message */}
      {subscriptions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No subscriptions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start saving with our subscription plans!
          </Typography>
        </Box>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, subscription: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel your subscription for {cancelDialog.subscription?.product.name}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can resume your subscription anytime within 30 days of cancellation.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Help us improve by sharing why you're cancelling..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, subscription: null })}>
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelSubscription}
            color="error"
            variant="contained"
            disabled={actionLoading === cancelDialog.subscription?.id}
          >
            {actionLoading === cancelDialog.subscription?.id ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, subscription: null })}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Edit subscription for {editDialog.subscription?.product.name}
          </Typography>
          {/* Edit form would go here - shipping address, plan changes, etc. */}
          <Typography variant="body2" color="text.secondary">
            Edit functionality coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, subscription: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManager;