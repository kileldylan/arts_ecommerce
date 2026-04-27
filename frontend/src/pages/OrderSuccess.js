import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  CheckCircle,
  ShoppingBag
} from '@mui/icons-material';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12'
};

export default function OrderSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/orders'); // auto-redirect after 3 seconds
    }, 3000);

    return () => clearTimeout(timer); // cleanup if component unmounts
  }, [navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card sx={{ 
        textAlign: 'center', 
        p: 6,
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <CheckCircle sx={{ 
            fontSize: 80, 
            color: '#4CAF50',
            mb: 3
          }} />
          
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: themeColors.primary }}>
            Order Confirmed!
          </Typography>
          
          <Typography variant="h6" sx={{ color: '#7F8C8D', mb: 4 }}>
            Thank you for your purchase. Your order has been received and is being processed.
            <br />
            <strong>You’ll be redirected shortly...</strong>
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/orders')}
              startIcon={<ShoppingBag />}
              sx={{
                backgroundColor: themeColors.primary,
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: themeColors.primary,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              View Orders
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                borderColor: themeColors.primary,
                color: themeColors.primary,
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  borderColor: themeColors.primary,
                  backgroundColor: 'rgba(44, 62, 80, 0.04)'
                }
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
