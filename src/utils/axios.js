// src/utils/axios.js
import axios from 'axios';

// Use environment variable with proper fallbacks
const getApiBaseUrl = () => {
  // Priority 1: Use the environment variable from Vercel
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Priority 2: Auto-detect production environment
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('branchiartsgifts')) {
    return 'https://arts-ecommerce.onrender.com/api';
  }
  
  // Priority 3: Default to localhost for development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🚀 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hostname: window.location.hostname
});

// Create axios instance with better production settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Increased timeout for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📡 Making API call to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with production error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      code: error.code,
      message: error.message,
      status: error.response?.status
    });

    // Handle specific errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/login';
    }
    
    // Provide better error messages for production
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - backend might be starting up. Please try again.';
    } else if (!error.response) {
      error.message = 'Cannot connect to server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

export default api;