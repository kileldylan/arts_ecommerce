import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, CircularProgress, Container, Alert } from '@mui/material';

export default function OAuthSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a moment for Supabase to process the OAuth callback
      setTimeout(() => {
        if (user) {
          // Redirect based on user type
          const userType = user.user_metadata?.user_type || 'customer';
          if (userType === 'artist') {
            navigate('/artist/profile');
          } else {
            navigate('/customer/dashboard');
          }
        } else {
          // If no user after reasonable time, redirect to login
          navigate('/login?error=oauth_failed');
        }
      }, 2000);
    };

    checkAuth();
  }, [user, navigate]);

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h5" gutterBottom>
          Completing Authentication...
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Please wait while we set up your account.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          You will be redirected automatically.
        </Alert>
      </Box>
    </Container>
  );
}