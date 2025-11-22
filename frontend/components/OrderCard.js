import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Checkbox
} from '@mui/material';
import OrderStatusBadge from './OrderStatusBadge';
import OrderActions from './OrderActions';
import { useOrderHistory } from './OrderHistoryContext';

const OrderCard = ({ order, onViewDetails }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedOrders, toggleOrderSelection } = useOrderHistory();

  const isSelected = selectedOrders.includes(order.id);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `£${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2} alignItems="center">
          {/* Checkbox for bulk selection */}
          <Grid item xs="auto">
            <Checkbox
              checked={isSelected}
              onChange={() => toggleOrderSelection(order.id)}
              size="small"
            />
          </Grid>

          {/* Order ID and Date */}
          <Grid item xs sm={5}>
            <Box>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Order #{order.external_id}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {formatDate(order.order_date)}
              </Typography>
              <OrderStatusBadge status={order.status} />
            </Box>
          </Grid>

          {/* Total and Items Count */}
          <Grid item xs sm={5}>
            <Box
              sx={{
                textAlign: { xs: 'left', sm: 'right' },
                mt: { xs: 1, sm: 0 }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  mb: 1,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                {formatCurrency(order.total)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
              </Typography>
            </Box>
          </Grid>

          {/* Order Actions */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <OrderActions order={order} onViewDetails={onViewDetails} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OrderCard;