import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy loading wrapper with error boundary and loading states
const LazyComponent = ({
  component,
  fallback = null,
  errorFallback = null,
  ...props
}) => {
  const LazyLoadedComponent = lazy(component);

  const LoadingFallback = () => (
    fallback || (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          width: '100%'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    )
  );

  const ErrorFallback = () => (
    errorFallback || (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          width: '100%',
          color: 'error.main'
        }}
      >
        Failed to load component
      </Box>
    )
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <LazyLoadedComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    // You can log to monitoring service here
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Preload function for critical components
export const preloadComponent = (component) => {
  const LazyComponent = lazy(component);
  // Trigger preload
  LazyComponent.preload && LazyComponent.preload();
};

// Dynamic import helpers
export const lazyLoad = (importFunc) => {
  return lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load component:', error);
      // Return a fallback component
      return {
        default: () => (
          <Box sx={{ p: 2, color: 'error.main' }}>
            Component failed to load. Please refresh the page.
          </Box>
        )
      };
    })
  );
};

// Route-based lazy loading
export const lazyRoute = (importFunc) => {
  return lazy(() =>
    importFunc().catch(error => {
      console.error('Failed to load route:', error);
      return {
        default: () => (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <h2>Page Not Found</h2>
            <p>The requested page could not be loaded.</p>
          </Box>
        )
      };
    })
  );
};

export default LazyComponent;