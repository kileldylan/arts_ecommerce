import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

// Image Upload Service (unchanged, keep as is)
class ImageUploadService {
  static BUCKET_NAME = 'product-images';

  static async uploadImage(file, folder = 'products') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { success: true, publicUrl, filePath };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  }

  static async uploadMultipleImages(files, folder = 'products') {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      const results = await Promise.all(uploadPromises);

      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      return {
        success: true,
        images: successfulUploads.map(result => ({
          url: result.publicUrl,
          path: result.filePath
        })),
        failed: failedUploads
      };
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  }

  static getImageUrl(filePath) {
    const { data: { publicUrl } } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);
    return publicUrl;
  }
}

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
  const { profile, validateSession } = useAuth();

  // Enhanced cache with multiple layers
  const cacheRef = useRef({
    allProducts: null,
    productsByCategory: new Map(),
    productsById: new Map(),
    lastFetch: 0,
    cacheDuration: 5 * 60 * 1000, // 5 minutes (increased from 2)
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: false
  });

  // Abort controller for canceling pending requests
  const abortControllerRef = useRef(null);

  const ensureValidSession = async (operation = 'operation') => {
    try {
      console.log(`🔍 Validating session for ${operation}...`);
      
      if (validateSession) {
        const session = await validateSession();
        if (!session) throw new Error('No valid session. Please log in again.');
        return session;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) throw new Error('No active session. Please log in again.');
      return session;
    } catch (error) {
      console.error(`💥 Session validation failed:`, error);
      throw error;
    }
  };

  const handleOperationError = useCallback((error, operation) => {
    console.error(`❌ ${operation} failed:`, error);
    if (error.message?.includes('session') || error.message?.includes('auth') || error.message?.includes('JWT') || error.code === 401) {
      const sessionError = 'Your session has expired. Please refresh the page and try again.';
      setError(sessionError);
      throw new Error(sessionError);
    }
    const errorMessage = error.message || `Failed to ${operation}`;
    setError(errorMessage);
    throw new Error(errorMessage);
  }, []);

  const processProductImages = useCallback((product) => {
    if (!product) return product;
    if (!product.images || !Array.isArray(product.images)) {
      return { ...product, image_url: null, images: [] };
    }

    const processedImages = product.images.map(img => {
      if (typeof img === 'string') return img;
      if (img.url) return img.url;
      if (img.path) return ImageUploadService.getImageUrl(img.path);
      return img;
    });

    return {
      ...product,
      image_url: processedImages.length > 0 ? processedImages[0] : null,
      images: processedImages
    };
  }, []);

  // OPTIMIZED: Get all products with caching, pagination, and abort support
  const getAllProducts = useCallback(async (options = {}) => {
    const { forceRefresh = false, categoryId = null, page = 1, limit = 12, search = '' } = options;
    
    // Check cache
    const now = Date.now();
    if (!forceRefresh && cacheRef.current.allProducts && (now - cacheRef.current.lastFetch) < cacheRef.current.cacheDuration) {
      console.log('✅ Serving products from cache');
      setProducts(cacheRef.current.allProducts);
      return cacheRef.current.allProducts;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching products from Supabase...');
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (categoryId && categoryId !== '0') {
        query = query.eq('category_id', categoryId);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      console.log(`✅ Successfully fetched ${data?.length || 0} products (Total: ${count})`);
      
      const processedProducts = (data || []).map(processProductImages);
      
      // Update cache
      cacheRef.current.allProducts = processedProducts;
      cacheRef.current.lastFetch = now;
      
      // Update pagination
      setPagination({
        page,
        limit,
        total: count || 0,
        hasMore: (page * limit) < (count || 0)
      });

      setProducts(processedProducts);
      return processedProducts;
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleOperationError(err, 'fetch products');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleOperationError, processProductImages]);

  // OPTIMIZED: Prefetch next page for smoother pagination
  const prefetchNextPage = useCallback(async () => {
    if (!pagination.hasMore) return;
    
    const nextPage = pagination.page + 1;
    const from = (nextPage - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .eq('is_published', true)
        .range(from, to)
        .limit(pagination.limit);
      
      if (data && data.length > 0) {
        console.log(`📦 Prefetched ${data.length} products for page ${nextPage}`);
      }
    } catch (err) {
      // Silently fail - prefetch is optional
      console.debug('Prefetch failed:', err.message);
    }
  }, [pagination]);

  // OPTIMIZED: Get artist products with caching
  const getArtistProducts = useCallback(async (artistId = null, forceRefresh = false) => {
    const id = artistId || profile?.artist_id;
    if (!id) {
      setArtistProducts([]);
      return [];
    }

    // Check cache for artist products
    const cacheKey = `artist_${id}`;
    const now = Date.now();
    if (!forceRefresh && cacheRef.current[cacheKey] && (now - cacheRef.current[`${cacheKey}_time`]) < cacheRef.current.cacheDuration) {
      console.log(`✅ Serving artist products from cache for ${id}`);
      setArtistProducts(cacheRef.current[cacheKey]);
      return cacheRef.current[cacheKey];
    }

    setLoading(true);
    setError(null);
    
    try {
      await ensureValidSession('fetch artist products');
      
      console.log(`🔄 Fetching products for artist_id: ${id}`);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('artist_id', id)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedProducts = (data || []).map(processProductImages);
      
      // Cache the results
      cacheRef.current[cacheKey] = processedProducts;
      cacheRef.current[`${cacheKey}_time`] = now;
      
      console.log(`✅ Found ${processedProducts.length} products for artist_id ${id}`);
      setArtistProducts(processedProducts);
      return processedProducts;
      
    } catch (err) {
      console.error('Error fetching artist products:', err);
      setError(err.message || 'Failed to fetch artist products');
      return [];
    } finally {
      setLoading(false);
    }
  }, [profile?.artist_id, ensureValidSession, processProductImages]);

  // OPTIMIZED: Get single product with caching
  const getProduct = useCallback(async (productId, forceRefresh = false) => {
    if (!productId) throw new Error('Product ID is required');

    // Check cache first
    if (!forceRefresh && cacheRef.current.productsById.has(productId)) {
      console.log(`✅ Serving product ${productId} from cache`);
      return cacheRef.current.productsById.get(productId);
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

      const processedProduct = processProductImages(data);
      
      // Cache the result
      cacheRef.current.productsById.set(productId, processedProduct);
      
      return processedProduct;
      
    } catch (err) {
      handleOperationError(err, 'fetch product');
    } finally {
      setLoading(false);
    }
  }, [handleOperationError, processProductImages]);

  const clearCache = useCallback(() => {
    cacheRef.current = {
      allProducts: null,
      productsByCategory: new Map(),
      productsById: new Map(),
      lastFetch: 0,
      cacheDuration: 5 * 60 * 1000,
    };
  }, []);

  const createProduct = async (productData, imageFiles = []) => {
    setLoading(true);
    setError(null);
    
    try {
      await ensureValidSession('create product');
      
      const artistId = profile?.artist_id;
      if (!artistId) throw new Error('Artist ID not found.');

      let imageUrls = [];
      if (imageFiles.length > 0) {
        const uploadResult = await ImageUploadService.uploadMultipleImages(imageFiles);
        if (uploadResult.success) imageUrls = uploadResult.images;
      }

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
          images: imageUrls,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (productError) throw productError;

      clearCache();
      await getArtistProducts();
      
      return processProductImages(product);
      
    } catch (err) {
      handleOperationError(err, 'create product');
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData, newImageFiles = []) => {
    setLoading(true);
    setError(null);
    
    try {
      await ensureValidSession('update product');
      
      let updatedImages = productData.images || [];
      if (newImageFiles.length > 0) {
        const uploadResult = await ImageUploadService.uploadMultipleImages(newImageFiles);
        if (uploadResult.success) updatedImages = [...updatedImages, ...uploadResult.images];
      }

      const { data, error: supabaseError } = await supabase
        .from('products')
        .update({ ...productData, images: updatedImages, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      clearCache();
      await getArtistProducts();
      
      return processProductImages(data);
      
    } catch (err) {
      handleOperationError(err, 'update product');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    
    try {
      await ensureValidSession('delete product');
      
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (supabaseError) throw supabaseError;

      clearCache();
      if (profile?.artist_id) await getArtistProducts(profile.artist_id, true);
      
      return { success: true };
      
    } catch (err) {
      handleOperationError(err, 'delete product');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishProduct = async (productId, isPublished) => {
    return updateProduct(productId, { is_published: isPublished });
  };

  const getProductsByCategory = async (categoryId) => {
    // Check category cache
    if (cacheRef.current.productsByCategory.has(categoryId)) {
      return cacheRef.current.productsByCategory.get(categoryId);
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedProducts = (data || []).map(processProductImages);
      cacheRef.current.productsByCategory.set(categoryId, processedProducts);
      
      return processedProducts;
      
    } catch (err) {
      handleOperationError(err, 'fetch category products');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      return (data || []).map(processProductImages);
      
    } catch (err) {
      handleOperationError(err, 'search products');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    products,
    artistProducts,
    loading,
    error,
    pagination,
    getAllProducts,
    getArtistProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    togglePublishProduct,
    getProductsByCategory,
    searchProducts,
    prefetchNextPage,
    clearError: () => setError(null),
    refreshProducts: () => {
      clearCache();
      return getAllProducts({ forceRefresh: true });
    },
    refreshArtistProducts: () => {
      return getArtistProducts(null, true);
    }
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}