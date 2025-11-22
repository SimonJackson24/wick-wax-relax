import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory/reports', {
        params: { dateFrom, dateTo }
      });
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load inventory reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchReports();
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  if (!reports) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Inventory Reports
            </Typography>
            <Alert severity="info">
              No report data available. Please ensure inventory data exists.
            </Alert>
          </Container>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  // Prepare chart data
  const stockLevelsData = reports.stockLevels?.slice(0, 10).map(item => ({
    name: item.variant_name,
    stock: item.inventory_quantity || 0,
    value: (item.inventory_quantity || 0) * (item.price || 0)
  })) || [];

  const lowStockData = reports.lowStock?.map(item => ({
    name: item.variant_name,
    value: item.inventory_quantity
  })) || [];

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            <AssessmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Inventory Reports & Analytics
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Date Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter by Date Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <Button variant="contained" onClick={handleDateFilter}>
                Apply Filter
              </Button>
            </Box>
          </Paper>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Inventory Value
                  </Typography>
                  <Typography variant="h4">
                    £{reports.inventoryValue?.total_value?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Items in Stock
                  </Typography>
                  <Typography variant="h4">
                    {reports.inventoryValue?.total_items || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {reports.lowStock?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Price
                  </Typography>
                  <Typography variant="h4">
                    £{reports.inventoryValue?.average_price?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Stock Levels Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Top 10 Stock Levels
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={stockLevelsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Low Stock Pie Chart */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Low Stock Distribution
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={lowStockData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {lowStockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Recent Audit Trail */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Inventory Changes
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {reports.auditTrail?.slice(0, 20).map((entry, index) => (
                    <Box
                      key={entry.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < 19 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          {entry.product_name} - {entry.variant_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {entry.change_type}: {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {entry.reason}
                        </Typography>
                      </Box>
                    </Box>
                  )) || []}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default InventoryReports;