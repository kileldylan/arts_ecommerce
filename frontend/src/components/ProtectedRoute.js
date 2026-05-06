// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, LinearProgress } from '@mui/material';
import CustomSpinner from './CustomSpinner';

/**
 * ProtectedRoute Component
 * Ensures only authenticated users can access certain routes
 * Redirects to login if not authenticated
 * Shows loading spinner while checking authentication
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['customer', 'artist', 'admin'], // Roles allowed to access this route
  redirectTo = '/login' // Where to redirect if not authenticated
}) {
  const { isAuthenticated, userType, loading, sessionReady } = useAuth();

  // Show custom branded spinner while checking authentication
  if (loading || !sessionReady) {
    return <CustomSpinner text="Verifying your account..." />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(userType)) {
    // Redirect to appropriate dashboard based on user type
    const dashboardPath = userType === 'admin' 
      ? '/admin' 
      : userType === 'artist' 
        ? '/artist/dashboard' 
        : '/customer/dashboard';
    
    return <Navigate to={dashboardPath} replace />;
  }

  // Authenticated and has proper role - render children
  return children;
}