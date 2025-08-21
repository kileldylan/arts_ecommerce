// src/components/dashboard/AdminDashboard.js
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
import { ExitToApp, People, ShoppingCart, Assessment, Security } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContexts';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
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
            Ujamaa Collective - Admin Panel
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'error.main', mr: 1 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Admin: {user?.name}
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
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage the Ujamaa Collective platform
          </Typography>
        </Box>

        {/* Admin Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Total Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Assessment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  $0
                </Typography>
                <Typography color="text.secondary">
                  Total Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Security sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h5" component="div">
                  0
                </Typography>
                <Typography color="text.secondary">
                  Pending Issues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Admin Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Admin Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/admin/users')}
                disabled
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/admin/products')}
                disabled
              >
                Manage Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/admin/orders')}
                disabled
              >
                View All Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ py: 2 }}
                onClick={() => navigate('/admin/analytics')}
                disabled
              >
                Analytics
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* System Status */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            System Status
          </Typography>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6">Platform Status: <Box component="span" color="success.main">Online</Box></Typography>
                  <Typography variant="body2" color="text.secondary">All systems operational</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6">Database: <Box component="span" color="success.main">Connected</Box></Typography>
                  <Typography variant="body2" color="text.secondary">MySQL connection active</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}