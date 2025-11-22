import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as SalesIcon,
  People as UsersIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  Assessment as ReportsIcon,
  DateRange as DateRangeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const AdminAnalyticsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date range filters
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Analytics data states
  const [salesData, setSalesData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const tabProps = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      component: <AnalyticsDashboard />
    },
    {
      label: 'Sales',
      icon: <SalesIcon />,
      component: <SalesAnalyticsTab data={salesData} loading={loading} />
    },
    {
      label: 'Users',
      icon: <UsersIcon />,
      component: <UserAnalyticsTab data={userData} loading={loading} />
    },
    {
      label: 'Products',
      icon: <OrdersIcon />,
      component: <ProductAnalyticsTab data={productData} loading={loading} />
    },
    {
      label: 'Inventory',
      icon: <InventoryIcon />,
      component: <InventoryAnalyticsTab data={inventoryData} loading={loading} />
    },
    {
      label: 'Reports',
      icon: <ReportsIcon />,
      component: <ReportsTab dateRange={dateRange} />
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadAnalyticsData = async (dataType) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      };

      const response = await axios.get(`/api/analytics/${dataType}`, { params });

      switch (dataType) {
        case 'sales':
          setSalesData(response.data.analytics);
          break;
        case 'users':
          setUserData(response.data.analytics);
          break;
        case 'products':
          setProductData(response.data.analytics);
          break;
        case 'inventory':
          setInventoryData(response.data.analytics);
          break;
        case 'customers':
          setCustomerData(response.data.analytics);
          break;
      }
    } catch (err) {
      console.error(`Error loading ${dataType} analytics:`, err);
      setError(`Failed to load ${dataType} analytics`);
    } finally {
      setLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    const dataTypes = ['sales', 'users', 'products', 'inventory', 'customers'];
    const dataType = dataTypes[activeTab];

    if (activeTab > 0 && dataType) { // Skip dashboard tab
      loadAnalyticsData(dataType);
    }
  }, [activeTab, dateRange]);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Analytics & Reporting
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive business intelligence and performance analytics for your Wick Wax Relax store.
            </Typography>
          </Box>

          {/* Date Range Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' }
            }}>
              <DateRangeIcon sx={{ color: 'action.active' }} />
              <TextField
                label="From Date"
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange('from', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                label="To Date"
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange('to', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <Button
                variant="outlined"
                onClick={() => {
                  const dataTypes = ['sales', 'users', 'products', 'inventory', 'customers'];
                  const dataType = dataTypes[activeTab];
                  if (dataType) loadAnalyticsData(dataType);
                }}
                disabled={loading}
              >
                Apply Filters
              </Button>
            </Box>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Tabs */}
          <Paper sx={{ width: '100%', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                }
              }}
            >
              {tabProps.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={isMobile ? '' : tab.label}
                  iconPosition="start"
                  sx={{
                    flexDirection: isMobile ? 'column' : 'row',
                    '& .MuiTab-iconWrapper': {
                      marginBottom: isMobile ? 0.5 : 0,
                      marginRight: isMobile ? 0 : 1,
                    }
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box>
            {tabProps[activeTab].component}
          </Box>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

// Sales Analytics Tab Component
const SalesAnalyticsTab = ({ data, loading }) => {
  if (loading || !data) {
    return <Typography>Loading sales analytics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sales Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.trends?.length || 0} data points available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Channel Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.byChannel?.length || 0} channels tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// User Analytics Tab Component
const UserAnalyticsTab = ({ data, loading }) => {
  if (loading || !data) {
    return <Typography>Loading user analytics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main">
                {data.overview?.total_users || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {data.overview?.active_users_30d || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users (30d)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {data.overview?.new_users_30d || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Users (30d)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Product Analytics Tab Component
const ProductAnalyticsTab = ({ data, loading }) => {
  if (loading || !data) {
    return <Typography>Loading product analytics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Product Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.productPerformance?.length || 0} products analyzed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Inventory Analytics Tab Component
const InventoryAnalyticsTab = ({ data, loading }) => {
  if (loading || !data) {
    return <Typography>Loading inventory analytics...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Inventory Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Value
              </Typography>
              <Typography variant="h4" color="primary.main">
                £{data.overview?.total_inventory_value?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total value of inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Turnover
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.turnover?.length || 0} products analyzed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Reports Tab Component
const ReportsTab = ({ dateRange }) => {
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await axios.get('/api/analytics/reports/business-overview', {
        params: {
          dateFrom: dateRange.from,
          dateTo: dateRange.to
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `business_report_${dateRange.from}_to_${dateRange.to}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Business Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Overview Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Comprehensive business report including sales, users, products, and inventory analytics.
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleGenerateReport}
                disabled={generatingReport}
                fullWidth
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Custom Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Run custom analytics queries and export specialized reports.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalyticsPage;