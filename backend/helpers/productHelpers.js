// backend/helpers/productHelpers.js
const supabase = require('../config/supabase');

const ProductHelpers = {
  // Generate slug from product name
  generateSlug: (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  },

  // Generate unique slug
  generateUniqueSlug: async (name) => {
    const baseSlug = ProductHelpers.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter++}`;
    }
  },

  // Safe JSON parse for images
  safeJsonParse: (str) => {
    try {
      return str ? JSON.parse(str) : [];
    } catch {
      return [];
    }
  },

  // Format image URLs
  formatImageUrls: (imagesArray) => {
    if (!Array.isArray(imagesArray)) return [];
    return imagesArray
      .map((img) => {
        if (!img) return '';
        if (img.startsWith('http') || img.startsWith('/uploads')) return img;
        return `/uploads/${img}`;
      })
      .filter(Boolean);
  },

  // Parse boolean values from form data
  parseBoolean: (value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    if (value === 'on') return true;
    if (value === 'off') return false;
    return Boolean(value);
  },

  // Parse number values
  parseNumber: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },

  // Normalize product data
  normalizeProduct: (product) => {
    return {
      ...product,
      images: ProductHelpers.formatImageUrls(ProductHelpers.safeJsonParse(product.images))
    };
  },

  // Prepare product data for database
  prepareProductData: (productData) => {
    const processedData = { ...productData };

    // Parse numbers
    ['price', 'compare_price', 'cost_per_item', 'weight', 'length', 'width', 'height'].forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = ProductHelpers.parseNumber(processedData[field]);
      }
    });

    // Parse booleans
    ['allow_out_of_stock_purchases', 'is_published', 'is_featured', 'is_digital', 'requires_shipping'].forEach(field => {
      if (processedData[field] !== undefined) {
        processedData[field] = ProductHelpers.parseBoolean(processedData[field]);
      }
    });

    // Handle quantity
    if (processedData.quantity !== undefined) {
      processedData.quantity = parseInt(processedData.quantity) || 0;
    }

    // Handle category_id
    if (processedData.category_id !== undefined) {
      processedData.category_id = parseInt(processedData.category_id);
    }

    // Handle images
    if (processedData.images && Array.isArray(processedData.images)) {
      processedData.images = JSON.stringify(processedData.images);
    }

    // Add timestamps for new products
    if (!processedData.id) {
      processedData.created_at = new Date().toISOString();
    }
    processedData.updated_at = new Date().toISOString();

    return processedData;
  }
};

module.exports = ProductHelpers;