// src/pages/artist/AddProduct.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import ProductForm from '../../forms/ProductForm';

export default function AddProduct() {
  const navigate = useNavigate();
  const { createProduct, loading } = useProducts();

  const handleSubmit = async (formData) => {
    try {
      await createProduct(formData);
      navigate('/artist/products');
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Add New Product
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create a new artwork listing
        </Typography>
      </Box>

      <ProductForm onSubmit={handleSubmit} loading={loading} />
    </Container>
  );
}