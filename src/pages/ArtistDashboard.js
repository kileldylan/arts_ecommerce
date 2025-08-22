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
  Avatar
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
      const avgRating = artistProducts.reduce((sum, p) => sum + (p.average_rating || 0), 0) / artistProducts.length;

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
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box sx={{ fontSize: 40, color: `${color}.main`, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="h6" component="div" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const RecentProductItem = ({ product }) => (
    <Paper elevation={1} sx={{ p: 2, mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/artist/products/${product.id}`)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          variant="rounded"
          src={product.images?.[0]?.image_url}
          sx={{ width: 60, height: 60, bgcolor: 'grey.100' }}
        >
          <Brush />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${product.price} • {product.category_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              size="small"
              label={product.is_published ? 'Published' : 'Draft'}
              color={product.is_published ? 'success' : 'default'}
            />
            <Chip
              size="small"
              label={`${product.quantity} in stock`}
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            {new Date(product.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <>
    <Navbar/>
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your artwork and track your performance
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Inventory />}
              title="Total Products"
              value={stats.totalProducts}
              subtitle={`${stats.publishedProducts} published`}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<ShoppingCart />}
              title="Total Sales"
              value={stats.totalSales}
              subtitle="All time"
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Visibility />}
              title="Total Views"
              value={stats.totalViews}
              subtitle="Product views"
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Star />}
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              subtitle="Out of 5 stars"
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Quick Actions
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      fullWidth
                      sx={{ py: 2 }}
                      onClick={() => navigate('/artist/products/new')}
                    >
                      New Product
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ py: 2 }}
                      onClick={() => navigate('/artist/products')}
                    >
                      Manage Products
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ py: 2 }}
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
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Performance
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Sales Target</Typography>
                    <Typography variant="body2" fontWeight="bold">75%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                    <Typography variant="body2">Inventory Health</Typography>
                    <Typography variant="body2" fontWeight="bold">90%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={90} color="success" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Products */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold">
                    Recent Products
                  </Typography>
                  <Button onClick={() => navigate('/artist/products')}>
                    View All
                  </Button>
                </Box>
                
                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading products...</Typography>
                  </Box>
                ) : artistProducts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Inventory sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No products yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Start by creating your first artwork listing
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/artist/products/new')}
                    >
                      Create First Product
                    </Button>
                  </Box>
                ) : (
                  artistProducts.slice(0, 5).map((product) => (
                    <RecentProductItem key={product.id} product={product} />
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Quick Tips
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    "Use high-quality images to showcase your artwork",
                    "Write detailed descriptions about your creative process",
                    "Set competitive prices based on market research",
                    "Keep your inventory updated to avoid overselling",
                    "Respond promptly to customer inquiries"
                  ].map((tip, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Star color="primary" sx={{ fontSize: 16, mt: 0.5, mr: 1 }} />
                      <Typography variant="body2">{tip}</Typography>
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