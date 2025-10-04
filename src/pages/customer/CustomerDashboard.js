import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Drawer,
  Badge,
  Fab,
  Rating,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  alpha
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  FilterList,
  Close,
  Add,
  Remove,
  LocalMall,
  Diamond,
  Palette,
  Brush
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Modern color palette
const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1'
};

// Mock categories data
const categories = [
  { id: 0, name: 'All Categories', slug: 'all', icon: <LocalMall /> },
  { id: 1, name: 'Jewelry', slug: 'jewelry', icon: <Diamond /> },
  { id: 2, name: 'Paintings', slug: 'paintings', icon: <Palette /> },
  { id: 3, name: 'Sculptures', slug: 'sculptures', icon: <Brush /> },
  { id: 4, name: 'Wood Carvings', slug: 'wood-carvings', icon: <Brush /> }
];
const API_BASE_URL = "http://localhost:5000";

const getProductImageUrl = (product) => {
  try {
    if (!product.images) return null;
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      if (typeof firstImage === 'object' && firstImage.image_url) {
        return `${API_BASE_URL}${firstImage.image_url}`;
      } else if (typeof firstImage === 'string') {
        return `${API_BASE_URL}${firstImage}`;
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing product images:', error);
    return null;
  }
};

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [cartDrawer, setCartDrawer] = useState(false);
  const { products, loading, getAllProducts } = useProducts();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    getAllProducts();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cart') === 'true') {
      setCartDrawer(true);
    }
  }, [getAllProducts]);

