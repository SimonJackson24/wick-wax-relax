import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, alertsRes] = await Promise.all([
        axios.get('/api/inventory'),
        axios.get('/api/inventory/alerts?threshold=5')
      ]);

      setInventory(inventoryRes.data);
      setAlerts(alertsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedRows.length || !bulkQuantity) return;

    try {
      setUpdating(true);
      const updates = selectedRows.map(variantId => ({
        variantId,
        newQuantity: parseInt(bulkQuantity),
        reason: 'Bulk admin update'
      }));

      await axios.patch('/api/inventory/bulk', { updates });
      setBulkUpdateDialog(false);
      setSelectedRows([]);
      setBulkQuantity('');
      await fetchInventoryData(); // Refresh data
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError('Failed to update inventory');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertEmail) return;

    try {
      setSendingAlert(true);
      await axios.post('/api/inventory/alerts/send', {
        email: alertEmail,
        threshold: 5
      });
      setAlertEmail('');
      setError(null);
      // Could show success message here
    } catch (err) {
      console.error('Error sending alert:', err);
      setError('Failed to send low stock alert');
    } finally {
      setSendingAlert(false);
    }
  };

  const columns = [
    { field: 'product_name', headerName: 'Product', width: 200 },
    { field: 'variant_name', headerName: 'Variant', width: 150 },
    { field: 'sku', headerName: 'SKU', width: 120 },
    {
      field: 'inventory_quantity',
      headerName: 'Stock',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const quantity = params.value;
        let color = 'default';
        if (quantity <= 5) color = 'error';
        else if (quantity <= 10) color = 'warning';
        else color = 'success';

        return (
          <Chip
            label={quantity}
            color={color}
            size="small"
            icon={quantity <= 5 ? <WarningIcon /> : undefined}
          />
        );
      }
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      type: 'number',
      valueFormatter: (params) => `$${params.value?.toFixed(2)}`
    },
    {
      field: 'attributes',
      headerName: 'Attributes',
      width: 200,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return Object.entries(params.value)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarFilterButton />
      <GridToolbarExport />
      {selectedRows.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => setBulkUpdateDialog(true)}
          sx={{ ml: 2 }}
        >
          Bulk Update ({selectedRows.length})
        </Button>
      )}
    </GridToolbarContainer>
  );

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
            Inventory Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Variants
                  </Typography>
                  <Typography variant="h4">
                    {inventory.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" color="error">
                    {alerts.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Stock
                  </Typography>
                  <Typography variant="h4">
                    {inventory.reduce((sum, item) => sum + item.inventory_quantity, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" color="error">
                    {inventory.filter(item => item.inventory_quantity === 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Low Stock Alerts */}
          {alerts.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff3e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="warning.main">
                  <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Low Stock Alerts
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    label="Email for alerts"
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<EmailIcon />}
                    onClick={handleSendAlert}
                    disabled={!alertEmail || sendingAlert}
                  >
                    {sendingAlert ? 'Sending...' : 'Send Alert'}
                  </Button>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {alerts.map((alert) => (
                  <Chip
                    key={alert.id}
                    label={`${alert.name} (${alert.sku}): ${alert.inventory_quantity} left`}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Inventory Table */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={inventory}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              onSelectionModelChange={(newSelection) => {
                setSelectedRows(newSelection);
              }}
              components={{
                Toolbar: CustomToolbar,
              }}
              getRowId={(row) => row.id}
            />
          </Paper>

          {/* Bulk Update Dialog */}
          <Dialog open={bulkUpdateDialog} onClose={() => setBulkUpdateDialog(false)}>
            <DialogTitle>Bulk Update Inventory</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Update stock for {selectedRows.length} selected items
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="New Quantity"
                type="number"
                fullWidth
                variant="outlined"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBulkUpdateDialog(false)}>Cancel</Button>
              <Button
                onClick={handleBulkUpdate}
                variant="contained"
                disabled={!bulkQuantity || updating}
              >
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default InventoryManagement;