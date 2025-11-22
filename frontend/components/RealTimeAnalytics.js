import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

const RealTimeAnalytics = ({ refreshInterval = 30000 }) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load real-time analytics
  const loadRealTimeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/realtime');
      setRealTimeData(response.data.analytics);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading real-time analytics:', err);
      setError('Failed to load real-time analytics');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    loadRealTimeData();

    const interval = setInterval(() => {
      loadRealTimeData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, percentage: 0 };

    const change = current - previous;
    const percentage = ((change / previous) * 100);

    return {
      value: change,
      percentage: Math.abs(percentage),
      isPositive: change >= 0
    };
  };

  if (loading && !realTimeData) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            Loading real-time analytics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <IconButton
          size="small"
          onClick={loadRealTimeData}
          sx={{ ml: 1 }}
        >
          <RefreshIcon />
        </IconButton>
      </Alert>
    );
  }

  const { today, yesterday, activeUsers, alerts } = realTimeData || {};

  // Calculate changes from yesterday
  const revenueChange = calculateChange(today?.revenue_today, yesterday?.revenue_yesterday);
  const ordersChange = calculateChange(today?.orders_today, yesterday?.orders_yesterday);
  const customersChange = calculateChange(today?.customers_today, yesterday?.customers_yesterday);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Real-Time Analytics
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatTime(lastUpdated)}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <IconButton size="small" onClick={loadRealTimeData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Today's Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Today's Revenue
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {revenueChange.isPositive ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>

              <Typography variant="h4" sx={{ mb: 1 }}>
                {formatCurrency(today?.revenue_today)}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  color={revenueChange.isPositive ? 'success.main' : 'error.main'}
                >
                  {revenueChange.isPositive ? '+' : '-'}{formatCurrency(Math.abs(revenueChange.value))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({revenueChange.percentage.toFixed(1)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Today's Orders
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {ordersChange.isPositive ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>

              <Typography variant="h4" sx={{ mb: 1 }}>
                {today?.orders_today || 0}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  color={ordersChange.isPositive ? 'success.main' : 'error.main'}
                >
                  {ordersChange.isPositive ? '+' : '-'}{Math.abs(ordersChange.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({ordersChange.percentage.toFixed(1)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Today's Customers
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {customersChange.isPositive ? (
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                </Box>
              </Box>

              <Typography variant="h4" sx={{ mb: 1 }}>
                {today?.customers_today || 0}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  color={customersChange.isPositive ? 'success.main' : 'error.main'}
                >
                  {customersChange.isPositive ? '+' : '-'}{Math.abs(customersChange.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({customersChange.percentage.toFixed(1)}%)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Users (24h)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
                </Box>
              </Box>

              <Typography variant="h4" sx={{ mb: 1 }}>
                {activeUsers || 0}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Users active in last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Section */}
      {(alerts?.lowStock > 0 || alerts?.pendingOrders > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              System Alerts
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {alerts?.lowStock > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${alerts.lowStock} items low on stock`}
                  color="warning"
                  variant="outlined"
                />
              )}

              {alerts?.pendingOrders > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${alerts.pendingOrders} orders pending`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Performance Indicators */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Indicators
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="h5" color="success.main">
                  {((today?.orders_today || 0) / Math.max(today?.customers_today || 1, 1)).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders per Customer
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="h5" color="primary.main">
                  {formatCurrency((today?.revenue_today || 0) / Math.max(today?.orders_today || 1, 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Order Value
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="h5" color="info.main">
                  {((today?.items_sold_today || 0) / Math.max(today?.orders_today || 1, 1)).toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items per Order
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="h5" color="secondary.main">
                  {formatCurrency((today?.revenue_today || 0) / Math.max(today?.items_sold_today || 1, 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue per Item
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeAnalytics;