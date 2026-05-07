import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import axios from 'axios';

const OrderHistory = ({ subscriptionId = null }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    loadOrders();
  }, [page, rowsPerPage, subscriptionId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });
      
      if (subscriptionId) {
        params.append('subscription_id', subscriptionId);
      }

      const response = await axios.get(`/api/orders?${params.toString()}`);
      
      let orderData = response.data.orders || response.data.data || [];
      if (response.data.orders) {
        setTotalOrders(response.data.pagination?.total || orderData.length);
      } else {
        setTotalOrders(orderData.length);
      }
      
      setOrders(orderData);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpand = async (orderId) => {
    if (expandedRows[orderId]) {
      setExpandedRows(prev => ({ ...prev, [orderId]: false }));
      return;
    }

    if (!orderDetails || orderDetails.id !== orderId) {
      await loadOrderDetails(orderId);
    }
    setExpandedRows(prev => ({ ...prev, [orderId]: true }));
  };

  const loadOrderDetails = async (orderId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(`/api/orders/${orderId}`);
      setOrderDetails(response.data);
    } catch (err) {
      console.error('Error loading order details:', err);
      setError('Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: 'warning',
      PROCESSING: 'info',
      SHIPPED: 'primary',
      DELIVERED: 'success',
      CANCELLED: 'error',
      REFUNDED: 'default',
    };
    return statusColors[status] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const getTrackingUrl = (trackingNumber, carrier) => {
    if (!trackingNumber) return null;
    if (carrier === 'ROYAL_MAIL') {
      return `https://www.royalmail.com/track-your-item#${trackingNumber}`;
    } else if (carrier === 'DPD') {
      return `https://www.dpd.co.uk/tracking/tracking.jsp?chunk=${trackingNumber}`;
    } else if (carrier === 'HERMES') {
      return `https://www.hermesworld.co.uk/track-your-parcel?trackingNumber=${trackingNumber}`;
    }
    return null;
  };

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading order history...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button onClick={loadOrders} sx={{ ml: 2 }}>Retry</Button>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No orders found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subscriptionId 
            ? 'Your subscription deliveries will appear here once processed.'
            : 'Your order history will appear here once you make a purchase.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h3">
          {subscriptionId ? 'Subscription Order History' : 'Order History'}
        </Typography>
        <Button onClick={loadOrders} size="small">Refresh</Button>
      </Box>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tracking</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow 
                  hover 
                  sx={{ 
                    '& > *': { borderBottom: expandedRows[order.id] ? 'unset' : undefined },
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleRowExpand(order.id)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small">
                        {expandedRows[order.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {order.id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(order.created_at || order.order_date)}</TableCell>
                  <TableCell>
                    <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatPrice(order.total || order.total_price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <MuiLink 
                        href={getTrackingUrl(order.tracking_number, order.carrier)} 
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.tracking_number.substring(0, 12)}...
                      </MuiLink>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not yet shipped</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); loadOrderDetails(order.id); setSelectedOrder(order); }}>
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0, borderBottom: expandedRows[order.id] ? undefined : 'none' }}>
                    <Collapse in={expandedRows[order.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 3, px: 2 }}>
                        {orderDetails && orderDetails.id === order.id ? (
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom color="primary">Order Items</Typography>
                              {orderDetails.items && orderDetails.items.length > 0 ? (
                                orderDetails.items.map((item, idx) => (
                                  <Box key={idx} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">{item.name || item.product_name} x {item.quantity}</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                      {formatPrice(item.total_price || item.price * item.quantity)}
                                    </Typography>
                                  </Box>
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">Item details not available</Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom color="primary">Shipping Address</Typography>
                              {orderDetails.shipping_address ? (
                                <Box>
                                  <Typography variant="body2">{orderDetails.shipping_address.full_name}</Typography>
                                  <Typography variant="body2">{orderDetails.shipping_address.address_line1}</Typography>
                                  {orderDetails.shipping_address.address_line2 && (
                                    <Typography variant="body2">{orderDetails.shipping_address.address_line2}</Typography>
                                  )}
                                  <Typography variant="body2">{orderDetails.shipping_address.city}, {orderDetails.shipping_address.postal_code}</Typography>
                                  <Typography variant="body2">{orderDetails.shipping_address.country}</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">Address not available</Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Divider sx={{ my: 2 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  {orderDetails.shipping_method && (
                                    <Typography variant="body2" color="text.secondary">Shipping: {orderDetails.shipping_method}</Typography>
                                  )}
                                  {orderDetails.payment_method && (
                                    <Typography variant="body2" color="text.secondary">Payment: {orderDetails.payment_method.replace('_', ' ')}</Typography>
                                  )}
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  {orderDetails.subtotal !== undefined && (
                                    <Typography variant="body2">Subtotal: {formatPrice(orderDetails.subtotal)}</Typography>
                                  )}
                                  {orderDetails.shipping_cost !== undefined && (
                                    <Typography variant="body2">Shipping: {formatPrice(orderDetails.shipping_cost)}</Typography>
                                  )}
                                  {orderDetails.discount !== undefined && orderDetails.discount > 0 && (
                                    <Typography variant="body2" color="success.main">Discount: -{formatPrice(orderDetails.discount)}</Typography>
                                  )}
                                  <Typography variant="h6" fontWeight="bold">Total: {formatPrice(orderDetails.total || orderDetails.total_price)}</Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        ) : detailsLoading ? (
                          <LinearProgress />
                        ) : (
                          <Typography variant="body2" color="text.secondary">Loading details...</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalOrders > rowsPerPage && (
        <TablePagination
          component="div"
          count={totalOrders}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}

      <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
        {selectedOrder && orderDetails && orderDetails.id === selectedOrder.id && (
          <>
            <DialogTitle>Order Details - {selectedOrder.id.substring(0, 8)}...</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="overline" color="text.secondary">Order Status</Typography>
                  <Box sx={{ mt: 1 }}><Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} /></Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="overline" color="text.secondary">Order Date</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{formatDate(selectedOrder.created_at || selectedOrder.order_date)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="overline" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h5" color="primary" sx={{ mt: 1 }}>{formatPrice(selectedOrder.total || selectedOrder.total_price)}</Typography>
                </Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="primary">Items</Typography>
                  {orderDetails.items?.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="body1">{item.name || item.product_name}</Typography>
                      <Typography variant="body2" color="text.secondary">Qty: {item.quantity} x {formatPrice(item.unit_price || item.price)}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="primary">Shipping Address</Typography>
                  {orderDetails.shipping_address && (
                    <Box>
                      <Typography variant="body1">{orderDetails.shipping_address.full_name}</Typography>
                      <Typography variant="body2">{orderDetails.shipping_address.address_line1}</Typography>
                      {orderDetails.shipping_address.address_line2 && <Typography variant="body2">{orderDetails.shipping_address.address_line2}</Typography>}
                      <Typography variant="body2">{orderDetails.shipping_address.city}, {orderDetails.shipping_address.postal_code}</Typography>
                      <Typography variant="body2">{orderDetails.shipping_address.country}</Typography>
                    </Box>
                  )}
                </Grid>
                {selectedOrder.tracking_number && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom color="primary">Tracking Information</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2">{selectedOrder.carrier}: {selectedOrder.tracking_number}</Typography>
                      <MuiLink href={getTrackingUrl(selectedOrder.tracking_number, selectedOrder.carrier)} target="_blank" rel="noopener">Track Package</MuiLink>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions><Button onClick={() => setSelectedOrder(null)}>Close</Button></DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default OrderHistory;
