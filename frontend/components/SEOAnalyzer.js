import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const SEOAnalyzer = ({ initialUrl = '', initialContent = {} }) => {
  const theme = useTheme();
  const [url, setUrl] = useState(initialUrl);
  const [content, setContent] = useState(initialContent);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Analyze SEO when component mounts with initial data
  useEffect(() => {
    if (initialUrl && Object.keys(initialContent).length > 0) {
      analyzeSEO();
    }
  }, [initialUrl, initialContent]);

  const analyzeSEO = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/seo/analyze', {
        url: url.trim(),
        content: content
      });

      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error('SEO analysis error:', err);
      setError('Failed to analyze SEO. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (field, value) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircleIcon color="success" />;
    if (score >= 60) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        SEO Analyzer
      </Typography>

      {/* Input Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL to Analyze"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/page"
                helperText="Enter the full URL of the page you want to analyze"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Button
                  variant="contained"
                  onClick={analyzeSEO}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setUrl('');
                    setContent({});
                    setAnalysis(null);
                    setError(null);
                  }}
                  startIcon={<RefreshIcon />}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Content Input Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Page Content (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Provide page content for more detailed analysis
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Page Title"
                  value={content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  helperText="Current page title"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meta Description"
                  value={content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  helperText="Current meta description"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Keywords"
                  value={content.keywords || ''}
                  onChange={(e) => handleContentChange('keywords', e.target.value)}
                  helperText="Comma-separated keywords"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Open Graph Image URL"
                  value={content.image || ''}
                  onChange={(e) => handleContentChange('image', e.target.value)}
                  helperText="URL of the Open Graph image"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Page Content"
                  value={content.content || ''}
                  onChange={(e) => handleContentChange('content', e.target.value)}
                  helperText="Main content of the page for analysis"
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

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
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Analyzing SEO performance...
          </Typography>
        </Box>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Box>
          {/* Overall Score */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  SEO Score
                </Typography>
                {getScoreIcon(analysis.score)}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" color={`${getScoreColor(analysis.score)}.main`}>
                  {analysis.score}/100
                </Typography>
                <Chip
                  label={analysis.score >= 80 ? 'Good' : analysis.score >= 60 ? 'Needs Improvement' : 'Poor'}
                  color={getScoreColor(analysis.score)}
                  variant="outlined"
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={analysis.score}
                color={getScoreColor(analysis.score)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>

          {/* Issues and Recommendations */}
          <Grid container spacing={3}>
            {/* Issues */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                    Issues Found ({analysis.issues?.length || 0})
                  </Typography>

                  {analysis.issues?.length > 0 ? (
                    <List>
                      {analysis.issues.map((issue, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={issue}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No issues found! Your page looks good.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                    Recommendations ({analysis.recommendations?.length || 0})
                  </Typography>

                  {analysis.recommendations?.length > 0 ? (
                    <List>
                      {analysis.recommendations.map((recommendation, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={recommendation}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Great job! No recommendations needed.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Analysis */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Analysis
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Meta Tags Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Title:</strong> {analysis.metaTags?.title || 'Not found'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Description:</strong> {analysis.metaTags?.description || 'Not found'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Keywords:</strong> {analysis.metaTags?.keywords || 'Not found'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Image:</strong> {analysis.metaTags?.image || 'Not found'}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Content Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Word Count:</strong> {analysis.content?.wordCount || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Headings:</strong> {analysis.content?.headings?.length || 0} found
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Images:</strong> {analysis.content?.images?.length || 0} found
                    </Typography>
                    <Typography variant="body2">
                      <strong>Links:</strong> {analysis.content?.links?.length || 0} found
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Technical SEO</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Page Speed:</strong> {analysis.technical?.pageSpeed || 'Not analyzed'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Mobile Friendly:</strong> {analysis.technical?.mobileFriendly ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>SSL Certificate:</strong> {analysis.technical?.ssl ? 'Valid' : 'Invalid'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Structured Data:</strong> {analysis.technical?.structuredData ? 'Present' : 'Missing'}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default SEOAnalyzer;