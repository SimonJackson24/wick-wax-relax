import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Here you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2'
            }}
          >
            <ErrorOutline sx={{ fontSize: 64, color: '#e53e3e', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Error Details (Development):
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#f7fafc',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" component="pre">
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ mt: 2 }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleRetry}
                sx={{ minWidth: 120 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ minWidth: 120 }}
              >
                Refresh Page
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;