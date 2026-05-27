// src/components/ElegantNavbar.js - COMPLETE REWRITE (NO FLICKERING)
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  useScrollTrigger,
  Slide,
  Skeleton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  Close,
  ExitToApp,
  Dashboard,
  Store,
  AdminPanelSettings,
  ShoppingBag,
  Analytics,
  Group,
  Login as LoginIcon,
  AppRegistration as RegisterIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function ElegantNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isAuthenticated, 
    profile, 
    userType, 
    logout, 
    loading, 
    sessionReady 
  } = useAuth();

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth-success']
    .some(path => location.pathname.startsWith(path));

  // Don't show navbar on auth pages
  if (isAuthPage) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleMenuClose();
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // ✅ Direct navigation items based on userType - NO local state
  const getNavItems = () => {
    const commonItems = [
      { label: 'Home', path: '/dashboard', icon: <Dashboard /> },
    ];

    // Not authenticated or still loading - show only home
    if (!isAuthenticated || !sessionReady || loading) {
      return commonItems;
    }

    // Switch based on actual userType from AuthContext
    switch (userType) {
      case 'admin':
        return [
          ...commonItems,
          { label: 'Admin Panel', path: '/admin', icon: <AdminPanelSettings /> },
          { label: 'Users', path: '/admin/users', icon: <Group /> },
          { label: 'Analytics', path: '/admin/analytics', icon: <Analytics /> },
        ];
      case 'artist':
        return [
          ...commonItems,
          { label: 'My Products', path: '/artist/products', icon: <Store /> },
          { label: 'Orders', path: '/artist/orders', icon: <ShoppingBag /> },
          { label: 'Analytics', path: '/artist/analytics', icon: <Analytics /> },
        ];
      case 'customer':
      default:
        return [
          ...commonItems,
          { label: 'My Orders', path: '/customer/orders', icon: <ShoppingBag /> },
        ];
    }
  };

  const navItems = getNavItems();
  
  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : 'User';

  // ✅ Show nothing while loading to prevent flash of wrong content
  if (loading || !sessionReady) {
    return (
      <AppBar position="fixed" sx={{ backgroundColor: 'white', boxShadow: 'none' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ py: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
              Branchi Arts & Gifts
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Skeleton variant="circular" width={40} height={40} />
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <>
      <HideOnScroll>
        <AppBar 
          position="fixed" 
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 1px 20px rgba(0,0,0,0.08)',
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <Container maxWidth="xl">
            <Toolbar sx={{ py: 1, minHeight: '70px !important' }}>
              {/* Logo */}
              <Typography
                variant="h5"
                component="div"
                sx={{
                  flexGrow: 0,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                  mr: 4
                }}
                onClick={() => navigate('/dashboard')}
              >
                Branchi Arts & Gifts
              </Typography>

              {/* Desktop Menu */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(44, 62, 80, 0.04)',
                        transform: 'translateY(-1px)'
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              {/* Right Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                {isAuthenticated ? (
                  <>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="600" color="text.primary">
                        {displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {userType === 'admin' ? 'Admin' : userType === 'artist' ? 'Artist' : 'Customer'}
                      </Typography>
                    </Box>
                    
                    <IconButton onClick={handleMenuOpen}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: userType === 'admin' ? '#E74C3C' : userType === 'artist' ? '#F39C12' : '#2C3E50',
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    </IconButton>
                    
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                      <MenuItem onClick={() => handleNavigation(
                        userType === 'admin' ? '/admin/profile' : 
                        userType === 'artist' ? '/artist/profile' : 
                        '/customer/profile'
                      )}>
                        <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Profile" />
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Logout" />
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button startIcon={<LoginIcon />} onClick={() => navigate('/login')}>
                      Login
                    </Button>
                    <Button startIcon={<RegisterIcon />} variant="contained" onClick={() => navigate('/register')}>
                      Sign Up
                    </Button>
                  </Box>
                )}

                <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileMenuOpen(true)}>
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">Menu</Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}><Close /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {navItems.map((item) => (
              <ListItem key={item.path} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
          
          {isAuthenticated ? (
            <Button fullWidth variant="outlined" startIcon={<ExitToApp />} onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Box>
              <Button fullWidth variant="contained" onClick={() => handleNavigation('/login')} sx={{ mb: 1 }}>
                Login
              </Button>
              <Button fullWidth variant="outlined" onClick={() => handleNavigation('/register')}>
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      <Toolbar sx={{ minHeight: '70px !important' }} />
    </>
  );
}