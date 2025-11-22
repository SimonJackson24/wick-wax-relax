import React from 'react';
import { Box, Container, Typography, Paper, Grid, Button } from '@mui/material';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import { useRouter } from 'next/router';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

const AdminDashboard = () => {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Dashboard',
      description: 'View sales analytics and performance metrics',
      icon: <DashboardIcon fontSize="large" />,
      path: '/admin',
    },
    {
      title: 'Products',
      description: 'Manage product inventory and listings',
      icon: <InventoryIcon fontSize="large" />,
      path: '/admin/products',
    },
    {
      title: 'Categories',
      description: 'Manage hierarchical product categories and subcategories',
      icon: <CategoryIcon fontSize="large" />,
      path: '/admin/hierarchical-categories',
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: <ShoppingCartIcon fontSize="large" />,
      path: '/admin/orders',
    },
    {
      title: 'Customers',
      description: 'Manage customer accounts and data',
      icon: <PeopleIcon fontSize="large" />,
      path: '/admin/users',
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: <BarChartIcon fontSize="large" />,
      path: '/admin/analytics',
    },
  ];

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    router.push(path);
  };

  return (
    <AdminProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Welcome to the Wick Wax & Relax admin dashboard. Select an option below to manage your store.
        </Typography>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3,
                  },
                  cursor: 'pointer',
                }}
                onClick={() => handleNavigation(item.path)}
                role="button"
                tabIndex={0}
                aria-label={`Navigate to ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigation(item.path);
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {item.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 2 }}>
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button variant="outlined" size="small">
                    Manage
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;