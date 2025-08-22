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
  Snackbar
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
            onClick={() => navigate('/artist/products/new')}
            size="large"
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
            artistProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Avatar
                    variant="rounded"
                    src={product.images?.[0]?.image_url}
                    sx={{ width: '100%', height: 200, bgcolor: 'grey.100' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {product.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" color="primary">
                        ${product.price}
                      </Typography>
                      <Chip
                        size="small"
                        label={product.is_published ? 'Published' : 'Draft'}
                        color={product.is_published ? 'success' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Category: {product.category_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock: {product.quantity}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      startIcon={<Edit />}
                      onClick={() => navigate(`/artist/products/edit/${product.id}`)}
                      sx={{ mb: 1 }}
                    >
                      Edit
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={product.is_published ? <VisibilityOff /> : <Visibility />}
                        onClick={() => handleTogglePublish(product)}
                      >
                        {product.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <IconButton
                        color="error"
                        onClick={() => setDeleteDialog(product)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))
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