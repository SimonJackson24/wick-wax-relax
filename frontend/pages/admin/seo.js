import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons/material';
import SEOAnalyzer from '../../components/SEOAnalyzer';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const AdminSEO = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // SEO Report data
  const [seoReport, setSeoReport] = useState(null);
  const [seoSettings, setSeoSettings] = useState(null);
  const [seoPerformance, setSeoPerformance] = useState(null);

  // Pagination for SEO report
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tabProps = [
    {
      label: 'Dashboard',
      icon: <AssessmentIcon />,
      component: <SEODashboard report={seoReport} performance={seoPerformance} loading={loading} />
    },
    {
      label: 'Analyzer',
      icon: <SearchIcon />,
      component: <SEOAnalyzer />
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      component: <SEOSettings settings={seoSettings} onUpdate={loadSEOSettings} />
    },
    {
      label: 'Reports',
      icon: <AnalyticsIcon />,
      component: <SEOReports report={seoReport} loading={loading} />
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Load SEO data
  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      const [reportResponse, settingsResponse, performanceResponse] = await Promise.all([
        axios.get('/api/seo/report'),
        axios.get('/api/seo/settings'),
        axios.get('/api/seo/performance')
      ]);

      setSeoReport(reportResponse.data.report);
      setSeoSettings(settingsResponse.data.settings);
      setSeoPerformance(performanceResponse.data.performance);
    } catch (err) {
      console.error('Error loading SEO data:', err);
      setError('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  };

  const loadSEOSettings = async () => {
    try {
      const response = await axios.get('/api/seo/settings');
      setSeoSettings(response.data.settings);
    } catch (err) {
      console.error('Error loading SEO settings:', err);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              SEO Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Optimize your site's search engine performance with comprehensive SEO tools and analytics.
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Tabs */}
          <Paper sx={{ width: '100%', mb: 3 }}>
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
          </Paper>

          {/* Tab Content */}
          <Box>
            {tabProps[activeTab].component}
          </Box>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

// SEO Dashboard Component
const SEODashboard = ({ report, performance, loading }) => {
  if (loading || !report) {
    return <Typography>Loading SEO dashboard...</Typography>;
  }

  const overallScore = report.overallScore || 0;
  const totalPages = report.pages?.length || 0;
  const issuesCount = report.pages?.reduce((sum, page) => sum + (page.issues?.length || 0), 0) || 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        SEO Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall SEO Score
              </Typography>
              <Typography variant="h4" color={overallScore >= 80 ? 'success.main' : overallScore >= 60 ? 'warning.main' : 'error.main'}>
                {overallScore}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                color={overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pages Analyzed
              </Typography>
              <Typography variant="h4">
                {totalPages}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Issues Found
              </Typography>
              <Typography variant="h4" color="error.main">
                {issuesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Organic Traffic
              </Typography>
              <Typography variant="h4" color="success.main">
                {performance?.organicTraffic?.current?.toLocaleString() || '0'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {performance?.organicTraffic?.change >= 0 ? (
                  <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography variant="body2" color={performance?.organicTraffic?.change >= 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(performance?.organicTraffic?.change || 0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      {performance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Search Rankings
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Improved</Typography>
                  <Chip label={`+${performance.keywordRankings?.improved || 0}`} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Declined</Typography>
                  <Chip label={`-${performance.keywordRankings?.declined || 0}`} color="error" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Stable</Typography>
                  <Chip label={performance.keywordRankings?.stable || 0} color="default" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Technical SEO
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Page Speed Score</Typography>
                  <Chip
                    label={`${performance.pageSpeed?.score || 0}/100`}
                    color={performance.pageSpeed?.score >= 90 ? 'success' : performance.pageSpeed?.score >= 50 ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Mobile Friendly</Typography>
                  <Chip
                    label={performance.mobileFriendly?.score >= 90 ? 'Good' : 'Needs Work'}
                    color={performance.mobileFriendly?.score >= 90 ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Core Web Vitals</Typography>
                  <Chip
                    label={performance.coreWebVitals?.lcp === 'good' ? 'Good' : 'Needs Work'}
                    color={performance.coreWebVitals?.lcp === 'good' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Top Recommendations */}
      {report.recommendations?.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top SEO Recommendations
            </Typography>
            {report.recommendations.slice(0, 5).map((recommendation, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {index + 1}. {recommendation}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// SEO Settings Component
const SEOSettings = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings || {});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put('/api/seo/settings', formData);
      onUpdate();
    } catch (err) {
      console.error('Error saving SEO settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        SEO Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Site Information
              </Typography>

              <TextField
                fullWidth
                label="Site Name"
                value={formData.siteName || ''}
                onChange={(e) => handleChange('siteName', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Site Description"
                value={formData.siteDescription || ''}
                onChange={(e) => handleChange('siteDescription', e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Base URL"
                value={formData.baseUrl || ''}
                onChange={(e) => handleChange('baseUrl', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Default Image URL"
                value={formData.defaultImage || ''}
                onChange={(e) => handleChange('defaultImage', e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analytics & Tracking
              </Typography>

              <TextField
                fullWidth
                label="Google Analytics ID"
                value={formData.googleAnalyticsId || ''}
                onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Google Search Console URL"
                value={formData.googleSearchConsole || ''}
                onChange={(e) => handleChange('googleSearchConsole', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Google Site Verification"
                value={formData.googleSiteVerification || ''}
                onChange={(e) => handleChange('googleSiteVerification', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Bing Site Verification"
                value={formData.bingSiteVerification || ''}
                onChange={(e) => handleChange('bingSiteVerification', e.target.value)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setFormData(settings || {})}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// SEO Reports Component
const SEOReports = ({ report, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (loading || !report) {
    return <Typography>Loading SEO reports...</Typography>;
  }

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPages = report.pages?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) || [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        SEO Reports
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => {
            // Export functionality would be implemented here
            console.log('Export SEO report');
          }}
        >
          Export Report
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            // Refresh functionality would be implemented here
            console.log('Refresh SEO report');
          }}
        >
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Page</TableCell>
              <TableCell>SEO Score</TableCell>
              <TableCell>Issues</TableCell>
              <TableCell>Recommendations</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPages.map((page, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {page.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {page.url}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${page.seoScore}/100`}
                    color={page.seoScore >= 80 ? 'success' : page.seoScore >= 60 ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {page.issues?.length || 0} issues
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {page.recommendations?.length || 0} recommendations
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={report.pages?.length || 0}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>
    </Box>
  );
};

export default AdminSEO;