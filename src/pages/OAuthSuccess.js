// src/pages/OAuthSuccess.js
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');

    if (token && userData) {
      // Store the token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', userData);
      
      // Redirect to appropriate dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      // Redirect to login if no token
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Authentication Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to Ujamaa Collective. Redirecting you to your dashboard...
        </Typography>
      </Box>
    </Container>
  );
}