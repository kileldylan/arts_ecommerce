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
  const { user, profile } = useAuth();

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
    // Use profile ID first, then user ID as fallback
    const id = artistId || profile?.id || user?.id;
    
    if (!id) {
      console.log('⚠️ No user ID available for artist products');
      setArtistProducts([]);
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching products for artist: ${id} (UUID: ${id.includes('-')})`);
      
      // First, let's test if the artist_id column accepts UUIDs
      const testQuery = await supabase
        .from('products')
        .select('artist_id')
        .limit(1);

      console.log('🔍 Database artist_id sample:', testQuery.data?.[0]?.artist_id);
      
      // Try the query with UUID directly
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Try different approaches based on the artist_id type
      if (testQuery.data?.[0]?.artist_id && typeof testQuery.data[0].artist_id === 'string' && testQuery.data[0].artist_id.includes('-')) {
        // Database uses UUIDs - use direct filter
        console.log('🎯 Using UUID filter');
        query = query.eq('artist_id', id);
      } else {
        // Database might use integers - use client-side filtering
        console.log('🎯 Using client-side filtering (potential type mismatch)');
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('❌ Supabase error in getArtistProducts:', supabaseError);
        
        // If there's a type error, fall back to client-side filtering
        if (supabaseError.message.includes('integer') || supabaseError.message.includes('invalid input syntax')) {
          console.log('🔄 Type mismatch detected, using client-side filtering...');
          
          const { data: allProducts, error: allError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (allError) {
            console.error('❌ Error fetching all products:', allError);
            throw allError;
          }
          
          // Filter by artist_id manually (convert both to string for comparison)
          const filteredProducts = allProducts.filter(product => 
            product.artist_id && product.artist_id.toString() === id.toString()
          );
          
          console.log(`✅ Found ${filteredProducts.length} artist products (client-side filter)`);
          setArtistProducts(filteredProducts);
          return filteredProducts;
        }
        
        throw supabaseError;
      }

      // If we used client-side filtering approach from the start, filter the results
      let finalProducts = data || [];
      if (testQuery.data?.[0]?.artist_id && typeof testQuery.data[0].artist_id === 'number') {
        console.log('🔍 Filtering results client-side for integer artist_id');
        finalProducts = finalProducts.filter(product => 
          product.artist_id && product.artist_id.toString() === id.toString()
        );
      }

      console.log(`✅ Found ${finalProducts.length} artist products`);
      setArtistProducts(finalProducts);
      return finalProducts;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch artist products';
      console.error('❌ Artist products error:', errorMessage);
      setError(errorMessage);
      setArtistProducts([]);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

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
      console.log('🔄 Creating product with artist_id:', user?.id);
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          artist_id: user?.id, // This should be UUID
          dimensions: productData.dimensions,
          materials: productData.materials,
          is_published: productData.is_published || false,
        }])
        .select()
        .single();

      if (productError) {
        console.error('❌ Product creation error:', productError);
        
        // If it's a type error, provide clear instructions
        if (productError.message.includes('integer') || productError.message.includes('invalid input syntax')) {
          throw new Error(
            'Database schema issue: artist_id column expects integer but received UUID. ' +
            'Please run this SQL in your Supabase database: ' +
            'ALTER TABLE products ALTER COLUMN artist_id TYPE UUID USING artist_id::uuid;'
          );
        }
        throw productError;
      }

      console.log('✅ Product created successfully:', product?.id);
      
      // Clear cache since products changed
      clearCache();
      
      // Refresh artist products
      await getArtistProducts();
      
      return product;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to create product';
      console.error('❌ Product creation error:', errorMessage);
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
      console.log(`🔄 Updating product: ${productId}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      console.log('✅ Product updated successfully');
      
      // Clear cache since products changed
      clearCache();
      await getArtistProducts();
      
      return data;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to update product';
      console.error('❌ Product update error:', errorMessage);
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
      console.log(`🔄 Deleting product: ${productId}`);
      
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (supabaseError) throw supabaseError;

      console.log('✅ Product deleted successfully');
      
      // Clear cache since products changed
      clearCache();
      await getArtistProducts();
      
      return { success: true };
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete product';
      console.error('❌ Product deletion error:', errorMessage);
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