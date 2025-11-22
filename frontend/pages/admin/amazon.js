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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ShoppingCart as AmazonIcon,
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const AmazonManagement = () => {
  const [status, setStatus] = useState({
    connected: false,
    lastSync: null,
    status: 'unknown',
    error: null,
  });

  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportParams, setReportParams] = useState({
    startDate: '',
    endDate: '',
    reportType: 'sales',
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/amazon/health');
      setStatus({
        connected: response.data.success,
        lastSync: new Date(),
        status: response.data.status,
        error: response.data.error,
      });
    } catch (error) {
      console.error('Error fetching Amazon status:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        status: 'error',
        error: error.message,
      }));
    }
  };

  const handleSyncInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/amazon/sync-inventory');
      setInventory(response.data.updates || []);
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
    } catch (error) {
      console.error('Error syncing inventory:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    } finally {
      setLoading(false);
      setSyncDialog(false);
    }
  };

  const handleSyncOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/amazon/orders');
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

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/amazon/reports/sales?startDate=${reportParams.startDate}&endDate=${reportParams.endDate}&reportType=${reportParams.reportType}`
      );
      setReports([response.data.report]);
      setReportDialog(false);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePricing = async (skus, prices) => {
    setLoading(true);
    try {
      await axios.post('/api/amazon/pricing', {
        skus,
        prices,
      });
      setStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success',
      }));
    } catch (error) {
      console.error('Error updating pricing:', error);
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
            <AmazonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4">
              Amazon Integration Management
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

            {/* Action Buttons */}
            <Grid item xs={12}>
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
                    onClick={handleSyncOrders}
                    disabled={!status.connected || loading}
                  >
                    Sync Orders
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    onClick={() => setReportDialog(true)}
                    disabled={!status.connected || loading}
                  >
                    Generate Report
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

            {/* Inventory Table */}
            {inventory.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Inventory Sync Results
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>SKU</TableCell>
                          <TableCell>Local Stock</TableCell>
                          <TableCell>Amazon Stock</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventory.map((item) => (
                          <TableRow key={item.sku}>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.localStock}</TableCell>
                            <TableCell>{item.amazonStock}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                color={item.status === 'synced' ? 'success' : 'warning'}
                                size="small"
                              />
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
                                color={order.status === 'Shipped' ? 'success' : 'default'}
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

          {/* Sync Dialog */}
          <Dialog open={syncDialog} onClose={() => setSyncDialog(false)}>
            <DialogTitle>Sync Amazon Inventory</DialogTitle>
            <DialogContent>
              <Typography>
                This will sync your local inventory levels with Amazon.
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

          {/* Report Dialog */}
          <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Generate Sales Report</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={reportParams.startDate}
                  onChange={(e) => setReportParams(prev => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={reportParams.endDate}
                  onChange={(e) => setReportParams(prev => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportParams.reportType}
                    onChange={(e) => setReportParams(prev => ({ ...prev, reportType: e.target.value }))}
                  >
                    <MenuItem value="sales">Sales Report</MenuItem>
                    <MenuItem value="inventory">Inventory Report</MenuItem>
                    <MenuItem value="performance">Performance Report</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReportDialog(false)}>Cancel</Button>
              <Button onClick={handleGenerateReport} variant="contained" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AmazonManagement;