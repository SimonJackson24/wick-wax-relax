import React, { useState } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Email as EmailIcon } from '@mui/icons-material';

const EmailSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    smtp_host: settings.email?.smtp_host?.value || '',
    smtp_port: settings.email?.smtp_port?.value || '587',
    smtp_secure: settings.email?.smtp_secure?.value === 'true',
    email_from_name: settings.email?.email_from_name?.value || '',
    email_from_address: settings.email?.email_from_address?.value || '',
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.smtp_host && !formData.smtp_host.trim()) {
      newErrors.smtp_host = 'SMTP host is required when configuring email';
    }

    if (formData.email_from_address && !validateEmail(formData.email_from_address)) {
      newErrors.email_from_address = 'Please enter a valid email address';
    }

    if (formData.email_from_name && !formData.email_from_name.trim()) {
      newErrors.email_from_name = 'Sender name is required when configuring email';
    }

    const port = parseInt(formData.smtp_port);
    if (isNaN(port) || port < 1 || port > 65535) {
      newErrors.smtp_port = 'Please enter a valid port number (1-65535)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = [
      { category: 'email', key: 'smtp_host', value: formData.smtp_host },
      { category: 'email', key: 'smtp_port', value: formData.smtp_port },
      { category: 'email', key: 'smtp_secure', value: formData.smtp_secure.toString() },
      { category: 'email', key: 'email_from_name', value: formData.email_from_name },
      { category: 'email', key: 'email_from_address', value: formData.email_from_address },
    ];

    await onBulkUpdate(updates);
  };

  const testEmailConfiguration = async () => {
    // This would typically send a test email
    alert('Test email functionality would be implemented here');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Email Service Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="SMTP Configuration"
              avatar={<EmailIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    value={formData.smtp_host}
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                    error={!!errors.smtp_host}
                    helperText={errors.smtp_host || 'e.g., smtp.gmail.com, smtp.office365.com'}
                    placeholder="smtp.your-provider.com"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                    error={!!errors.smtp_port}
                    helperText={errors.smtp_port || 'Common: 587 (TLS), 465 (SSL), 25 (Plain)'}
                    inputProps={{ min: 1, max: 65535 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.smtp_secure}
                        onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
                      />
                    }
                    label="Use SSL/TLS encryption"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="From Name"
                    value={formData.email_from_name}
                    onChange={(e) => handleInputChange('email_from_name', e.target.value)}
                    error={!!errors.email_from_name}
                    helperText={errors.email_from_name || 'Display name for sent emails'}
                    placeholder="Your Company Name"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="From Email Address"
                    type="email"
                    value={formData.email_from_address}
                    onChange={(e) => handleInputChange('email_from_address', e.target.value)}
                    error={!!errors.email_from_address}
                    helperText={errors.email_from_address || 'noreply@yourcompany.com'}
                    placeholder="noreply@yourcompany.com"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Email Templates" />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Email templates are configured separately and include:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                <li>Order confirmation emails</li>
                <li>Shipping notifications</li>
                <li>Delivery confirmations</li>
                <li>Password reset emails</li>
                <li>Newsletter subscriptions</li>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Test Configuration" />
            <CardContent>
              <Button
                fullWidth
                variant="outlined"
                onClick={testEmailConfiguration}
                disabled={!formData.smtp_host || !formData.email_from_address}
              >
                Send Test Email
              </Button>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Sends a test email to verify configuration
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Email Configuration Notes:</strong>
              <br />• SMTP credentials are stored securely and encrypted
              <br />• Common providers: Gmail (smtp.gmail.com:587), Outlook (smtp-mail.outlook.com:587)
              <br />• For Gmail, you may need to enable "Less secure app access" or use an App Password
              <br />• Test your configuration before going live
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={testEmailConfiguration}
              disabled={!formData.smtp_host || !formData.email_from_address}
            >
              Test Configuration
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? null : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Email Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailSettings;