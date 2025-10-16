import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Button,
  IconButton,
  Badge,
  Fab,
  Pagination,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Drawer,
  LinearProgress
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Favorite,
  Share,
  LocalShipping,
  Security,
  Support,
  Star,
  Check,
  ViewModule,
  ViewList,
  Add,
  Close
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';

// Modern color palette
const themeColors = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#E74C3C',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1',
  success: '#27AE60'
};

const categories = [
  { id: '0', name: 'All Products', count: 0 },
  { id: '1', name: 'Wood Intarsia', count: 21, image: '/api/placeholder/80/80?text=Wallpaper' },
  { id: '2', name: 'Frames', count: 9, image: '/api/placeholder/80/80?text=Frames' },
  { id: '3', name: 'Wall Art', count: 3, image: '/api/placeholder/80/80?text=Wall+Art' },
  { id: '4', name: 'Sculptures', count: 3, image: '/api/placeholder/80/80?text=Wall+Art' },
  { id: '5', name: 'Aesthetic Mirrors', count: 31, image: '/api/placeholder/80/80?text=Door+Signs' }
];

const features = [
  {
    icon: <LocalShipping sx={{ fontSize: 40, color: themeColors.primary }} />,
    title: 'Free Shipping',
    description: 'Free delivery on orders over Ksh 5,000'
  },
  {
    icon: <Security sx={{ fontSize: 40, color: themeColors.primary }} />,
    title: 'Secure Payment',
    description: '100% secure payment processing'
  },
  {
    icon: <Support sx={{ fontSize: 40, color: themeColors.primary }} />,
    title: '24/7 Support',
    description: 'Dedicated customer support team'
  }
];

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Interior Designer',
    content: 'The quality of frames and wall art exceeded my expectations. My clients are always impressed!',
    rating: 5,
    image: '/api/placeholder/80/80?text=SJ'
  },
  {
    id: 2,
    name: 'Mike Chen',
    role: 'Office Manager',
    content: 'Perfect signage solutions for our corporate office. Professional and durable.',
    rating: 5,
    image: '/api/placeholder/80/80?text=MC'
  },
  {
    id: 3,
    name: 'Emily Davis',
    role: 'Home Owner',
    content: 'Transformed my living space with beautiful wall decor. The customization options are amazing!',
    rating: 4,
    image: '/api/placeholder/80/80?text=ED'
  }
];

export default function ModernDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const { products, getAllProducts, loading } = useProducts();
  const { cart, addToCart, getCartItemsCount, removeFromCart, updateCartQuantity } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    getAllProducts();
  }, [getAllProducts]);

  // Check for cart parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cart') === 'true') {
      setCartDrawerOpen(true);
    }
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === '0' || product.category_id?.toString() === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return (a.price || 0) - (b.price || 0);
        case 'price-high': return (b.price || 0) - (a.price || 0);
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'newest':
        default: return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

  const productsPerPage = isMobile ? 8 : 10;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleCartClick = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
    // Remove cart parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('cart');
    window.history.replaceState({}, '', url);
  };

  // Cart Drawer Component
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
              onClick={() => navigate('/checkout')}
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

