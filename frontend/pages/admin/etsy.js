import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
} from '@mui/material';
import {
  Store as EtsyIcon,
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const EtsyManagement = () => {
  const [status, setStatus] = useState({
    connected: false,
    lastSync: null,
    status: 'unknown',
    error: null,
  });

  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [newListingDialog, setNewListingDialog] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
  });

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/etsy/health');
      setStatus({
        connected: response.data.success,
        lastSync: new Date(),
        status: response.data.status,
        error: response.data.error,
      });
    } catch (error) {
      console.error('Error fetching Etsy status:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        status: 'error',
        error: error.message,
      }));
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/etsy/stats');
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching Etsy stats:', error);
    }
  };

  const handleSyncInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/etsy/sync-inventory');
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
      setSyncDialog(false);
    } catch (error) {
      console.error('Error syncing inventory:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncListings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/etsy/listings');
      setListings(response.data.listings || []);
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
    } catch (error) {
      console.error('Error syncing listings:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/etsy/orders');
      setOrders(response.data.orders || []);
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
    } catch (error) {
      console.error('Error syncing orders:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    setLoading(true);
    try {
      await axios.post('/api/etsy/listings', newListing);
      setNewListingDialog(false);
      setNewListing({
        title: '',
        description: '',
        price: '',
        quantity: '',
      });
      handleSyncListings(); // Refresh listings
    } catch (error) {
      console.error('Error creating listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (listingId, products) => {
    setLoading(true);
    try {
      await axios.put(`/api/etsy/listings/${listingId}/inventory`, {
        products,
      });
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
    } catch (error) {
      console.error('Error updating inventory:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <EtsyIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
            <Typography variant="h4">
              Etsy Integration Management
            </Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Status Card */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Connection Status
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last Sync: {status.lastSync ? status.lastSync.toLocaleString() : 'Never'}
                      </Typography>
                    </Box>
                    <Chip
                      label={status.connected ? 'Connected' : 'Disconnected'}
                      color={status.connected ? 'success' : 'error'}
                      icon={status.connected ? <SuccessIcon /> : <ErrorIcon />}
                    />
                  </Box>

                  {status.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {status.error}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Shop Stats */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Shop Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Listings
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalListings || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Active Listings
                    </Typography>
                    <Typography variant="h4">
                      {stats.activeListings || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Total Sales
                    </Typography>
                    <Typography variant="h4">
                      ${stats.totalSales || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Avg Rating
                    </Typography>
                    <Typography variant="h4">
                      {stats.averageRating || 0}/5
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={() => setSyncDialog(true)}
                    disabled={!status.connected || loading}
                  >
                    Sync Inventory
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleSyncListings}
                    disabled={!status.connected || loading}
                  >
                    Sync Listings
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleSyncOrders}
                    disabled={!status.connected || loading}
                  >
                    Sync Orders
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={fetchStatus}
                  >
                    Refresh Status
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Listings Table */}
            {listings.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Active Listings
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {listings.slice(0, 10).map((listing) => (
                          <TableRow key={listing.id}>
                            <TableCell>{listing.title}</TableCell>
                            <TableCell>${listing.price}</TableCell>
                            <TableCell>{listing.quantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={listing.state}
                                color={listing.state === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleUpdateInventory(listing.id, [])}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}

            {/* Orders Table */}
            {orders.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Orders
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.slice(0, 10).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>
                              <Chip
                                label={order.status}
                                color={order.status === 'paid' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>${order.total}</TableCell>
                            <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Floating Action Button for New Listing */}
          <Fab
            color="primary"
            aria-label="add listing"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setNewListingDialog(true)}
          >
            <AddIcon />
          </Fab>

          {/* Sync Dialog */}
          <Dialog open={syncDialog} onClose={() => setSyncDialog(false)}>
            <DialogTitle>Sync Etsy Inventory</DialogTitle>
            <DialogContent>
              <Typography>
                This will sync your local inventory levels with Etsy listings.
                Any discrepancies will be updated automatically.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSyncDialog(false)}>Cancel</Button>
              <Button onClick={handleSyncInventory} variant="contained" disabled={loading}>
                {loading ? 'Syncing...' : 'Start Sync'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* New Listing Dialog */}
          <Dialog open={newListingDialog} onClose={() => setNewListingDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Listing</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Title"
                  value={newListing.title}
                  onChange={(e) => setNewListing(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={newListing.description}
                  onChange={(e) => setNewListing(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={4}
                  fullWidth
                  required
                />
                <TextField
                  label="Price"
                  type="number"
                  value={newListing.price}
                  onChange={(e) => setNewListing(prev => ({ ...prev, price: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={newListing.quantity}
                  onChange={(e) => setNewListing(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth
                  required
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setNewListingDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateListing} variant="contained" disabled={loading}>
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default EtsyManagement;