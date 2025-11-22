import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  CloudSync as SyncIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
// import PWAStatusBar from './PWAStatusBar'; // Temporarily disabled due to SSR issues

const drawerWidth = 240;

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
    },
    {
      text: 'Products',
      icon: <StoreIcon />,
      path: '/admin/products',
    },
    {
      text: 'Categories',
      icon: <CategoryIcon />,
      path: '/admin/categories',
    },
    {
      text: 'Inventory',
      icon: <InventoryIcon />,
      path: '/admin/inventory',
    },
    {
      text: 'Orders',
      icon: <OrdersIcon />,
      path: '/admin/orders',
    },
    {
      text: 'Users',
      icon: <UsersIcon />,
      path: '/admin/users',
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/admin/analytics',
    },
    {
      text: 'Sync Management',
      icon: <SyncIcon />,
      path: '/admin/sync',
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={router.pathname === item.path}
              onClick={() => {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* <PWAStatusBar /> */} {/* Temporarily disabled due to SSR issues */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          // top: '40px', // Account for PWA status bar - disabled
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Wick Wax Relax Admin
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.name || 'Admin'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              // top: '40px', // Account for PWA status bar - disabled
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              // top: '40px', // Account for PWA status bar - disabled
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          // mt: '40px', // Account for PWA status bar - disabled
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;