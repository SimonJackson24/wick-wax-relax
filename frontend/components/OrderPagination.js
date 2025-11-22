import React from 'react';
import {
  Box,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useOrderHistory } from './OrderHistoryContext';

const OrderPagination = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pagination, fetchOrders, filters } = useOrderHistory();

  const pageSizeOptions = [10, 20, 50, 100];

  const handlePageChange = (event, page) => {
    fetchOrders(page, filters);
  };

  const handlePageSizeChange = (event) => {
    const newLimit = event.target.value;
    fetchOrders(1, { ...filters, limit: newLimit });
  };

  if (pagination.pages <= 1 && pagination.total <= pageSizeOptions[0]) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} orders
        </Typography>

        {/* Page Size Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Show:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={pagination.limit}
              onChange={handlePageSizeChange}
              sx={{ fontSize: '0.875rem' }}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: theme.shape.borderRadius,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default OrderPagination;