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
  Badge
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
import CustomerOrders from '../pages/customer/CustomOrder';

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
          { label: 'Checkout', path: '/checkout', icon: <Store /> },
          { label: 'Analytics', path: '/artist/analytics', icon: <Store /> }
        ];
      case 'customer':
      default:
        return [
          ...commonItems,
          { label: 'Wishlist', path: '/wishlist', icon: <Favorite /> },
          { label: 'Orders', path: '/customer/orders', icon: <Store /> },
          { label: 'Cart', path: '/cart', icon: <ShoppingCart /> }
        ];
    }
  };

  const navItems = getNavItems();

  const renderDesktopNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
      <Typography
        variant="h6"
        component="div"
        sx={{ cursor: 'pointer', mr: 4 }}
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
      >
        <MenuIcon />
      </IconButton>
      
      <Drawer
        anchor="left"
        open={mobileDrawer}
        onClose={() => setMobileDrawer(false)}
      >
        <Box sx={{ width: 250 }}>
          <List>
            <ListItem>
              <ListItemText 
                primary="Ujamaa Collective" 
                primaryTypographyProps={{ variant: 'h6' }}
              />
            </ListItem>
            {navItems.map((item) => (
              <ListItem 
                button 
                key={item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <Typography
        variant="h6"
        component="div"
        sx={{ flexGrow: 1, textAlign: 'center' }}
      >
        Ujamaa Collective
      </Typography>
    </>
  );

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {isMobile ? renderMobileNav() : renderDesktopNav()}
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Cart Icon for customers */}
            {user.user_type === 'customer' && (
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge badgeContent={0} color="secondary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            )}
            
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleNavigation('/artist/profile')}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button 
              color="secondary" 
              variant="contained" 
              onClick={() => navigate('/register')}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}