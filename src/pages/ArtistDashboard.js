// src/components/dashboard/ArtistDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  alpha
} from '@mui/material';
import {
  Add,
  Inventory,
  Visibility,
  ShoppingCart,
  Star,
  Brush
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../contexts/ProductContext';
import Navbar from '../components/NavBar';

// Modern color palette
const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1'
};

export default function ArtistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { artistProducts, loading, getArtistProducts } = useProducts();
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    totalSales: 0,
    totalViews: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (user) {
      getArtistProducts(user.id);
    }
  }, [user, getArtistProducts]);

  useEffect(() => {
    if (artistProducts.length > 0) {
      const published = artistProducts.filter(p => p.is_published).length;
      const totalSales = artistProducts.reduce((sum, p) => sum + (p.sales_count || 0), 0);
      const totalViews = artistProducts.reduce((sum, p) => sum + (p.view_count || 0), 0);
      const avgRating =
        artistProducts.reduce((sum, p) => sum + (p.average_rating || 0), 0) /
        artistProducts.length;

      setStats({
        totalProducts: artistProducts.length,
        publishedProducts: published,
        totalSales,
        totalViews,
        averageRating: avgRating || 0
      });
    }
  }, [artistProducts]);

  const StatCard = ({ icon, title, value, subtitle, color = 'primary' }) => (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        border: `1px solid ${themeColors.border}`,
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          borderColor: themeColors.accent
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ fontSize: 36, color: `${color}.main`, mb: 1 }}>
          {icon}
        </Box>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ color: themeColors.text, fontFamily: 'Roboto, sans-serif' }}
        >
          {value}
        </Typography>
        <Typography
          variant="subtitle2"
          color={themeColors.lightText}
          sx={{ fontFamily: 'Roboto, sans-serif', mt: 0.5 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color={themeColors.lightText}
            sx={{ fontFamily: 'Roboto, sans-serif', mt: 0.25 }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const RecentProductItem = ({ product }) => (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        border: `1px solid ${themeColors.border}`,
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.06)',
          borderColor: themeColors.accent
        }
      }}
      onClick={() => navigate(`/artist/products/${product.id}`)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          variant="rounded"
          src={product.images?.[0]?.image_url}
          sx={{
            width: 70,
            height: 70,
            bgcolor: 'grey.100',
            borderRadius: '8px'
          }}
        >
          <Brush sx={{ fontSize: 32, color: themeColors.primary }} />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            sx={{ color: themeColors.text, fontFamily: 'Roboto, sans-serif' }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="body2"
            color={themeColors.lightText}
            sx={{ fontFamily: 'Roboto, sans-serif', mt: 0.25 }}
          >
            Ksh{product.price} • {product.category_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              size="small"
              label={product.is_published ? 'Published' : 'Draft'}
              sx={{
                fontFamily: 'Roboto, sans-serif',
                backgroundColor: product.is_published
                  ? alpha('#27AE60', 0.1)
                  : alpha('#BDC3C7', 0.1),
                color: product.is_published ? '#27AE60' : '#7F8C8D'
              }}
            />
            <Chip
              size="small"
              label={`${product.quantity} in stock`}
              variant="outlined"
              sx={{
                fontFamily: 'Roboto, sans-serif',
                borderColor: themeColors.border,
                color: themeColors.lightText
              }}
            />
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="caption"
            color={themeColors.lightText}
            sx={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {new Date(product.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <>
      <Navbar />
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: themeColors.background,
          minHeight: '100vh',
          pt: 2,
          pb: 8
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 5, textAlign: 'left' }}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: -0.3,
                color: themeColors.text,
                fontSize: { xs: '2rem', md: '2.75rem' }
              }}
            >
              Welcome back, {user?.name}!
            </Typography>
            <Typography
              variant="h6"
              color={themeColors.lightText}
              sx={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Manage your artwork and track your performance
            </Typography>
          </Box>

          {/* Stats Grid */}
          <Box
            sx={{
              mb: 6,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2
            }}
          >
            <StatCard
              icon={<Inventory />}
              title="Total Products"
              value={stats.totalProducts}
              subtitle={`${stats.publishedProducts} published`}
              color="primary"
            />
            <StatCard
              icon={<ShoppingCart />}
              title="Total Sales"
              value={stats.totalSales}
              subtitle="All time"
              color="success"
            />
            <StatCard
              icon={<Visibility />}
              title="Total Views"
              value={stats.totalViews}
              subtitle="Product views"
              color="info"
            />
            <StatCard
              icon={<Star />}
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              subtitle="Out of 5 stars"
              color="warning"
            />
          </Box>

          {/* Action Cards */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} md={8}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="bold"
                    sx={{
                      fontFamily: 'Roboto, sans-serif',
                      color: themeColors.text
                    }}
                  >
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        fullWidth
                        sx={{
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontFamily: 'Roboto, sans-serif',
                          borderRadius: '8px',
                          backgroundColor: themeColors.primary,
                          '&:hover': {
                            backgroundColor: alpha(themeColors.primary, 0.9),
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => navigate('/artist/products/new')}
                      >
                        New Product
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontFamily: 'Roboto, sans-serif',
                          borderRadius: '8px',
                          borderColor: themeColors.border,
                          color: themeColors.text,
                          '&:hover': {
                            borderColor: themeColors.primary,
                            backgroundColor: alpha(themeColors.primary, 0.04)
                          }
                        }}
                        onClick={() => navigate('/artist/products')}
                      >
                        Manage Products
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontFamily: 'Roboto, sans-serif',
                          borderRadius: '8px',
                          borderColor: themeColors.border,
                          color: themeColors.text,
                          '&:hover': {
                            borderColor: themeColors.primary,
                            backgroundColor: alpha(themeColors.primary, 0.04)
                          }
                        }}
                        onClick={() => navigate('/artist/profile')}
                      >
                        Edit Profile
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="bold"
                    sx={{
                      fontFamily: 'Roboto, sans-serif',
                      color: themeColors.text
                    }}
                  >
                    Performance
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: themeColors.text,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        Sales Target
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          color: themeColors.text,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        75%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: themeColors.border,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: themeColors.accent
                        }
                      }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                        mt: 2
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: themeColors.text,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        Inventory Health
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          color: themeColors.text,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        90%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={90}
                      color="success"
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: themeColors.border,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: themeColors.secondary
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Products */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        color: themeColors.text
                      }}
                    >
                      Recent Products
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        borderColor: themeColors.border,
                        color: themeColors.text,
                        '&:hover': {
                          borderColor: themeColors.primary,
                          backgroundColor: alpha(themeColors.primary, 0.04)
                        }
                      }}
                      onClick={() => navigate('/artist/products')}
                    >
                      View All
                    </Button>
                  </Box>

                  {loading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography
                        variant="body2"
                        color={themeColors.lightText}
                        sx={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        Loading products...
                      </Typography>
                    </Box>
                  ) : artistProducts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Inventory
                        sx={{
                          fontSize: 40,
                          color: themeColors.lightText,
                          mb: 1.5
                        }}
                      />
                      <Typography
                        variant="subtitle1"
                        color={themeColors.lightText}
                        gutterBottom
                        sx={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        No products yet
                      </Typography>
                      <Typography
                        variant="body2"
                        color={themeColors.lightText}
                        sx={{
                          mb: 2,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                      >
                        Start by creating your first artwork listing
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                          backgroundColor: themeColors.primary,
                          '&:hover': {
                            backgroundColor: alpha(themeColors.primary, 0.9),
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          borderRadius: '8px'
                        }}
                        onClick={() => navigate('/artist/products/new')}
                      >
                        Create First Product
                      </Button>
                    </Box>
                  ) : (
                    artistProducts.slice(0, 5).map(product => (
                      <RecentProductItem key={product.id} product={product} />
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="bold"
                    sx={{
                      fontFamily: 'Roboto, sans-serif',
                      color: themeColors.text
                    }}
                  >
                    Quick Tips
                  </Typography>
                  <Box sx={{ mt: 1.5 }}>
                    {[
                      'Use high-quality images to showcase your artwork',
                      'Write detailed descriptions about your creative process',
                      'Set competitive prices based on market research',
                      'Keep your inventory updated to avoid overselling',
                      'Respond promptly to customer inquiries'
                    ].map((tip, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          mb: 1.5
                        }}
                      >
                        <Star
                          sx={{
                            fontSize: 14,
                            mt: 0.25,
                            mr: 1,
                            color: themeColors.accent
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: themeColors.lightText,
                            fontFamily: 'Roboto, sans-serif'
                          }}
                        >
                          {tip}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
