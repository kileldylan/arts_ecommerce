/////// src/contexts/ProductContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

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

  const getAllProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:artist_id (first_name, last_name, avatar_url),
          product_images (*)
        `)
        .eq('is_published', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setProducts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch products';
      setError(errorMessage);
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

      const { data, error: supabaseError } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*)
        `)
        .eq('artist_id', id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setArtistProducts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch artist products';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select(`
          *,
          profiles:artist_id (*),
          product_images (*)
        `)
        .eq('id', productId)
        .single();

      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch product';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      // First create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          title: productData.title,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          artist_id: user.id,
          dimensions: productData.dimensions,
          materials: productData.materials,
          is_published: productData.is_published || false,
        }])
        .select()
        .single();

      if (productError) throw productError;

      // Handle image uploads if any
      if (productData.images && productData.images.length > 0) {
        const imageRecords = productData.images.map((image, index) => ({
          product_id: product.id,
          image_url: image.url, // Assuming you've uploaded to Supabase Storage
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imageError) throw imageError;
      }

      await getArtistProducts();
      return product;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create product';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await getArtistProducts();
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update product';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (supabaseError) throw supabaseError;

      await getArtistProducts();
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete product';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePublishProduct = async (productId, isPublished) => {
    return updateProduct(productId, { is_published: isPublished });
  };

  const value = {
    products,
    artistProducts,
    loading,
    error,
    getAllProducts,
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