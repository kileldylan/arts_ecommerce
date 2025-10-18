import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
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
  
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Person,
  Search,
  Close,
  ExitToApp,
  Dashboard,
  Store,
  AdminPanelSettings,
  ShoppingBag,
  Analytics,
  Group,
  AccountCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

// Hide app bar on scroll
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
  const { getCartItemsCount } = useCart();
  const { isAuthenticated, user, profile, userType, logout, loading } = useAuth();

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      handleMenuClose();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleMenuClose();
  };

  const getNavItems = () => {
    // Common items that appear for everyone (including logged out users)
    const commonItems = [
      { label: 'Home', path: '/dashboard', icon: <Dashboard /> },
    ];

    // If no user or still loading, return only common items
    if (loading || !user) {
      return commonItems;
    }

    // User-specific items based on user type
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

  const getDisplayName = () => {
    if (!user) return 'Guest';
    
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }

    return user?.email?.split('@')[0] || 'User';
  };

  const getAvatarInitial = () => {
    if (!user) return '?';
    
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const navItems = getNavItems();

  // Render immediately; show guest actions if loading

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
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              {/* Right Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* User Account */}
                {isAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* User info for desktop */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="600" color="text.primary">
                          {getDisplayName()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <IconButton
                      onClick={handleMenuOpen}
                      sx={{ 
                        color: 'text.primary',
                        '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' }
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: '#F39C12',
                          fontWeight: '600',
                          fontSize: '1rem',
                        }}
                      >
                        {getAvatarInitial()}
                      </Avatar>
                    </IconButton>
                    
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      PaperProps={{
                        sx: {
                          backgroundColor: 'white',
                          color: 'text.primary',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '12px',
                          marginTop: '8px',
                          minWidth: 180,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        },
                      }}
                    >
                      <MenuItem
                        onClick={() =>
                          handleNavigation(
                            userType === 'artist' 
                              ? '/artist/profile' 
                              : '/customer/profile'
                          )
                        }
                        sx={{ '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' } }}
                      >
                        <ListItemIcon>
                          <Person fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Profile" />
                      </MenuItem>
                      <MenuItem
                        onClick={handleLogout}
                        sx={{ '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' } }}
                      >
                        <ListItemIcon>
                          <ExitToApp fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                      </MenuItem>
                    </Menu>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Show simple account icon when not logged in on mobile */}
                    <IconButton
                      color="inherit"
                      onClick={() => navigate('/login')}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' },
                        display: { xs: 'flex', md: 'none' }
                      }}
                    >
                      <AccountCircle />
                    </IconButton>
                    
                    {/* Regular login/signup buttons for desktop */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                      <Button
                        color="inherit"
                        onClick={() => navigate('/login')}
                        sx={{
                          color: 'text.primary',
                          fontWeight: '500',
                          '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' },
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/register')}
                        sx={{
                          backgroundColor: '#2C3E50',
                          color: 'white',
                          borderRadius: '8px',
                          px: 3,
                          '&:hover': {
                            backgroundColor: '#34495E',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        Sign Up
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Mobile Menu Button */}
                <IconButton
                  sx={{ display: { md: 'none' }, color: 'text.primary' }}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Navigation Items */}
          <List sx={{ flexGrow: 1 }}>
            {navItems.map((item) => (
              <ListItem 
                key={item.path} 
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(44, 62, 80, 0.04)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>

          {/* User Section for Mobile */}
          {isAuthenticated ? (
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#F39C12',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    mr: 2
                  }}
                >
                  {getAvatarInitial()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    {getDisplayName()}
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{
                  color: 'text.primary',
                  borderColor: 'rgba(0,0,0,0.2)',
                  '&:hover': {
                    borderColor: '#E74C3C',
                    backgroundColor: 'rgba(231, 76, 60, 0.04)'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', pt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleNavigation('/login')}
                sx={{
                  backgroundColor: '#2C3E50',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: '#34495E'
                  }
                }}
              >
                Login
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleNavigation('/register')}
                sx={{
                  borderColor: '#2C3E50',
                  color: '#2C3E50',
                  '&:hover': {
                    borderColor: '#34495E',
                    backgroundColor: 'rgba(44, 62, 80, 0.04)'
                  }
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Spacer for fixed app bar */}
      <Toolbar sx={{ minHeight: '70px !important' }} />
    </>
  );
}