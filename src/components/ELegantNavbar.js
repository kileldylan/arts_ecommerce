// src/components/ElegantNavbar.js
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
  Divider,
  useScrollTrigger,
  Slide
} from '@mui/material';
import {
  Menu,
  ShoppingCart,
  Person,
  Search,
  Close
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
  const navigate = useNavigate();
  const { getCartItemsCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/customer/dashboard' },
    { label: 'Categories', path: '/categories' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
                onClick={() => navigate('/')}
              >
                ArtsEcommerce
              </Typography>

              {/* Desktop Menu */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    onClick={() => navigate(item.path)}
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
                {/* Search Icon */}
                <IconButton 
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' }
                  }}
                >
                  <Search />
                </IconButton>

                {/* Cart Icon */}
                <IconButton 
                  onClick={() => navigate('/customer/dashboard?cart=true')}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' }
                  }}
                >
                  <Badge badgeContent={getCartItemsCount()} color="error">
                    <ShoppingCart />
                  </Badge>
                </IconButton>

                {/* User Account / Login */}
                {isAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      onClick={() => navigate('/profile')}
                      sx={{ 
                        color: 'text.primary',
                        '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' }
                      }}
                    >
                      <Person />
                    </IconButton>
                    <Button
                      variant="outlined"
                      onClick={handleLogout}
                      sx={{
                        borderColor: 'text.primary',
                        color: 'text.primary',
                        borderRadius: '8px',
                        px: 2,
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
                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    sx={{
                      backgroundColor: '#2C3E50',
                      borderRadius: '8px',
                      px: 3,
                      '&:hover': {
                        backgroundColor: '#34495E',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Login
                  </Button>
                )}

                {/* Mobile Menu Button */}
                <IconButton
                  sx={{ display: { md: 'none' }, color: 'text.primary' }}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu />
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
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Menu
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.label} 
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(44, 62, 80, 0.04)'
                  }
                }}
              >
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Spacer for fixed app bar */}
      <Toolbar sx={{ minHeight: '70px !important' }} />
    </>
  );
}