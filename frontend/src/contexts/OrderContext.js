// contexts/OrderContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

// Helper to get backend URL - FIXED for production
const getBackendUrl = () => {
  // For production (Vercel)
  if (process.env.NODE_ENV === 'production') {
    const url = process.env.REACT_APP_API_BASE_URL;
    if (!url) {
      console.error('❌ REACT_APP_API_BASE_URL is not set!');
      return ''; // Will cause errors, but at least we know why
    }
    // Remove trailing slash if present
    return url.replace(/\/$/, '');
  }
  // For development
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
};

// Helper function to create consistent fetch options
const createFetchOptions = async (getToken, method = 'GET', body = null, requiresAuth = true) => {
  const options = {
    method,
    credentials: 'include', // CRITICAL for CORS with credentials
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add body for POST/PUT requests
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  return options;
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getToken, user } = useAuth();
  const backendUrl = getBackendUrl();

  // Log backend URL for debugging
  console.log(`🔧 OrderContext initialized with backend URL: ${backendUrl} (${process.env.NODE_ENV})`);

  // Get all orders with filters - FIXED
  const getOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${backendUrl}/api/orders`;
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.payment_status) queryParams.append('payment_status', filters.payment_status);
      if (filters.customer_id) queryParams.append('customer_id', filters.customer_id);
      if (filters.artist_id) queryParams.append('artist_id', filters.artist_id);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      console.log('📡 Fetching orders from:', url);
      
      const options = await createFetchOptions(getToken, 'GET', null, true);
      const response = await fetch(url, options);
      
      // First check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch orders: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Expected JSON but got:', contentType, text.substring(0, 200));
        throw new Error(`Server returned non-JSON response. Content-Type: ${contentType}`);
      }
      
      const data = await response.json();
      console.log('✅ Orders received:', data?.length || 0);
      setOrders(data || []);
      return data;
    } catch (err) {
      console.error('❌ Get orders error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, backendUrl]);

  // Get single order by ID - FIXED
  const getOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const options = await createFetchOptions(getToken, 'GET', null, true);
      const response = await fetch(`${backendUrl}/api/orders/${orderId}`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch order: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Order received:', data);
      return data;
    } catch (err) {
      console.error('❌ Get order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, backendUrl]);

  // Create new order - FIXED
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        items: orderData.items.map(item => ({
          product_id: item.productId || item.product_id,
          product_name: item.name || item.product_name,
          product_price: item.unitPrice || item.price,
          quantity: item.quantity,
          total_price: (item.unitPrice || item.price) * item.quantity
        })),
        total_amount: orderData.totalAmount,
        subtotal: orderData.subtotal || orderData.totalAmount,
        shipping_amount: orderData.shipping_amount || 0,
        tax_amount: orderData.tax_amount || 0,
        discount_amount: orderData.discount_amount || 0,
        payment_method: orderData.payment_method || 'mpesa',
        shipping_address: orderData.shippingAddress,
        customer_note: orderData.customer_note || '',
        phone: orderData.phone || ''
      };
      
      console.log('📝 Creating order with payload:', payload);
      
      const options = await createFetchOptions(getToken, 'POST', payload, true);
      const response = await fetch(`${backendUrl}/api/orders`, options);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      console.log('✅ Order created successfully:', data);
      return data;
    } catch (err) {
      console.error('❌ Create order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, backendUrl]);

  // Update order status - FIXED
  const updateOrderStatus = useCallback(async (orderId, status, note = '') => {
    setLoading(true);
    setError(null);
    try {
      const options = await createFetchOptions(getToken, 'PUT', { status, note }, true);
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order status');
      }
      
      const data = await response.json();
      console.log('✅ Order status updated:', data);
      
      // Refresh orders list
      await getOrders();
      
      return data;
    } catch (err) {
      console.error('❌ Update order status error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, backendUrl, getOrders]);

  // Poll order status - FIXED
  const pollOrderStatus = useCallback(async (orderId, onComplete, onError) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = 3000;
    
    const checkStatus = async () => {
      attempts++;
      try {
        const options = await createFetchOptions(getToken, 'GET', null, true);
        const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.payment_status === 'paid') {
          if (onComplete) onComplete(data);
          return true;
        } else if (data.payment_status === 'failed') {
          if (onError) onError(new Error('Payment failed'));
          return true;
        }
        
        if (attempts >= maxAttempts) {
          if (onError) onError(new Error('Payment timeout'));
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('Polling error:', err);
        if (attempts >= maxAttempts) {
          if (onError) onError(err);
          return true;
        }
        return false;
      }
    };
    
    const poll = async () => {
      const shouldStop = await checkStatus();
      if (!shouldStop) {
        setTimeout(poll, interval);
      }
    };
    
    poll();
  }, [getToken, backendUrl]);

  // Get order history - FIXED
  const getOrderHistory = useCallback(async (orderId) => {
    try {
      const options = await createFetchOptions(getToken, 'GET', null, true);
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/history`, options);
      
      if (!response.ok) {
        console.warn('Failed to fetch order history');
        return [];
      }
      
      const data = await response.json();
      console.log('✅ Order history received:', data);
      return data;
    } catch (err) {
      console.error('Get order history error:', err);
      return [];
    }
  }, [getToken, backendUrl]);

  // Cancel order - FIXED
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    setLoading(true);
    setError(null);
    try {
      const options = await createFetchOptions(getToken, 'POST', { reason }, true);
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/cancel`, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }
      
      const data = await response.json();
      console.log('✅ Order cancelled:', data);
      
      await getOrders();
      
      return data;
    } catch (err) {
      console.error('❌ Cancel order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken, backendUrl, getOrders]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    orders,
    loading,
    error,
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    pollOrderStatus,
    getOrderHistory,
    cancelOrder,
    clearError,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}