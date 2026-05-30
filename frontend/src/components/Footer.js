import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Link,
  Divider,
  alpha,
  Stack
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Copyright,
  Facebook,
  Instagram,
  Twitter,
  WhatsApp,
  AccessTime,
  LocalShipping,
  Security,
  Verified
} from '@mui/icons-material';

// Modern color palette (aligned with your theme)
const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#D4AF37',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#BDC3C7',
  white: '#FFFFFF',
  border: '#34495E',
};

const Footer = () => {
  // Shop location
  const shopLocation = {
    name: 'Branchi Arts & Gifts',
    address: 'Nairobi, Kenya, Ngong Road, Opposite Prestige Mall',
    latitude: -1.2921,
    longitude: 36.8219,
  };

  const businessHours = [
    'Monday - Friday: 9:00 AM - 6:00 PM',
    'Saturday: 10:00 AM - 4:00 PM',
    'Sunday: Closed'
  ];

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <Instagram />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <Twitter />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <WhatsApp />, url: 'https://wa.me/254716769050', label: 'WhatsApp' },
  ];

  return (
    <Box
      sx={{
        backgroundColor: themeColors.primary,
        color: themeColors.white,
        py: { xs: 4, md: 5 },
        mt: 'auto',
        borderTop: `3px solid ${themeColors.accent}`,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Grid container spacing={3} alignItems="flex-start">
          
          {/* Contact Information with Hours */}
          <Grid item xs={12} md={4}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={{ 
                color: themeColors.accent, 
                fontWeight: 700,
                mb: 2,
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Email sx={{ fontSize: 18, color: themeColors.accent, mr: 1.5 }} />
              <Typography variant="body2" sx={{ color: themeColors.lightText }}>
                info@branchiartsgifts.co.ke
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Phone sx={{ fontSize: 18, color: themeColors.accent, mr: 1.5 }} />
              <Typography variant="body2" sx={{ color: themeColors.lightText }}>
                +254 716 769050
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
              <LocationOn sx={{ fontSize: 18, color: themeColors.accent, mr: 1.5 }} />
              <Typography variant="body2" sx={{ color: themeColors.lightText, lineHeight: 1.4 }}>
                {shopLocation.address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 2 }}>
              <AccessTime sx={{ fontSize: 18, color: themeColors.accent, mr: 1.5 }} />
              <Box>
                {businessHours.map((hour, index) => (
                  <Typography key={index} variant="caption" sx={{ color: themeColors.lightText, display: 'block', fontSize: '0.7rem' }}>
                    {hour}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Quick Links - Now with working links only */}
          <Grid item xs={12} md={3}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={{ 
                color: themeColors.accent, 
                fontWeight: 700,
                mb: 2,
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              Quick Links
            </Typography>
            <Stack spacing={1.5}>
              <Link 
                component={RouterLink} 
                to="/customer/dashboard" 
                underline="hover" 
                sx={{ 
                  color: themeColors.lightText, 
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  '&:hover': { 
                    color: themeColors.accent,
                    transform: 'translateX(3px)'
                  }
                }}
              >
                Home / Shop
              </Link>
              <Link 
                component={RouterLink} 
                to="/customer/orders" 
                underline="hover" 
                sx={{ 
                  color: themeColors.lightText, 
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  '&:hover': { 
                    color: themeColors.accent,
                    transform: 'translateX(3px)'
                  }
                }}
              >
                My Orders
              </Link>
              <Link 
                component={RouterLink} 
                to="/customer/profile" 
                underline="hover" 
                sx={{ 
                  color: themeColors.lightText, 
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  '&:hover': { 
                    color: themeColors.accent,
                    transform: 'translateX(3px)'
                  }
                }}
              >
                My Profile
              </Link>
              <Link 
                component={RouterLink} 
                to="/checkout" 
                underline="hover" 
                sx={{ 
                  color: themeColors.lightText, 
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  '&:hover': { 
                    color: themeColors.accent,
                    transform: 'translateX(3px)'
                  }
                }}
              >
                Checkout
              </Link>
            </Stack>

            {/* Social Links */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ color: themeColors.accent, mb: 1.5, fontWeight: 600, fontSize: '0.85rem' }}>
                Follow Us
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: alpha(themeColors.lightText, 0.1),
                      color: themeColors.lightText,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: themeColors.accent,
                        color: themeColors.primary,
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    {social.icon}
                  </Link>
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Trust & Services */}
          <Grid item xs={12} md={2}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={{ 
                color: themeColors.accent, 
                fontWeight: 700,
                mb: 2,
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              Services
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping sx={{ fontSize: 16, color: themeColors.accent }} />
                <Typography variant="body2" sx={{ color: themeColors.lightText, fontSize: '0.85rem' }}>
                  Free Delivery Over Ksh 5,000
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ fontSize: 16, color: themeColors.accent }} />
                <Typography variant="body2" sx={{ color: themeColors.lightText, fontSize: '0.85rem' }}>
                  Secure Checkout
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Verified sx={{ fontSize: 16, color: themeColors.accent }} />
                <Typography variant="body2" sx={{ color: themeColors.lightText, fontSize: '0.85rem' }}>
                  Handcrafted in Kenya
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={3}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={{ 
                color: themeColors.accent, 
                fontWeight: 700,
                mb: 2,
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              Visit Our Workshop
            </Typography>
            <Box 
              sx={{ 
                position: 'relative', 
                width: '100%', 
                height: 160, 
                borderRadius: 2, 
                overflow: 'hidden', 
                border: `1px solid ${alpha(themeColors.accent, 0.3)}`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 4px 12px ${alpha(themeColors.accent, 0.2)}`
                }
              }}
            >
              <iframe
                title="Shop Location"
                src={`https://www.google.com/maps?q=${shopLocation.latitude},${shopLocation.longitude}&z=14&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Footer Bottom */}
        <Divider sx={{ my: 3, borderColor: alpha(themeColors.border, 0.5) }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: themeColors.lightText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              fontSize: '0.7rem'
            }}
          >
            <Copyright sx={{ fontSize: 12 }} />
            {new Date().getFullYear()} Branchi Arts and Gifts. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;