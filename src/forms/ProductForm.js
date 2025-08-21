// src/components/forms/ProductForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  MenuItem,
  InputAdornment,
  Chip,
  Avatar
} from '@mui/material';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContexts';

const categories = [
  { id: 1, name: 'Jewelry', slug: 'jewelry' },
  { id: 2, name: 'Paintings', slug: 'paintings' },
  { id: 3, name: 'Sculptures', slug: 'sculptures' },
  { id: 4, name: 'Textiles', slug: 'textiles' },
  { id: 5, name: 'Pottery', slug: 'pottery' },
  { id: 6, name: 'Baskets', slug: 'baskets' },
  { id: 7, name: 'Wood Carvings', slug: 'wood-carvings' },
  { id: 8, name: 'Beadwork', slug: 'beadwork' }
];

export default function ProductForm({ product, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    quantity: '',
    sku: '',
    is_published: false,
    is_featured: false,
    requires_shipping: true,
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  const [images, setImages] = useState([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category_id: product.category_id || '',
        quantity: product.quantity || '',
        sku: product.sku || '',
        is_published: product.is_published || false,
        is_featured: product.is_featured || false,
        requires_shipping: product.requires_shipping !== false,
        weight: product.weight || '',
        length: product.length || '',
        width: product.width || '',
        height: product.height || ''
      });
      setImages(product.images || []);
    }
  }, [product]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'is_published' || field === 'is_featured' || field === 'requires_shipping' 
        ? event.target.checked 
        : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, images });
  };

  const handleImageUpload = (event) => {
    // Simulate image upload - in real app, you'd upload to cloud storage
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      image_url: URL.createObjectURL(file),
      alt_text: file.name,
      is_primary: images.length === 0
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Basic Information */}
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
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Price"
                    value={formData.price}
                    onChange={handleChange('price')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
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

          {/* Inventory */}
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
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={handleChange('sku')}
                    placeholder="Optional"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Shipping */}
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
              {formData.requires_shipping && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Weight (kg)"
                      value={formData.weight}
                      onChange={handleChange('weight')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Length (cm)"
                      value={formData.length}
                      onChange={handleChange('length')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Width (cm)"
                      value={formData.width}
                      onChange={handleChange('width')}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Publish */}
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
              >
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
              </Button>
            </CardContent>
          </Card>

          {/* Images */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Images
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
              
              <Box sx={{ mt: 2 }}>
                {images.map((image, index) => (
                  <Box key={index} sx={{ position: 'relative', mb: 1 }}>
                    <Avatar
                      variant="rounded"
                      src={image.image_url}
                      sx={{ width: '100%', height: 100 }}
                    />
                    <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                      <Chip
                        size="small"
                        label={image.is_primary ? 'Primary' : 'Set primary'}
                        color={image.is_primary ? 'primary' : 'default'}
                        onClick={() => setPrimaryImage(index)}
                        sx={{ mr: 0.5 }}
                      />
                      <Chip
                        size="small"
                        label="Remove"
                        color="error"
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}