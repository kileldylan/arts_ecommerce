// src/pages/artist/EditProduct.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useProducts } from '../../contexts/ProductContext';
import ProductForm from '../../forms/ProductForm';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { artistProducts, updateProduct, loading } = useProducts();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const foundProduct = artistProducts.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
    }
  }, [id, artistProducts]);

  const handleSubmit = async (formData) => {
    try {
      await updateProduct(id, formData);
      navigate('/artist/products');
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Edit Product
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Update your artwork listing
        </Typography>
      </Box>

      <ProductForm product={product} onSubmit={handleSubmit} loading={loading} />
    </Container>
  );
}