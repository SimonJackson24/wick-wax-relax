import React from 'react';
import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledChip = styled(Chip)(({ theme, statuscolor }) => ({
  backgroundColor: statuscolor,
  color: theme.palette.getContrastText(statuscolor),
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

const OrderStatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#ff9800'; // Orange
      case 'PROCESSING':
        return '#2196f3'; // Blue
      case 'SHIPPED':
        return '#4caf50'; // Green
      case 'DELIVERED':
        return '#2e7d32'; // Dark Green
      case 'CANCELLED':
        return '#f44336'; // Red
      case 'REFUNDED':
        return '#9c27b0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <StyledChip
      label={getStatusLabel(status)}
      statuscolor={getStatusColor(status)}
      size="small"
    />
  );
};

export default OrderStatusBadge;