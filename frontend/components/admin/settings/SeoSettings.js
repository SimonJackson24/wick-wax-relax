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
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material';

const SeoSettings = ({ settings, onSettingUpdate, onBulkUpdate, saving }) => {
  const [formData, setFormData] = useState({
    site_title: settings.seo?.site_title?.value || '',
    site_description: settings.seo?.site_description?.value || '',
    site_keywords: settings.seo?.site_keywords?.value || '',
    og_title: settings.seo?.og_title?.value || '',
    og_description: settings.seo?.og_description?.value || '',
    og_image: settings.seo?.og_image?.value || '',
    twitter_card: settings.seo?.twitter_card?.value || 'summary_large_image',
    canonical_url: settings.seo?.canonical_url?.value || '',
    robots_txt: settings.seo?.robots_txt?.value || 'User-agent: *\nAllow: /',
    sitemap_enabled: settings.seo?.sitemap_enabled?.value === 'true',
    google_analytics_id: settings.seo?.google_analytics_id?.value || '',
    facebook_pixel_id: settings.seo?.facebook_pixel_id?.value || '',
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

    if (formData.site_title && formData.site_title.length > 60) {
      newErrors.site_title = 'Site title should be under 60 characters for optimal SEO';
    }

    if (formData.site_description && formData.site_description.length > 160) {
      newErrors.site_description = 'Site description should be under 160 characters for optimal SEO';
    }

    if (formData.og_title && formData.og_title.length > 60) {
      newErrors.og_title = 'Open Graph title should be under 60 characters';
    }

    if (formData.og_description && formData.og_description.length > 160) {
      newErrors.og_description = 'Open Graph description should be under 160 characters';
    }

    if (formData.canonical_url && !formData.canonical_url.match(/^https?:\/\/.+/)) {
      newErrors.canonical_url = 'Please enter a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = Object.keys(formData).map(key => ({
      category: 'seo',
      key,
      value: formData[key].toString()
    }));

    await onBulkUpdate(updates);
  };

  const generateRobotsTxt = () => {
    const defaultRobots = `User-agent: *
Allow: /

Sitemap: ${formData.canonical_url || 'https://yourdomain.com'}/sitemap.xml`;
    setFormData(prev => ({
      ...prev,
      robots_txt: defaultRobots
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SEO & Social Media Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Basic SEO Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Basic SEO Settings"
              avatar={<SearchIcon />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Title"
                    value={formData.site_title}
                    onChange={(e) => handleInputChange('site_title', e.target.value)}
                    error={!!errors.site_title}
                    helperText={errors.site_title || `${formData.site_title.length}/60 characters`}
                    placeholder="Wick Wax Relax - Premium Candles & Home Fragrance"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Site Description"
                    value={formData.site_description}
                    onChange={(e) => handleInputChange('site_description', e.target.value)}
                    error={!!errors.site_description}
                    helperText={errors.site_description || `${formData.site_description.length}/160 characters`}
                    placeholder="Discover our premium collection of hand-poured soy wax candles, wax melts, and diffusers. Made with natural ingredients for a luxurious home fragrance experience."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Keywords"
                    value={formData.site_keywords}
                    onChange={(e) => handleInputChange('site_keywords', e.target.value)}
                    helperText="Comma-separated keywords for search engines"
                    placeholder="candles, wax melts, home fragrance, soy wax, essential oils"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Canonical URL"
                    value={formData.canonical_url}
                    onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                    error={!!errors.canonical_url}
                    helperText={errors.canonical_url || 'Main domain URL for SEO canonical tags'}
                    placeholder="https://wickwaxrelax.com"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Social Media Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Open Graph & Social Media" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Open Graph Title"
                    value={formData.og_title}
                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                    error={!!errors.og_title}
                    helperText={errors.og_title || `${formData.og_title.length}/60 characters`}
                    placeholder="Wick Wax Relax - Premium Home Fragrance"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Open Graph Description"
                    value={formData.og_description}
                    onChange={(e) => handleInputChange('og_description', e.target.value)}
                    error={!!errors.og_description}
                    helperText={errors.og_description || `${formData.og_description.length}/160 characters`}
                    placeholder="Experience the finest hand-poured soy wax candles and home fragrance products."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Open Graph Image URL"
                    value={formData.og_image}
                    onChange={(e) => handleInputChange('og_image', e.target.value)}
                    helperText="URL to image for social media sharing (1200x630 recommended)"
                    placeholder="https://wickwaxrelax.com/images/og-image.jpg"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Twitter Card Type"
                    value={formData.twitter_card}
                    onChange={(e) => handleInputChange('twitter_card', e.target.value)}
                  >
                    <MenuItem value="summary">Summary</MenuItem>
                    <MenuItem value="summary_large_image">Summary Large Image</MenuItem>
                    <MenuItem value="app">App</MenuItem>
                    <MenuItem value="player">Player</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Technical SEO */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Technical SEO" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sitemap_enabled}
                        onChange={(e) => handleInputChange('sitemap_enabled', e.target.checked)}
                      />
                    }
                    label="Enable XML Sitemap Generation"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Robots.txt Content"
                    value={formData.robots_txt}
                    onChange={(e) => handleInputChange('robots_txt', e.target.value)}
                    helperText="Instructions for search engine crawlers"
                    placeholder="User-agent: *
Allow: /"
                  />
                  <Button
                    size="small"
                    onClick={generateRobotsTxt}
                    sx={{ mt: 1 }}
                  >
                    Generate Default Robots.txt
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics & Tracking */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Analytics & Tracking" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Google Analytics ID"
                    value={formData.google_analytics_id}
                    onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                    helperText="GA4 Measurement ID (G-XXXXXXXXXX)"
                    placeholder="G-XXXXXXXXXX"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facebook Pixel ID"
                    value={formData.facebook_pixel_id}
                    onChange={(e) => handleInputChange('facebook_pixel_id', e.target.value)}
                    helperText="Facebook Pixel ID for conversion tracking"
                    placeholder="123456789012345"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>SEO Best Practices:</strong>
              <br />• Site title: Keep under 60 characters
              <br />• Description: Keep under 160 characters
              <br />• Keywords: Use relevant terms separated by commas
              <br />• Open Graph: Optimize for social media sharing
              <br />• Robots.txt: Controls search engine crawling
              <br />• Sitemap: Helps search engines index your site
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
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeoSettings;