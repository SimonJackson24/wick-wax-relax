import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OrderStatusBadge from './OrderStatusBadge';

const OrderDetailsModal = ({ open, onClose, orderId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `£${parseFloat(amount).toFixed(2)}`;
  };

  const handleExportPDF = async () => {
    if (!orderDetails) return;

    setExportLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/export/invoice/${orderDetails.id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderDetails.external_id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Invoice downloaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download invoice',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!orderDetails) return;

    setExportLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/export/orders/items/csv?status=${orderDetails.status}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export order data');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-items-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Order data exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting order data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export order data',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '95%' : '80%',
    maxWidth: 800,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[24],
    overflow: 'auto',
  };

  if (loading) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Box>
      </Modal>
    );
  }

  if (error || !orderDetails) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error || 'Order not found'}
            </Typography>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Order #{orderDetails.external_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placed on {formatDate(orderDetails.order_date)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <OrderStatusBadge status={orderDetails.status} />
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={exportLoading}
              sx={{ mr: 1 }}
            >
              {exportLoading ? 'Generating...' : 'PDF Invoice'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCSV}
              disabled={exportLoading}
              sx={{ mr: 1 }}
            >
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Order Summary */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(orderDetails.total)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Channel
                  </Typography>
                  <Typography variant="body1">
                    {orderDetails.channel_name || 'PWA'}
                  </Typography>
                </Box>
                {orderDetails.payment && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Payment Method
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.payment.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Status History
                </Typography>
                {orderDetails.statusHistory && orderDetails.statusHistory.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {orderDetails.statusHistory.map((history, index) => (
                      <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < orderDetails.statusHistory.length - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <OrderStatusBadge status={history.new_status} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(history.created_at)}
                          </Typography>
                        </Box>
                        {history.reason && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {history.reason}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No status history available
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Order Items */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Items
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderDetails.items && orderDetails.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {item.product_name}
                          </Typography>
                          {item.variant_name && (
                            <Typography variant="body2" color="text.secondary">
                              {item.variant_name}
                            </Typography>
                          )}
                          {item.sku && (
                            <Typography variant="body2" color="text.secondary">
                              SKU: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Payment Information */}
          {orderDetails.payment && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Method
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.payment.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Status
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.payment.status?.toUpperCase() || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(orderDetails.payment.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Date
                    </Typography>
                    <Typography variant="body1">
                      {orderDetails.payment.created_at ? formatDate(orderDetails.payment.created_at) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 3,
          pt: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Modal>
  );
};

export default OrderDetailsModal;