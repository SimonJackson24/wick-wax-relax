import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Notifications as NotificationsIcon } from '@mui/icons-material';

const NotificationSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    order_confirmation_enabled: settings.notifications?.order_confirmation_enabled?.value === 'true',
    shipping_notification_enabled: settings.notifications?.shipping_notification_enabled?.value === 'true',
    delivery_notification_enabled: settings.notifications?.delivery_notification_enabled?.value === 'true',
    push_notifications_enabled: settings.notifications?.push_notifications_enabled?.value === 'true',
  });

  const handleToggleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const updates = Object.keys(formData).map(key => ({
      category: 'notifications',
      key,
      value: formData[key].toString()
    }));

    await onBulkUpdate(updates);
  };

  const notificationTypes = [
    {
      key: 'order_confirmation_enabled',
      title: 'Order Confirmations',
      description: 'Send email when customer places an order',
      email: true,
      push: false
    },
    {
      key: 'shipping_notification_enabled',
      title: 'Shipping Notifications',
      description: 'Send email when order is shipped with tracking info',
      email: true,
      push: true
    },
    {
      key: 'delivery_notification_enabled',
      title: 'Delivery Confirmations',
      description: 'Send email when order is delivered',
      email: true,
      push: true
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Email Notifications"
              avatar={<NotificationsIcon />}
            />
            <CardContent>
              {notificationTypes.map((notification, index) => (
                <Box key={notification.key}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {notification.description}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData[notification.key]}
                          onChange={(e) => handleToggleChange(notification.key, e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>
                  {index < notificationTypes.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="Push Notifications" />
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Browser Push Notifications
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Enable push notifications for order updates and promotions
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.push_notifications_enabled}
                      onChange={(e) => handleToggleChange('push_notifications_enabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Notification Summary" />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Current notification settings:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>
                  Order confirmations: {formData.order_confirmation_enabled ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  Shipping notifications: {formData.shipping_notification_enabled ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  Delivery confirmations: {formData.delivery_notification_enabled ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  Push notifications: {formData.push_notifications_enabled ? 'Enabled' : 'Disabled'}
                </li>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="VAPID Keys" />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Push notification VAPID keys are configured separately for security.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                These keys are used to send push notifications to users' browsers and are managed in the API Keys section.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Notification Settings:</strong>
              <br />• Email notifications are sent to customers for order updates
              <br />• Push notifications require user permission and work in supported browsers
              <br />• SMS notifications can be added as a future enhancement
              <br />• All notifications include unsubscribe options for compliance
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>GDPR Compliance:</strong> All notifications include proper opt-in/opt-out mechanisms
              and respect user preferences. Marketing notifications require explicit consent.
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? null : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationSettings;