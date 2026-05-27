import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Grid, Card, CardContent, Typography,
  Switch, FormControlLabel, MenuItem, InputAdornment, Avatar,
  CircularProgress, Alert, IconButton, FormControl, InputLabel, Select
} from '@mui/material';
import { Delete, Star, StarBorder } from '@mui/icons-material';
import { useProducts } from '../contexts/ProductContext';

// Complete categories list matching your database
const categories = [
  { id: 1, name: 'Jewelry', slug: 'jewelry' },
  { id: 2, name: 'Paintings', slug: 'paintings' },
  { id: 3, name: 'Sculptures', slug: 'sculptures' },
  { id: 4, name: 'Wood Carvings', slug: 'wood-carvings' },
  { id: 5, name: 'Gift Items', slug: 'gift-items' },
  { id: 6, name: 'Frames', slug: 'frames' },
  { id: 7, name: 'Wall Art', slug: 'wall-art' },
  { id: 8, name: 'Trophies & Awards', slug: 'trophies-awards' },
  { id: 9, name: 'Signage', slug: 'signage' },
  { id: 10, name: 'Banners', slug: 'banners' },
  { id: 11, name: 'Adhesive Stickers', slug: 'adhesive-stickers' },
  { id: 12, name: 'Board Printing', slug: 'board-printing' },
  { id: 13, name: 'Event Branding', slug: 'event-branding' },
  { id: 14, name: 'Door Signs', slug: 'door-signs' }
];

