import axios from 'axios';

// Simple, reliable API configuration
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  // local development fallback
  return 'http://localhost:5000/api';
};

const REACT_APP_API_BASE_URL = getApiBaseUrl();

console.log('🎯 API Base URL:', REACT_APP_API_BASE_URL);

const api = axios.create({
  baseURL: REACT_APP_API_BASE_URL,
  timeout: 30000, // 30 seconds for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      // Use window.location instead of navigate for safety
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;