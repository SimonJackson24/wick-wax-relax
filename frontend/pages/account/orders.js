import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuth } from '../../components/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { OrderHistoryProvider, useOrderHistory } from '../../components/OrderHistoryContext';
import OrderCard from '../../components/OrderCard';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import OrderSearch from '../../components/OrderSearch';
import OrderFilters from '../../components/OrderFilters';
import OrderPagination from '../../components/OrderPagination';
import BulkActions from '../../components/BulkActions';
import EmptyState from '../../components/EmptyState';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';

function OrdersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    orders,
    loading,
    error,
    pagination,
    filters,
    fetchOrders,
    setFilters,
    selectAllOrders,
    clearSelection
  } = useOrderHistory();

  // Keyboard navigation handlers
  const keyboardHandlers = {
    onFocusSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    onEscape: () => {
      if (modalOpen) {
        handleCloseModal();
      } else {
        clearSelection();
      }
    },
    onSelectAll: () => {
      selectAllOrders();
    }
  };

  useKeyboardNavigation(keyboardHandlers);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const handlePageChange = (event, page) => {
    fetchOrders(page, filters);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    fetchOrders(1, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { status: '', dateFrom: '', dateTo: '' };
    setFilters(clearedFilters);
    fetchOrders(1, clearedFilters);
  };

  const handleExportOrders = async () => {
    setExportLoading(true);
    try {
      // Build query parameters from current filters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`http://localhost:3001/api/export/orders/csv?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Orders exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting orders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export orders',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportOrderItems = async () => {
    setExportLoading(true);
    try {
      // Build query parameters from current filters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`http://localhost:3001/api/export/orders/items/csv?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export order items');
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
        message: 'Order items exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting order items:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export order items',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && orders.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Order History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and track all your orders
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportOrders}
              disabled={exportLoading || orders.length === 0}
              size="small"
            >
              {exportLoading ? 'Exporting...' : 'Export Orders'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportOrderItems}
              disabled={exportLoading || orders.length === 0}
              size="small"
            >
              {exportLoading ? 'Exporting...' : 'Export Items'}
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <OrderSearch />

      {/* Bulk Actions */}
      <BulkActions />

      {/* Filters */}
      <OrderFilters mobileDrawer />

      {/* Orders List */}
      {orders.length === 0 && !loading ? (
        <EmptyState
          title="No orders found"
          description="You haven't placed any orders yet. Start shopping to see your order history here."
          action={
            <Button
              component={Link}
              href="/products"
              variant="contained"
              size="large"
            >
              Browse Products
            </Button>
          }
        />
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {orders.length} of {pagination.total} orders
            </Typography>
          </Box>

          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
            />
          ))}

          {/* Pagination */}
          <OrderPagination />
        </>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        orderId={selectedOrder?.id}
      />

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
    </Container>
  );
}

export default function Orders() {
  return (
    <ProtectedRoute>
      <OrderHistoryProvider>
        <OrdersContent />
      </OrderHistoryProvider>
    </ProtectedRoute>
  );
}