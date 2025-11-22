import React from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';
import { Box, Typography, CircularProgress } from '@mui/material';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Debug logging
  console.log('AdminProtectedRoute Debug:', {
    user,
    loading,
    isAuthenticated,
    isAdmin: user && (user.is_admin === 1 || user.isAdmin === true)
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push({
        pathname: '/auth/login',
        query: { redirect: router.asPath }
      });
    }
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography variant="h6">Redirecting to login...</Typography>
      </Box>
    );
  }

  // Check if user is admin
  const isAdmin = user && (user.is_admin === 1 || user.isAdmin === true);
  console.log('AdminProtectedRoute Debug: isAdmin check result:', isAdmin);

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" align="center">
          You don't have permission to access this page.
          Please contact an administrator if you believe this is an error.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Debug info: User object = {JSON.stringify(user, null, 2)}
        </Typography>
      </Box>
    );
  }

  // Render children if authenticated and is admin
  return <>{children}</>;
};

export default AdminProtectedRoute;