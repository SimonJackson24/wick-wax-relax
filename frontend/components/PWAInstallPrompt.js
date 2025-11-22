import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  OfflineBolt as OfflineIcon,
  Notifications as NotificationIcon,
  Smartphone as MobileIcon,
} from '@mui/icons-material';
import { usePWA } from './PWAContext';

const PWAInstallPrompt = ({ open: controlledOpen, onClose, autoShow = true }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isInstallable, installPWA, deferredPrompt, isRunningAsPWA } = usePWA();

  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has already dismissed the prompt
  useEffect(() => {
    const dismissedPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
    if (dismissedPrompt) {
      const dismissedTime = parseInt(dismissedPrompt);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      }
    }
  }, []);

  // Auto-show logic
  useEffect(() => {
    if (autoShow && isInstallable && !dismissed && !isRunningAsPWA) {
      // Delay showing the prompt to avoid being too intrusive
      const timer = setTimeout(() => {
        setOpen(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [autoShow, isInstallable, dismissed, isRunningAsPWA]);

  // Controlled open state
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
    handleClose();
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        // Track successful installation
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_install', {
            event_category: 'engagement',
            event_label: 'pwa_install_prompt'
          });
        }
        handleClose();
      }
    } catch (error) {
      console.error('PWA install failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  // Don't show if not installable or already running as PWA
  if (!isInstallable || isRunningAsPWA || dismissed) {
    return null;
  }

  const features = [
    {
      icon: <SpeedIcon sx={{ color: 'success.main' }} />,
      title: 'Lightning Fast',
      description: 'Instant loading and smooth performance'
    },
    {
      icon: <OfflineIcon sx={{ color: 'info.main' }} />,
      title: 'Works Offline',
      description: 'Browse products even without internet'
    },
    {
      icon: <NotificationIcon sx={{ color: 'warning.main' }} />,
      title: 'Push Notifications',
      description: 'Get updates on orders and promotions'
    },
    {
      icon: <MobileIcon sx={{ color: 'primary.main' }} />,
      title: 'Mobile Optimized',
      description: 'Perfect experience on your phone'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 2,
          margin: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            Install Wick Wax Relax
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Get the full Wick Wax Relax experience with our mobile app!
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} sx={{ color: 'warning.main', fontSize: 20 }} />
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary">
            ⭐⭐⭐⭐⭐ Rated 4.9/5 by our customers
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Why install our app?
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, mb: 3 }}>
          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.default',
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              {feature.icon}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            label="No App Store Required"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label="Free Installation"
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip
            label="Works Offline"
            size="small"
            color="info"
            variant="outlined"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleInstall}
          disabled={installing}
          startIcon={installing ? null : <InstallIcon />}
          sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 2,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            }
          }}
        >
          {installing ? 'Installing...' : 'Install App Now'}
        </Button>

        <Button
          variant="text"
          onClick={handleDismiss}
          sx={{ color: 'text.secondary' }}
        >
          Maybe Later
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;