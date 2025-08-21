// src/contexts/ProductContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContexts';

const ProductContext = createContext();

export function useProducts() {
  return useContext(ProductContext);
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [artistProducts, setArtistProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const API_BASE = 'http://localhost:5000/api';

  const getProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE}/products?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data);
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
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
      
      const response = await fetch(`${API_BASE}/products/artist/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setArtistProducts(data);
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch artist products');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching artist products:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh artist products
        await getArtistProducts();
        return data;
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh artist products
        await getArtistProducts();
        return data;
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh artist products
        await getArtistProducts();
        return data;
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
      throw err;
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
    createProduct,
    updateProduct,
    deleteProduct,
    clearError: () => setError(null)
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}