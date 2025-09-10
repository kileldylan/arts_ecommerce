// src/components/layout/Navbar.js
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Badge,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  ExitToApp,
  Dashboard,
  Store,
  Person,
  AdminPanelSettings,
  Brush,
  Favorite,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Use the same color palette as CustomerDashboard
const themeColors = {
  primary: '#2C3E50', // Deep navy blue
  secondary: '#E74C3C', // Vibrant coral red
  accent: '#F39C12', // Warm gold
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1'
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileDrawer(false);
    handleMenuClose();
  };

  // Navigation items based on user type
  const getNavItems = () => {
    const commonItems = [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> } 
    ];

    if (!user) {
      return [
        { label: 'Login', path: '/login', icon: <Person /> },
        { label: 'Register', path: '/register', icon: <Person /> }
      ];
    }

    switch (user.user_type) {
      case 'admin':
        return [
          ...commonItems,
          { label: 'Admin Panel', path: '/admin', icon: <AdminPanelSettings /> },
          { label: 'Users', path: '/admin/users', icon: <Person /> }
        ];
      case 'artist':
        return [
          ...commonItems,
          { label: 'My Studio', path: '/artist', icon: <Brush /> },
          { label: 'My Products', path: '/artist/products', icon: <Store /> },
          { label: 'Orders', path: '/artist/orders', icon: <Store /> },
          { label: 'Analytics', path: '/artist/analytics', icon: <Store /> }
        ];
      case 'customer':
      default:
        return [
          ...commonItems,
          { label: 'Wishlist', path: '/wishlist', icon: <Favorite /> },
          { label: 'Orders', path: '/customer/orders', icon: <Store /> },
        ];
    }
  };

  const navItems = getNavItems();

  const renderDesktopNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
      <Typography
        variant="h6"
        component="div"
        sx={{ 
          cursor: 'pointer', 
          mr: 4,
          fontWeight: '800',
          fontSize: '1.5rem',
          background: 'linear-gradient(45deg, #FFFFFF 30%, #F39C12 90%)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
        onClick={() => navigate('/')}
      >
        Ujamaa Collective
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            color="inherit"
            startIcon={item.icon}
            onClick={() => handleNavigation(item.path)}
            sx={{
              color: 'white',
              fontWeight: '500',
              '&:hover': {
                backgroundColor: alpha('#FFFFFF', 0.1),
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>
    </Box>
  );

  const renderMobileNav = () => (
    <>
      <IconButton
        color="inherit"
        onClick={() => setMobileDrawer(true)}
        sx={{
          '&:hover': {
            backgroundColor: alpha('#FFFFFF', 0.1)
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      
      <Drawer
        anchor="left"
        open={mobileDrawer}
        onClose={() => setMobileDrawer(false)}
        PaperProps={{
          sx: {
            backgroundColor: themeColors.primary,
            color: 'white'
          }
        }}
      >
        <Box sx={{ width: 280, height: '100%', backgroundColor: themeColors.primary }}>
          <List>
            <ListItem sx={{ py: 3 }}>
              <ListItemText 
                primary="Ujamaa Collective" 
                primaryTypographyProps={{ 
                  variant: 'h6',
                  fontWeight: '700',
                  color: 'white'
                }}
              />
            </ListItem>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#FFFFFF', 0.1)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ color: 'white' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Typography
        variant="h6"
        component="div"
        sx={{ 
          flexGrow: 1, 
          textAlign: 'center',
          fontWeight: '800',
          background: 'linear-gradient(45deg, #FFFFFF 30%, #F39C12 90%)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        Ujamaa Collective
      </Typography>
    </>
  );

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${alpha(themeColors.primary, 0.95)} 100%)`,
        borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        backdropFilter: 'blur(10px)'
      }}
    >
      <Toolbar>
        {isMobile ? renderMobileNav() : renderDesktopNav()}
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            <IconButton 
              onClick={handleMenuOpen} 
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: alpha('#FFFFFF', 0.1)
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  backgroundColor: themeColors.accent,
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: themeColors.primary,
                  color: 'white',
                  border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                  borderRadius: '12px',
                  marginTop: '8px'
                }
              }}
            >
              <MenuItem 
                onClick={() => handleNavigation('/artist/profile')}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#FFFFFF', 0.1)
                  }
                }}
              >
                <ListItemIcon>
                  <Person fontSize="small" sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#FFFFFF', 0.1)
                  }
                }}
              >
                <ListItemIcon>
                  <ExitToApp fontSize="small" sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/login')}
              sx={{
                fontWeight: '500',
                '&:hover': {
                  backgroundColor: alpha('#FFFFFF', 0.1)
                }
              }}
            >
              Login
            </Button>
            <Button 
              variant="contained" 
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: themeColors.accent,
                color: 'white',
                fontWeight: '600',
                borderRadius: '8px',
                px: 3,
                '&:hover': {
                  backgroundColor: alpha(themeColors.accent, 0.9),
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}