import React, { useState, useEffect, useRef } from 'react';
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
  alpha,
  useTheme,
  useMediaQuery,
  Drawer,
  LinearProgress,
  Paper,
  Stack,
  Chip,
  InputBase,
  Divider,
  MobileStepper
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Favorite,
  LocalShipping,
  Security,
  Support,
  Star,
  Check,
  Close,
  FilterList,
  Sort,
  Tune,
  ClearAll,
  ArrowBack,
  ArrowForward,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Verified,
  Brush,
  Storefront,
  EmojiEvents,
  FlashOn
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#3498DB',
  accent: '#E74C3C',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1',
  success: '#27AE60',
  warmWood: '#8B5A2B',
  gold: '#D4AF37'
};

const heroSlides = [
  {
    id: 1,
    imageDesktop: '/images/hero/desktop/hero_image.jpg',
    imageTablet: '/images/hero/tablet/hero_tablet.jpg',
    imageMobile: '/images/hero/mobile/hero.jpg',
    title: 'Handcrafted Wood Art',
    subtitle: 'Each piece tells a story',
    cta: 'Shop Now',
    link: '/products'
  },
  {
    id: 2,
    imageDesktop: '/images/hero/desktop/hero_image.jpg',
    imageTablet: '/images/hero/tablet/hero_tablet.jpg',
    imageMobile: '/images/hero/mobile/hero.jpg',
    title: 'Custom Intarsia',
    subtitle: 'Your vision, carved in wood',
    cta: 'Commission Art',
    link: '/custom-order'
  },
  {
    id: 3,
    imageDesktop: '/images/hero/desktop/hero_image.jpg',
    imageTablet: '/images/hero/tablet/hero_tablet.jpg',
    imageMobile: '/images/hero/mobile/hero.jpg',
    title: 'Unique Gifts That Last',
    subtitle: 'For the art lover in your life',
    cta: 'Explore Gifts',
    link: '/products?category=gifts'
  }
];

// Categories
const categories = [
  { id: '0', name: 'All Products', icon: <Storefront sx={{ fontSize: 18 }} /> },
  { id: '1', name: 'Wood Intarsia', icon: <Brush sx={{ fontSize: 18 }} /> },
  { id: '2', name: 'Frames', icon: <Storefront sx={{ fontSize: 18 }} /> },
  { id: '3', name: 'Wall Art', icon: <Brush sx={{ fontSize: 18 }} /> },
  { id: '4', name: 'Sculptures', icon: <Brush sx={{ fontSize: 18 }} /> },
  { id: '5', name: 'Aesthetic Mirrors', icon: <Storefront sx={{ fontSize: 18 }} /> }
];

