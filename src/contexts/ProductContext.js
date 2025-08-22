// src/contexts/ProductContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/axios';

const ProductContext = createContext();

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [artistProducts, setArtistProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const getProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products', { params: filters });
      setProducts(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getArtistProducts = useCallback(async (artistId = null) => {
    setLoading(true);
    setError(null);
    try {
      const id = artistId || user?.id;
      if (!id) return;
      
      const response = await api.get(`/products/artist/${id}`);
      setArtistProducts(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch artist products';
      setError(errorMessage);
      console.error('Error fetching artist products:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch product';
      setError(errorMessage);
      console.error('Error fetching product:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/products', productData);
      // Refresh artist products
      await getArtistProducts();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create product';
      setError(errorMessage);
      console.error('Error creating product:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/products/${productId}`, productData);
      // Refresh artist products
      await getArtistProducts();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update product';
      setError(errorMessage);
      console.error('Error updating product:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/products/${productId}`);
      // Refresh artist products
      await getArtistProducts();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product';
      setError(errorMessage);
      console.error('Error deleting product:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePublishProduct = async (productId, isPublished) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/products/${productId}`, {
        is_published: isPublished
      });
      // Refresh artist products
      await getArtistProducts();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update product status';
      setError(errorMessage);
      console.error('Error updating product status:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    artistProducts,
    loading,
    error,
    getProducts,
    getArtistProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    togglePublishProduct,
    clearError: () => setError(null)
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}