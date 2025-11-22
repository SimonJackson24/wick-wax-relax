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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Security as SecurityIcon } from '@mui/icons-material';

const PaymentSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    currency: settings.payment?.currency?.value || 'GBP',
    payment_methods: settings.payment?.payment_methods?.value ? JSON.parse(settings.payment.payment_methods.value) : ['card', 'apple_pay', 'google_pay', 'klarna', 'clearpay'],
    min_order_value: settings.payment?.min_order_value?.value || '5.00',
    max_order_value: settings.payment?.max_order_value?.value || '1000.00',
  });

  const [errors, setErrors] = useState({});

  const currencies = [
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'US Dollar ($)' },
  ];

  const availablePaymentMethods = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'google_pay', label: 'Google Pay' },
    { value: 'klarna', label: 'Klarna' },
    { value: 'clearpay', label: 'Clearpay' },
    { value: 'paypal', label: 'PayPal' },
  ];

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

  const handlePaymentMethodChange = (method) => {
    const currentMethods = [...formData.payment_methods];
    const index = currentMethods.indexOf(method);

    if (index === -1) {
      currentMethods.push(method);
    } else {
      currentMethods.splice(index, 1);
    }

    setFormData(prev => ({
      ...prev,
      payment_methods: currentMethods
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const minValue = parseFloat(formData.min_order_value);
    if (isNaN(minValue) || minValue < 0) {
      newErrors.min_order_value = 'Please enter a valid minimum order value';
    }

    const maxValue = parseFloat(formData.max_order_value);
    if (isNaN(maxValue) || maxValue <= 0) {
      newErrors.max_order_value = 'Please enter a valid maximum order value';
    }

    if (minValue >= maxValue) {
      newErrors.max_order_value = 'Maximum value must be greater than minimum value';
    }

    if (formData.payment_methods.length === 0) {
      newErrors.payment_methods = 'At least one payment method must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = [
      { category: 'payment', key: 'currency', value: formData.currency },
      { category: 'payment', key: 'payment_methods', value: JSON.stringify(formData.payment_methods) },
      { category: 'payment', key: 'min_order_value', value: formData.min_order_value },
      { category: 'payment', key: 'max_order_value', value: formData.max_order_value },
    ];

    await onBulkUpdate(updates);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Gateway Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Currency & Order Limits"
              avatar={<SecurityIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Default Currency</InputLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      label="Default Currency"
                    >
                      {currencies.map(currency => (
                        <MenuItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Order Value (£)"
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => handleInputChange('min_order_value', e.target.value)}
                    error={!!errors.min_order_value}
                    helperText={errors.min_order_value}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Order Value (£)"
                    type="number"
                    value={formData.max_order_value}
                    onChange={(e) => handleInputChange('max_order_value', e.target.value)}
                    error={!!errors.max_order_value}
                    helperText={errors.max_order_value}
                    inputProps={{ min: 1, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Payment Methods" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select enabled payment methods:
                  </Typography>
                  {availablePaymentMethods.map(method => (
                    <Box key={method.value} display="flex" alignItems="center" mb={1}>
                      <Checkbox
                        checked={formData.payment_methods.includes(method.value)}
                        onChange={() => handlePaymentMethodChange(method.value)}
                      />
                      <Typography variant="body2">{method.label}</Typography>
                    </Box>
                  ))}
                  {errors.payment_methods && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.payment_methods}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Enabled Methods:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.payment_methods.map(method => {
                      const methodInfo = availablePaymentMethods.find(m => m.value === method);
                      return (
                        <Chip
                          key={method}
                          label={methodInfo?.label || method}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Important:</strong> Payment gateway API keys and sensitive credentials are configured
              separately in the API Keys section for security reasons. These settings control the general
              payment behavior and available methods.
            </Typography>
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> Changes to payment methods may take a few minutes to reflect
              on the frontend. Some payment methods may require additional setup or merchant approval.
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentSettings;