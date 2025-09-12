// src/pages/artist/ProductList.js
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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar,
  alpha
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/NavBar';

const STATIC_BASE_URL = "http://localhost:5000"; // static file host

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

/**
 * Get a normalized full image URL for the product.
 * Accepts either:
 *  - product.images = ['uploads/foo.jpg'] (array of strings)
 *  - product.images = ['/uploads/foo.jpg']
 *  - product.images = [{ image_url: 'uploads/foo.jpg' }] (array of objects)
 *
 * Returns absolute URL like "http://localhost:5000/uploads/foo.jpg" or undefined.
 */
function getFirstImageUrl(product) {
  if (!product || !product.images || product.images.length === 0) return undefined;

  const first = product.images[0];

  // If it's an object with common keys:
  if (typeof first === 'object' && first !== null) {
    // try common property names
    const candidate = first.image_url || first.url || first.path || first.src || first;
    if (typeof candidate === 'string' && candidate.length > 0) {
      const normalized = candidate.replace(/^\/?/, ''); // strip leading slash if present
      return `${STATIC_BASE_URL}/${normalized}`;
    }
    return undefined;
  }

  // If it's a string
  if (typeof first === 'string') {
    const normalized = first.replace(/^\/?/, ''); // strip leading slash if present
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

  const handleCloseError = () => {
    clearError();
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  if (loading && artistProducts.length === 0) {
    return (
      <>
        <Navbar />
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
              My Products
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Manage your artwork listings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/artist/products/new`)}
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
          >
            Add New Product
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseError}>
            {error}
          </Alert>
        )}

        {/* Products Grid */}
        <Grid container spacing={3}>
          {artistProducts.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
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
                </CardContent>
              </Card>
            </Grid>
          ) : (
            artistProducts.map((product) => {
              // Debug line you can enable during development:
              // console.log('product.images for product', product.id, product.images);

              const imageUrl = getFirstImageUrl(product);

              return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ 
                  height: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: 2,
                  transition: 'box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}>
                  <Avatar
                    variant="rounded"
                    src={imageUrl || undefined}
                    sx={{ 
                      width: '100%', 
                      height: 120,
                      bgcolor: 'grey.100',
                      borderRadius: '8px 8px 0 0'
                    }}
                  />
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    p: 1, 
                    '&:last-child': {
                      pb: 1
                    }
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 600, 
                      mb: 0.5,
                      lineHeight: 1.2
                    }}>
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
                        lineHeight: 1.2
                      }}
                    >
                      {product.description?.substring(0, 60)}...
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1 
                    }}>
                      <Typography variant="h6" color="primary" sx={{ 
                        fontSize: '1rem', 
                        fontWeight: 700 
                      }}>
                        Ksh{product.price}
                      </Typography>
                      <Chip
                        size="small"
                        label={product.is_published ? 'Published' : 'Draft'}
                        color={product.is_published ? 'success' : 'default'}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          '& .MuiChip-label': {
                            px: 0.5
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mb: 0.25,
                      fontSize: '0.7rem'
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Category:
                      </Typography>
                      <Typography variant="caption" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                        {product.category_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Stock:
                      </Typography>
                      <Typography variant="caption" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
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
                      sx={{ 
                        mb: 0.5,
                        fontSize: '0.75rem',
                        py: 0.25,
                        minHeight: 'auto'
                      }}
                    >
                      Edit
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={product.is_published ? 
                          <VisibilityOff sx={{ fontSize: 16 }} /> : 
                          <Visibility sx={{ fontSize: 16 }} />
                        }
                        onClick={() => handleTogglePublish(product)}
                        sx={{ 
                          fontSize: '0.7rem',
                          py: 0.25,
                          minHeight: 'auto'
                        }}
                      >
                        {product.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog(product)}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          '& svg': {
                            fontSize: 18
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              );
            })
          )}
        </Grid>

        {/* Delete Confirmation Dialog */}
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
          onClose={handleCloseSuccess}
          message={successMessage}
        />
      </Container>
    </>
  );
}
