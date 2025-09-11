import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Grid, Card, CardContent, Typography,
  Switch, FormControlLabel, MenuItem, InputAdornment, Avatar,
  CircularProgress, Alert, IconButton
} from '@mui/material';
import { Delete, Star, StarBorder } from '@mui/icons-material';

const categories = [
  { id: 1, name: 'Jewelry', slug: 'jewelry' },
  { id: 2, name: 'Paintings', slug: 'paintings' },
  { id: 3, name: 'Sculptures', slug: 'sculptures' },
  { id: 4, name: 'Wood Carvings', slug: 'wood-carvings' }
];

export default function ProductForm({ product, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', compare_price: '', cost_per_item: '',
    category_id: '', quantity: '0', sku: '', barcode: '', is_published: false,
    is_featured: false, is_digital: false, requires_shipping: true,
    allow_out_of_stock_purchases: false, weight: '', length: '', width: '',
    height: '', seo_title: '', seo_description: ''
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState('');

  // Backend base URL (configure in .env or hardcode for now)
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        seo_description: product.seo_description || ''
      });

      // Set existing images with full URLs
      setImages((product.images || []).map((url, index) => ({
        url,
        preview: `${BASE_URL}${url}`,
        filename: url.split('/').pop(),
        is_primary: index === 0,
        isNew: false
      })));
    }
  }, [product, BASE_URL]);

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

  try {
    const submitData = new FormData();
    
    // Convert all form data to strings for FormData
    Object.keys(formData).forEach(key => {
      let value = formData[key];
      
      // Convert booleans to strings
      if (typeof value === 'boolean') {
        value = value.toString();
      }
      
      // Convert numbers to strings
      if (typeof value === 'number') {
        value = value.toString();
      }
      
      if (value !== null && value !== undefined) {
        submitData.append(key, value);
      }
    });

    // Debug: Log all form data entries
    console.log('FormData entries:');
    for (let [key, value] of submitData.entries()) {
      console.log(key, value);
    }

    // Append new image files
    imageFiles.forEach(file => {
      console.log('Appending file:', file.name, file.size);
      submitData.append('images', file);
    });

    await onSubmit(submitData);
    setImageFiles([]);
    
  } catch (err) {
    setError(err.message || 'Failed to submit product');
  }
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
      is_primary: images.length === 0,
      isNew: true
    }));

    setImages(prev => [...prev, ...newImagePreviews]);
    event.target.value = '';
  };

  const removeImage = (index) => {
    const imageToRemove = images[index];
    if (imageToRemove.isNew) {
      const fileIndex = imageFiles.findIndex(file => file.name === imageToRemove.filename);
      if (fileIndex !== -1) {
        setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
      URL.revokeObjectURL(imageToRemove.preview);
    }

    setImages(prev => prev.filter((_, i) => i !== index));
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
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconButton
            size="small"
            color={image.is_primary ? 'primary' : 'default'}
            onClick={() => setPrimaryImage(index)}
            title={image.is_primary ? 'Primary image' : 'Set as primary'}
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
                  <TextField
                    required
                    fullWidth
                    select
                    label="Category"
                    value={formData.category_id}
                    onChange={handleChange('category_id')}
                  >
                    <MenuItem value="">Select a category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
        <Grid item xs={12} md={4}>
          <Card>
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
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
              </Button>
            </CardContent>
          </Card>
          <Card sx={{ mt: 3 }}>
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
        </Grid>
      </Grid>
    </Box>
  );
}