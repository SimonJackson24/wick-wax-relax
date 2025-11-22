import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  GetApp as InstallIcon,
  Refresh as UpdateIcon,
  Clear as ClearIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';
import { usePWA } from './PWAContext';

const PWAStatusBar = ({ position = 'top', showDetails = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    isOnline,
    isInstallable,
    serviceWorkerStatus,
    cacheStatus,
    updateAvailable,
    capabilities,
    networkInfo,
    installPWA,
    updateServiceWorker,
    clearCache,
    isRunningAsPWA
  } = usePWA();

  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Don't show if running as PWA and not in debug mode
  if (isRunningAsPWA && !showDetails && !updateAvailable && !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installPWA();
    setSnackbar({
      open: true,
      message: success ? 'App installed successfully!' : 'Installation cancelled',
      severity: success ? 'success' : 'info'
    });
  };

  const handleUpdate = () => {
    updateServiceWorker();
    setSnackbar({
      open: true,
      message: 'App update initiated',
      severity: 'info'
    });
  };

  const handleClearCache = async () => {
    await clearCache();
    setSnackbar({
      open: true,
      message: 'Cache cleared successfully',
      severity: 'success'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'installing': return 'warning';
      case 'waiting': return 'info';
      case 'error': return 'error';
      case 'unsupported': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <SuccessIcon />;
      case 'installing': return <WarningIcon />;
      case 'waiting': return <InfoIcon />;
      case 'error': return <ErrorIcon />;
      case 'unsupported': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getCacheStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'default';
      case 'clearing': return 'warning';
      case 'cleared': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          top: position === 'top' ? 0 : 'auto',
          bottom: position === 'bottom' ? 0 : 'auto',
          left: 0,
          right: 0,
          zIndex: 1300,
          p: 1,
          backgroundColor: theme.palette.background.paper,
          borderBottom: position === 'top' ? `1px solid ${theme.palette.divider}` : 'none',
          borderTop: position === 'bottom' ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}>
          {/* Status Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Network Status */}
            <Chip
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />

            {/* Service Worker Status */}
            <Chip
              icon={getStatusIcon(serviceWorkerStatus)}
              label={`SW: ${serviceWorkerStatus}`}
              color={getStatusColor(serviceWorkerStatus)}
              size="small"
              variant="outlined"
            />

            {/* Cache Status */}
            {cacheStatus !== 'idle' && (
              <Chip
                icon={<StorageIcon />}
                label={`Cache: ${cacheStatus}`}
                color={getCacheStatusColor(cacheStatus)}
                size="small"
                variant="outlined"
              />
            )}

            {/* Network Info */}
            {networkInfo && (
              <Chip
                icon={<NetworkIcon />}
                label={`${networkInfo.effectiveType} ${networkInfo.downlink}Mbps`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Install Button */}
            {isInstallable && (
              <Button
                variant="contained"
                size="small"
                startIcon={<InstallIcon />}
                onClick={handleInstall}
                sx={{ minWidth: 'auto' }}
              >
                {!isMobile && 'Install'}
              </Button>
            )}

            {/* Update Button */}
            {updateAvailable && (
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<UpdateIcon />}
                onClick={handleUpdate}
                sx={{ minWidth: 'auto' }}
              >
                {!isMobile && 'Update'}
              </Button>
            )}

            {/* Clear Cache Button */}
            <IconButton
              size="small"
              onClick={handleClearCache}
              disabled={cacheStatus === 'clearing'}
              title="Clear Cache"
            >
              <ClearIcon />
            </IconButton>

            {/* Details Button */}
            <IconButton
              size="small"
              onClick={() => setShowDetailsDialog(true)}
              title="PWA Details"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          PWA Status Details
          <IconButton
            onClick={() => setShowDetailsDialog(false)}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <List>
            {/* Network Status */}
            <ListItem>
              <ListItemIcon>
                {isOnline ? <OnlineIcon color="success" /> : <OfflineIcon color="error" />}
              </ListItemIcon>
              <ListItemText
                primary="Network Status"
                secondary={isOnline ? 'Connected' : 'Offline'}
              />
            </ListItem>

            <Divider />

            {/* Service Worker */}
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(serviceWorkerStatus)}
              </ListItemIcon>
              <ListItemText
                primary="Service Worker"
                secondary={`Status: ${serviceWorkerStatus}`}
              />
            </ListItem>

            {/* Cache Status */}
            <ListItem>
              <ListItemIcon>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText
                primary="Cache Status"
                secondary={`Status: ${cacheStatus}`}
              />
            </ListItem>

            <Divider />

            {/* PWA Capabilities */}
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="PWA Capabilities"
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(capabilities).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value ? 'Yes' : 'No'}`}
                        size="small"
                        color={value ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                }
              />
            </ListItem>

            {/* Network Information */}
            {networkInfo && (
              <>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <NetworkIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Network Information"
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Type: {networkInfo.effectiveType}
                        </Typography>
                        <Typography variant="body2">
                          Speed: {networkInfo.downlink} Mbps
                        </Typography>
                        <Typography variant="body2">
                          Latency: {networkInfo.rtt} ms
                        </Typography>
                        {networkInfo.saveData && (
                          <Typography variant="body2" color="warning.main">
                            Data Saver: Enabled
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </>
            )}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default PWAStatusBar;