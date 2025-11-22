import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import SubscriptionPlans from '../components/SubscriptionPlans';
import SubscriptionManager from '../components/SubscriptionManager';
import { useAuth } from '../components/AuthContext';

const SubscriptionsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Optionally switch to plans tab
    setActiveTab(1);
  };

  const tabProps = [
    {
      label: 'My Subscriptions',
      icon: <SettingsIcon />,
      component: <SubscriptionManager userId={user?.id} />
    },
    {
      label: 'Subscription Plans',
      icon: <CartIcon />,
      component: (
        <SubscriptionPlans
          selectedProduct={selectedProduct}
          onSelectPlan={(plan) => {
            // Handle plan selection
            console.log('Selected plan:', plan);
          }}
        />
      )
    },
    {
      label: 'Order History',
      icon: <HistoryIcon />,
      component: (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Subscription Order History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your past subscription deliveries and order details.
          </Typography>
          {/* Order history component would go here */}
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Subscriptions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your recurring deliveries and discover subscription plans to save on your favorite products.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
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

        <Box sx={{ p: 0 }}>
          {tabProps[activeTab].component}
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 2
        }}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
              }
            }}
            onClick={() => setActiveTab(1)}
          >
            <CartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Browse Plans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discover subscription plans and start saving
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
              }
            }}
            onClick={() => setActiveTab(0)}
          >
            <SettingsIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Manage Subscriptions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pause, resume, or cancel your subscriptions
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
              }
            }}
            onClick={() => setActiveTab(2)}
          >
            <HistoryIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Order History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your subscription delivery history
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Subscription Benefits */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom align="center">
          Why Choose Subscriptions?
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mt: 3
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" sx={{ mb: 1 }}>
              💰
            </Typography>
            <Typography variant="h6" gutterBottom>
              Save Money
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get up to 10% off on regular deliveries with our subscription plans
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" sx={{ mb: 1 }}>
              🚚
            </Typography>
            <Typography variant="h6" gutterBottom>
              Free Delivery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Never pay for shipping on your subscription orders
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" sx={{ mb: 1 }}>
              ⏰
            </Typography>
            <Typography variant="h6" gutterBottom>
              Convenient
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set it and forget it - automatic deliveries on your schedule
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" color="primary.main" sx={{ mb: 1 }}>
              🔄
            </Typography>
            <Typography variant="h6" gutterBottom>
              Flexible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pause, resume, or cancel anytime with no hidden fees
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom align="center">
          Frequently Asked Questions
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            How do subscriptions work?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a subscription plan and product, set your delivery schedule, and we'll automatically send you fresh products at regular intervals. You can pause, resume, or cancel anytime.
          </Typography>

          <Typography variant="h6" gutterBottom>
            When will I be charged?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You're charged when each order is processed and shipped. You'll receive an email confirmation with tracking information for each delivery.
          </Typography>

          <Typography variant="h6" gutterBottom>
            Can I change my delivery address?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Yes! You can update your shipping address anytime from your subscription management dashboard. Changes will apply to future deliveries.
          </Typography>

          <Typography variant="h6" gutterBottom>
            What if I'm not home for delivery?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Our delivery partners will attempt delivery. If you're not home, they'll leave a card with collection instructions or redeliver on your chosen date.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default SubscriptionsPage;