export default function ProductForm({ product, onSubmit, loading }) {
  const { createProduct, updateProduct } = useProducts();
  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    price: '', 
    compare_price: '', 
    cost_per_item: '',
    category_id: '', 
    quantity: '0', 
    sku: '', 
    barcode: '', 
    is_published: false,
    is_featured: false, 
    is_digital: false, 
    requires_shipping: true,
    allow_out_of_stock_purchases: false, 
    weight: '', 
    length: '', 
    width: '',
    height: '', 
    seo_title: '', 
    seo_description: '',
    slug: ''
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        compare_price: product.compare_price || '',
        cost_per_item: product.cost_per_item || '',
        category_id: product.category_id || '',
        quantity: product.quantity || '0',
        sku: product.sku || '',
        barcode: product.barcode || '',
        is_published: product.is_published || false,
        is_featured: product.is_featured || false,
        is_digital: product.is_digital || false,
        requires_shipping: product.requires_shipping !== false,
        allow_out_of_stock_purchases: product.allow_out_of_stock_purchases || false,
        weight: product.weight || '',
        length: product.length || '',
        width: product.width || '',
        height: product.height || '',
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        slug: product.slug || ''
      });

      // Set existing images
      setImages((product.images || []).map((url, index) => ({
        url,
        preview: url,
        filename: url.split('/').pop(),
        is_primary: index === 0,
        isNew: false
      })));
    }
  }, [product]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: ['is_published', 'is_featured', 'is_digital', 'requires_shipping', 'allow_out_of_stock_purchases'].includes(field)
        ? event.target.checked
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Prepare form data (convert to proper types)
      const submitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_per_item: formData.cost_per_item ? parseFloat(formData.cost_per_item) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        quantity: parseInt(formData.quantity) || 0,
        sku: formData.sku,
        barcode: formData.barcode,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        is_digital: formData.is_digital,
        requires_shipping: formData.requires_shipping,
        allow_out_of_stock_purchases: formData.allow_out_of_stock_purchases,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        slug: formData.slug || generateSlug(formData.name),
        images: images.filter(img => !img.isNew).map(img => img.url) // Existing images
      };

      console.log('📦 Submitting product data:', submitData);
      console.log('📸 Image files to upload:', imageFiles.length);

      let result;
      if (product) {
        // Update existing product
        result = await updateProduct(product.id, submitData, imageFiles);
      } else {
        // Create new product
        result = await createProduct(submitData, imageFiles);
      }

      if (onSubmit) {
        onSubmit(result);
      }

      // Reset form if it's a new product
      if (!product) {
        setFormData({
          name: '', description: '', price: '', compare_price: '', cost_per_item: '',
          category_id: '', quantity: '0', sku: '', barcode: '', is_published: false,
          is_featured: false, is_digital: false, requires_shipping: true,
          allow_out_of_stock_purchases: false, weight: '', length: '', width: '',
          height: '', seo_title: '', seo_description: '', slug: ''
        });
        setImages([]);
        setImageFiles([]);
      }

    } catch (err) {
      setError(err.message || 'Failed to submit product');
      console.error('❌ Product submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setError('');

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);
    const newImagePreviews = validFiles.map(file => ({
      url: file.name,
      preview: URL.createObjectURL(file),
      filename: file.name,
      is_primary: images.length === 0 && imageFiles.length === 0, // Only set as primary if no images exist
      isNew: true
    }));

    setImages(prev => [...prev, ...newImagePreviews]);
    event.target.value = '';
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    if (imageToRemove.isNew) {
      // Remove from imageFiles
      const fileIndex = imageFiles.findIndex(file => file.name === imageToRemove.filename);
      if (fileIndex !== -1) {
        setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
      // Revoke object URL
      URL.revokeObjectURL(imageToRemove.preview);
    }

    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Set new primary image if needed
    if (imageToRemove.is_primary && images.length > 1) {
      const newPrimaryIndex = index === 0 ? 0 : index - 1;
      setPrimaryImage(newPrimaryIndex);
    }
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  const renderImagePreview = (image, index) => (
    <Box key={index} sx={{ position: 'relative', mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          variant="rounded"
          src={image.preview}
          sx={{ width: 80, height: 80, flexShrink: 0 }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" noWrap>
            {image.filename}
          </Typography>
          {image.isNew && (
            <Typography variant="caption" color="primary">
              New - Ready to upload
            </Typography>
          )}
          {image.is_primary && (
            <Typography variant="caption" color="success.main">
              Primary Image
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconButton
            size="small"
            color={image.is_primary ? 'primary' : 'default'}
            onClick={() => setPrimaryImage(index)}
            title={image.is_primary ? 'Primary image' : 'Set as primary'}
            disabled={image.is_primary}
          >
            {image.is_primary ? <Star /> : <StarBorder />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => removeImage(index)}
            title="Remove image"
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Basic Information Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Product Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Enter product name"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="Describe your product in detail"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Price"
                    value={formData.price}
                    onChange={handleChange('price')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Compare at Price"
                    value={formData.compare_price}
                    onChange={handleChange('compare_price')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                    }}
                    placeholder="Original price"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost per Item"
                    value={formData.cost_per_item}
                    onChange={handleChange('cost_per_item')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                    }}
                    placeholder="Your cost"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category_id}
                      label="Category"
                      onChange={handleChange('category_id')}
                      sx={{ textAlign: 'left' }}
                    >
                      <MenuItem value="">Select a category</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={handleChange('sku')}
                    placeholder="Stock keeping unit"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Barcode"
                    value={formData.barcode}
                    onChange={handleChange('barcode')}
                    placeholder="ISBN, UPC, etc."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Slug"
                    value={formData.slug}
                    onChange={handleChange('slug')}
                    placeholder="product-url-slug"
                    helperText="URL-friendly version of the product name"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={formData.quantity}
                    onChange={handleChange('quantity')}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.allow_out_of_stock_purchases}
                        onChange={handleChange('allow_out_of_stock_purchases')}
                      />
                    }
                    label="Allow out of stock purchases"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Shipping Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shipping
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requires_shipping}
                    onChange={handleChange('requires_shipping')}
                  />
                }
                label="This product requires shipping"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_digital}
                    onChange={handleChange('is_digital')}
                  />
                }
                label="This is a digital product"
              />
              {formData.requires_shipping && !formData.is_digital && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Weight (kg)"
                      value={formData.weight}
                      onChange={handleChange('weight')}
                      placeholder="0.0"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Length (cm)"
                      value={formData.length}
                      onChange={handleChange('length')}
                      placeholder="0.0"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Width (cm)"
                      value={formData.width}
                      onChange={handleChange('width')}
                      placeholder="0.0"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Height (cm)"
                      value={formData.height}
                      onChange={handleChange('height')}
                      placeholder="0.0"
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SEO Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SEO Title"
                    value={formData.seo_title}
                    onChange={handleChange('seo_title')}
                    placeholder="Optional - for search engines"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="SEO Description"
                    value={formData.seo_description}
                    onChange={handleChange('seo_description')}
                    placeholder="Optional - for search engines"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Images and Status */}
        <Grid item xs={12} md={4}>
          {/* Product Images Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Images
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Upload high-quality images of your product. The first image will be used as the primary display image.
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="product-images"
                type="file"
                multiple
                onChange={handleImageUpload}
              />
              <label htmlFor="product-images">
                <Button variant="outlined" component="span" fullWidth>
                  Upload Images
                </Button>
              </label>
              <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                {images.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                    No images uploaded yet
                  </Typography>
                ) : (
                  images.map((image, index) => renderImagePreview(image, index))
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_published}
                    onChange={handleChange('is_published')}
                  />
                }
                label="Published"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={handleChange('is_featured')}
                  />
                }
                label="Featured"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={submitting || loading}
                startIcon={(submitting || loading) && <CircularProgress size={20} />}
              >
                {(submitting || loading) ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}