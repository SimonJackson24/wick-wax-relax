import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Typography,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useOrderHistory } from './OrderHistoryContext';

const BulkActions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    orders,
    selectedOrders,
    selectAllOrders,
    clearSelection,
    bulkAction,
    bulkActionLoading
  } = useOrderHistory();

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      selectAllOrders();
    } else {
      clearSelection();
    }
  };

  const handleBulkExport = async () => {
    if (selectedOrders.length === 0) return;

    try {
      // Build query parameters for selected orders
      const orderIds = selectedOrders.join(',');

      const response = await fetch(`http://localhost:3001/api/export/orders/bulk?orderIds=${orderIds}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export selected orders');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Successfully exported ${selectedOrders.length} orders`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Bulk export error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export selected orders',
        severity: 'error'
      });
    }
  };

  const handleBulkTrack = () => {
    if (selectedOrders.length === 0) return;

    // Open tracking pages for selected orders
    selectedOrders.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (order && order.tracking_number) {
        const trackingUrl = `https://www.royalmail.com/track-your-item#/tracking-details/${order.tracking_number}`;
        window.open(trackingUrl, '_blank');
      }
    });

    setSnackbar({
      open: true,
      message: `Opened tracking for ${selectedOrders.length} orders`,
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (orders.length === 0) return null;

  const selectedCount = selectedOrders.length;
  const hasSelections = selectedCount > 0;

  return (
    <>
      <Box sx={{
        mb: 2,
        p: 2,
        bgcolor: hasSelections ? theme.palette.action.selected : 'transparent',
        borderRadius: theme.shape.borderRadius,
        border: hasSelections ? `1px solid ${theme.palette.primary.main}` : 'none'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Checkbox
              checked={selectedCount === orders.length && orders.length > 0}
              indeterminate={selectedCount > 0 && selectedCount < orders.length}
              onChange={handleSelectAll}
              size="small"
            />
            <Typography variant="body2">
              {selectedCount === 0
                ? 'Select orders to perform bulk actions'
                : `${selectedCount} order${selectedCount === 1 ? '' : 's'} selected`
              }
            </Typography>
          </Box>

          {hasSelections && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleBulkExport}
                disabled={bulkActionLoading}
                sx={{ textTransform: 'none' }}
              >
                Export Selected
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<LocalShippingIcon />}
                onClick={handleBulkTrack}
                disabled={bulkActionLoading}
                sx={{ textTransform: 'none' }}
              >
                Track Selected
              </Button>

              <Button
                variant="text"
                size="small"
                onClick={clearSelection}
                sx={{ textTransform: 'none' }}
              >
                Clear Selection
              </Button>
            </Box>
          )}
        </Box>

        {hasSelections && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Bulk actions will be applied to all selected orders. Please review your selection before proceeding.
          </Alert>
        )}
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
    </>
  );
};

export default BulkActions;