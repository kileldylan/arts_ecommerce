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
      if (filters.category_id && filters.category_id !== '0') {
        query = query.eq('category_id', filters.category_id);
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
    // Use ONLY the integer artist_id from profile
    const id = artistId || profile?.artist_id;
    
    if (!id) {
      console.log('⚠️ No artist_id available in profile');
      console.log('Current profile artist_id:', profile?.artist_id);
      console.log('Full profile:', profile);
      setArtistProducts([]);
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching products for artist_id: ${id} (INTEGER)`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      console.log(`✅ Found ${data?.length || 0} products for artist_id ${id}`);
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
  }, [profile?.artist_id]); // ✅ Only depend on profile.artist_id

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
      // Use the INTEGER artist_id from profile
      const artistId = profile?.artist_id;
      
      if (!artistId) {
        throw new Error('Artist ID not found. Please make sure you are logged in as an artist and your profile has an artist_id.');
      }

      console.log('🔄 Creating product with artist_id:', artistId);
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          compare_price: productData.compare_price,
          cost_per_item: productData.cost_per_item,
          category_id: productData.category_id,
          artist_id: artistId,
          sku: productData.sku,
          barcode: productData.barcode,
          quantity: productData.quantity,
          allow_out_of_stock_purchases: productData.allow_out_of_stock_purchases || false,
          weight: productData.weight,
          length: productData.length,
          width: productData.width,
          height: productData.height,
          is_published: productData.is_published || false,
          is_featured: productData.is_featured || false,
          is_digital: productData.is_digital || false,
          requires_shipping: productData.requires_shipping !== undefined ? productData.requires_shipping : true,
          seo_title: productData.seo_title,
          seo_description: productData.seo_description,
          slug: productData.slug,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (productError) {
        console.error('❌ Product creation error:', productError);
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
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
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

  const getProductsByCategory = async (categoryId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching products for category: ${categoryId}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      return data || [];
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch category products';
      console.error('❌ Category products error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Searching products for: ${searchTerm}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      return data || [];
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to search products';
      console.error('❌ Product search error:', errorMessage);
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
    togglePublishProduct,
    getProductsByCategory,
    searchProducts,
    clearError: () => setError(null),
    refreshProducts: () => {
      clearCache();
      return getAllProducts();
    },
    refreshArtistProducts: () => {
      return getArtistProducts();
    }
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}