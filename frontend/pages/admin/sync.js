import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ShoppingCart as AmazonIcon,
  Store as EtsyIcon,
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const SyncManagement = () => {
  const [amazonStatus, setAmazonStatus] = useState({
    connected: false,
    lastSync: null,
    status: 'unknown',
    error: null,
  });

  const [etsyStatus, setEtsyStatus] = useState({
    connected: false,
    lastSync: null,
    status: 'unknown',
    error: null,
  });

  const [syncHistory, setSyncHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncDialog, setSyncDialog] = useState({
    open: false,
    platform: null,
    type: null,
  });

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncHistory();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const [amazonResponse, etsyResponse] = await Promise.all([
        axios.get('/api/amazon/health'),
        axios.get('/api/etsy/health'),
      ]);

      setAmazonStatus({
        connected: amazonResponse.data.success,
        lastSync: new Date(), // In production, get from database
        status: amazonResponse.data.status,
        error: amazonResponse.data.error,
      });

      setEtsyStatus({
        connected: etsyResponse.data.success,
        lastSync: new Date(), // In production, get from database
        status: etsyResponse.data.status,
        error: etsyResponse.data.error,
      });
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const fetchSyncHistory = async () => {
    try {
      // In production, fetch from database
      setSyncHistory([
        {
          id: 1,
          platform: 'amazon',
          type: 'inventory',
          status: 'success',
          timestamp: new Date(Date.now() - 3600000),
          message: 'Inventory sync completed successfully',
        },
        {
          id: 2,
          platform: 'etsy',
          type: 'orders',
          status: 'success',
          timestamp: new Date(Date.now() - 7200000),
          message: 'Order sync completed successfully',
        },
      ]);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  };

  const handleSync = async (platform, type) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (platform) {
        case 'amazon':
          switch (type) {
            case 'inventory':
              endpoint = '/api/amazon/sync-inventory';
              break;
            case 'catalog':
              endpoint = '/api/amazon/sync-catalog';
              break;
            case 'orders':
              endpoint = '/api/amazon/orders';
              break;
          }
          break;
        case 'etsy':
          switch (type) {
            case 'inventory':
              endpoint = '/api/etsy/sync-inventory';
              break;
            case 'listings':
              endpoint = '/api/etsy/listings';
              break;
            case 'orders':
              endpoint = '/api/etsy/orders';
              break;
          }
          break;
      }

      const response = await axios.post(endpoint);
      await fetchSyncHistory(); // Refresh history

      // Update status
      if (platform === 'amazon') {
        setAmazonStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          status: 'success',
        }));
      } else {
        setEtsyStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          status: 'success',
        }));
      }
    } catch (error) {
      console.error('Sync error:', error);

      // Update status with error
      if (platform === 'amazon') {
        setAmazonStatus(prev => ({
          ...prev,
          status: 'error',
          error: error.message,
        }));
      } else {
        setEtsyStatus(prev => ({
          ...prev,
          status: 'error',
          error: error.message,
        }));
      }
    } finally {
      setLoading(false);
      setSyncDialog({ open: false, platform: null, type: null });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'pending':
        return <PendingIcon color="action" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const PlatformCard = ({ platform, status, icon, title }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
          <Chip
            label={status.connected ? 'Connected' : 'Disconnected'}
            color={status.connected ? 'success' : 'error'}
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Last Sync: {status.lastSync ? status.lastSync.toLocaleString() : 'Never'}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Status: <Chip label={status.status} color={getStatusColor(status.status)} size="small" />
        </Typography>

        {status.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {status.error}
          </Alert>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<SyncIcon />}
          onClick={() => setSyncDialog({ open: true, platform, type: 'inventory' })}
          disabled={!status.connected || loading}
        >
          Sync Inventory
        </Button>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => setSyncDialog({ open: true, platform, type: 'orders' })}
          disabled={!status.connected || loading}
        >
          Sync Orders
        </Button>
        <Button
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => setSyncDialog({ open: true, platform, type: 'catalog' })}
          disabled={!status.connected || loading}
        >
          Sync Catalog
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Sync Management
          </Typography>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            {/* Amazon Integration */}
            <Grid item xs={12} md={6}>
              <PlatformCard
                platform="amazon"
                status={amazonStatus}
                icon={<AmazonIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                title="Amazon Integration"
              />
            </Grid>

            {/* Etsy Integration */}
            <Grid item xs={12} md={6}>
              <PlatformCard
                platform="etsy"
                status={etsyStatus}
                icon={<EtsyIcon sx={{ fontSize: 40, color: 'secondary.main' }} />}
                title="Etsy Integration"
              />
            </Grid>

            {/* Sync History */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Sync History
                </Typography>
                <List>
                  {syncHistory.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem>
                        <ListItemIcon>
                          {getStatusIcon(item.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${item.platform.toUpperCase()} - ${item.type} sync`}
                          secondary={`${item.timestamp.toLocaleString()} - ${item.message}`}
                        />
                      </ListItem>
                      {index < syncHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Bulk Operations */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Bulk Operations
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={() => handleSync('amazon', 'inventory')}
                    disabled={!amazonStatus.connected || loading}
                  >
                    Sync All Amazon
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={() => handleSync('etsy', 'inventory')}
                    disabled={!etsyStatus.connected || loading}
                  >
                    Sync All Etsy
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchSyncStatus}
                  >
                    Refresh Status
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Sync Confirmation Dialog */}
          <Dialog open={syncDialog.open} onClose={() => setSyncDialog({ open: false, platform: null, type: null })}>
            <DialogTitle>
              Confirm Sync Operation
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to sync {syncDialog.type} for {syncDialog.platform}?
                This operation may take several minutes.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSyncDialog({ open: false, platform: null, type: null })}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSync(syncDialog.platform, syncDialog.type)}
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Syncing...' : 'Start Sync'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default SyncManagement;