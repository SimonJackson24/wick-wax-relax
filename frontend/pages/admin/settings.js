import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Api as ApiIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

// Import settings components
import GeneralSettings from '../../components/admin/settings/GeneralSettings';
import ShippingSettings from '../../components/admin/settings/ShippingSettings';
import PaymentSettings from '../../components/admin/settings/PaymentSettings';
import ApiSettings from '../../components/admin/settings/ApiSettings';
import EmailSettings from '../../components/admin/settings/EmailSettings';
import NotificationSettings from '../../components/admin/settings/NotificationSettings';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/settings');
      setSettings(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingUpdate = async (category, key, value) => {
    try {
      setSaving(true);
      await axios.put(`/api/admin/settings/${category}/${key}`, { value });
      setSuccessMessage('Setting updated successfully');

      // Update local state
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: {
            ...prev[category][key],
            value
          }
        }
      }));
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async (updates) => {
    try {
      setSaving(true);
      await axios.post('/api/admin/settings/bulk', { settings: updates });
      setSuccessMessage('Settings updated successfully');

      // Refresh settings
      await fetchSettings();
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setError(null);
  };

  const tabs = [
    { label: 'General', icon: <SettingsIcon />, component: GeneralSettings },
    { label: 'Shipping', icon: <ShippingIcon />, component: ShippingSettings },
    { label: 'Payment', icon: <PaymentIcon />, component: PaymentSettings },
    { label: 'API Keys', icon: <ApiIcon />, component: ApiSettings },
    { label: 'Email', icon: <EmailIcon />, component: EmailSettings },
    { label: 'Notifications', icon: <NotificationsIcon />, component: NotificationSettings },
  ];

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  const ActiveComponent = tabs[activeTab]?.component;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Platform Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ minHeight: 64 }}
                />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {ActiveComponent && (
                <ActiveComponent
                  settings={settings}
                  onSettingUpdate={handleSettingUpdate}
                  onBulkUpdate={handleBulkUpdate}
                  saving={saving}
                />
              )}
            </Box>
          </Paper>

          <Snackbar
            open={!!successMessage}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="success">
              {successMessage}
            </Alert>
          </Snackbar>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminSettings;