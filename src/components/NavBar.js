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
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp,
  Dashboard,
  Store,
  Person,
  AdminPanelSettings,
  ShoppingBag,
  Analytics,
  Group,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Use the same color palette as CustomerDashboard
const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1',
};

export default function Navbar() {
  const { user, profile, userType, logout, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawer, setMobileDrawer] = useState(false);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      handleMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileDrawer(false);
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

    console.log('🔍 Navbar - User type:', userType, 'Profile:', profile);

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
          { label: 'CRM', path: '/artist/CRM', icon: <Group /> },
        ];
      case 'customer':
      default:
        return [
          ...commonItems,
          { label: 'My Orders', path: '/customer/orders', icon: <ShoppingBag /> },
          { label: 'Wishlist', path: '/customer/wishlist', icon: <Store /> },
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
          WebkitTextFillColor: 'transparent',
        }}
        onClick={() => navigate('/dashboard')}
      >
        Branchi Arts & Gifts
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
              transition: 'all 0.2s ease-in-out',
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
        sx={{ '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) } }}
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
            color: 'white',
            width: 280 
          } 
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List sx={{ flexGrow: 1 }}>
            <ListItem sx={{ py: 3, borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}` }}>
              <ListItemText
                primary="Branchi Arts & Gifts"
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
                  '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) },
                  py: 2
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ color: 'white' }} 
                />
              </ListItem>
            ))}
          </List>
          
          {/* Only show user section if logged in */}
          {user && (
            <Box sx={{ p: 2, borderTop: `1px solid ${alpha('#FFFFFF', 0.1)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="600" color="white">
                    {getDisplayName()}
                  </Typography>
                  {/* Removed role tag as requested */}
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  borderColor: alpha('#FFFFFF', 0.3),
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: alpha('#FFFFFF', 0.1)
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          )}
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
          WebkitTextFillColor: 'transparent',
        }}
        onClick={() => navigate('/')}
      >
        Branchi Arts & Gifts
      </Typography>
    </>
  );

  // Don't render anything during initial auth loading
  if (loading) {
    return null;
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${alpha(themeColors.primary, 0.95)} 100%)`,
        borderBottom: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar>
        {isMobile ? renderMobileNav() : renderDesktopNav()}

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* User info for desktop - Removed role tag */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="600" color="white">
                    {getDisplayName()}
                  </Typography>
                  {/* Removed role tag as requested */}
                </Box>
              </Box>
            )}
            
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              sx={{ '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) } }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: themeColors.accent,
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
                  backgroundColor: themeColors.primary,
                  color: 'white',
                  border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
                  borderRadius: '12px',
                  marginTop: '8px',
                  minWidth: 180,
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
                sx={{ '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) } }}
              >
                <ListItemIcon>
                  <Person fontSize="small" sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                sx={{ '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) } }}
              >
                <ListItemIcon>
                  <ExitToApp fontSize="small" sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
            {/* Show simple account icon when not logged in */}
            <IconButton
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ 
                '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) },
                display: { xs: 'flex', md: 'none' } // Only show on mobile when logged out
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
                  fontWeight: '500',
                  '&:hover': { backgroundColor: alpha('#FFFFFF', 0.1) },
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
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Sign Up
              </Button>
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}