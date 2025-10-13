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
  
  if (product.image_url) {
    return product.image_url;
  }
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === 'object' && firstImage.image_url) {
      return firstImage.image_url;
    }
    if (typeof firstImage === 'string') {
      return firstImage;
    }
  }
  
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
  const [deletingProductId, setDeletingProductId] = useState(null); 

  useEffect(() => {
    if (profile?.artist_id) {
      getArtistProducts(profile.artist_id);
    }
  }, [profile, getArtistProducts]);

  const togglePublishProduct = async (productId, isPublished) => {
    try {
      await updateProduct(productId, { is_published: isPublished });
      setSuccessMessage(`Product ${isPublished ? 'published' : 'unpublished'} successfully!`);
      if (profile?.artist_id) {
        getArtistProducts(profile.artist_id);
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleDelete = async () => {
  console.log('=== DELETE PROCESS STARTING ===');
  console.log('🔄 DELETE BUTTON CLICKED');
  console.log('🔍 Delete dialog data:', deleteDialog);
  
  if (deleteDialog) {
    try {
      setDeletingProductId(deleteDialog.id); // Start loading
      console.log('🚀 Calling deleteProduct with ID:', deleteDialog.id);
      const result = await deleteProduct(deleteDialog.id);
      console.log('✅ deleteProduct returned:', result);
      
      setSuccessMessage('Product deleted successfully!');
      setDeleteDialog(null);
      console.log('=== DELETE PROCESS COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('❌ ERROR IN handleDelete:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.log('=== DELETE PROCESS FAILED ===');
    } finally {
      setDeletingProductId(null); // Stop loading regardless of outcome
    }
  } else {
    console.warn('⚠️ Delete dialog is null - this should not happen');
  }
};

  const handleTogglePublish = async (product) => {
    await togglePublishProduct(product.id, !product.is_published);
  };

  // Apply filters
  const filteredProducts = artistProducts.filter((product) => {
    const matchesCategory = selectedCategory === '0' || product.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              My Products
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
              Manage your artwork and product listings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/artist/products/new`)}
            sx={{
              px: 3,
              py: 1.2,
              fontSize: '0.9rem',
              borderRadius: '8px',
              backgroundColor: themeColors.primary,
              fontWeight: 600,
              '&:hover': { 
                backgroundColor: alpha(themeColors.primary, 0.9), 
                transform: 'translateY(-2px)' 
              },
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 8px rgba(44, 62, 80, 0.15)'
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

        {/* Search and Filter */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          backgroundColor: 'white',
          p: 2,
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': { 
                borderRadius: '8px', 
                backgroundColor: 'white',
                minWidth: { xs: '100%', sm: '300px' }
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
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ borderRadius: '8px', backgroundColor: 'white' }}
            >
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Product Grid */}
        <Grid container spacing={3}>
          {filteredProducts.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ textAlign: 'center', py: 8, boxShadow: 2, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {artistProducts.length === 0 ? 'No products yet' : 'No products match your filters'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {artistProducts.length === 0 
                      ? 'Start by creating your first product listing' 
                      : 'Try adjusting your search criteria'}
                  </Typography>
                  {artistProducts.length === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/artist/products/new')}
                      sx={{ px: 3, py: 1.2 }}
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
              
              return (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Product Card */}
                    <Card
                      sx={{
                        width: '100%',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': { 
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                          transform: 'translateY(-4px)'
                        },
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: 'white'
                      }}
                    >
                      {/* Image Container */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '100%',
                          backgroundColor: '#f8f9fa',
                          overflow: 'hidden',
                          '& img:hover': { transform: 'scale(1.05)' }
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              backgroundColor: '#f8f9fa'
                            }}
                          >
                            <ImageIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                            <Typography variant="caption" color="grey.500">
                              No Image
                            </Typography>
                          </Box>
                        )}

                      </Box>

                      {/* Price + Actions */}
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="h6"
                          fontWeight={700}
                          color={themeColors.primary}
                          sx={{ fontSize: '1rem', mb: 1 }}
                        >
                          Ksh {product.price?.toLocaleString() || '0'}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<Edit sx={{ fontSize: 16 }} />}
                            onClick={() => navigate(`/artist/products/edit/${product.id}`)}
                            sx={{ 
                              fontSize: '0.75rem',
                              py: 0.8,
                              borderRadius: '6px',
                              borderColor: themeColors.primary,
                              color: themeColors.primary,
                              '&:hover': {
                                borderColor: themeColors.primary,
                                backgroundColor: alpha(themeColors.primary, 0.04)
                              }
                            }}
                          >
                            Edit
                          </Button>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog(product)}
                            sx={{ 
                              width: 32,
                              height: 32,
                              border: '1px solid',
                              borderColor: 'error.main'
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Product Name and Category BELOW */}
                    <Box sx={{ mt: 1, textAlign: 'center', width: '100%' }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.3,
                          fontSize: '0.9rem',
                          color: themeColors.text,
                          minHeight: '2.6rem',
                        }}
                      >
                        {product.name}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* Delete Dialog */}
        <Dialog 
          open={!!deleteDialog} 
          onClose={() => setDeleteDialog(null)}
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Delete Product</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialog(null)}
              sx={{ borderRadius: '6px' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              sx={{ borderRadius: '6px' }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
    </>
  );
}
