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
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const GeneralSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    site_name: settings.general?.site_name?.value || '',
    site_description: settings.general?.site_description?.value || '',
    contact_email: settings.general?.contact_email?.value || '',
    support_phone: settings.general?.support_phone?.value || '',
    business_address: settings.general?.business_address?.value || '',
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = 'Site name is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.support_phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.support_phone)) {
      newErrors.support_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = [
      { category: 'general', key: 'site_name', value: formData.site_name },
      { category: 'general', key: 'site_description', value: formData.site_description },
      { category: 'general', key: 'contact_email', value: formData.contact_email },
      { category: 'general', key: 'support_phone', value: formData.support_phone },
      { category: 'general', key: 'business_address', value: formData.business_address },
    ];

    await onBulkUpdate(updates);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        General Platform Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Site Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={formData.site_name}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    error={!!errors.site_name}
                    helperText={errors.site_name}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Description"
                    value={formData.site_description}
                    onChange={(e) => handleInputChange('site_description', e.target.value)}
                    multiline
                    rows={3}
                    error={!!errors.site_description}
                    helperText={errors.site_description || 'Brief description for SEO and branding'}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    error={!!errors.contact_email}
                    helperText={errors.contact_email}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Support Phone"
                    value={formData.support_phone}
                    onChange={(e) => handleInputChange('support_phone', e.target.value)}
                    error={!!errors.support_phone}
                    helperText={errors.support_phone || 'Customer support phone number'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    multiline
                    rows={3}
                    error={!!errors.business_address}
                    helperText={errors.business_address || 'Full business address for orders and returns'}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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

export default GeneralSettings;