const testimonials = [
  {
    id: 1,
    name: 'Joy Muthoni',
    role: 'Interior Designer, Nairobi',
    content: 'The quality of frames and wall art exceeded my expectations. My clients are always impressed! The wood intarsia pieces add such warmth to modern spaces.',
    rating: 5,
    image: '/api/placeholder/80/80?text=SJ'
  },
  {
    id: 2,
    name: 'Mike Oduor',
    role: 'Office Manager, Kisumu',
    content: 'Perfect signage solutions for our corporate office. Professional and durable. The delivery was prompt and the team was very helpful with custom sizing.',
    rating: 5,
    image: '/api/placeholder/80/80?text=MC'
  },
  {
    id: 3,
    name: 'Emily Chepchumba',
    role: 'Home Owner, Eldoret',
    content: 'Transformed my living space with beautiful wall decor. The customization options are amazing! Got a custom piece for my daughter\'s birthday and she loved it.',
    rating: 4,
    image: '/api/placeholder/80/80?text=ED'
  },
  {
    id: 4,
    name: 'Samuel Kipchoge',
    role: 'Art Collector, Mombasa',
    content: 'I\'ve collected art for years, and Branchi Arts stands out. The attention to detail in their wood intarsia is unmatched. Truly world-class craftsmanship from Kenya!',
    rating: 5,
    image: '/api/placeholder/80/80?text=SK'
  },
  {
    id: 5,
    name: 'Dr. Wanjiku Ndegwa',
    role: 'Restaurant Owner, Westlands',
    content: 'Commissioned several large wall art pieces for my restaurant. My customers constantly compliment them. The wood art creates such a warm, inviting atmosphere.',
    rating: 5,
    image: '/api/placeholder/80/80?text=WN'
  }
];

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayRef = useRef(null);
  const { products, getAllProducts, loading } = useProducts();
  const { cart, addToCart, getCartItemsCount, removeFromCart, updateCartQuantity } = useCart();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    getAllProducts();
  }, [getAllProducts]);

  // Hero slider autoplay
  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
    }
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [autoplay]);

  // Check for cart parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cart') === 'true') {
      setCartDrawerOpen(true);
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, sortBy]);

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

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const productsPerPage = isMobile ? 6 : 12;
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
    const url = new URL(window.location);
    url.searchParams.delete('cart');
    window.history.replaceState({}, '', url);
  };

  const handleSlideChange = (newSlide) => {
    setActiveSlide(newSlide);
    setAutoplay(false);
    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => setAutoplay(true), 10000);
  };

  const hasActiveFilters = selectedCategory !== '0' || searchTerm !== '' || sortBy !== 'newest';

  const clearFilters = () => {
    setSelectedCategory('0');
    setSearchTerm('');
    setSortBy('newest');
  };

  // Mobile Filter Drawer
  const MobileFilterDrawer = () => (
    <Drawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          borderRadius: '20px 20px 0 0',
          maxHeight: '70vh',
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${themeColors.border}` }}>
        <Typography variant="h6" fontWeight="700">
          <Tune sx={{ mr: 1, fontSize: 20, verticalAlign: 'middle' }} />
          Filter & Sort
        </Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, mt: 1 }}>
          Sort By
        </Typography>
        <Select
          fullWidth
          size="small"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="newest">Newest First</MenuItem>
          <MenuItem value="price-low">Price: Low to High</MenuItem>
          <MenuItem value="price-high">Price: High to Low</MenuItem>
          <MenuItem value="name">Name A-Z</MenuItem>
        </Select>

        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, mt: 1 }}>
          Category
        </Typography>
        <Select
          fullWidth
          size="small"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ mb: 2 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </Select>

        <Divider sx={{ my: 2 }} />

        {hasActiveFilters && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ClearAll />}
            onClick={() => {
              clearFilters();
              setFilterDrawerOpen(false);
            }}
            sx={{ mb: 2 }}
          >
            Clear All Filters
          </Button>
        )}
      </Box>

      <Box sx={{ pt: 2, borderTop: `1px solid ${themeColors.border}` }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setFilterDrawerOpen(false)}
          sx={{
            backgroundColor: themeColors.primary,
            py: 1.5,
            borderRadius: '12px'
          }}
        >
          Show {filteredProducts.length} Results
        </Button>
      </Box>
    </Drawer>
  );

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

  // Enhanced Product Card Component
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
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: 'white',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          willChange: 'box-shadow',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
            borderColor: alpha(themeColors.primary, 0.3)
          }
        }}
      >
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
            alt={product.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </Box>

        <CardContent sx={{ p: '10px 12px 12px 12px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              lineHeight: 1.3,
              color: themeColors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 0.5,
              minHeight: isMobile ? '2.6rem' : 'auto'
            }}
          >
            {product.name}
          </Typography>

          <Typography variant="h6" fontWeight="800" sx={{ color: themeColors.primary, fontSize: isMobile ? '1rem' : '1.1rem', lineHeight: 1, mb: 1 }}>
            Ksh {(product.price || 0).toLocaleString()}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={cartItem}
            startIcon={cartItem ? <Check sx={{ fontSize: isMobile ? 14 : 16 }} /> : <ShoppingCart sx={{ fontSize: isMobile ? 14 : 16 }} />}
            sx={{
              backgroundColor: cartItem ? themeColors.success : themeColors.primary,
              color: 'white',
              borderRadius: '8px',
              py: 0.6,
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: cartItem ? themeColors.success : alpha(themeColors.primary, 0.9),
              },
              '&.Mui-disabled': {
                backgroundColor: themeColors.success,
                color: 'white'
              }
            }}
          >
            {cartItem ? 'Added' : 'Add to Cart'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Testimonial Card Component
  const TestimonialCard = ({ testimonial }) => (
    <Card
      elevation={0}
      sx={{
        minWidth: { xs: 280, sm: 300 },
        maxWidth: { xs: 280, sm: 300 },
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${themeColors.border}`,
        backgroundColor: 'white',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          borderColor: alpha(themeColors.gold, 0.3)
        }
      }}
    >
      {/* Quote Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 20,
          fontSize: 40,
          color: alpha(themeColors.gold, 0.15),
          fontFamily: 'Georgia, serif',
          fontWeight: 'bold'
        }}
      >
        "
      </Box>

      {/* Rating Stars */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            sx={{
              fontSize: 16,
              color: star <= testimonial.rating ? '#FFB800' : '#E0E0E0'
            }}
          />
        ))}
      </Box>

      {/* Content */}
      <Typography
        variant="body2"
        sx={{
          fontStyle: 'italic',
          mb: 2,
          lineHeight: 1.5,
          color: themeColors.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          minHeight: 80
        }}
      >
        "{testimonial.content}"
      </Typography>

      {/* Customer Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto', pt: 1 }}>
        {/* Avatar with initial */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: alpha(themeColors.primary, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColors.primary,
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {testimonial.name.charAt(0)}
        </Box>
        
        <Box>
          <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.85rem' }}>
            {testimonial.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
            {testimonial.role}
          </Typography>
        </Box>

        {/* Verified Badge */}
        <Verified
          sx={{
            fontSize: 14,
            color: themeColors.success,
            ml: 'auto',
            opacity: 0.7
          }}
        />
      </Box>
    </Card>
  );

  return (
    <Box sx={{ background: themeColors.background, minHeight: '100vh' }}>
      
      {/* Cart Drawer */}
      <CartDrawer />
      
      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer />

      {/* HERO SECTION - SIMPLE & RESPONSIVE */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          bgcolor: '#000'
        }}
      >
        {/* Hero Container */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: '40vh', sm: '45vh', md: '50vh' },
            transition: 'all 0.3s ease'
          }}
        >
          {heroSlides.map((slide, index) => (
            <Box
              key={slide.id}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: activeSlide === index ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                zIndex: activeSlide === index ? 1 : 0
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#2C1810',
                  filter: 'brightness(0.65)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundImage: {
                    xs: `url(${slide.imageMobile})`,
                    sm: `url(${slide.imageTablet})`,
                    md: `url(${slide.imageDesktop})`
                  },
                  transform: activeSlide === index ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 8s ease-out'
                }}
              />
              
              {/* Gradient Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
                }}
              />

              {/* Content Overlay */}
              <Container
                maxWidth="lg"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: 'white'
                }}
              >
                <Chip
                  icon={<EmojiEvents sx={{ fontSize: 16 }} />}
                  label="Kenyan Artisan • Handcrafted With ❤️"
                  sx={{
                    backgroundColor: alpha(themeColors.gold, 0.9),
                    color: '#2C1810',
                    fontWeight: 600,
                    mb: { xs: 1, sm: 2 },
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }
                  }}
                />

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '2.5rem' },
                    fontWeight: 800,
                    mb: { xs: 0.5, sm: 1 },
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  {slide.title}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.85rem', md: '1rem', lg: '1.2rem' },
                    mb: { xs: 1.5, sm: 2, md: 2.5 },
                    opacity: 0.9,
                    maxWidth: { xs: '280px', sm: '400px', md: '500px' }
                  }}
                >
                  {slide.subtitle}
                </Typography>
              </Container>
            </Box>
          ))}

          {/* Navigation Arrows */}
          <IconButton
            onClick={() => handleSlideChange((activeSlide - 1 + heroSlides.length) % heroSlides.length)}
            sx={{
              position: 'absolute',
              left: { xs: 8, sm: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>

          <IconButton
            onClick={() => handleSlideChange((activeSlide + 1) % heroSlides.length)}
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <KeyboardArrowRight />
          </IconButton>

          {/* Dots Navigation */}
          <MobileStepper
            steps={heroSlides.length}
            position="static"
            activeStep={activeSlide}
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              zIndex: 3,
              backgroundColor: 'transparent',
              justifyContent: 'center',
              '& .MuiMobileStepper-dot': {
                backgroundColor: 'rgba(255,255,255,0.5)',
                margin: '0 4px'
              },
              '& .MuiMobileStepper-dotActive': {
                backgroundColor: themeColors.gold,
                width: 20,
                borderRadius: '4px'
              }
            }}
            backButton={null}
            nextButton={null}
          />
        </Box>
      </Box>

      {/* Trust Bar - Below Hero */}
      <Box
        sx={{
          backgroundColor: themeColors.warmWood,
          color: 'white',
          py: { xs: 1.5, sm: 2 },
          borderBottom: `1px solid ${alpha(themeColors.gold, 0.3)}`
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 4 }}
            justifyContent="center"
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: alpha('#fff', 0.2), display: { xs: 'none', sm: 'block' } }} />}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Verified sx={{ color: themeColors.gold }} />
              <Typography variant="body2">100% Handmade in Kenya</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <FlashOn sx={{ color: themeColors.gold }} />
              <Typography variant="body2">Free Delivery Over Ksh 5,000</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalShipping sx={{ color: themeColors.gold }} />
              <Typography variant="body2">Nationwide Shipping</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Categories Section - RESPONSIVE */}
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {/* Fun Category Pills */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          {/* Mobile: Horizontal Scroll */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1, overflowX: 'auto', pb: 1, px: 1 }}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                icon={category.icon}
                label={category.name}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: selectedCategory === category.id ? themeColors.primary : 'transparent',
                  color: selectedCategory === category.id ? 'white' : themeColors.text,
                  borderColor: alpha(themeColors.primary, 0.3),
                  '&:hover': {
                    backgroundColor: selectedCategory === category.id ? themeColors.primary : alpha(themeColors.primary, 0.08)
                  },
                  py: 2,
                  px: 0.5
                }}
              />
            ))}
          </Box>

          {/* Desktop: Centered Buttons */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(category.id)}
                startIcon={category.icon}
                sx={{
                  textTransform: 'none',
                  fontWeight: selectedCategory === category.id ? 700 : 600,
                  backgroundColor: selectedCategory === category.id ? themeColors.primary : 'transparent',
                  color: selectedCategory === category.id ? 'white' : themeColors.text,
                  borderColor: alpha(themeColors.primary, 0.3),
                  px: { sm: 1.5, md: 2.5 },
                  py: 0.75,
                  borderRadius: 40,
                  fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                  '&:hover': {
                    backgroundColor: selectedCategory === category.id ? themeColors.primary : alpha(themeColors.primary, 0.08)
                  }
                }}
              >
                {category.name}
              </Button>
            ))}
          </Box>
        </Box>
        
        {/* Products Section */}
        <div>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 3,
              backgroundColor: 'white',
              borderRadius: '12px',
              border: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 1.5, sm: 2 }
            }}
          >
            {/* Search Box */}
            <Box
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 auto' },
                display: 'flex',
                alignItems: 'center',
                backgroundColor: themeColors.background,
                borderRadius: '40px',
                px: 2,
                py: 0.5,
                border: `1px solid ${themeColors.border}`,
                order: { xs: 0, sm: 1 }
              }}
            >
              <Search sx={{ color: themeColors.lightText, fontSize: 20, mr: 1 }} />
              <InputBase
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ fontSize: '0.9rem' }}
              />
              {searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', order: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
              {/* Mobile Filter Button */}
              {isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    borderColor: alpha(themeColors.primary, 0.3)
                  }}
                >
                  Filter
                  {hasActiveFilters && (
                    <Badge
                      variant="dot"
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          top: -4,
                          right: -8,
                          width: 8,
                          height: 8,
                          minWidth: 8,
                          borderRadius: '50%'
                        }
                      }}
                    />
                  )}
                </Button>
              )}

              {/* Sort Dropdown */}
              <FormControl size="small" sx={{ minWidth: { xs: 'auto', sm: 150, md: 180 } }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  startAdornment={!isMobile && <Sort sx={{ mr: 0.5, fontSize: 18, color: themeColors.lightText }} />}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiSelect-select': {
                      py: 0.8,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name A-Z</MenuItem>
                </Select>
              </FormControl>

              {/* Results count */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.8rem',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </Typography>

              {/* Clear filters button */}
              {hasActiveFilters && !isMobile && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ClearAll />}
                  onClick={clearFilters}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Paper>

          {/* Active filters chips - mobile */}
          {hasActiveFilters && isMobile && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
              {selectedCategory !== '0' && (
                <Chip
                  size="small"
                  label={categories.find(c => c.id === selectedCategory)?.name}
                  onDelete={() => setSelectedCategory('0')}
                  sx={{ fontSize: '0.7rem', height: 28 }}
                />
              )}
              {searchTerm && (
                <Chip
                  size="small"
                  label={`Search: ${searchTerm.substring(0, 20)}${searchTerm.length > 20 ? '...' : ''}`}
                  onDelete={() => setSearchTerm('')}
                  sx={{ fontSize: '0.7rem', height: 28 }}
                />
              )}
              {sortBy !== 'newest' && (
                <Chip
                  size="small"
                  label={`Sort: ${sortBy === 'price-low' ? 'Price: Low' : sortBy === 'price-high' ? 'Price: High' : 'Name A-Z'}`}
                  onDelete={() => setSortBy('newest')}
                  sx={{ fontSize: '0.7rem', height: 28 }}
                />
              )}
              <Chip
                size="small"
                label={`${filteredProducts.length} results`}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 28 }}
              />
            </Box>
          )}

          {/* Products Grid */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LinearProgress />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gap: { xs: 1.5, sm: 2, md: 2.5 },
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    md: 'repeat(4, 1fr)',
                    lg: 'repeat(4, 1fr)'
                  }
                }}
              >
                {paginatedProducts.map((product) => (
                  <Box key={product.id}>
                    <ProductCard product={product} />
                  </Box>
                ))}
              </Box>

              {paginatedProducts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No products found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or browse different categories
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{ mt: 2 }}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={isMobile ? 1 : 2}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: '8px',
                        '&.Mui-selected': {
                          backgroundColor: themeColors.primary,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: alpha(themeColors.primary, 0.9)
                          }
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </div>

        {/* Testimonials Section - Enhanced */}
        <Box sx={{ mb: 6, mt: 6 }}>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              mb: 1,
              textAlign: 'center',
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: themeColors.primary
            }}
          >
            What Our Customers Say
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              mb: 4,
              color: themeColors.lightText,
              maxWidth: 500,
              mx: 'auto'
            }}
          >
            Join 500+ happy customers who transformed their spaces
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              overflowX: 'auto',
              py: 2,
              px: 2,
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                height: 6
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(themeColors.border, 0.5),
                borderRadius: 10
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(themeColors.primary, 0.3),
                borderRadius: 10
              }
            }}
          >
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </Box>

          {/* Trust Indicator */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3,
              mt: 4,
              flexWrap: 'wrap'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Star sx={{ fontSize: 18, color: '#FFB800' }} />
              <Typography variant="body2" color="text.secondary">
                4.8 ★ Average Rating
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: themeColors.success }} />
              <Typography variant="body2" color="text.secondary">
                500+ Happy Customers
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: themeColors.gold }} />
              <Typography variant="body2" color="text.secondary">
                Kenya Wide Delivery
              </Typography>
            </Stack>
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
            transform: 'scale(1.05)'
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