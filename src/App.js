// src/App.js
import { Analytics } from "@vercel/analytics/react";
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { OrderProvider } from './contexts/OrderContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WIshlistContext';
import OAuthSuccess from './pages/OAuthSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import ElegantNavbar from "./components/ELegantNavbar";
import CustomSpinner from './components/CustomSpinner';
import './App.css';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const ProductList = lazy(() => import('./pages/artist/ProductList'));
const AddProduct = lazy(() => import('./pages/artist/AddProduct'));
const EditProduct = lazy(() => import('./pages/artist/EditProduct'));
const ArtistProfile = lazy(() => import('./pages/artist/ArtistProfile'));
const Orders = lazy(() => import('./pages/artist/Orders'));
const CustomerOrders = lazy(() => import('./pages/customer/CustomOrder'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const CRMDashboard = lazy(() => import('./pages/artist/CRMDashboard'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/artist/ArtistAnalytics'));
const ArtistDashboard = lazy(() => import('./pages/artist/ArtistDashboard'));

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

// ✅ Custom branded loader (NO default spinner!)
const PageLoader = () => <CustomSpinner text="Loading your experience..." />;

// ✅ Auth loader with custom spinner
const AuthLoader = () => <CustomSpinner text="Verifying your account..." />;

const SessionRecovery = () => {
  const { validateSession, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('🔄 App became visible, validating session...');
        validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    window.addEventListener('focus', () => {
      if (isAuthenticated) {
        console.log('🔄 Window focused, validating session...');
        validateSession();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', validateSession);
    };
  }, [isAuthenticated, validateSession]);

  return null;
};

function AppContent() {
  const { loading } = useAuth();
  
  // ✅ Show custom branded spinner while auth is loading
  if (loading) {
    return <PageLoader />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ElegantNavbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* ✅ Suspense with custom branded spinner */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/customer/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            {/* Customer Routes */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/customer/orders" element={
              <ProtectedRoute>
                <CustomerOrders />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/customer/wishlist" element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } />
            
            {/* Artist Routes */}
            <Route path="/artist/dashboard" element={
              <ProtectedRoute>
                <ArtistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/artist/products" element={
              <ProtectedRoute>
                <ProductList />
              </ProtectedRoute>
            } />
            <Route path="/artist/CRM" element={
              <ProtectedRoute>
                <CRMDashboard />
              </ProtectedRoute>
            } />
            <Route path="/artist/products/new" element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            } />
            <Route path="/artist/products/edit/:id" element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            } />
            <Route path="/artist/profile" element={
              <ProtectedRoute>
                <ArtistProfile />
              </ProtectedRoute>
            } />
            <Route path="/artist/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/artist/analytics" element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            {/* Dashboard Route */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProductProvider>
          <SessionRecovery />
          <OrderProvider>
            <CartProvider>
              <WishlistProvider>
                <PaymentProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </PaymentProvider>
              </WishlistProvider>
            </CartProvider>
          </OrderProvider>
        </ProductProvider>
      </AuthProvider>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;