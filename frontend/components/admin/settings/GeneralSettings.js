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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const GeneralSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    site_name: settings.general?.site_name?.value || '',
    site_description: settings.general?.site_description?.value || '',
    contact_email: settings.general?.contact_email?.value || '',
    support_phone: settings.general?.support_phone?.value || '',
    business_address: settings.general?.business_address?.value || '',
    vat_registered: settings.general?.vat_registered?.value === 'true',
    vat_registration_number: settings.general?.vat_registration_number?.value || '',
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
      { category: 'general', key: 'vat_registered', value: formData.vat_registered ? 'true' : 'false' },
      { category: 'general', key: 'vat_registration_number', value: formData.vat_registration_number },
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

        {/* VAT — the flip-of-switch. Prices are always entered as what the
            customer pays; this switch only changes how they are ACCOUNTED
            for. OFF: no VAT lines anywhere. ON: same prices become
            VAT-inclusive, invoices/admin show the breakdown. */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="VAT Registration" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.vat_registered}
                        onChange={(e) => handleInputChange('vat_registered', e.target.checked)}
                      />
                    }
                    label={formData.vat_registered ? 'VAT registered — prices are VAT-inclusive' : 'Not VAT registered — prices displayed as entered'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="VAT Registration Number"
                    value={formData.vat_registration_number}
                    onChange={(e) => handleInputChange('vat_registration_number', e.target.value)}
                    helperText="GB123456789 — leave empty until HMRC issues one. Flipping the switch with a number set starts showing the VAT breakdown on invoices."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Turning this on does <strong>not</strong> change any displayed prices — customers
                    see exactly the same amounts. Only the accounting interpretation changes
                    (ex-VAT + VAT breakdown on invoices and admin reports).
                  </Alert>
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