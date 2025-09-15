// src/pages/OAuthSuccess.js
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUserProfile } = useAuth(); // ✅ expose this in AuthContext

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Store token temporarily
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);

      // Fetch the actual user profile from backend
      fetchUserProfile(token).then(() => {
        setTimeout(() => {
          navigate('/dashboard'); // ✅ use navigate instead of window.location.href
        }, 1500);
      });
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, fetchUserProfile]);

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
          Welcome to Brianchi Arts & Gifts. Redirecting you to your dashboard...
        </Typography>
      </Box>
    </Container>
  );
}