const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === '0' || product.category_id === parseInt(selectedCategory);
      const price = parseFloat(product.price) || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high': return parseFloat(b.price) - parseFloat(a.price);
        case 'name': return a.name.localeCompare(b.name);
        case 'newest':
        default: return (b.created_at ? new Date(b.created_at) : b.id) - (a.created_at ? new Date(a.created_at) : a.id);
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / 20);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * 20,
    currentPage * 20
  );

  const ProductCard = ({ product }) => {
    const cartItem = cart.find(item => item.id === product.id);
    const imageUrl = getProductImageUrl(product);

    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        height: 420, // FIXED TOTAL HEIGHT
        minHeight: 420,
        maxHeight: 420,
        overflow: 'hidden', // Prevent any overflow from affecting layout
      }}>
        {/* Product Image Card - STRICTLY FIXED DIMENSIONS */}
        <Card
          sx={{
            height: 250, // FIXED
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 2,
            transition: '0.2s',
            border: `1px solid ${themeColors.border}`,
            '&:hover': { 
              boxShadow: 6, 
              borderColor: themeColors.accent,
              transform: 'translateY(-4px)'
            },
            borderRadius: '12px',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              height: 160, // FIXED
              width: '100%',
              backgroundColor: 'grey.100',
              backgroundImage: `url(${imageUrl || '/api/placeholder/300/250'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'relative'
            }}
          >
            {product.is_featured && (
              <Chip
                label="Featured"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: themeColors.accent,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
          <CardContent sx={{ 
            height: 90, // FIXED
            p: 1.5, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            '&:last-child': { pb: 1.5 },
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Rating value={4.5} precision={0.5} size="small" readOnly />
              <Typography variant="caption" sx={{ color: themeColors.lightText, fontSize: '0.7rem' }}>
                (24)
              </Typography>
            </Box>
            <Box
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mt: 'auto',
                gap: 1 
              }}
            >
              <Typography
                variant="h6"
                sx={{ 
                  color: themeColors.secondary, 
                  fontWeight: 'bold', 
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}
              >
                Ksh{parseFloat(product.price).toLocaleString()}
              </Typography>
              {cartItem ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                    sx={{ 
                      backgroundColor: themeColors.primary, 
                      color: 'white', 
                      '&:hover': { backgroundColor: alpha(themeColors.primary, 0.8) },
                      width: 24,
                      height: 24
                    }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" fontWeight="600" sx={{ minWidth: 20, textAlign: 'center', fontSize: '0.8rem' }}>
                    {cartItem.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                    sx={{ 
                      backgroundColor: themeColors.primary, 
                      color: 'white', 
                      '&:hover': { backgroundColor: alpha(themeColors.primary, 0.8) },
                      width: 24,
                      height: 24
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => addToCart(product)}
                  sx={{
                    backgroundColor: themeColors.primary,
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '6px',
                    px: 1.2,
                    py: 0.3,
                    fontSize: '0.7rem',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: alpha(themeColors.primary, 0.9) }
                  }}
                >
                  Add to Cart
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Product Name and Description - STRICTLY FIXED CONTAINER */}
        <Box sx={{ 
          height: 140, // FIXED
          width: '100%',
          mt: 1.5, 
          px: 0.5,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden', // CRITICAL: Prevent text from affecting layout
        }}>
          {/* Product Name - STRICTLY FIXED with overflow */}
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              color: themeColors.text,
              mb: 1,
              lineHeight: 1.3,
              fontSize: '0.9rem',
              height: 40, // FIXED
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              width: '100%', // Force full width
              maxWidth: '100%', // Prevent expansion
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {product.name}
          </Typography>
          
          {/* Product Description - STRICTLY FIXED with overflow */}
          <Typography
            variant="body2"
            sx={{
              color: themeColors.lightText,
              fontSize: '0.75rem',
              lineHeight: 1.4,
              height: 60, // FIXED
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              width: '100%', // Force full width
              maxWidth: '100%', // Prevent expansion
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {product.description}
          </Typography>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.background }}>
        <Typography variant="h4" sx={{ color: themeColors.text }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ background: 'transparent', boxShadow: 'none', position: 'absolute', width: '100%', zIndex: 10 }}>
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
        <Card sx={{ mb: 4, p: 2, borderRadius: '16px', border: `1px solid ${themeColors.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search for jewelry, art..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: 'white' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: themeColors.lightText }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: themeColors.text }}>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ borderRadius: '12px', backgroundColor: 'white' }}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: themeColors.text }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ borderRadius: '12px', backgroundColor: 'white' }}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name A-Z</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDrawer(true)}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  '&:hover': { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, 0.04) }
                }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Grid with STRICT FIXED SIZES */}
        <Grid container spacing={3} sx={{ 
          mx: 'auto', 
          px: { xs: 1, sm: 2, md: 3 }, 
          width: '100%',
          '& .MuiGrid-item': {
            minWidth: 0, // Prevent grid items from expanding
            overflow: 'hidden'
          }
        }}>
          {paginatedProducts.map(product => (
            <Grid item xs={12} sm={6} md={3} key={product.id} sx={{ display: 'flex' }}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>

        {paginatedProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: themeColors.lightText, mb: 2 }}>
              No products found
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.lightText }}>
              Try adjusting your search criteria
            </Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px',
                  margin: '0 4px',
                  '&.Mui-selected': { backgroundColor: themeColors.primary, color: 'white' }
                }
              }}
            />
          </Box>
        )}

        {/* Rest of the component remains the same */}
        <Fab
          color="primary"
          aria-label="cart"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            backgroundColor: themeColors.primary,
            '&:hover': { backgroundColor: alpha(themeColors.secondary, 0.9), transform: 'scale(1.1)' },
            transition: 'all 0.2s ease-in-out'
          }}
          onClick={() => setCartDrawer(true)}
        >
          <Badge badgeContent={getCartItemsCount()} color="error">
            <ShoppingCart />
          </Badge>
        </Fab>

        {/* Filter and Cart drawers remain unchanged */}
        <Drawer
          anchor="right"
          open={filterDrawer}
          onClose={() => setFilterDrawer(false)}
        >
          <Box sx={{ width: 300, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setFilterDrawer(false)}>
                <Close />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              Price Range
            </Typography>
            <Slider
              value={priceRange}
              onChange={(e, newValue) => setPriceRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              sx={{ mb: 3 }}
            />
            <Typography variant="subtitle1" gutterBottom>
              Categories
            </Typography>
            <Box sx={{ mb: 3 }}>
              {categories.map(category => (
                <Chip
                  key={category.id}
                  label={category.name}
                  variant={selectedCategory === category.id.toString() ? 'filled' : 'outlined'}
                  color="primary"
                  onClick={() => setSelectedCategory(category.id.toString())}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setFilterDrawer(false)}
              sx={{ mt: 2, backgroundColor: themeColors.primary }}
            >
              Apply Filters
            </Button>
          </Box>
        </Drawer>

        <Drawer
          anchor="right"
          open={cartDrawer}
          onClose={() => setCartDrawer(false)}
        >
          <Box sx={{ width: 400, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Shopping Cart ({getCartItemsCount()})</Typography>
              <IconButton onClick={() => setCartDrawer(false)}>
                <Close />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingCart sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Your cart is empty
                </Typography>
              </Box>
            ) : (
              <>
                {cart.map(item => (
                  <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <img
                        src={getProductImageUrl(item) || '/api/placeholder/80/80'}
                        alt={item.name}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ksh{parseFloat(item.price).toLocaleString()} × {item.quantity}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Remove />
                          </IconButton>
                          <Typography variant="body2">{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Add />
                          </IconButton>
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                        <Close />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Ksh{getCartTotal().toLocaleString()}
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: '/customer/dashboard?cart=true' } });
                    } else {
                      navigate('/checkout');
                      setCartDrawer(false);
                    }
                  }}
                  sx={{ mb: 2, backgroundColor: themeColors.primary }}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    clearCart();
                    setCartDrawer(false);
                  }}
                >
                  Clear Cart
                </Button>
              </>
            )}
          </Box>
        </Drawer>
      </Container>
    </Box>
  );
}