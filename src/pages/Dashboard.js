// src/pages/Dashboard.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomerDashboard from '../pages/CustomerDashboard';
import ArtistDashboard from '../pages/ArtistDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import { Box, CircularProgress, Container } from '@mui/material';

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.user_type) {
      case 'artist':
        return <ArtistDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'customer':
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <Box>
      {renderDashboard()}
    </Box>
  );
}