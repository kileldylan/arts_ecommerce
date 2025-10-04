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
import { Add, Edit, Delete, Visibility, VisibilityOff, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';

const STATIC_BASE_URL = "http://localhost:5000";

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

// Categories to match database (same as CustomerDashboard)
const categories = [
  { id: 0, name: 'All Categories', slug: 'all' },
  { id: 1, name: 'Jewelry', slug: 'jewelry' },
  { id: 2, name: 'Paintings', slug: 'paintings' },
  { id: 3, name: 'Sculptures', slug: 'sculptures' },
  { id: 4, name: 'Wood Carvings', slug: 'wood-carvings' }
];

function getFirstImageUrl(product) {
  if (!product || !product.images || product.images.length === 0) return undefined;
  const first = product.images[0];
  if (typeof first === 'object' && first !== null) {
    const candidate = first.image_url || first.url || first.path || first.src || first;
    if (typeof candidate === 'string' && candidate.length > 0) {
      const normalized = candidate.replace(/^\/?/, '');
      return `${STATIC_BASE_URL}/${normalized}`;
    }
    return undefined;
  }
  if (typeof first === 'string') {
    const normalized = first.replace(/^\/?/, '');
    return `${STATIC_BASE_URL}/${normalized}`;
  }
  return undefined;
}

export default function ProductList() {
  const navigate = useNavigate();
  const { artistProducts, loading, deleteProduct, getArtistProducts, togglePublishProduct, error, clearError } = useProducts();
  const { user } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('0');

  useEffect(() => {
    if (user) {
      getArtistProducts(user.id);
    }
  }, [user, getArtistProducts]);

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
    try {
      await togglePublishProduct(product.id, !product.is_published);
      setSuccessMessage(`Product ${!product.is_published ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  // Apply filters
  const filteredProducts = artistProducts.filter((product) => {
    const matchesCategory = selectedCategory === '0' || product.category_id === parseInt(selectedCategory);
    const matchesSearch =
      !searchTerm ||
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading && artistProducts.length === 0) {
    return (
      <>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      </>
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
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: 'white', maxWidth: '400px' } }}
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
                <MenuItem key={category.id} value={category.id.toString()}>
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
                    No products yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start by creating your first artwork listing
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/artist/products/new')}
                  >
                    Create First Product
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getFirstImageUrl(product);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 2,
                      transition: '0.2s',
                      '&:hover': { boxShadow: 6 }
                    }}
                  >
                    {/* Image container */}
                    <Box
                      sx={{
                        height: 140,
                        backgroundColor: 'grey.100',
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px 8px 0 0'
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
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
                          fontSize: '0.8rem'
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" fontWeight={700}>
                          Ksh{product.price}
                        </Typography>
                        <Chip
                          size="small"
                          label={product.is_published ? 'Published' : 'Draft'}
                          color={product.is_published ? 'success' : 'default'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <Typography variant="caption" color="text.secondary">
                          Stock:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {product.quantity}
                        </Typography>
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 1, pt: 0 }}>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<Edit sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(`/artist/products/edit/${product.id}`)}
                        sx={{ mb: 0.5, fontSize: '0.75rem', py: 0.25 }}
                      >
                        Edit
                      </Button>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={product.is_published ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          onClick={() => handleTogglePublish(product)}
                          sx={{ fontSize: '0.7rem', py: 0.25 }}
                        >
                          {product.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog(product)}
                          sx={{ width: 30, height: 30 }}
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