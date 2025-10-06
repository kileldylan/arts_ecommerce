/////// src/contexts/OrderContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

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
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          customer:customer_id (*),
          shipping_address (*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on user role
      if (user?.user_type === 'artist') {
        // For artists, get orders that include their products
        const { data: artistProducts } = await supabase
          .from('products')
          .select('id')
          .eq('artist_id', user.id);

        const productIds = artistProducts?.map(p => p.id) || [];
        
        if (productIds.length > 0) {
          query = query.filter('order_items.product_id', 'in', `(${productIds.join(',')})`);
        } else {
          setOrders([]);
          return [];
        }
      } else if (user?.user_type === 'customer') {
        // For customers, get their own orders
        query = query.eq('customer_id', user.id);
      }

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setOrders(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch orders';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              *,
              profiles:artist_id (*)
            )
          ),
          customer:customer_id (*),
          shipping_address (*)
        `)
        .eq('id', orderId)
        .single();

      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: user.id,
          total_amount: orderData.totalAmount,
          status: 'pending',
          payment_status: 'pending',
          shipping_address_id: orderData.shippingAddressId,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        artist_id: item.artistId,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create order';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateOrderStatus = useCallback(async (orderId, status, note) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      // Add to order history if note provided
      if (note) {
        await supabase
          .from('order_history')
          .insert([{
            order_id: orderId,
            status,
            note,
            updated_by: user.id,
          }]);
      }

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update order status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getOrderHistory = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('order_history')
        .select(`
          *,
          profiles:updated_by (first_name, last_name)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      return data || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch order history';
      setError(errorMessage);
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