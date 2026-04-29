import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  Rating
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Remove,
  ShoppingCart,
  WhatsApp,
  LocalShipping,
  CheckCircleOutline,
  FavoriteBorder,
  Share,
  Sell
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import Footer from '../../components/Footer';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#E74C3C',
  border: '#E0E0E0',
  background: '#FFFFFF',
  lightText: '#666666',
  success: '#27AE60'
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, products } = useProducts();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const productData = await getProduct(id);
        if (!productData) throw new Error('Product not found');
        setProduct(productData);
        setActiveImage(0);
      } catch (err) {
        setError(err?.message || 'Unable to load product details');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [getProduct, id]);

  const whatsappMessage = useMemo(() => {
    if (!product) return '';
    const productUrl = `${window.location.origin}/product/${product.id}`;
    return `Hi! I'm interested in ${product.name}. Price: Ksh ${(product.price || 0).toLocaleString()}. ${productUrl}`;
  }, [product]);

  const WhatsAppLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const relatedProducts = useMemo(() => {
    if (!product || !products?.length) return [];
    return products
      .filter((item) => item.id !== product.id && item.category_id === product.category_id)
      .slice(0, 4);
  }, [product, products]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ ...product, quantity });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back to shop
        </Button>
        <Typography variant="h5" sx={{ mt: 4 }}>Product not found</Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Container>
    );
  }

  const imageGallery = product.images?.length ? product.images : [product.image_url].filter(Boolean);
  const productStatus = product.quantity > 0 ? 'In Stock' : 'Out of Stock';

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: themeColors.primary, textTransform: 'none' }}
        >
          Back to Shop
        </Button>

        {/* Main Product Section */}
        <Grid container spacing={3}>
          {/* LEFT COLUMN - IMAGES */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Main Image */}
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 300, sm: 400, md: 500 },
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <Box
                  component="img"
                  src={imageGallery[activeImage] || '/api/placeholder/600/600'}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    p: 2
                  }}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/600/600?text=No+Image';
                  }}
                />
              </Box>

              {/* Thumbnails */}
              {imageGallery.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                  {imageGallery.map((image, index) => (
                    <Box
                      key={index}
                      onClick={() => setActiveImage(index)}
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: index === activeImage ? `2px solid ${themeColors.secondary}` : '1px solid #ddd',
                        bgcolor: '#f5f5f5',
                        flexShrink: 0,
                        '&:hover': { borderColor: themeColors.secondary }
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/70/70?text=Error';
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          {/* RIGHT COLUMN - DETAILS */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {/* Status */}
              <Chip
                label={productStatus}
                size="small"
                sx={{
                  width: 'fit-content',
                  bgcolor: product.quantity > 0 ? themeColors.success : '#999',
                  color: '#fff',
                  fontWeight: 600
                }}
              />

              {/* Title */}
              <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {product.name}
              </Typography>

              {/* Rating */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Rating value={4.5} precision={0.5} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">(128 reviews)</Typography>
              </Stack>

              {/* Price */}
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" fontWeight={800} sx={{ color: themeColors.accent }}>
                  Ksh {(product.price || 0).toLocaleString()}
                </Typography>
                {product.compare_price && (
                  <Typography variant="body1" sx={{ color: '#999', textDecoration: 'line-through' }}>
                    Ksh {product.compare_price.toLocaleString()}
                  </Typography>
                )}
              </Stack>

              {/* Description */}
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {product.description || 'No description available for this product.'}
              </Typography>

              <Divider />

              {/* Quantity */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography fontWeight={600}>Quantity:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={product.quantity <= 0}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 2, minWidth: 40, textAlign: 'center' }}>{quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={product.quantity <= 0 || quantity >= product.quantity}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>

              {/* Add to Cart */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={product.quantity <= 0}
                sx={{
                  py: 1.5,
                  bgcolor: themeColors.primary,
                  '&:hover': { bgcolor: '#1a252f' },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Add to Cart
              </Button>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                <Button
                  component="a"
                  href={WhatsAppLink}
                  target="_blank"
                  startIcon={<WhatsApp />}
                  sx={{
                    flex: 1,
                    bgcolor: '#25D366',
                    color: '#fff',
                    '&:hover': { bgcolor: '#1ebe58' },
                    textTransform: 'none'
                  }}
                >
                  WhatsApp
                </Button>
                <Button variant="outlined" startIcon={<FavoriteBorder />} sx={{ flex: 1, textTransform: 'none' }}>
                  Wishlist
                </Button>
                <IconButton sx={{ border: '1px solid #ddd' }}>
                  <Share />
                </IconButton>
              </Stack>

              <Divider />

              {/* Product Info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">SKU</Typography>
                  <Typography variant="body2" fontWeight={500}>{product.sku || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Stock</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {product.quantity > 0 ? `${product.quantity} units` : 'Out of stock'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2" fontWeight={500}>{product.category_id || 'General'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Weight</Typography>
                  <Typography variant="body2" fontWeight={500}>{product.weight ? `${product.weight} kg` : '—'}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              You May Also Like
            </Typography>
            <Grid container spacing={2}>
              {relatedProducts.map((item) => (
                <Grid item xs={6} sm={4} md={3} key={item.id}>
                  <Box
                    onClick={() => navigate(`/product/${item.id}`)}
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid #eee',
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&:hover': { boxShadow: 1 }
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image_url || '/api/placeholder/200/200'}
                      alt={item.name}
                      sx={{ width: '100%', height: 150, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = '/api/placeholder/200/200?text=No+Image';
                      }}
                    />
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ color: themeColors.accent }}>
                        Ksh {(item.price || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
}