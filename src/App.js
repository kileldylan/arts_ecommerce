import { Analytics } from "@vercel/analytics/react"
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import OAuthSuccess from './pages/OAuthSuccess';
import ProductList from './pages/artist/ProductList';
import AddProduct from './pages/artist/AddProduct';
import EditProduct from './pages/artist/EditProduct';
import ArtistProfile from './pages/artist/ArtistProfile';
import Orders from './pages/artist/Orders';
import './App.css';
import { Box, CircularProgress } from '@mui/material';
import { OrderProvider } from './contexts/OrderContext';
import CustomerOrders from './pages/customer/CustomOrder';
import OrderDetail from './pages/OrderDetail';
import Checkout from './pages/customer/Checkout';
import { CartProvider } from './contexts/CartContext';
import CRMDashboard from './pages/artist/CRMDashboard';
import CustomerProfile from './pages/customer/CustomerProfile';
import { WishlistProvider } from './contexts/WIshlistContext';
import WishlistPage from './pages/customer/WishlistPage';
import Navbar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import AnalyticsDashboard from "./pages/artist/ArtistAnalytics";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1' },
    secondary: { main: '#ec4899' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' } } },
  },
});

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/customer/dashboard" />} /> {/* Redirect root to CustomerDashboard */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          
          <Route path="/customer/dashboard" element={<CustomerDashboard />} /> {/* Public access */}
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/artist/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/artist/CRM" element={<ProtectedRoute><CRMDashboard /></ProtectedRoute>} />
          <Route path="/artist/products/new" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/artist/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/artist/profile" element={<ProtectedRoute><ArtistProfile /></ProtectedRoute>} />
          <Route path="/artist/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/artist/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />

          <Route path="/customer/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Analytics>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProductProvider>
          <OrderProvider>
            <CartProvider>
              <WishlistProvider>
                <Router>
                  <AppContent />
                </Router>
              </WishlistProvider>
            </CartProvider>
          </OrderProvider>
        </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
    </Analytics>
  );
}

export default App;