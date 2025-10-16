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
        py: { xs: 3, md: 4 },
        mt: 'auto',
        borderTop: `1px solid ${themeColors.border}`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="flex-start">
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Email fontSize="small" />
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                info@branchiartsgifts.co.ke
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Phone fontSize="small" />
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                +254 716769050
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn fontSize="small" />
              <Typography variant="body2" sx={{ ml: 1, color: themeColors.lightText }}>
                {shopLocation.address}
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Links
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Link href="/dashboard" underline="hover" sx={{ color: themeColors.lightText, fontSize: '0.9rem' }}>
                Home
              </Link>
              <Link href="/customer/orders" underline="hover" sx={{ color: themeColors.lightText, fontSize: '0.9rem' }}>
                Orders
              </Link>
              <Link href="/contact" underline="hover" sx={{ color: themeColors.lightText, fontSize: '0.9rem' }}>
                Contact
              </Link>
            </Box>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: themeColors.white, fontWeight: 700 }}>
              Visit Us
            </Typography>
            <Box sx={{ position: 'relative', width: '100%', height: 160, borderRadius: 2, overflow: 'hidden', border: `1px solid ${themeColors.border}` }}>
              <iframe
                title="Shop Location"
                src={`https://www.google.com/maps?q=${shopLocation.latitude},${shopLocation.longitude}&z=14&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Bottom */}
        <Box sx={{ mt: 3, textAlign: 'center', borderTop: `1px solid ${themeColors.border}`, pt: 1.5 }}>
          <Typography variant="caption" sx={{ color: themeColors.lightText }}>
            © {new Date().getFullYear()} Rio Gift Shop
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;