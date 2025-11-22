import { createContext, useContext, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, severity = 'info', title, duration) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity,
      title,
      duration,
      open: true
    };

    setToasts(prev => [...prev, toast]);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, title) => addToast(message, 'success', title);
  const showError = (message, title) => addToast(message, 'error', title);
  const showWarning = (message, title) => addToast(message, 'warning', title);
  const showInfo = (message, title) => addToast(message, 'info', title);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          open={toast.open}
          onClose={() => removeToast(toast.id)}
          message={toast.message}
          severity={toast.severity}
          title={toast.title}
          autoHideDuration={toast.duration}
        />
      ))}
    </ToastContext.Provider>
  );
};