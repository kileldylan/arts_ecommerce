import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar,
  alpha,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Visibility, VisibilityOff, Search, Image as ImageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';

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

// Categories to match database (updated for Supabase)
const categories = [
  { id: '0', name: 'All Categories', slug: 'all' },
  { id: 'gift-items', name: 'Gift Items', slug: 'gift-items' },
  { id: 'frames', name: 'Frames', slug: 'frames' },
  { id: 'wall-art', name: 'Wall Art', slug: 'wall-art' },
  { id: 'trophies-awards', name: 'Trophies & Awards', slug: 'trophies-awards' },
  { id: 'signage', name: 'Signage', slug: 'signage' },
  { id: 'banners', name: 'Banners', slug: 'banners' },
  { id: 'adhesive-stickers', name: 'Adhesive Stickers', slug: 'adhesive-stickers' },
  { id: 'board-printing', name: 'Board Printing', slug: 'board-printing' },
  { id: 'event-branding', name: 'Event Branding', slug: 'event-branding' },
  { id: 'door-signs', name: 'Door Signs', slug: 'door-signs' }
];

// Updated image URL handler for Supabase
function getFirstImageUrl(product) {
  if (!product) return null;
  
  // If product has direct image_url field (Supabase storage)
  if (product.image_url) {
    return product.image_url;
  }
  
  // If product has images array (from joined table)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === 'object' && firstImage.image_url) {
      return firstImage.image_url;
    }
    if (typeof firstImage === 'string') {
      return firstImage;
    }
  }
  
  // If product_images relation exists
  if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
    const firstImage = product.product_images[0];
    if (firstImage.image_url) {
      return firstImage.image_url;
    }
  }
  
  return null;
}

export default function ProductList() {
  const navigate = useNavigate();
  const { 
    artistProducts, 
    loading, 
    deleteProduct, 
    getArtistProducts, 
    updateProduct, 
    error, 
    clearError 
  } = useProducts();
  const { profile } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('0');

  useEffect(() => {
    console.log('🔍 ProductList - Profile:', profile);
    if (profile?.id) {
      getArtistProducts(profile.id);
    }
  }, [profile, getArtistProducts]);

  // Add togglePublishProduct function since it's not in context
  const togglePublishProduct = async (productId, isPublished) => {
    try {
      await updateProduct(productId, { is_published: isPublished });
      setSuccessMessage(`Product ${isPublished ? 'published' : 'unpublished'} successfully!`);
      // Refresh the products list
      if (profile?.id) {
        getArtistProducts(profile.id);
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteDialog) {
      try {
        await deleteProduct(deleteDialog.id);
        setSuccessMessage('Product deleted successfully!');
        setDeleteDialog(null);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleTogglePublish = async (product) => {
    await togglePublishProduct(product.id, !product.is_published);
  };

  // Apply filters - FIXED: Use category instead of category_id
  const filteredProducts = artistProducts.filter((product) => {
    const matchesCategory = selectedCategory === '0' || product.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Debug logging
  console.log('🔍 ProductList Debug:', {
    profileId: profile?.id,
    artistProductsCount: artistProducts.length,
    filteredCount: filteredProducts.length,
    loading: loading
  });

  if (loading && artistProducts.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              My Products
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your artwork listings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/artist/products/new`)}
            sx={{
              py: 1,
              fontSize: '0.85rem',
              borderRadius: '8px',
              backgroundColor: themeColors.primary,
              '&:hover': { backgroundColor: alpha(themeColors.primary, 0.9), transform: 'translateY(-2px)' },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Add New Product
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Search and Category Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '12px', 
                backgroundColor: 'white', 
                minWidth: '300px' 
              } 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: themeColors.lightText }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: themeColors.text }}>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ borderRadius: '12px', backgroundColor: 'white' }}
            >
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={2}>
          {filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {artistProducts.length === 0 ? 'No products yet' : 'No products match your filters'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {artistProducts.length === 0 
                      ? 'Start by creating your first artwork listing' 
                      : 'Try adjusting your search criteria'
                    }
                  </Typography>
                  {artistProducts.length === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/artist/products/new')}
                    >
                      Create First Product
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getFirstImageUrl(product);
              console.log('🖼️ Product image:', { productId: product.id, imageUrl, product });
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: 380,
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 2,
                      transition: '0.2s',
                      '&:hover': { 
                        boxShadow: 6,
                        transform: 'translateY(-4px)'
                      },
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Image container */}
                    <Box
                      sx={{
                        height: 160,
                        backgroundColor: 'grey.100',
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {!imageUrl && (
                        <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                      )}
                      <Chip
                        size="small"
                        label={product.is_published ? 'Published' : 'Draft'}
                        color={product.is_published ? 'success' : 'default'}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8
                        }}
                      />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 1 }}>
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.8rem',
                          minHeight: '2.5rem'
                        }}
                      >
                        {product.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" fontWeight={700} color={themeColors.primary}>
                          Ksh {product.price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.category || 'Uncategorized'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <Typography variant="caption" color="text.secondary">
                          Stock:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {product.quantity || 0}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<Edit sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(`/artist/products/edit/${product.id}`)}
                        sx={{ mb: 1, fontSize: '0.75rem' }}
                      >
                        Edit
                      </Button>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant={product.is_published ? "outlined" : "contained"}
                          startIcon={product.is_published ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          onClick={() => handleTogglePublish(product)}
                          sx={{ fontSize: '0.7rem' }}
                          color={product.is_published ? "warning" : "success"}
                        >
                          {product.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog(product)}
                          sx={{ 
                            width: 36, 
                            height: 36,
                            border: '1px solid',
                            borderColor: 'error.main'
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* Delete Dialog */}
        <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        />
      </Container>
    </>
  );
}