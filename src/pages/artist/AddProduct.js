// src/pages/artist/AddProduct.js
import React, { useState } from 'react';
import { Container, Typography, Box, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import ProductForm from '../../forms/ProductForm';

export default function AddProduct() {
  const navigate = useNavigate();
  const { createProduct, loading, error, clearError } = useProducts();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (formData) => {
    try {
      const result = await createProduct(formData);
      setSuccessMessage('Product created successfully!');
      setTimeout(() => {
        navigate('/artist/products');
      }, 1000);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleCloseError = () => {
    clearError();
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            Add New Product
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Create a new artwork listing
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={handleCloseError}>
            {error}
          </Alert>
        )}

        <ProductForm onSubmit={handleSubmit} loading={loading} />

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