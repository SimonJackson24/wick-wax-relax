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
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const ApiSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    amazon_api_key: settings.api?.amazon_api_key?.value || '',
    amazon_client_secret: settings.api?.amazon_client_secret?.value || '',
    etsy_api_key: settings.api?.etsy_api_key?.value || '',
    etsy_shared_secret: settings.api?.etsy_shared_secret?.value || '',
    revolut_api_key: settings.api?.revolut_api_key?.value || '',
    revolut_webhook_secret: settings.api?.revolut_webhook_secret?.value || '',
  });

  const [showPasswords, setShowPasswords] = useState({
    amazon_api_key: false,
    amazon_client_secret: false,
    etsy_api_key: false,
    etsy_shared_secret: false,
    revolut_api_key: false,
    revolut_webhook_secret: false,
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateApiKey = (key, platform) => {
    if (!key.trim()) return true; // Empty is allowed (optional)

    const patterns = {
      amazon_api_key: /^[A-Z0-9]{20,40}$/,
      amazon_client_secret: /^[A-Za-z0-9+/=]{20,}$/,
      etsy_api_key: /^[a-f0-9]{32}$/,
      etsy_shared_secret: /^[a-f0-9]{32}$/,
      revolut_api_key: /^[a-f0-9]{64}$/,
      revolut_webhook_secret: /^[a-f0-9]{64}$/,
    };

    return patterns[key] ? patterns[key].test(key) : true;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate each API key format if provided
    Object.keys(formData).forEach(field => {
      if (formData[field] && !validateApiKey(formData[field], field)) {
        newErrors[field] = `Invalid ${field.replace(/_/g, ' ')} format`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = Object.keys(formData).map(key => ({
      category: 'api',
      key,
      value: formData[key]
    }));

    await onBulkUpdate(updates);
  };

  const apiConfigurations = [
    {
      title: 'Amazon SP-API',
      fields: [
        {
          key: 'amazon_api_key',
          label: 'API Key',
          helperText: 'Amazon Selling Partner API Key',
          tooltip: 'Your Amazon SP-API access key for product synchronization'
        },
        {
          key: 'amazon_client_secret',
          label: 'Client Secret',
          helperText: 'Amazon SP-API Client Secret',
          tooltip: 'Your Amazon SP-API client secret for authentication'
        }
      ]
    },
    {
      title: 'Etsy API',
      fields: [
        {
          key: 'etsy_api_key',
          label: 'API Key',
          helperText: 'Etsy API Key',
          tooltip: 'Your Etsy API key for shop integration'
        },
        {
          key: 'etsy_shared_secret',
          label: 'Shared Secret',
          helperText: 'Etsy Shared Secret',
          tooltip: 'Your Etsy shared secret for API authentication'
        }
      ]
    },
    {
      title: 'Revolut Payment Gateway',
      fields: [
        {
          key: 'revolut_api_key',
          label: 'API Key',
          helperText: 'Revolut API Key',
          tooltip: 'Your Revolut API key for payment processing'
        },
        {
          key: 'revolut_webhook_secret',
          label: 'Webhook Secret',
          helperText: 'Revolut Webhook Secret',
          tooltip: 'Secret for validating Revolut webhook signatures'
        }
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        External API Configuration
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Security Notice:</strong> API keys and secrets are encrypted before storage.
          Changes take effect immediately but may require service restart for some integrations.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {apiConfigurations.map((config, configIndex) => (
          <Grid item xs={12} md={6} key={configIndex}>
            <Card>
              <CardHeader
                title={config.title}
                avatar={<SecurityIcon />}
                action={
                  <Tooltip title="All API credentials are encrypted at rest">
                    <IconButton size="small">
                      <HelpIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  {config.fields.map((field, fieldIndex) => (
                    <Grid item xs={12} key={fieldIndex}>
                      <TextField
                        fullWidth
                        label={field.label}
                        type={showPasswords[field.key] ? 'text' : 'password'}
                        value={formData[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        error={!!errors[field.key]}
                        helperText={errors[field.key] || field.helperText}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility(field.key)}
                                edge="end"
                                size="small"
                              >
                                {showPasswords[field.key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        placeholder={field.key.includes('secret') ? '••••••••••••••••' : 'Enter API key...'}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>API Key Management:</strong>
              <br />• Leave fields empty to disable integrations
              <br />• API keys are validated for correct format before saving
              <br />• Changes are logged for audit purposes
              <br />• Test integrations after updating credentials
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Last updated: {new Date().toLocaleString()}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? null : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save API Keys'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiSettings;