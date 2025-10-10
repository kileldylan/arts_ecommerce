import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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

  // Simple frontend cache to prevent unnecessary re-fetches
  const cacheRef = useRef({
    allProducts: null,
    lastFetch: 0,
    cacheDuration: 2 * 60 * 1000 // 2 minutes cache
  });

  const getAllProducts = useCallback(async (filters = {}) => {
    // Check cache first
    const now = Date.now();
    if (cacheRef.current.allProducts && 
        (now - cacheRef.current.lastFetch) < cacheRef.current.cacheDuration) {
      console.log('✅ Serving from frontend cache');
      setProducts(cacheRef.current.allProducts);
      return cacheRef.current.allProducts;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching products from Supabase...');
      
      // SIMPLE QUERY - No complex joins that might fail
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Apply basic filters
      if (filters.category && filters.category !== '0') {
        query = query.eq('category', filters.category);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} products`);
      
      // Update cache
      cacheRef.current.allProducts = data || [];
      cacheRef.current.lastFetch = now;

      setProducts(data || []);
      return data || [];
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch products';
      console.error('❌ Product fetch error:', errorMessage);
      setError(errorMessage);
      setProducts([]); // Set empty array to prevent undefined errors
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getArtistProducts = useCallback(async (artistId = null) => {
    const id = artistId || user?.id;
    if (!id) {
      console.log('⚠️ No user ID available for artist products');
      setArtistProducts([]);
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching products for artist: ${id}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      console.log(`✅ Found ${data?.length || 0} artist products`);
      setArtistProducts(data || []);
      return data || [];
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch artist products';
      console.error('❌ Artist products error:', errorMessage);
      setError(errorMessage);
      setArtistProducts([]);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getProduct = async (productId) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching product: ${productId}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (supabaseError) throw supabaseError;

      return data;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch product';
      console.error('❌ Single product error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear cache when products are modified
  const clearCache = () => {
    cacheRef.current.allProducts = null;
    cacheRef.current.lastFetch = 0;
  };

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
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

      // Clear cache since products changed
      clearCache();
      
      // Refresh artist products
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

      // Clear cache since products changed
      clearCache();
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

      // Clear cache since products changed
      clearCache();
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
    clearError: () => setError(null),
    refreshProducts: () => {
      clearCache();
      return getAllProducts();
    }
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}