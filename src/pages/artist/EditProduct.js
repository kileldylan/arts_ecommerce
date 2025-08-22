// src/pages/artist/EditProduct.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useProducts } from '../../contexts/ProductContext';
import ProductForm from '../../forms/ProductForm';
import Navbar from '../../components/NavBar';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, updateProduct, loading, error, clearError } = useProducts();
  const [product, setProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setFetchLoading(true);
        const productData = await getProduct(id);
        if (isMounted) {
          setProduct(productData);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        if (isMounted) {
          setFetchLoading(false);
        }
      }
    };

    if (id) {
      fetchProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]); // Remove getProduct from dependencies

  const handleSubmit = async (formData) => {
    try {
      const result = await updateProduct(id, formData);
      setSuccessMessage('Product updated successfully!');
      setTimeout(() => {
        navigate('/artist/products');
      }, 1500);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleCloseError = () => {
    clearError();
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  if (fetchLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading product...
          </Typography>
        </Container>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Product not found
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Edit Product
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Update your artwork listing
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseError}>
            {error}
          </Alert>
        )}

        <ProductForm 
          product={product} 
          onSubmit={handleSubmit} 
          loading={loading} 
        />

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