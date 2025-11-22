import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/orders/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      await axios.patch(`/api/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        reason: statusReason
      });

      setStatusDialog(false);
      setSelectedOrder(null);
      setNewStatus('');
      setStatusReason('');
      await fetchOrders(); // Refresh orders
      await fetchStats(); // Refresh stats
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      case 'REFUNDED': return 'secondary';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'id', headerName: 'Order ID', width: 150 },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      type: 'number',
      valueFormatter: (params) => `$${params.value?.toFixed(2)}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'order_date',
      headerName: 'Order Date',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'shipping_address',
      headerName: 'Shipping Address',
      width: 200,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const addr = params.value;
        return `${addr.street}, ${addr.city}, ${addr.postcode}`;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelectedOrder(params.row);
              setNewStatus(params.row.status);
              setStatusDialog(true);
            }}
            sx={{ mr: 1 }}
          >
            Update
          </Button>
        </Box>
      )
    }
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const statusOptions = [
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  ];

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Order Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalOrders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Orders
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingOrders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Processing Orders
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.processingOrders || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ${stats.totalRevenue?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Orders Table */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={orders}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              components={{
                Toolbar: CustomToolbar,
              }}
              getRowId={(row) => row.id}
            />
          </Paper>

          {/* Status Update Dialog */}
          <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Order #{selectedOrder?.id}
              </Typography>
              <TextField
                select
                label="New Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Reason (optional)"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
              <Button
                onClick={handleStatusUpdate}
                variant="contained"
                disabled={!newStatus || updating}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default OrderManagement;