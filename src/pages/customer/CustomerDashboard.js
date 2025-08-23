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
  Divider
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  FavoriteBorder,
  Favorite,
  FilterList,
  Close,
  Add,
  Remove
} from '@mui/icons-material';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/NavBar';
import { useNavigate } from 'react-router-dom';
// Mock categories data - replace with actual categories from your backend
const categories = [
  { id: 1, name: 'All Categories', slug: 'all' },
  { id: 2, name: 'Jewelry', slug: 'jewelry' },
  { id: 3, name: 'Paintings', slug: 'paintings' },
  { id: 4, name: 'Sculptures', slug: 'sculptures' },
  { id: 5, name: 'Textiles', slug: 'textiles' },
  { id: 6, name: 'Pottery', slug: 'pottery' }
];

const priceRanges = [
  { label: 'Under Ksh25', min: 0, max: 25 },
  { label: 'Ksh25 - Ksh50', min: 25, max: 50 },
  { label: 'Ksh50 - Ksh100', min: 50, max: 100 },
  { label: 'Ksh100 - Ksh200', min: 100, max: 200 },
  { label: 'Over Ksh200', min: 200, max: 1000 }
];

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { products, loading, getProducts } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();

  const itemsPerPage = 12;

  useEffect(() => {
    getProducts({ is_published: true });
  }, [getProducts]);

  // Filter products based on search, category, and price
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_name?.toLowerCase() === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.includes(product.id);
    const cartItem = cart.find(item => item.id === product.id);

    return (
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="250"
            image={product.images?.[0]?.image_url || '/api/placeholder/300/250'}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': { backgroundColor: 'white' }
            }}
            onClick={() => toggleWishlist(product.id)}
          >
            {isWishlisted ? (
              <Favorite color="error" />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
          {product.is_featured && (
            <Chip
              label="Featured"
              color="primary"
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom noWrap>
            {product.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={4.5} precision={0.5} size="small" readOnly />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              (24 reviews)
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            By {product.artist_name}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              Ksh{product.price}
            </Typography>
            
            {cartItem ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                >
                  <Remove />
                </IconButton>
                <Typography variant="body1" fontWeight="medium">
                  {cartItem.quantity}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
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
                  backgroundColor: '#6366f1',
                  '&:hover': { backgroundColor: '#4f46e5' }
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
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4">Loading products...</Typography>
      </Container>
    );
  }

  return (
    <>
    <Navbar/>
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header Section */}
      <Box sx={{ 
        backgroundColor: 'white', 
        py: 4, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        mb: 4 
      }}>
        <Container maxWidth="xl">
          <Typography variant="h2" fontWeight="bold" color="primary.main" gutterBottom>
            Ujamaa Collective
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Discover unique African art and handmade jewelry
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 8 }}>
        {/* Search and Filter Bar */}
        <Card sx={{ mb: 4, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.slug}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
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
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDrawer(true)}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Results Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredProducts.length} products
          </Typography>
        </Box>

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
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        )}

        {/* Shopping Cart FAB */}
        <Fab
          color="primary"
          aria-label="cart"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#6366f1',
            '&:hover': { backgroundColor: '#4f46e5' }
          }}
          onClick={() => setFilterDrawer(true)} // This will open cart drawer
        >
          <Badge badgeContent={totalCartItems} color="error">
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
          open={filterDrawer} // You might want to separate this state for cart
          onClose={() => setFilterDrawer(false)}
        >
          <Box sx={{ width: 400, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Shopping Cart ({totalCartItems})</Typography>
              <IconButton onClick={() => setFilterDrawer(false)}>
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
                          Ksh{item.price} × {item.quantity}
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
                    Ksh{cartTotal.toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    navigate('/checkout');
                    console.log('Proceed to checkout');
                  }}
                  sx={{ mb: 2 }}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setCart([])}
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