// src/components/dashboard/CustomerDashboard.js
import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar
} from '@mui/material';
import { ExitToApp, ShoppingCart, Favorite, History } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    <Navbar/>
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Ujamaa Collective
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover unique art and jewelry from talented African artists
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Items in Cart
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Favorite sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Favorites
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <History sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}>
                  ⭐
                </Box>
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Featured Products Preview */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Featured Artworks
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Coming soon - our curated collection of beautiful pieces
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ 
                    height: 200, 
                    bgcolor: 'grey.100', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2,
                    borderRadius: 1
                  }}>
                    <Typography color="text.secondary">Product Image</Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Beautiful Art Piece
                  </Typography>
                  <Typography color="primary.main" variant="h6" gutterBottom>
                    $99.99
                  </Typography>
                  <Button variant="outlined" disabled>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ 
                    height: 200, 
                    bgcolor: 'grey.100', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2,
                    borderRadius: 1
                  }}>
                    <Typography color="text.secondary">Product Image</Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Handmade Jewelry
                  </Typography>
                  <Typography color="primary.main" variant="h6" gutterBottom>
                    $149.99
                  </Typography>
                  <Button variant="outlined" disabled>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box sx={{ 
                    height: 200, 
                    bgcolor: 'grey.100', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2,
                    borderRadius: 1
                  }}>
                    <Typography color="text.secondary">Product Image</Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Traditional Craft
                  </Typography>
                  <Typography color="primary.main" variant="h6" gutterBottom>
                    $79.99
                  </Typography>
                  <Button variant="outlined" disabled>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/products')}
                disabled
              >
                Browse Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/profile')}
                disabled
              >
                Edit Profile
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/orders')}
                disabled
              >
                View Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/wishlist')}
                disabled
              >
                Wishlist
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
    </>
  );
}