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

  // ✅ Show loading skeleton ONLY if auth is checking (for authenticated users)
  // Unauthenticated users should see login/signup buttons immediately
  if (loading && isAuthenticated) {
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
            <Toolbar sx={{ py: { xs: 0.5, sm: 1 }, minHeight: { xs: '60px !important', sm: '70px !important' } }}>
              {/* Logo */}
              <Typography
                variant="h5"
                component="div"
                sx={{
                  flexGrow: 0,
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' },
                  background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                  mr: { xs: 1, sm: 2, md: 4 },
                  whiteSpace: { xs: 'nowrap', sm: 'normal' }
                }}
                onClick={() => navigate('/dashboard')}
              >
                Branchi Arts & Gifts
              </Typography>

              {/* Desktop Menu */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: { md: '0.9rem', lg: '0.95rem' },
                      px: { md: 1.5, lg: 2 },
                      py: 0.75,
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 1.5 }, ml: 'auto' }}>
                {isAuthenticated ? (
                  <>
                    <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { lg: '0.9rem' } }}>
                        {displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { lg: '0.75rem' } }}>
                        {userType === 'admin' ? 'Admin' : userType === 'artist' ? 'Artist' : 'Customer'}
                      </Typography>
                    </Box>
                    
                    <IconButton onClick={handleMenuOpen} sx={{ p: { xs: 0.75, md: 1 } }}>
                      <Avatar
                        sx={{
                          width: { xs: 32, md: 36 },
                          height: { xs: 32, md: 36 },
                          backgroundColor: userType === 'admin' ? '#E74C3C' : userType === 'artist' ? '#F39C12' : '#2C3E50',
                          fontSize: { xs: '0.9rem', md: '1rem' }
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
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: { xs: 1, sm: 2 } }}>
                    <Button size="small" onClick={() => navigate('/login')} sx={{ fontSize: { sm: '0.85rem', md: '0.9rem' } }}>
                      Login
                    </Button>
                    <Button size="small" variant="contained" onClick={() => navigate('/register')} sx={{ fontSize: { sm: '0.85rem', md: '0.9rem' } }}>
                      Sign Up
                    </Button>
                  </Box>
                )}

                <IconButton sx={{ display: { md: 'none' }, p: 0.75 }} onClick={() => setMobileMenuOpen(true)}>
                  <MenuIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: { xs: 280, sm: 300 }, p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>Menu</Typography>
            <IconButton size="small" onClick={() => setMobileMenuOpen(false)}><Close /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {isAuthenticated && (
            <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'rgba(44, 62, 80, 0.04)', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.85rem' }}>{displayName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {userType === 'admin' ? 'Admin' : userType === 'artist' ? 'Artist' : 'Customer'}
              </Typography>
            </Box>
          )}
          
          <List sx={{ py: 0 }}>
            {navItems.map((item) => (
              <ListItem key={item.path} onClick={() => handleNavigation(item.path)} sx={{ py: 1, px: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem' }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
          
          {isAuthenticated ? (
            <Box>
              <Button fullWidth variant="outlined" startIcon={<Person />} onClick={() => handleNavigation(
                userType === 'admin' ? '/admin/profile' : 
                userType === 'artist' ? '/artist/profile' : 
                '/customer/profile'
              )} sx={{ mb: 1, fontSize: '0.9rem' }}>
                Profile
              </Button>
              <Button fullWidth variant="outlined" startIcon={<ExitToApp />} onClick={handleLogout} sx={{ fontSize: '0.9rem' }}>
                Logout
              </Button>
            </Box>
          ) : (
            <Box>
              <Button fullWidth variant="contained" onClick={() => handleNavigation('/login')} sx={{ mb: 1, fontSize: '0.9rem' }}>
                Login
              </Button>
              <Button fullWidth variant="outlined" onClick={() => handleNavigation('/register')} sx={{ fontSize: '0.9rem' }}>
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      <Toolbar sx={{ minHeight: { xs: '60px !important', sm: '70px !important' } }} />
    </>
  );
}