import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  AccountCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
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
  const location = useLocation();
  const { isAuthenticated, user, profile, userType, logout, loading, validateSession } = useAuth();
  const [localUserType, setLocalUserType] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoading = loading || !authInitialized || isLoggingOut;

  // Check if we're on auth pages (login, register, etc.)
  const isAuthPage = useMemo(() => {
    const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth-success'];
    return authPaths.some(path => location.pathname.startsWith(path));
  }, [location.pathname]);

  // Clear UI immediately when on auth pages
  useEffect(() => {
    if (isAuthPage && !isAuthenticated) {
      setLocalUserType(null);
      setAuthInitialized(false);
    }
  }, [isAuthPage, isAuthenticated]);

  // Sync userType locally
  useEffect(() => {
    let mounted = true;
    
    const syncUserType = async () => {
      if (isAuthPage) {
        if (mounted) {
          setLocalUserType(null);
          setAuthInitialized(true);
        }
        return;
      }
      
      if (!isAuthenticated) {
        if (mounted) {
          setLocalUserType(null);
          setAuthInitialized(true);
        }
        return;
      }
      
      if (!loading && isAuthenticated) {
        if (mounted) {
          setLocalUserType(userType);
          setAuthInitialized(true);
        }
      } else if (loading) {
        try {
          const session = await validateSession();
          if (mounted && session?.user) {
            const { data: freshProfile } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .single();
            
            if (freshProfile && mounted) {
              setLocalUserType(freshProfile.user_type);
            }
          }
          if (mounted) setAuthInitialized(true);
        } catch (err) {
          console.debug('Session validation during navbar sync:', err);
          if (mounted) setAuthInitialized(true);
        }
      }
    };
    
    syncUserType();
    
    return () => {
      mounted = false;
    };
  }, [userType, loading, validateSession, isAuthenticated, isAuthPage]);

  // Re-validate when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isAuthPage && isAuthenticated) {
        console.log('🔄 Tab became visible, re-validating session...');
        const session = await validateSession();
        if (session?.user) {
          const { data: freshProfile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();
          
          if (freshProfile && freshProfile.user_type !== localUserType) {
            console.log('🔄 User type changed from', localUserType, 'to', freshProfile.user_type);
            setLocalUserType(freshProfile.user_type);
          }
        } else if (!session) {
          setLocalUserType(null);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [validateSession, localUserType, isAuthPage, isAuthenticated]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLocalUserType(null);
      setAuthInitialized(false);
      await logout();
      navigate('/login');
      handleMenuClose();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleMenuClose();
  };

  // Get nav items based on LOCAL user type
  const getNavItems = useCallback(() => {
    const commonItems = [
      { label: 'Home', path: '/dashboard', icon: <Dashboard /> },
    ];

    if (isAuthPage || !isAuthenticated || isLoading || isLoggingOut) {
      return commonItems;
    }

    const activeUserType = localUserType || userType;
    
    switch (activeUserType) {
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
  }, [isAuthenticated, isAuthPage, localUserType, userType, isLoading, isLoggingOut]);

  const getDisplayName = useCallback(() => {
    if (isAuthPage || !isAuthenticated || isLoading || isLoggingOut) return 'Guest';
    
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split('@')[0] || 'User';
  }, [user, profile, isAuthenticated, isLoading, isAuthPage, isLoggingOut]);

  const getAvatarInitial = useCallback(() => {
    if (isAuthPage || !isAuthenticated || isLoading || isLoggingOut) return '';
    
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (profile?.last_name) {
      return profile.last_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '';
  }, [user, profile, isAuthenticated, isLoading, isAuthPage, isLoggingOut]);

  const navItems = useMemo(() => getNavItems(), [getNavItems]);
  const isValidAuth = isAuthenticated && !isAuthPage && !isLoggingOut;

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

              {/* Desktop Menu - Only show when NOT on auth pages */}
              {!isAuthPage && (
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
              )}

              {/* Right Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                {isValidAuth && !isLoading ? (
                  <>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="600" color="text.primary">
                          {getDisplayName()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {localUserType === 'admin' ? 'Admin' : localUserType === 'artist' ? 'Artist' : 'Customer'}
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
                          backgroundColor: localUserType === 'admin' ? '#E74C3C' : localUserType === 'artist' ? '#F39C12' : '#2C3E50',
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
                            localUserType === 'admin' 
                              ? '/admin/profile'
                              : localUserType === 'artist' 
                                ? '/artist/profile' 
                                : '/customer/profile'
                          )
                        }
                      >
                        <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Profile" />
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Logout" />
                      </MenuItem>
                    </Menu>
                  </>
                ) : isAuthPage ? (
                  // ✅ On auth pages - show NOTHING in the right side (no login/signup buttons)
                  // This space intentionally left empty
                  <Box sx={{ width: { xs: 40, md: 0 } }} />
                ) : isLoading && !isAuthPage ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Skeleton variant="text" width={80} height={20} />
                  </Box>
                ) : null}

                {/* Mobile Menu Button - Only show when NOT on auth pages */}
                {!isAuthPage && (
                  <IconButton
                    sx={{ display: { md: 'none' }, color: 'text.primary' }}
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Menu Drawer - Only show when NOT on auth pages */}
      {!isAuthPage && (
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
              <Typography variant="h6" fontWeight="600">Menu</Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}><Close /></IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ flexGrow: 1 }}>
              {navItems.map((item) => (
                <ListItem key={item.path} onClick={() => handleNavigation(item.path)} sx={{ borderRadius: '8px', mb: 0.5, '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' } }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItem>
              ))}
            </List>

            {isValidAuth && !isLoading ? (
              <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: localUserType === 'admin' ? '#E74C3C' : localUserType === 'artist' ? '#F39C12' : '#2C3E50', mr: 2 }}>
                    {getAvatarInitial()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="600">{getDisplayName()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {localUserType === 'admin' ? 'Admin' : localUserType === 'artist' ? 'Artist' : 'Customer'}
                    </Typography>
                  </Box>
                </Box>
                <Button fullWidth variant="outlined" startIcon={<ExitToApp />} onClick={handleLogout} sx={{ color: 'text.primary', borderColor: 'rgba(0,0,0,0.2)' }}>
                  Logout
                </Button>
              </Box>
            ) : !isAuthPage && (
              // Only show login/signup in drawer when NOT on auth pages and not authenticated
              <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', pt: 2 }}>
                <Button fullWidth variant="contained" onClick={() => handleNavigation('/login')} sx={{ backgroundColor: '#2C3E50', mb: 1 }}>
                  Login
                </Button>
                <Button fullWidth variant="outlined" onClick={() => handleNavigation('/register')} sx={{ borderColor: '#2C3E50', color: '#2C3E50' }}>
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Drawer>
      )}

      {/* Spacer for fixed app bar */}
      <Toolbar sx={{ minHeight: '70px !important' }} />
    </>
  );
}