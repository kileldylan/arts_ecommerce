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
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Remove,
  ShoppingCart,
  WhatsApp,
  LocalShipping,
  Star,
  CheckCircleOutline,
  InfoOutlined,
  FavoriteBorder
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import Footer from '../../components/Footer';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#E74C3C',
  border: '#ECF0F1',
  background: '#FAFAFA',
  lightText: '#7F8C8D'
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
        if (!productData) {
          throw new Error('Product not found');
        }
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
    return `Hi! I'm interested in ${product.name}. Here is the product link: ${productUrl}`;
  }, [product]);

  const WhatsAppLink = useMemo(() => {
    return `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  }, [whatsappMessage]);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          Back to shop
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Oops! Product not found.
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  const imageGallery = product.images?.length ? product.images : [product.image_url].filter(Boolean);

  const productStatus = product.quantity > 0 ? 'In Stock' : 'Out of Stock';

  return (
    <Box sx={{ background: themeColors.background, minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 4, color: themeColors.primary }}
        >
          Back to Shop
        </Button>

        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <Typography variant="overline" sx={{ color: themeColors.secondary, fontWeight: 700 }}>
                Product Details
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                {product.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
                {product.description || 'No description provided for this item yet.'}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                <Chip label={productStatus} color={product.quantity > 0 ? 'success' : 'default'} />
                <Chip icon={<LocalShipping />} label="Free shipping on orders over Ksh 5,000" />
                <Chip icon={<InfoOutlined />} label={product.category_id ? `Category ${product.category_id}` : 'General'} />
              </Stack>

              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: themeColors.primary }}>
                  Ksh {(product.price || 0).toLocaleString()}
                </Typography>
                {product.compare_price && (
                  <Typography variant="body2" sx={{ color: themeColors.lightText, textDecoration: 'line-through' }}>
                    Ksh {product.compare_price.toLocaleString()}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${themeColors.border}`, borderRadius: 2, bgcolor: '#fff' }}>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((qty) => Math.max(1, qty - 1))}
                  >
                    <Remove />
                  </IconButton>
                  <Typography sx={{ px: 2, minWidth: 40, textAlign: 'center' }}>{quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((qty) => qty + 1)}
                  >
                    <Add />
                  </IconButton>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ShoppingCart />}
                  onClick={handleAddToCart}
                  disabled={product.quantity <= 0}
                  sx={{ px: 4, py: 1.5, borderRadius: 3 }}
                >
                  Add to Cart
                </Button>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <Button
                  component="a"
                  href={WhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<WhatsApp />}
                  sx={{ backgroundColor: '#25D366', color: '#fff', '&:hover': { backgroundColor: '#1ebe58' } }}
                >
                  Share via WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FavoriteBorder />}
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                >
                  Ask for customization
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">SKU</Typography>
                  <Typography>{product.sku || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Barcode</Typography>
                  <Typography>{product.barcode || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Availability</Typography>
                  <Typography>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
                <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Weight
                  </Typography>
                  <Typography>{product.weight ? `${product.weight} kg` : '—'}</Typography>
                </Box>
                <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Dimensions
                  </Typography>
                  <Typography>{product.length || product.width || product.height ? `${product.length || '-'} x ${product.width || '-'} x ${product.height || '-'} cm` : '—'}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden', flex: 1, minHeight: 520, backgroundColor: '#f5f5f5' }}>
              <Box
                component="img"
                src={imageGallery[activeImage] || '/api/placeholder/800/800?text=Product'}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.28))' }} />
              <Box sx={{ position: 'absolute', inset: 0, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 3, p: 3, maxWidth: 420 }}>
                  <Typography variant="overline" sx={{ color: themeColors.secondary, fontWeight: 700 }}>
                    Selected Image
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 1, mb: 1 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description ? product.description.slice(0, 120) + '...' : 'A beautiful product ready for your space.'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {imageGallery.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 1 }}>
                {imageGallery.map((image, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    onClick={() => setActiveImage(index)}
                    sx={{
                      width: 96,
                      height: 96,
                      borderRadius: 3,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: index === activeImage ? `2px solid ${themeColors.primary}` : `1px solid ${themeColors.border}`
                    }}
                  />
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            Product Highlights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <CheckCircleOutline sx={{ color: themeColors.primary }} />
                  <Typography variant="subtitle2" fontWeight={700}>Premium Quality</Typography>
                </Stack>
                <Typography color="text.secondary">Designed for durability with modern finishes.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <LocalShipping sx={{ color: themeColors.primary }} />
                  <Typography variant="subtitle2" fontWeight={700}>Reliable Delivery</Typography>
                </Stack>
                <Typography color="text.secondary">Fast, tracked delivery across Kenya.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <InfoOutlined sx={{ color: themeColors.primary }} />
                  <Typography variant="subtitle2" fontWeight={700}>Easy Returns</Typography>
                </Stack>
                <Typography color="text.secondary">Hassle-free returns within 7 days.</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, borderRadius: 3, border: `1px solid ${themeColors.border}`, bgcolor: '#fff' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Star sx={{ color: themeColors.primary }} />
                  <Typography variant="subtitle2" fontWeight={700}>Customer Favorite</Typography>
                </Stack>
                <Typography color="text.secondary">Loved for its elegant look and great value.</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              More from this category
            </Typography>
            <Grid container spacing={2}>
              {relatedProducts.map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.id}>
                  <Box
                    onClick={() => navigate(`/product/${item.id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: '#fff',
                      border: `1px solid ${themeColors.border}`,
                      '&:hover': {
                        boxShadow: '0 16px 30px rgba(0,0,0,0.08)'
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image_url || '/api/placeholder/320/320?text=Product'}
                      alt={item.name}
                      sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{item.description || 'Quality product'}</Typography>
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