// Enhanced Product Card Component with larger size for better product showcase
// Optimized Product Card Component - No Extra White Space
const ProductCard = ({ product }) => {
  const cartItem = cart.find(item => item.id === product.id);
  const imageUrl = product.image_url || `/api/placeholder/400/400?text=${encodeURIComponent(product.name || 'Product')}`;

  return (
    <Card
      onClick={() => handleProductClick(product.id)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${themeColors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderColor: alpha(themeColors.primary, 0.3),
          '& .product-image': { transform: 'scale(1.08)' }
        }
      }}
    >
      {/* Product Image */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '100%',
          backgroundColor: '#f8f9fa',
          overflow: 'hidden'
        }}
      >
        <img
          src={imageUrl}
          alt={product.category_id}
          className="product-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
        />

        {/* Quick Action Buttons */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '.MuiCard:hover &': { opacity: 1 }
          }}
        >
          <IconButton
            size="small"
            sx={{
              backgroundColor: 'white',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <Favorite sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Product Info - Tightened Layout */}
      <CardContent
        sx={{
          p: '10px 14px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1
        }}
      >
        {/* Product Name */}
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.2,
            color: themeColors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1 // Reduced margin below name
          }}
        >
          {product.name}
        </Typography>

        {/* Price + Button (Tightly Aligned) */}
        <Box sx={{ mt: 0.2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.6 // Very minimal gap before button
            }}
          >
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{
                color: themeColors.primary,
                fontSize: '1.1rem',
                lineHeight: 1,
                mb: 1
              }}
            >
              Ksh {(product.price || 0).toLocaleString()}
            </Typography>

            {product.compare_price && (
              <Typography
                variant="body2"
                sx={{
                  color: themeColors.lightText,
                  textDecoration: 'line-through',
                  fontSize: '0.7rem',
                  lineHeight: 1
                }}
              >
                Ksh {product.compare_price.toLocaleString()}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={cartItem}
            startIcon={cartItem ? <Check /> : <ShoppingCart />}
            sx={{
              backgroundColor: cartItem ? themeColors.success : themeColors.primary,
              color: 'white',
              borderRadius: '8px',
              py: 0.8,
              mb: 0.6,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
              '&:hover': {
                backgroundColor: cartItem
                  ? themeColors.success
                  : alpha(themeColors.primary, 0.9),
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)'
              },
              '&.Mui-disabled': {
                backgroundColor: themeColors.success,
                color: 'white'
              },
              m: 0
            }}
          >
            {cartItem ? 'Added' : 'Add to Cart'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

  // Testimonial Card Component
  const TestimonialCard = ({ testimonial }) => (
    <Card
      sx={{
        minWidth: 300,
        maxWidth: 350,
        height: 200,
        p: 3,
        borderRadius: 3,
        border: `1px solid ${themeColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontStyle: 'italic',
          mb: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}
      >
        "{testimonial.content}"
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            backgroundImage: `url(${testimonial.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <Box>
          <Typography variant="subtitle1" fontWeight="600">
            {testimonial.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {testimonial.role}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                sx={{
                  fontSize: 14,
                  color: star <= testimonial.rating ? '#FFD700' : '#E0E0E0'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ background: themeColors.background, minHeight: '100vh' }}>
      
      {/* Cart Drawer */}
      <CartDrawer />
      
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          backgroundImage: 'url("/hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          height: { xs: 280, sm: 320, md: 420 },
          display: 'flex',
          alignItems: 'center',
          mb: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.42) 100%)'
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', px: { xs: 2, md: 0 } }}>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 1.5, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              Discover Unique Art & Decor
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 400, opacity: 0.95 }}>
              Transform your space with curated wall art, frames, and sculptures.
            </Typography>
            <TextField
              fullWidth
              placeholder="Search for art, frames, decor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                maxWidth: 520,
                mx: 'auto',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  '& fieldset': { border: 'none' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: themeColors.lightText }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Categories Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ maxWidth: 900, mx: 'auto', px: 2 }}>
            <Grid container spacing={1} justifyContent="center">
              {categories.slice(1).map((category) => (
                <Grid item xs="auto" key={category.id}>
                  <Button
                    variant="text"
                    onClick={() => setSelectedCategory(category.id)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: selectedCategory === category.id ? 800 : 600,
                      color: selectedCategory === category.id ? themeColors.primary : themeColors.text,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 999,
                      '&:hover': {
                        backgroundColor: alpha(themeColors.primary, 0.08),
                        color: themeColors.primary
                      }
                    }}
                  >
                    {category.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            {/* Sort Filter */}
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="name">Name A-Z</MenuItem>
              </Select>
            </FormControl>
          </Box>

        {/* Products Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LinearProgress/>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} justifyContent="center" alignItems="stretch">
              {paginatedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>

            {paginatedProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or browse different categories
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, value) => setCurrentPage(value)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '8px',
                      margin: '0 4px',
                      '&.Mui-selected': {
                        backgroundColor: themeColors.primary,
                        color: 'white'
                      }
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Features Section */}
        <Box sx={{ mb: 6 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} justifyContent="center" alignItems="stretch">
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{
                    textAlign: 'center',
                    px: 3,
                    py: 3,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 3,
                    backgroundColor: 'white',
                    height: '100%'
                  }}>
                    {feature.icon}
                    <Typography variant="h6" fontWeight="700" sx={{ mt: 2, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Testimonials Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 4, textAlign: 'center' }}>
            What Our Customers Say
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              py: 2,
              px: 1,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </Box>
        </Box>
      </Container>

      {/* Floating Cart Button */}
      <Fab
        color="primary"
        aria-label="cart"
        onClick={handleCartClick}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          backgroundColor: themeColors.primary,
          '&:hover': {
            backgroundColor: alpha(themeColors.primary, 0.9),
            transform: 'scale(1.1)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <Badge badgeContent={getCartItemsCount()} color="error">
          <ShoppingCart />
        </Badge>
      </Fab>

      <Footer />
    </Box>
  );
}