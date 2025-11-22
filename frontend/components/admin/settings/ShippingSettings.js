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
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const ShippingSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    free_shipping_threshold: settings.shipping?.free_shipping_threshold?.value || '50.00',
    default_shipping_method: settings.shipping?.default_shipping_method?.value || 'standard',
    shipping_zones: settings.shipping?.shipping_zones?.value ? JSON.parse(settings.shipping.shipping_zones.value) : ['UK', 'EU', 'Worldwide'],
    max_order_weight: settings.shipping?.max_order_weight?.value || '10.0',
  });

  const [errors, setErrors] = useState({});
  const [newZone, setNewZone] = useState('');

  const shippingMethods = [
    { value: 'standard', label: 'Standard Delivery (3-5 days)' },
    { value: 'express', label: 'Express Delivery (1-2 days)' },
    { value: 'overnight', label: 'Overnight Delivery (Next day)' },
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

  const handleAddZone = () => {
    if (newZone.trim() && !formData.shipping_zones.includes(newZone.trim())) {
      setFormData(prev => ({
        ...prev,
        shipping_zones: [...prev.shipping_zones, newZone.trim()]
      }));
      setNewZone('');
    }
  };

  const handleRemoveZone = (zoneToRemove) => {
    setFormData(prev => ({
      ...prev,
      shipping_zones: prev.shipping_zones.filter(zone => zone !== zoneToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const threshold = parseFloat(formData.free_shipping_threshold);
    if (isNaN(threshold) || threshold < 0) {
      newErrors.free_shipping_threshold = 'Please enter a valid amount';
    }

    const maxWeight = parseFloat(formData.max_order_weight);
    if (isNaN(maxWeight) || maxWeight <= 0) {
      newErrors.max_order_weight = 'Please enter a valid weight';
    }

    if (formData.shipping_zones.length === 0) {
      newErrors.shipping_zones = 'At least one shipping zone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = [
      { category: 'shipping', key: 'free_shipping_threshold', value: formData.free_shipping_threshold },
      { category: 'shipping', key: 'default_shipping_method', value: formData.default_shipping_method },
      { category: 'shipping', key: 'shipping_zones', value: JSON.stringify(formData.shipping_zones) },
      { category: 'shipping', key: 'max_order_weight', value: formData.max_order_weight },
    ];

    await onBulkUpdate(updates);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Shipping Configuration
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Shipping Rates & Limits" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Free Shipping Threshold (£)"
                    type="number"
                    value={formData.free_shipping_threshold}
                    onChange={(e) => handleInputChange('free_shipping_threshold', e.target.value)}
                    error={!!errors.free_shipping_threshold}
                    helperText={errors.free_shipping_threshold || 'Minimum order value for free shipping'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Default Shipping Method</InputLabel>
                    <Select
                      value={formData.default_shipping_method}
                      onChange={(e) => handleInputChange('default_shipping_method', e.target.value)}
                      label="Default Shipping Method"
                    >
                      {shippingMethods.map(method => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Maximum Order Weight (kg)"
                    type="number"
                    value={formData.max_order_weight}
                    onChange={(e) => handleInputChange('max_order_weight', e.target.value)}
                    error={!!errors.max_order_weight}
                    helperText={errors.max_order_weight || 'Maximum weight allowed for orders'}
                    inputProps={{ min: 0.1, step: 0.1 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Shipping Zones" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label="Add Shipping Zone"
                      value={newZone}
                      onChange={(e) => setNewZone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddZone()}
                      helperText="Enter zone name (e.g., UK, EU, USA)"
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddZone}
                      disabled={!newZone.trim()}
                    >
                      Add
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Shipping Zones:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.shipping_zones.map((zone, index) => (
                      <Chip
                        key={index}
                        label={zone}
                        onDelete={() => handleRemoveZone(zone)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  {errors.shipping_zones && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.shipping_zones}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> Shipping rates and carrier integrations will be configured separately.
              These settings control the general shipping behavior and limits.
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

export default ShippingSettings;