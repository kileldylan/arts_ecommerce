// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContexts';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/artist/ProductList';
import AddProduct from './pages/artist/AddProduct';
import EditProduct from './pages/artist/EditProduct';
import './App.css';
import OAuthSuccess from './pages/OAuthSuccess';
import Navbar from './components/NavBar'; 
import { ProductProvider } from './contexts/ProductContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#ec4899',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="app">
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
            
          } 
        />
        <Route 
          path="/artist/products" 
          element={
            <ProtectedRoute>
              <ProductList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/artist/products/new" 
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/artist/products/edit/:id" 
          element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
 <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProductProvider>
          <Router>
            <AppContent />
          </Router>
        </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;