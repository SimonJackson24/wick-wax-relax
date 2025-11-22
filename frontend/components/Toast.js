import { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

const Toast = ({ open, onClose, message, severity = 'info', title, autoHideDuration = 6000 }) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    onClose && onClose();
  };

  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
      default:
        return <Info />;
    }
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
        icon={getIcon()}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;