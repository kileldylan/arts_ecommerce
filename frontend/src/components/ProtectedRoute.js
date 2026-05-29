// src/components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ProtectedRoute({ children, requiredUserType = null }) {
  const { isAuthenticated, userType, loading, authInitialized } = useAuth();
  const location = useLocation();

  // Show loading spinner only during initial auth check
  if (!authInitialized || (loading && isAuthenticated)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
        <Typography variant="body2" color="text.secondary">Verifying access...</Typography>
      </Box>
    );
  }

  // ✅ Not authenticated - SAVE the attempted location and redirect to login
  if (!isAuthenticated) {
    // This is the CRITICAL line that saves where the user wanted to go
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check user type if required
  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to appropriate dashboard based on user type
    const redirectPath = userType === 'artist' ? '/artist/dashboard' : '/customer/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}