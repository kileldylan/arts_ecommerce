// backend/controllers/productController.js
const supabase = require('../config/supabase');
const { clearCache } = require('../middleware/cache'); // We'll create this

const normalizeProduct = (product) => {
  if (product.images && typeof product.images === 'string') {
    try {
      return { ...product, images: JSON.parse(product.images) };
    } catch {
      return { ...product, images: [] };
    }
  }
  return product;
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const filters = { ...req.query };
    
    let query = supabase
      .from('products')
      .select('*, categories(name)');

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.artist_id) {
      query = query.eq('artist_id', filters.artist_id);
    }
    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published === 'true');
    }
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured === 'true');
    }

    const { data: products, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    res.json(products.map(normalizeProduct));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', productId)
      .limit(1);

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(normalizeProduct(products[0]));
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get products by artist
exports.getArtistProducts = async (req, res) => {
  try {
    const artistId = req.params.artistId || req.user.id;
    const filters = { artist_id: artistId, ...req.query };
    
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('artist_id', artistId);

    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published === 'true');
    }

    const { data: products, error } = await query;

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    res.json(products.map(normalizeProduct));
  } catch (error) {
    console.error('Get artist products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions
const parseBoolean = (value) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  if (value === 'on') return true;
  if (value === 'off') return false;
  return Boolean(value);
};

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user);

    // Validate authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required: user ID missing' });
    }

    // Validate required fields
    const {
      name, description, price, compare_price, cost_per_item, category_id,
      sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug
    } = req.body;

    if (!name || !description || !price || !category_id) {
      return res.status(400).json({
        message: 'Missing required fields: name, description, price, or category_id',
      });
    }

    // For Supabase, we'll handle file uploads separately
    const imagePaths = []; // We'll implement Supabase Storage later

    const productData = {
      name,
      description,
      price: parseNumber(price),
      compare_price: parseNumber(compare_price),
      cost_per_item: parseNumber(cost_per_item),
      category_id: parseInt(category_id),
      artist_id: req.user.id,
      sku: sku === '' || sku === undefined || sku === null ? null : sku,
      barcode: barcode || '',
      quantity: parseInt(quantity) || 0,
      allow_out_of_stock_purchases: parseBoolean(allow_out_of_stock_purchases),
      weight: parseNumber(weight),
      length: parseNumber(length),
      width: parseNumber(width),
      height: parseNumber(height),
      is_published: parseBoolean(is_published),
      is_featured: parseBoolean(is_featured),
      is_digital: parseBoolean(is_digital),
      requires_shipping: parseBoolean(requires_shipping),
      seo_title: seo_title || '',
      seo_description: seo_description || '',
      slug,
      images: imagePaths,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Product data for Supabase:', productData);

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Clear cache for products
    await clearCache('cache:/api/products*');

    res.status(201).json(product);

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name, description, price, compare_price, cost_per_item, category_id,
      artist_id, sku, barcode, quantity, allow_out_of_stock_purchases,
      weight, length, width, height, is_published, is_featured, is_digital,
      requires_shipping, seo_title, seo_description, slug
    } = req.body;

    // For now, handle images the same way (we'll update for Supabase Storage)
    const imagePaths = [];

    const updatedData = {
      name,
      description,
      price: parseNumber(price),
      compare_price: parseNumber(compare_price),
      cost_per_item: parseNumber(cost_per_item),
      category_id: parseInt(category_id),
      artist_id: parseInt(artist_id),
      sku,
      barcode,
      quantity: parseInt(quantity) || 0,
      allow_out_of_stock_purchases: parseBoolean(allow_out_of_stock_purchases),
      weight: parseNumber(weight),
      length: parseNumber(length),
      width: parseNumber(width),
      height: parseNumber(height),
      is_published: parseBoolean(is_published),
      is_featured: parseBoolean(is_featured),
      is_digital: parseBoolean(is_digital),
      requires_shipping: parseBoolean(requires_shipping),
      seo_title,
      seo_description,
      slug,
      updated_at: new Date().toISOString()
    };

    // Only update images if new ones are provided
    if (imagePaths.length > 0) {
      updatedData.images = imagePaths;
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Clear cache
    await clearCache('cache:/api/products*');
    await clearCache(`cache:/api/products/${id}`);

    res.status(200).json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // First check if product exists and user has permission
    const { data: products, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .limit(1);

    if (findError) {
      return res.status(500).json({ message: 'Server error', error: findError.message });
    }

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    if (product.artist_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return res.status(500).json({ message: 'Server error', error: deleteError.message });
    }

    // Clear cache
    await clearCache('cache:/api/products*');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};