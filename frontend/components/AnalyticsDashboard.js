import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  Inventory as InventoryIcon,
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleExport = async (dataType) => {
    try {
      const response = await axios.get(`/api/analytics/export/${dataType}`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading analytics dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  const {
    userAnalytics,
    salesAnalytics,
    productAnalytics,
    realTimeAnalytics
  } = dashboardData || {};

  // Prepare chart data
  const salesTrendData = salesAnalytics?.trends?.slice(-14) || []; // Last 14 days
  const topProductsData = productAnalytics?.productPerformance?.slice(0, 5) || [];
  const channelData = salesAnalytics?.byChannel || [];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
            </Select>
          </FormControl>

          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Today's Revenue
                  </Typography>
                  <Typography variant="h4">
                    £{realTimeAnalytics?.today?.revenue_today?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {realTimeAnalytics?.today?.orders_today || 0} orders
                  </Typography>
                </Box>
                <RevenueIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {realTimeAnalytics?.activeUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Last 24 hours
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h4">
                    {realTimeAnalytics?.alerts?.lowStock || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Items need attention
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Orders
                  </Typography>
                  <Typography variant="h4">
                    {realTimeAnalytics?.alerts?.pendingOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Awaiting processing
                  </Typography>
                </Box>
                <OrdersIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sales Trend</Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={() => handleExport('sales')}
              >
                Export
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-GB');
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `£${value.toFixed(2)}` : value,
                    name === 'revenue' ? 'Revenue' : name === 'orders_count' ? 'Orders' : 'Customers'
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="orders_count"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sales by Channel */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Channel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Top Products</Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={() => handleExport('products')}
              >
                Export
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={120}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? `£${value.toFixed(2)}` : value,
                    name === 'revenue' ? 'Revenue' : 'Units Sold'
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                <Bar dataKey="units_sold" fill="#82ca9d" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Analytics */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">User Analytics</Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={() => handleExport('users')}
              >
                Export
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main">
                    {userAnalytics?.overview?.total_users || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main">
                    {userAnalytics?.overview?.active_users_30d || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active (30d)
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.main">
                    {userAnalytics?.overview?.new_users_30d || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New (30d)
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main">
                    {userAnalytics?.engagement?.users_with_orders || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Orders
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Low Stock Alerts */}
      {productAnalytics?.lowStockProducts?.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
            Low Stock Alerts
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {productAnalytics.lowStockProducts.map((product, index) => (
              <Chip
                key={index}
                label={`${product.name} (${product.inventory_quantity} left)`}
                color="warning"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Export Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Analytics Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download comprehensive analytics data for external analysis and reporting.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('sales')}
          >
            Sales Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('users')}
          >
            User Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('products')}
          >
            Product Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('customers')}
          >
            Customer Data
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AnalyticsDashboard;