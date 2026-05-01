// src/pages/ProductDetail.js
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
  Stack,
  Divider,
  Rating,
  LinearProgress,
  Badge,
  Snackbar,
  Alert,
  Drawer,
  useMediaQuery,
  useTheme,
  Fab
} from '@mui/material';
import {
  ArrowBack,
  ShoppingCart,
  WhatsApp,
  FavoriteBorder,
  Share,
  Check,
  ShoppingBag,
  Close
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getProduct, products } = useProducts();
  const { cart, addToCart, getCartItemsCount, removeFromCart, updateCartQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Check if product is already in cart - like dashboard
  const cartItem = useMemo(() => {
    return cart.find(item => item.id === id);
  }, [cart, id]);

  const isInCart = !!cartItem;
  const cartItemsCount = getCartItemsCount();

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
    
    // Add to cart - JUST LIKE DASHBOARD (adds single item)
    addToCart({ ...product, quantity: 1 });
    
    // Show success message
    setSnackbarMessage(`${product.name} added to cart!`);
    setShowSnackbar(true);
  };

  const handleGoToCart = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
    // Remove cart parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('cart');
    window.history.replaceState({}, '', url);
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
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

  // Cart Drawer Component - EXACTLY like dashboard
  const CartDrawer = () => (
    <Drawer
      anchor="right"
      open={cartDrawerOpen}
      onClose={handleCloseCart}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 400,
          padding: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="700">
          Shopping Cart ({getCartItemsCount()})
        </Typography>
        <IconButton onClick={handleCloseCart}>
          <Close />
        </IconButton>
      </Box>

      {cart.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Your cart is empty</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {cart.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 2, mb: 2, p: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                <img 
                  src={item.image_url || `/api/placeholder/80/80?text=${encodeURIComponent(item.name)}`} 
                  alt={item.name}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="600">{item.name}</Typography>
                  <Typography variant="body2" color="primary" fontWeight="700">
                    Ksh {item.price?.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Button 
                      size="small" 
                      onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                      disabled={(item.quantity || 1) <= 1}
                    >
                      -
                    </Button>
                    <Typography>{item.quantity || 1}</Typography>
                    <Button 
                      size="small" 
                      onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                    >
                      +
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => removeFromCart(item.id)}
                      sx={{ ml: 'auto' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ borderTop: `1px solid ${themeColors.border}`, pt: 2 }}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ mb: 1 }}
              onClick={() => {
                navigate('/checkout');
                handleCloseCart();
              }}
            >
              Proceed to Checkout
            </Button>
            <Button fullWidth variant="outlined" onClick={handleCloseCart}>
              Continue Shopping
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      {/* Floating Cart Button - EXACTLY like dashboard */}
      <Fab
        color="primary"
        aria-label="cart"
        onClick={handleGoToCart}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          backgroundColor: themeColors.primary,
          '&:hover': {
            backgroundColor: alpha(themeColors.primary, 0.9),
            transform: 'scale(1.1)'
          },
          transition: 'all 0.2s ease-in-out',
          zIndex: 1000
        }}
      >
        <Badge badgeContent={cartItemsCount} color="error">
          <ShoppingCart />
        </Badge>
      </Fab>

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
        <Grid container spacing={4}>
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
                <img
                  src={imageGallery[activeImage] || '/api/placeholder/600/600'}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: 16
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
                        '&:hover': { 
                          borderColor: themeColors.secondary
                        }
                      }}
                    >
                      <img
                        src={image}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <Stack spacing={2.5}>
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

              {/* Add to Cart Button - EXACTLY like ProductCard in dashboard */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleAddToCart}
                disabled={product.quantity <= 0 || isInCart}
                startIcon={isInCart ? <Check /> : <ShoppingBag />}
                sx={{
                  backgroundColor: isInCart ? themeColors.success : themeColors.primary,
                  color: 'white',
                  borderRadius: '8px',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
                  '&:hover': {
                    backgroundColor: isInCart ? themeColors.success : alpha(themeColors.primary, 0.9),
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: themeColors.success,
                    color: 'white'
                  }
                }}
              >
                {isInCart ? 'Added' : 'Add to Cart'}
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
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
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
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <img
                      src={item.image_url || '/api/placeholder/200/200'}
                      alt={item.name}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
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

      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="success" 
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Cart Drawer */}
      <CartDrawer />

      <Footer />
    </Box>
  );
}