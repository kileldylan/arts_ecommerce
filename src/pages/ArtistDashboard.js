// src/components/dashboard/ArtistDashboard.js
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
import { ExitToApp, Add, TrendingUp, Inventory } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContexts';
import { useNavigate } from 'react-router-dom';

export default function ArtistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Ujamaa Collective - Artist Studio
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.name}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToApp />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Your Artist Studio
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your creations and connect with art lovers
          </Typography>
        </Box>

        {/* Artist Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Inventory sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Products Listed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Total Sales
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
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ fontSize: 40, color: 'info.main', mb: 1 }}>
                  👁️
                </Box>
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Profile Views
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions for Artists */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Manage Your Artwork
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/artist/products/new')}
                disabled
              >
                Add New Product
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/artist/products')}
                disabled
              >
                View Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/artist/orders')}
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
                onClick={() => navigate('/artist/profile')}
                disabled
              >
                Artist Profile
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Recent Activity */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Recent Activity
          </Typography>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Typography color="text.secondary" textAlign="center">
                Your activity feed will appear here once you start creating and selling artwork.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}