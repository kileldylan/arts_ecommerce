// src/contexts/OrderContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/axios';

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
  const { user } = useAuth();

  const getOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/orders', { params: filters });
      setOrders(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch orders';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch order';
      setError(errorMessage);
      console.error('Error fetching order:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create order';
      setError(errorMessage);
      console.error('Error creating order:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status, note) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status, note });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update order status';
      setError(errorMessage);
      console.error('Error updating order status:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderHistory = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/orders/${orderId}/history`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch order history';
      setError(errorMessage);
      console.error('Error fetching order history:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    orders,
    loading,
    error,
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    getOrderHistory,
    clearError: () => setError(null)
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}