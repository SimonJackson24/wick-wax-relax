import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplayIcon from '@mui/icons-material/Replay';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useRouter } from 'next/router';

const OrderActions = ({ order, onViewDetails }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReorder = async () => {
    try {
      // Implement reorder functionality
      // This would typically involve adding items back to cart
      console.log('Reordering order:', order.id);

      // For now, show a message
      setSnackbar({
        open: true,
        message: 'Reorder functionality coming soon!',
        severity: 'info'
      });
    } catch (error) {
      console.error('Error reordering:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reorder. Please try again.',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleTrackOrder = () => {
    // Implement tracking functionality
    if (order.tracking_number) {
      // Open Royal Mail tracking in new tab
      const trackingUrl = `https://www.royalmail.com/track-your-item#/tracking-details/${order.tracking_number}`;
      window.open(trackingUrl, '_blank');
    } else {
      setSnackbar({
        open: true,
        message: 'No tracking number available for this order.',
        severity: 'warning'
      });
    }
    handleMenuClose();
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/export/invoice/${order.id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.external_id}.pdf`;
      document.body.appendChild(link);
      link.click();
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
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    onViewDetails(order);
    handleMenuClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const canTrack = order.status === 'SHIPPED' || order.status === 'DELIVERED';
  const canReorder = order.status !== 'PENDING' && order.status !== 'PROCESSING';

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {/* Primary Actions */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleViewDetails}
          sx={{
            borderRadius: theme.shape.borderRadius,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          View Details
        </Button>

        {/* Track Order Button (if applicable) */}
        {canTrack && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<LocalShippingIcon />}
            onClick={handleTrackOrder}
            sx={{
              borderRadius: theme.shape.borderRadius,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {isMobile ? 'Track' : 'Track Order'}
          </Button>
        )}

        {/* More Actions Menu */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleMenuOpen}
          startIcon={<MoreVertIcon />}
          sx={{
            borderRadius: theme.shape.borderRadius,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          More
        </Button>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleReorder} disabled={!canReorder}>
          <ListItemIcon>
            <ReplayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reorder Items</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleTrackOrder} disabled={!canTrack}>
          <ListItemIcon>
            <LocalShippingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Track Package</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDownloadInvoice}>
          <ListItemIcon>
            <ReceiptIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Invoice</ListItemText>
        </MenuItem>
      </Menu>

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

export default OrderActions;