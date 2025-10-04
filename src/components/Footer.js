import React from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Link,
  IconButton,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

// Modern color palette (aligned with your theme)
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

const Footer = () => {
  // Shop location (example coordinates for Nairobi, Kenya; adjust as needed)
  const shopLocation = {
    name: 'Rio Gift Shop',
    address: 'Nairobi, Kenya, Ngong Road, Opposite Prestige Mall',
    latitude: -1.2921,
    longitude: 36.8219,
  };

  return (
    <Box
      sx={{
        backgroundColor: themeColors.primary,
        color: themeColors.white,
        py: 6,
        mt: 'auto',
        borderTop: `1px solid ${themeColors.border}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton size="small" sx={{ color: themeColors.accent }}>
                <Email />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                Email: info@riogiftshop.co.ke
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton size="small" sx={{ color: themeColors.accent }}>
                <Phone />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                Phone: +254 712 345 678
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" sx={{ color: themeColors.accent }}>
                <LocationOn />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                {shopLocation.address}
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Quick Links
            </Typography>
            <Box>
              <Link href="/about" underline="hover" sx={{ display: 'block', mb: 1, color: themeColors.lightText }}>
                About Us
              </Link>
              <Link href="/shop" underline="hover" sx={{ display: 'block', mb: 1, color: themeColors.lightText }}>
                Shop
              </Link>
              <Link href="/contact" underline="hover" sx={{ display: 'block', mb: 1, color: themeColors.lightText }}>
                Contact
              </Link>
              <Link href="/faq" underline="hover" sx={{ display: 'block', mb: 1, color: themeColors.lightText }}>
                FAQ
              </Link>
            </Box>
          </Grid>

          {/* Social Media and Map */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <IconButton
                href="https://facebook.com"
                target="_blank"
                sx={{ color: themeColors.white, '&:hover': { color: themeColors.accent } }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                href="https://twitter.com"
                target="_blank"
                sx={{ color: themeColors.white, '&:hover': { color: themeColors.accent } }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                href="https://instagram.com"
                target="_blank"
                sx={{ color: themeColors.white, '&:hover': { color: themeColors.accent } }}
              >
                <Instagram />
              </IconButton>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Visit Us
            </Typography>
            <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
              <iframe
                title="Shop Location"
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15946.735643819508!2d${shopLocation.longitude}!3d${shopLocation.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1758a34a6b6b%3A0x1e9c9c9c9c9c9c9c!2s${encodeURIComponent(shopLocation.name)}!5e0!3m2!1sen!2ske!4v1696413000000`}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 8 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Bottom */}
        <Box sx={{ mt: 4, textAlign: 'center', borderTop: `1px solid ${themeColors.border}`, pt: 2 }}>
          <Typography variant="body2" sx={{ color: themeColors.lightText }}>
            &copy; {new Date().getFullYear()} Rio Gift Shop. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;