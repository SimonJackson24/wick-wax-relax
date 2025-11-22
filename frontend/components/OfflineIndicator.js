import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  LinearProgress,
  Chip,
  Collapse,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { usePWA } from './PWAContext';

const OfflineIndicator = ({ showDetails = true, autoHide = false }) => {
  const theme = useTheme();
  const {
    isOnline,
    serviceWorkerStatus,
    cacheStatus,
    capabilities,
    clearCache
  } = usePWA();

  const [showExpanded, setShowExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Track when we went offline
  useEffect(() => {
    if (!isOnline) {
      setLastOnlineTime(new Date());
    }
  }, [isOnline]);

  // Auto-hide after coming back online
  useEffect(() => {
    if (isOnline && autoHide && lastOnlineTime) {
      const timer = setTimeout(() => {
        // Could hide the component here if needed
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, autoHide, lastOnlineTime]);

  const handleRetry = async () => {
    setRetrying(true);

    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Connection restored!',
          severity: 'success'
        });
        window.location.reload(); // Force page refresh to get fresh data
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Still offline. Please check your connection.',
        severity: 'warning'
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    setSnackbar({
      open: true,
      message: 'Cache cleared. Try refreshing the page.',
      severity: 'info'
    });
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Don't show if online and auto-hide is enabled
  if (isOnline && autoHide) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          top: 80, // Below the PWA status bar
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          minWidth: 300,
          maxWidth: 500,
          p: 2,
          backgroundColor: isOnline ? theme.palette.success.main : theme.palette.warning.main,
          color: 'white',
          borderRadius: 2,
          boxShadow: theme.shadows[8],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOnline ? (
              <OnlineIcon sx={{ fontSize: 20 }} />
            ) : (
              <OfflineIcon sx={{ fontSize: 20 }} />
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {isOnline ? 'Back Online' : 'You\'re Offline'}
            </Typography>
          </Box>

          {showDetails && (
            <IconButton
              size="small"
              onClick={() => setShowExpanded(!showExpanded)}
              sx={{ color: 'white' }}
            >
              {showExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
          {isOnline ? (
            <>
              Connection restored. All features are now available.
              {lastOnlineTime && ` (Went offline ${formatTimeAgo(lastOnlineTime)})`}
            </>
          ) : (
            'Some features may be limited. You can still browse cached content.'
          )}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {!isOnline && (
            <Button
              variant="contained"
              size="small"
              onClick={handleRetry}
              disabled={retrying}
              startIcon={retrying ? <LinearProgress size={16} /> : <RefreshIcon />}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                color: 'white'
              }}
            >
              {retrying ? 'Retrying...' : 'Retry Connection'}
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={handleClearCache}
            disabled={cacheStatus === 'clearing'}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Clear Cache
          </Button>
        </Box>

        {/* Expanded Details */}
        <Collapse in={showExpanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Offline Capabilities:
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label="Cached Pages"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
                icon={<InfoIcon />}
              />

              {capabilities.serviceWorker && (
                <Chip
                  label="Service Worker"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                />
              )}

              {capabilities.backgroundSync && (
                <Chip
                  label="Background Sync"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                />
              )}
            </Box>

            {!isOnline && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                  <WarningIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Limited functionality while offline:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0, opacity: 0.9 }}>
                  <li>Product browsing (cached content only)</li>
                  <li>Category navigation</li>
                  <li>Offline forms will sync when connection returns</li>
                  <li>Push notifications may not work</li>
                </Box>
              </Box>
            )}

            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Service Worker: {serviceWorkerStatus} |
              Cache: {cacheStatus}
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;