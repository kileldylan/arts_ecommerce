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
  Fab,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Card,
  CardContent,
  Tooltip,
  Zoom,
  Fade
} from '@mui/material';
import {
  ArrowBack,
  ShoppingCart,
  WhatsApp,
  FavoriteBorder,
  Share,
  Check,
  ShoppingBag,
  Close,
  LocalShipping,
  Security,
  Verified,
  Star,
  Storefront,
  Palette,
  Brush,
  Inventory,
  Visibility,
  ThumbUp,
  AssignmentReturn,
  Payment,
  Instagram,
  Twitter,
  Facebook
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import Footer from '../../components/Footer';
import CustomSpinner from '../../components/CustomSpinner';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#E74C3C',
  border: '#E0E0E0',
  background: '#FFFFFF',
  lightText: '#666666',
  success: '#27AE60',
  gold: '#D4AF37',
  warmWood: '#8B5A2B'
};

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { getProduct, products } = useProducts();
  const { cart, addToCart, getCartItemsCount, removeFromCart, updateCartQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Check if product is already in cart
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
    addToCart({ ...product, quantity });
    setSnackbarMessage(`${product.name} added to cart!`);
    setShowSnackbar(true);
  };

  const handleGoToCart = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
    const url = new URL(window.location);
    url.searchParams.delete('cart');
    window.history.replaceState({}, '', url);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <CustomSpinner text="Loading product details..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          Back to shop
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Product not found</Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button variant="contained" onClick={() => navigate('/customer/dashboard')} sx={{ mt: 3 }}>
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  const imageGallery = product.images?.length ? product.images : [product.image_url].filter(Boolean);
  const productStatus = product.quantity > 0 ? 'In Stock' : 'Out of Stock';
  const stockLevel = product.quantity > 20 ? 'High Stock' : product.quantity > 5 ? 'Medium Stock' : 'Low Stock';

  // Cart Drawer Component
  const CartDrawer = () => (
    <Drawer
      anchor="right"
      open={cartDrawerOpen}
      onClose={handleCloseCart}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 400,
          padding: 2,
          borderRadius: { xs: 0, md: '16px 0 0 16px' }
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
          <ShoppingBag sx={{ fontSize: 64, color: themeColors.lightText, opacity: 0.3, mb: 2 }} />
          <Typography color="text.secondary">Your cart is empty</Typography>
          <Button variant="outlined" onClick={handleCloseCart} sx={{ mt: 2 }}>
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
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
                      sx={{ minWidth: 28, width: 28, height: 28 }}
                    >
                      -
                    </Button>
                    <Typography variant="body2">{item.quantity || 1}</Typography>
                    <Button 
                      size="small" 
                      onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                      sx={{ minWidth: 28, width: 28, height: 28 }}
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
          <Box sx={{ borderTop: `1px solid ${themeColors.border}`, pt: 2, mt: 2 }}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ mb: 1, bgcolor: themeColors.gold, '&:hover': { bgcolor: '#C5A028' } }}
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
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Floating Cart Button */}
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
          sx={{ mb: 3, color: themeColors.primary, textTransform: 'none', '&:hover': { bgcolor: alpha(themeColors.primary, 0.05) } }}
        >
          Back to Shop
        </Button>

        {/* Main Product Section */}
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', p: { xs: 2, md: 4 } }}>
          <Grid container spacing={4}>
            {/* LEFT COLUMN - IMAGES */}
            <Grid item xs={12} md={6}>
              <Box>
                {/* Main Image with Zoom effect */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 320, sm: 400, md: 480 },
                    bgcolor: '#F8F9FA',
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    cursor: 'zoom-in'
                  }}
                >
                  <img
                    src={imageGallery[activeImage] || '/api/placeholder/600/600'}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: 24,
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/600/600?text=No+Image';
                    }}
                  />
                  {/* Stock Badge */}
                  {product.quantity <= 5 && product.quantity > 0 && (
                    <Chip
                      label="Limited Stock"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        bgcolor: '#FF9800',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>

                {/* Thumbnails */}
                {imageGallery.length > 1 && (
                  <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1, justifyContent: 'center' }}>
                    {imageGallery.map((image, index) => (
                      <Box
                        key={index}
                        onClick={() => setActiveImage(index)}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: index === activeImage ? `2px solid ${themeColors.gold}` : '1px solid #E0E0E0',
                          bgcolor: '#F8F9FA',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            borderColor: themeColors.gold,
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        <img
                          src={image}
                          alt="thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = '/api/placeholder/80/80?text=Error';
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
                {/* Status Badges */}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    label={productStatus}
                    size="small"
                    sx={{
                      bgcolor: product.quantity > 0 ? themeColors.success : '#999',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    label={stockLevel}
                    size="small"
                    sx={{
                      bgcolor: product.quantity > 20 ? '#E8F5E9' : product.quantity > 5 ? '#FFF3E0' : '#FFEBEE',
                      color: product.quantity > 20 ? '#27AE60' : product.quantity > 5 ? '#FF9800' : '#F44336'
                    }}
                  />
                  <Chip
                    icon={<Verified sx={{ fontSize: 14 }} />}
                    label="Verified Artisan"
                    size="small"
                    sx={{ bgcolor: '#FFF8E1', color: '#D4AF37' }}
                  />
                </Stack>

                {/* Title */}
                <Typography variant="h4" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                  {product.name}
                </Typography>

                {/* Rating Section */}
                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Rating value={4.5} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" sx={{ color: '#FFB800', fontWeight: 600 }}>4.5</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">(128 verified reviews)</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ThumbUp sx={{ fontSize: 14, color: themeColors.success }} />
                    <Typography variant="caption" color="text.secondary">98% of customers recommend</Typography>
                  </Stack>
                </Stack>

                {/* Price Section */}
                <Paper elevation={0} sx={{ bgcolor: '#FFF8E1', p: 2, borderRadius: 3 }}>
                  <Stack direction="row" alignItems="baseline" spacing={2} flexWrap="wrap">
                    <Typography variant="h3" fontWeight="800" sx={{ color: themeColors.accent }}>
                      Ksh {(product.price || 0).toLocaleString()}
                    </Typography>
                    {product.compare_price && (
                      <>
                        <Typography variant="body1" sx={{ color: '#999', textDecoration: 'line-through' }}>
                          Ksh {product.compare_price.toLocaleString()}
                        </Typography>
                        <Chip
                          label={`Save ${Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%`}
                          size="small"
                          sx={{ bgcolor: '#27AE60', color: 'white' }}
                        />
                      </>
                    )}
                  </Stack>
                  {product.quantity > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Free delivery on orders over Ksh 5,000
                    </Typography>
                  )}
                </Paper>

                {/* Description Preview */}
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {product.description?.substring(0, 150)}
                  {product.description?.length > 150 && '...'}
                </Typography>

                {/* Quantity Selector */}
                {product.quantity > 0 && (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" fontWeight="600">Quantity:</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        sx={{ border: '1px solid #E0E0E0', borderRadius: 1 }}
                      >
                        -
                      </IconButton>
                      <Typography variant="body1" fontWeight="600" sx={{ minWidth: 40, textAlign: 'center' }}>
                        {quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        sx={{ border: '1px solid #E0E0E0', borderRadius: 1 }}
                      >
                        +
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {product.quantity} units available
                    </Typography>
                  </Stack>
                )}

                <Divider />

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleAddToCart}
                    disabled={product.quantity <= 0 || isInCart}
                    startIcon={isInCart ? <Check /> : <ShoppingBag />}
                    sx={{
                      flex: 2,
                      backgroundColor: isInCart ? themeColors.success : themeColors.gold,
                      color: '#2C1810',
                      borderRadius: '12px',
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: isInCart ? themeColors.success : '#C5A028',
                        transform: 'translateY(-2px)'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: themeColors.success,
                        color: 'white'
                      }
                    }}
                  >
                    {isInCart ? 'Added to Cart' : 'Add to Cart'}
                  </Button>
                  <Button
                    component="a"
                    href={WhatsAppLink}
                    target="_blank"
                    variant="outlined"
                    startIcon={<WhatsApp />}
                    sx={{
                      flex: 1,
                      borderColor: '#25D366',
                      color: '#25D366',
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#1ebe58',
                        bgcolor: alpha('#25D366', 0.05)
                      }
                    }}
                  >
                    WhatsApp
                  </Button>
                </Stack>

                {/* Secondary Actions */}
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" startIcon={<FavoriteBorder />} sx={{ flex: 1, textTransform: 'none', borderRadius: '12px' }}>
                    Wishlist
                  </Button>
                  <IconButton sx={{ border: '1px solid #E0E0E0', borderRadius: '12px' }}>
                    <Share />
                  </IconButton>
                </Stack>

                <Divider />

                {/* Delivery & Returns Info */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocalShipping sx={{ fontSize: 20, color: themeColors.gold }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Delivery</Typography>
                        <Typography variant="body2" fontWeight="500">3-5 business days</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AssignmentReturn sx={{ fontSize: 20, color: themeColors.gold }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Returns</Typography>
                        <Typography variant="body2" fontWeight="500">7-day easy returns</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Payment sx={{ fontSize: 20, color: themeColors.gold }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Payment</Typography>
                        <Typography variant="body2" fontWeight="500">M-Pesa, Card, Bank</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Security sx={{ fontSize: 20, color: themeColors.gold }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Warranty</Typography>
                        <Typography variant="body2" fontWeight="500">1-year craftsmanship</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Product Details Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 4, mt: 4, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'white',
              '& .MuiTab-root.Mui-selected': { color: themeColors.gold },
              '& .MuiTabs-indicator': { bgcolor: themeColors.gold }
            }}
          >
            <Tab label="Product Details" iconPosition="start" />
            <Tab label="Artisan Story" iconPosition="start" />
            <Tab label="Reviews (128)" iconPosition="start" />
            <Tab label="Care Instructions" iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 4 }}>
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Product Specifications
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">Material</Typography>
                      <Typography variant="body2" fontWeight="500">Premium Wood</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                      <Typography variant="body2" fontWeight="500">{product.dimensions || 'Standard size'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">Weight</Typography>
                      <Typography variant="body2" fontWeight="500">{product.weight ? `${product.weight} kg` : '—'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">SKU</Typography>
                      <Typography variant="body2" fontWeight="500">{product.sku || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">Category</Typography>
                      <Typography variant="body2" fontWeight="500">{product.category_name || 'Wood Art'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${themeColors.border}` }}>
                      <Typography variant="body2" color="text.secondary">Handcrafted</Typography>
                      <Typography variant="body2" fontWeight="500">Made in Kenya</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {product.description || 'No detailed description available.'}
                  </Typography>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                <Avatar
                  src={product.artist_avatar}
                  sx={{ width: 120, height: 120, bgcolor: themeColors.gold }}
                >
                  <Brush sx={{ fontSize: 60 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Meet the Artisan
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    This piece is handcrafted by a skilled Kenyan artisan specializing in traditional wood intarsia. Each piece is unique, carved with precision and finished with natural oils to bring out the beauty of the wood grain.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <IconButton sx={{ color: '#E4405F' }}><Instagram /></IconButton>
                    <IconButton sx={{ color: '#1877F2' }}><Facebook /></IconButton>
                    <IconButton sx={{ color: '#1DA1F2' }}><Twitter /></IconButton>
                  </Stack>
                </Box>
              </Stack>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="800" color={themeColors.gold}>4.5</Typography>
                    <Rating value={4.5} precision={0.5} readOnly />
                    <Typography variant="caption" color="text.secondary">Based on 128 reviews</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <Stack key={star} direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="caption">{star} ★</Typography>
                        <LinearProgress variant="determinate" value={star === 5 ? 70 : star === 4 ? 20 : 10} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" color="text.secondary">
                          {star === 5 ? '70%' : star === 4 ? '20%' : '10%'}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
                <Divider />
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Customer reviews will appear here after purchase verification.
                </Typography>
              </Stack>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                How to Care for Your Wood Art
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧽</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">Clean gently</Typography>
                    <Typography variant="body2" color="text.secondary">Use a soft, dry cloth to dust. Avoid water or harsh chemicals.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☀️</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">Avoid direct sunlight</Typography>
                    <Typography variant="body2" color="text.secondary">Prolonged exposure can fade the natural wood colors.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💧</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">Keep away from moisture</Typography>
                    <Typography variant="body2" color="text.secondary">Wood is porous. Avoid humid areas like bathrooms.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">Natural oil finish</Typography>
                    <Typography variant="body2" color="text.secondary">Apply food-grade mineral oil occasionally to maintain luster.</Typography>
                  </Box>
                </Box>
              </Stack>
            </TabPanel>
          </Box>
        </Paper>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
              You May Also Like
            </Typography>
            <Grid container spacing={2}>
              {relatedProducts.map((item) => (
                <Grid item xs={6} sm={4} md={3} key={item.id}>
                  <Card
                    onClick={() => navigate(`/product/${item.id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', paddingTop: '100%', bgcolor: '#F8F9FA' }}>
                      <img
                        src={item.image_url || '/api/placeholder/200/200'}
                        alt={item.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/200/200?text=No+Image';
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography variant="body2" fontWeight="600" noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ color: themeColors.accent }}>
                        Ksh {(item.price || 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
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
          sx={{ bgcolor: themeColors.success }}
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