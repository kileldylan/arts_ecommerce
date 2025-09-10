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

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [cartDrawer, setCartDrawer] = useState(false);
  const [wishlist, setWishlist] = useState([]);
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

  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.includes(product.id);
    const cartItem = cart.find(item => item.id === product.id);

    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        border: `1px solid ${themeColors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderColor: themeColors.accent
        }
      }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="120"
            image={product.images?.[0]?.image_url || '/api/placeholder/300/280'}
            alt={product.name}
            sx={{ 
              objectFit: 'cover',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          <IconButton
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              '&:hover': { 
                backgroundColor: 'white',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            onClick={() => toggleWishlist(product.id)}
          >
            {isWishlisted ? (
              <Favorite sx={{ color: themeColors.secondary }} />
            ) : (
              <FavoriteBorder sx={{ color: themeColors.text }} />
            )}
          </IconButton>
          {product.is_featured && (
            <Chip
              label="Featured"
              size="small"
              sx={{ 
                position: 'absolute', 
                top: 12, 
                left: 12,
                backgroundColor: themeColors.accent,
                color: 'white',
                fontWeight: '600',
                fontSize: '0.75rem'
              }}
            />
          )}
        </Box>

        <CardContent sx={{ 
          flexGrow: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Typography variant="h6" fontWeight="700" sx={{ 
            color: themeColors.text,
            fontSize: '1.1rem',
            lineHeight: 1.3
          }}>
            {product.name}
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: themeColors.lightText,
            fontSize: '0.9rem',
            lineHeight: 1.4,
            flexGrow: 1
          }}>
            {product.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={4.5} precision={0.5} size="small" readOnly />
            <Typography variant="body2" sx={{ 
              color: themeColors.lightText,
              fontSize: '0.8rem',
              ml: 0.5
            }}>
              (24 reviews)
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ 
            color: themeColors.lightText,
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            By {product.artist_name}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 2
          }}>
            <Typography variant="h6" sx={{ 
              color: themeColors.secondary,
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              Ksh{parseFloat(product.price).toLocaleString()}
            </Typography>
            
            {cartItem ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  sx={{
                    backgroundColor: themeColors.primary,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: alpha(themeColors.primary, 0.8)
                    }
                  }}
                >
                  <Remove />
                </IconButton>
                <Typography variant="body1" fontWeight="600">
                  {cartItem.quantity}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  sx={{
                    backgroundColor: themeColors.primary,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: alpha(themeColors.primary, 0.8)
                    }
                  }}
                >
                  <Add />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="medium"
                onClick={() => addToCart(product)}
                sx={{
                  backgroundColor: themeColors.primary,
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '8px',
                  px: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: alpha(themeColors.primary, 0.9),
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
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
                Ujamaa Collective
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
            mb: 6, 
            p: 3,
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
          <Grid container spacing={3}>
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
                          src={item.images?.[0]?.image_url || '/api/placeholder/80/80'}
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