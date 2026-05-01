// src/contexts/OrderContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

const OrderContext = createContext();

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, getToken } = useAuth();

  const getOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      let url = `${backendUrl}/api/orders`;
      const queryParams = new URLSearchParams();
      
      // Handle all filter types
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.payment_status) queryParams.append('payment_status', filters.payment_status);
      if (filters.customer_id) queryParams.append('customer_id', filters.customer_id);
      if (filters.artist_id) queryParams.append('artist_id', filters.artist_id);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      console.log('Fetching orders from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log('Orders received:', data.length);
      setOrders(data);
      return data;
    } catch (err) {
      console.error('Get orders error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

    // UPDATED: Create order that works with M-Pesa
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Please login to place an order');
      }
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const payload = {
        items: orderData.items.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          product_price: item.unitPrice,
          quantity: item.quantity,
          total_price: item.unitPrice * item.quantity
        })),
        total_amount: orderData.totalAmount,
        subtotal: orderData.subtotal || orderData.totalAmount,
        shipping_amount: orderData.shipping_amount || 0,
        tax_amount: orderData.tax_amount || 0,
        discount_amount: orderData.discount_amount || 0,
        payment_method: orderData.payment_method || 'mpesa',
        shipping_address: orderData.shippingAddress,
        customer_note: orderData.customer_note || '',
        phone: orderData.phone || '' // Make sure phone is included
      };
      
      console.log('Sending order to backend:', payload);
      
      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }
      
      console.log('Order creation response:', data);
      return data; // Return the full response (including order and payment info)
    } catch (err) {
      console.error('Create order failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // NEW: Poll order status
  const pollOrderStatus = useCallback(async (orderId, onComplete, onError) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 * 3 seconds = 180 seconds = 3 minutes
    const interval = 3000; // 3 seconds
    
    const checkStatus = async () => {
      attempts++;
      try {
        const token = await getToken();
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.payment_status === 'paid') {
          if (onComplete) onComplete(data);
          return true; // Stop polling
        } else if (data.payment_status === 'failed') {
          if (onError) onError(new Error('Payment failed'));
          return true; // Stop polling
        }
        
        if (attempts >= maxAttempts) {
          if (onError) onError(new Error('Payment timeout'));
          return true; // Stop polling
        }
        
        return false; // Continue polling
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
  }, [getToken]);

  const updateOrderStatus = useCallback(async (orderId, status, note) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });
      
      if (!response.ok) throw new Error('Failed to update order status');
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Update order status error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch single order by ID
  const getOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      console.log('Order received:', data);
      return data;
    } catch (err) {
      console.error('Get order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch order history/timeline
  const getOrderHistory = useCallback(async (orderId) => {
    try {
      const token = await getToken();
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch order history');
        return []; // Return empty array if endpoint doesn't exist
      }
      
      const data = await response.json();
      console.log('Order history received:', data);
      return data;
    } catch (err) {
      console.error('Get order history error:', err);
      return []; // Return empty array on error
    }
  }, [getToken]);

  const value = {
    orders,
    loading,
    error,
    getOrders,
    getOrder,
    getOrderHistory,
    createOrder,
    pollOrderStatus,
    updateOrderStatus,
    clearError: () => setError(null)
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}