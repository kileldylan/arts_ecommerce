import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

// Image Upload Service
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

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        success: true,
        publicUrl,
        filePath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
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
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async deleteImage(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static getImageUrl(filePath) {
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);
    
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
  const { user, profile } = useAuth();

  // Simple frontend cache to prevent unnecessary re-fetches
  const cacheRef = useRef({
    allProducts: null,
    lastFetch: 0,
    cacheDuration: 2 * 60 * 1000 // 2 minutes cache
  });

  // Process product images to ensure full URLs
  const processProductImages = (product) => {
    if (!product.images || !Array.isArray(product.images)) {
      return {
        ...product,
        image_url: null,
        images: []
      };
    }

    const processedImages = product.images.map(img => {
      if (typeof img === 'string') {
        return img; // Already a URL
      }
      if (img.url) {
        return img.url; // Use URL from image object
      }
      if (img.path) {
        return ImageUploadService.getImageUrl(img.path); // Convert path to URL
      }
      return img;
    });

    return {
      ...product,
      image_url: processedImages.length > 0 ? processedImages[0] : null,
      images: processedImages
    };
  };

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
      
      // Process images and update cache
      const processedProducts = (data || []).map(processProductImages);
      cacheRef.current.allProducts = processedProducts;
      cacheRef.current.lastFetch = now;

      setProducts(processedProducts);
      return processedProducts;
      
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

      // Process images
      const processedProducts = (data || []).map(processProductImages);
      
      console.log(`✅ Found ${processedProducts.length} products for artist_id ${id}`);
      setArtistProducts(processedProducts);
      return processedProducts;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch artist products';
      console.error('❌ Artist products error:', errorMessage);
      setError(errorMessage);
      setArtistProducts([]);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile?.artist_id]);

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

      return processProductImages(data);
      
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

  const createProduct = async (productData, imageFiles = []) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the INTEGER artist_id from profile
      const artistId = profile?.artist_id;
      
      if (!artistId) {
        throw new Error('Artist ID not found. Please make sure you are logged in as an artist and your profile has an artist_id.');
      }

      console.log('🔄 Creating product with artist_id:', artistId);
      
      // Upload images first
      let imageUrls = [];
      if (imageFiles.length > 0) {
        console.log('📸 Uploading product images...');
        const uploadResult = await ImageUploadService.uploadMultipleImages(imageFiles);
        if (uploadResult.success) {
          imageUrls = uploadResult.images;
          console.log(`✅ Uploaded ${imageUrls.length} images`);
        } else {
          console.warn('⚠️ Failed to upload some images:', uploadResult.failed);
        }
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
          images: imageUrls, // Store image URLs/paths
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
      
      return processProductImages(product);
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to create product';
      console.error('❌ Product creation error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData, newImageFiles = []) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Updating product: ${productId}`);
      
      let updatedImages = productData.images || [];

      // Upload new images if provided
      if (newImageFiles.length > 0) {
        console.log('📸 Uploading new product images...');
        const uploadResult = await ImageUploadService.uploadMultipleImages(newImageFiles);
        if (uploadResult.success) {
          updatedImages = [...updatedImages, ...uploadResult.images];
          console.log(`✅ Uploaded ${uploadResult.images.length} new images`);
        }
      }

      const { data, error: supabaseError } = await supabase
        .from('products')
        .update({
          ...productData,
          images: updatedImages,
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
      
      return processProductImages(data);
      
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

      // Get product first to delete associated images
      const { data: product } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

      // Delete images from storage
      if (product && product.images) {
        console.log('🗑️ Deleting product images from storage...');
        const deletePromises = product.images.map(image => {
          const imagePath = typeof image === 'string' 
            ? image.split('/').pop() // Extract filename from URL
            : image.path;
          return ImageUploadService.deleteImage(imagePath);
        });
        await Promise.all(deletePromises);
        console.log('✅ Product images deleted from storage');
      }

      // Delete product from database
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

      return (data || []).map(processProductImages);
      
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

      return (data || []).map(processProductImages);
      
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