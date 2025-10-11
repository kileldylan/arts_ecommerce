// src/pages/Dashboard.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ArtistDashboard from '../pages/ArtistDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import { Box } from '@mui/material';
import CustomerDashboard from './customer/CustomerDashboard';

export default function Dashboard() {
  const { profile } = useAuth(); // ✅ get profile directly
  const userType = profile?.user_type || 'customer'; // fallback

  const renderDashboard = () => {
    switch (userType) {
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