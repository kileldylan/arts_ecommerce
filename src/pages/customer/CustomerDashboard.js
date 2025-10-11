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
  Drawer
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
import ElegantNavbar from '../../components/ELegantNavbar';

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
  { id: '1', name: 'Frames', count: 9, image: '/api/placeholder/80/80?text=Frames' },
  { id: '2', name: 'Wall Art', count: 3, image: '/api/placeholder/80/80?text=Wall+Art' },
  { id: '3', name: 'Wall Décor', count: 5, image: '/api/placeholder/80/80?text=Wall+Décor' },
  { id: '4', name: 'Wallpaper', count: 21, image: '/api/placeholder/80/80?text=Wallpaper' },
  { id: '5', name: 'Signage', count: 7, image: '/api/placeholder/80/80?text=Signage' },
  { id: '6', name: 'Banners', count: 10, image: '/api/placeholder/80/80?text=Banners' },
  { id: '7', name: 'Stickers', count: 5, image: '/api/placeholder/80/80?text=Stickers' },
  { id: '8', name: 'Board Printing', count: 7, image: '/api/placeholder/80/80?text=Board+Printing' },
  { id: '9', name: 'Event Branding', count: 4, image: '/api/placeholder/80/80?text=Event+Branding' },
  { id: '10', name: 'Door Signs', count: 31, image: '/api/placeholder/80/80?text=Door+Signs' }
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

  const productsPerPage = isMobile ? 8 : 12;
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

  // Sleek Product Card Component with fixed Add to Cart button
  const ProductCard = ({ product }) => {
    const cartItem = cart.find(item => item.id === product.id);
    const imageUrl = product.image_url || `/api/placeholder/300/300?text=${encodeURIComponent(product.name || 'Product')}`;

    return (
      <Card
        onClick={() => handleProductClick(product.id)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          backgroundColor: 'white',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            borderColor: alpha(themeColors.primary, 0.3),
            '& .product-image': {
              transform: 'scale(1.05)'
            }
          }
        }}
      >
        {/* Product Image Container */}
        <Box
          sx={{
            position: 'relative',
            paddingTop: '100%', // Square aspect ratio
            backgroundColor: '#f8f9fa',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
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
        </Box>

        {/* Product Info - Clean layout with Add to Cart under price */}
        <CardContent 
          sx={{ 
            p: 2, 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Product Name - Single line with ellipsis */}
          <Typography
            variant="body1"
            fontWeight="600"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              lineHeight: 1.3,
              color: themeColors.text
            }}
          >
            {product.name}
          </Typography>

          {/* Rating - Compact */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  sx={{
                    fontSize: 12,
                    color: star <= 4 ? '#FFD700' : '#E0E0E0'
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              (24)
            </Typography>
          </Box>

          {/* Price - Clean and prominent */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
            <Typography
              variant="h6"
              fontWeight="700"
              sx={{ 
                color: themeColors.primary,
                fontSize: '1rem'
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
                  fontSize: '0.8rem'
                }}
              >
                Ksh {product.compare_price.toLocaleString()}
              </Typography>
            )}
          </Box>

          {/* Add to Cart Button - Always visible under price */}
          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={cartItem}
            sx={{
              backgroundColor: cartItem ? themeColors.success : themeColors.primary,
              color: 'white',
              borderRadius: '8px',
              py: 1,
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: cartItem ? themeColors.success : alpha(themeColors.primary, 0.9),
                transform: 'translateY(-1px)'
              }
            }}
          >
            {cartItem ? '✓ Added to Cart' : '+ Add to Cart'}
          </Button>
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
      <ElegantNavbar />
      
      {/* Cart Drawer */}
      <CartDrawer />
      
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("/api/placeholder/1920/600?text=Art+Decor+Background")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: 'white',
          py: { xs: 6, md: 8 },
          mb: 6,
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
            <Typography
              variant="h3"
              fontWeight="700"
              sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}
            >
              Discover Unique Art & Decor
            </Typography>
            <Typography
              variant="h6"
              sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}
            >
              Transform your space with our curated collection of premium frames, wall art, and custom signage
            </Typography>
            
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search for frames, wall art, signage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                maxWidth: 500,
                mx: 'auto',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '50px',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: 'none' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <Search sx={{ color: themeColors.lightText }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center', px: 2 }}>
                {feature.icon}
                <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Categories Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 4, textAlign: 'center' }}>
            Shop by Category
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {categories.slice(1).map((category) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={category.id}>
                <Card
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    cursor: 'pointer',
                    height: '100%',
                    border: selectedCategory === category.id ? `2px solid ${themeColors.primary}` : `1px solid ${themeColors.border}`,
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: themeColors.primary,
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: '#f8f9fa',
                      borderRadius: '16px',
                      mb: 2,
                      backgroundImage: `url(${category.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: `1px solid ${themeColors.border}`
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5 }}>
                    {category.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.count} items
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
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

        {/* Products Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="700">
              {selectedCategory === '0' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} products found
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
        </Box>

        {/* Products Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography>Loading products...</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {paginatedProducts.map((product) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
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