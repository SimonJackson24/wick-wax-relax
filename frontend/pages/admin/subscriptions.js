import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  PlayArrow as ResumeIcon,
  Pause as PauseIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import { formatSubscriptionInterval, getSubscriptionStatusColor } from '../../utils/subscriptionUtils';

const AdminSubscriptionsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Action dialogs
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, subscription: null });
  const [actionReason, setActionReason] = useState('');

  // Load subscriptions
  useEffect(() => {
    loadSubscriptions();
  }, [page, rowsPerPage, statusFilter, planFilter]);

  // Load analytics
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { planId: planFilter })
      });

      const response = await axios.get(`/api/subscriptions/admin/all?${params}`);
      setSubscriptions(response.data.subscriptions || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/subscriptions/admin/analytics');
      setAnalytics(response.data.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter locally for now - could be enhanced with server-side search
    setPage(0);
  };

  const handleStatusChange = async (subscriptionId, newStatus, reason = '') => {
    try {
      const endpoint = newStatus === 'CANCELLED'
        ? `/api/subscriptions/${subscriptionId}/cancel`
        : `/api/subscriptions/${subscriptionId}/${newStatus.toLowerCase()}`;

      const payload = newStatus === 'CANCELLED' ? { reason } : {};

      await axios.post(endpoint, payload);

      // Update local state
      setSubscriptions(prev => prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, status: newStatus }
          : sub
      ));

      setActionDialog({ open: false, action: null, subscription: null });
      setActionReason('');

      // Reload analytics
      loadAnalytics();
    } catch (err) {
      console.error('Error updating subscription status:', err);
      setError('Failed to update subscription status');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery ||
      sub.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusActions = (subscription) => {
    const actions = [];

    if (subscription.status === 'ACTIVE') {
      actions.push(
        <Tooltip key="pause" title="Pause Subscription">
          <IconButton
            size="small"
            onClick={() => setActionDialog({
              open: true,
              action: 'pause',
              subscription
            })}
          >
            <PauseIcon />
          </IconButton>
        </Tooltip>
      );
    }

    if (subscription.status === 'PAUSED') {
      actions.push(
        <Tooltip key="resume" title="Resume Subscription">
          <IconButton
            size="small"
            onClick={() => handleStatusChange(subscription.id, 'ACTIVE')}
          >
            <ResumeIcon />
          </IconButton>
        </Tooltip>
      );
    }

    if (subscription.status !== 'CANCELLED') {
      actions.push(
        <Tooltip key="cancel" title="Cancel Subscription">
          <IconButton
            size="small"
            color="error"
            onClick={() => setActionDialog({
              open: true,
              action: 'cancel',
              subscription
            })}
          >
            <CancelIcon />
          </IconButton>
        </Tooltip>
      );
    }

    return actions;
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Subscription Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
          </Box>

          {/* Analytics Dashboard */}
          {showAnalytics && analytics && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Subscription Analytics
              </Typography>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2,
                mb: 3
              }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {analytics.overview.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Subscriptions
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {analytics.overview.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {analytics.overview.paused}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paused
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {analytics.overview.cancelled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, 1fr)'
                },
                gap: 2
              }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Revenue
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    £{analytics.revenue.total_subscription_revenue?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total from subscriptions
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Average Order Value
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    £{analytics.revenue.avg_subscription_order_value?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per subscription order
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Churn Rate
                  </Typography>
                  <Typography variant="h4" color={analytics.overview.churnRate > 10 ? 'error.main' : 'warning.main'}>
                    {analytics.overview.churnRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancellation rate
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: 'center'
            }}>
              <TextField
                placeholder="Search by product, user, or SKU..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={planFilter}
                  label="Plan"
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <MenuItem value="">All Plans</MenuItem>
                  <MenuItem value="1">Weekly Wellness</MenuItem>
                  <MenuItem value="2">Bi-Weekly Balance</MenuItem>
                  <MenuItem value="3">Monthly Renewal</MenuItem>
                </Select>
              </FormControl>

              <Button
                startIcon={<RefreshIcon />}
                onClick={loadSubscriptions}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Subscriptions Table */}
          <Paper>
            {loading && <LinearProgress />}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next Delivery</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {subscription.user?.first_name} {subscription.user?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.user?.email}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {subscription.product?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.product?.sku}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {subscription.plan?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatSubscriptionInterval(subscription.plan?.interval)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={subscription.status}
                          color={getSubscriptionStatusColor(subscription.status)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(subscription.next_order_date)}
                        </Typography>
                        {subscription.status === 'ACTIVE' &&
                         new Date(subscription.next_order_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                          <Chip
                            label="Due Soon"
                            color="warning"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(subscription.created_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          {getStatusActions(subscription)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>

          {/* Action Dialog */}
          <Dialog
            open={actionDialog.open}
            onClose={() => setActionDialog({ open: false, action: null, subscription: null })}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {actionDialog.action === 'pause' ? 'Pause Subscription' :
               actionDialog.action === 'cancel' ? 'Cancel Subscription' : 'Confirm Action'}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                {actionDialog.action === 'pause'
                  ? `Are you sure you want to pause the subscription for ${actionDialog.subscription?.product?.name}?`
                  : `Are you sure you want to cancel the subscription for ${actionDialog.subscription?.product?.name}?`
                }
              </Typography>

              {actionDialog.action === 'cancel' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Cancellation reason (optional)"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setActionDialog({ open: false, action: null, subscription: null })}>
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusChange(
                  actionDialog.subscription?.id,
                  actionDialog.action === 'pause' ? 'PAUSED' : 'CANCELLED',
                  actionReason
                )}
                color={actionDialog.action === 'cancel' ? 'error' : 'primary'}
                variant="contained"
              >
                {actionDialog.action === 'pause' ? 'Pause' : 'Cancel'} Subscription
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminSubscriptionsPage;