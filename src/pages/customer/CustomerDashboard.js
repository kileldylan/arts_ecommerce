// src/pages/customer/CustomerDashboard.js
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
  CardMedia,
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
  FavoriteBorder,
  Favorite,
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
import Navbar from '../../components/NavBar';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../contexts/WIshlistContext';

// Modern color palette
const themeColors = {
  primary: '#2C3E50', // Deep navy blue
  secondary: '#E74C3C', // Vibrant coral red
  accent: '#F39C12', // Warm gold
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1'
};

// Mock categories data
const categories = [
  { id: 1, name: 'All Categories', slug: 'all', icon: <LocalMall /> },
  { id: 2, name: 'Jewelry', slug: 'jewelry', icon: <Diamond /> },
  { id: 3, name: 'Paintings', slug: 'paintings', icon: <Palette /> },
  { id: 4, name: 'Sculptures', slug: 'sculptures', icon: <Brush /> }
];
const API_BASE_URL = "http://localhost:5000"; // static file host

const getProductImageUrl = (product) => {
  try {
    if (!product.images) return null;
    
    // Parse the images if it's a string (JSON)
    const images = typeof product.images === 'string' 
      ? JSON.parse(product.images) 
      : product.images;
    
    // Handle both object format and string format
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      // Check if it's an object with image_url property or just a string path
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [cartDrawer, setCartDrawer] = useState(false);
  const { products, loading, getAllProducts } = useProducts();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemsCount } = useCart();
  const navigate = useNavigate();

  const itemsPerPage = 12;

  useEffect(() => {
    getAllProducts();
  }, [getAllProducts]);

  // Show ALL products without filtering
  const filteredProducts = products;

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ProductCard = ({ product }) => {
    const cartItem = cart.find(item => item.id === product.id);
    const imageUrl = getProductImageUrl(product);
    const { wishlist, toggleWishlist } = useWishlist();
    const isWishlisted = wishlist.some((p) => p.id === product.id);

    return (
      <Card
        sx={{
          height: 300, 
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 2,
          transition: '0.2s',
          border: `1px solid ${themeColors.border}`,
          '&:hover': { boxShadow: 6, borderColor: themeColors.accent }
        }}
      >
        {/* Image container */}
        <Box
          sx={{
            height: 140,
            backgroundColor: 'grey.100',
            backgroundImage: `url(${imageUrl || '/api/placeholder/300/250'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px 8px 0 0',
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

  {/* Card body */}
  <CardContent sx={{ flexGrow: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Typography variant="subtitle1" fontWeight={600} noWrap>
      {product.name}
    </Typography>

    <Typography
      variant="body2"
      sx={{
        color: themeColors.lightText,
        fontSize: '0.8rem',
        lineHeight: 1.3,
        flexGrow: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {product.description}
    </Typography>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Rating value={4.5} precision={0.5} size="small" readOnly />
      <Typography variant="caption" sx={{ color: themeColors.lightText }}>
        (24 reviews)
      </Typography>
    </Box>

    <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mt: 2,       // margin-top to separate from content above
    gap: 2       // ensures space between price and button
  }}
>
  <Typography
    variant="h6"
    sx={{
      color: themeColors.secondary,
      fontWeight: "bold",
      fontSize: "1.1rem"
    }}
  >
    Ksh{parseFloat(product.price).toLocaleString()}
  </Typography>

  {cartItem ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton
        size="small"
        onClick={() =>
          updateQuantity(product.id, cartItem.quantity - 1)
        }
        sx={{
          backgroundColor: themeColors.primary,
          color: "white",
          "&:hover": { backgroundColor: alpha(themeColors.primary, 0.8) }
        }}
      >
        <Remove />
      </IconButton>
      <Typography variant="body1" fontWeight="600">
        {cartItem.quantity}
      </Typography>
      <IconButton
        size="small"
        onClick={() =>
          updateQuantity(product.id, cartItem.quantity + 1)
        }
        sx={{
          backgroundColor: themeColors.primary,
          color: "white",
          "&:hover": { backgroundColor: alpha(themeColors.primary, 0.8) }
        }}
      >
        <Add />
      </IconButton>
    </Box>
  ) : (
    <Button
      variant="contained"
      size="small"
      onClick={() => addToCart(product)}
      sx={{
        backgroundColor: themeColors.primary,
        color: "white",
        fontWeight: "600",
        borderRadius: "8px",
        px: 2,
        py: 0.5,
        "&:hover": { backgroundColor: alpha(themeColors.primary, 0.9) }
      }}
    >
      Add to Cart
    </Button>
  )}
</Box>

  </CardContent>
</Card>

    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: themeColors.background
      }}>
        <Typography variant="h4" sx={{ color: themeColors.text }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ 
        background: 'transparent', 
        boxShadow: 'none', 
        position: 'absolute', // overlay on top of hero
        width: '100%',
        zIndex: 10 
      }}>
        {/* Hero Section */}
        <Box sx={{ 
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${alpha(themeColors.primary, 0.8)} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: '0 0 4px 4px'
        }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <Typography variant="h1" sx={{ 
                fontWeight: '800',
                fontSize: { xs: '2.1rem', md: '3.1rem' },
                mb: 2,
                background: 'linear-gradient(45deg, #FFFFFF 30%, #F39C12 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Branchi Arts & Gifts
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: '300',
                opacity: 0.9,
                mb: 4,
                fontSize: { xs: '1.2rem', md: '1.5rem' }
              }}>
                Discover exquisite African jewelry and authentic art pieces
              </Typography>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ pb: 8 }}>
          {/* Search and Filter Bar */}
          <Card sx={{ 
            mb: 3,
            p: 1.5    ,
            borderRadius: '16px',
            border: `1px solid ${themeColors.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search for jewelry, art..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'white'
                    }
                  }}
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
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'white'
                    }}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.slug}>
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
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'white'
                    }}
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
                    '&:hover': {
                      borderColor: themeColors.primary,
                      backgroundColor: alpha(themeColors.primary, 0.04)
                    }
                  }}
                >
                  Filters
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* Products Grid */}
          <Grid 
            container 
            spacing={3} 
            sx={{ 
              mx: 'auto',        // centers the grid
              px: { xs: 1, sm: 2, md: 3 },  // equal padding left/right
              width: '100%'      // ensures full stretch
            }}
          >
            {paginatedProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>

          {/* No Results */}
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

          {/* Pagination */}
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
                    '&.Mui-selected': {
                      backgroundColor: themeColors.primary,
                      color: 'white'
                    }
                  }
                }}
              />
            </Box>
          )}

          {/* Shopping Cart FAB */}
          <Fab
            color="primary"
            aria-label="cart"
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              backgroundColor: themeColors.secondary,
              '&:hover': { 
                backgroundColor: alpha(themeColors.secondary, 0.9),
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => setCartDrawer(true)}
          >
            <Badge badgeContent={getCartItemsCount()} color="error">
              <ShoppingCart />
            </Badge>
          </Fab>

          {/* Filter Drawer */}
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
                max={1000}
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
                    variant={selectedCategory === category.slug ? 'filled' : 'outlined'}
                    color="primary"
                    onClick={() => setSelectedCategory(category.slug)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDrawer(false)}
                sx={{ mt: 2 }}
              >
                Apply Filters
              </Button>
            </Box>
          </Drawer>

          {/* Shopping Cart Drawer */}
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
                      navigate('/checkout');
                      setCartDrawer(false);
                    }}
                    sx={{ mb: 2 }}
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
    </>
  );
}