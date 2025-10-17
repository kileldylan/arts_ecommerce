/////// src/contexts/OrderContext.js
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
  const { user } = useAuth();

  // In OrderContext.js - update the getOrders function
  const getOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Build the base query without shipping_address first
      let baseQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          customer:customer_id (*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on user role
      if (user?.user_type === 'artist') {
        const { data: artistProducts } = await supabase
          .from('products')
          .select('id')
          .eq('artist_id', user.id);

        const productIds = artistProducts?.map(p => p.id) || [];
        
        if (productIds.length > 0) {
          baseQuery = baseQuery.filter('order_items.product_id', 'in', `(${productIds.join(',')})`);
        } else {
          setOrders([]);
          return [];
        }
      } else if (user?.user_type === 'customer') {
        baseQuery = baseQuery.eq('customer_id', user.id);
      }

      // Apply status filter
      if (filters.status) {
        baseQuery = baseQuery.eq('status', filters.status);
      }

      const { data, error: supabaseError } = await baseQuery;

      if (supabaseError) throw supabaseError;

      // If shipping_address relationship exists, fetch it separately
      const ordersWithShipping = await Promise.all(
        (data || []).map(async (order) => {
          if (order.shipping_address_id) {
            try {
              const { data: shippingAddress } = await supabase
                .from('shipping_addresses') // Note the table name might be plural
                .select('*')
                .eq('id', order.shipping_address_id)
                .single();
              
              return { ...order, shipping_address: shippingAddress };
            } catch (error) {
              console.warn('Could not fetch shipping address:', error);
              return { ...order, shipping_address: null };
            }
          }
          return { ...order, shipping_address: null };
        })
      );

      setOrders(ordersWithShipping);
      return ordersWithShipping;
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
          order_number: `ORD-${Date.now()}`, // ✅ generate a unique order number
          customer_id: user.id,              // ✅ required
          artist_id: orderData.items[0]?.artistId || null, // ✅ take from first product
          total_amount: orderData.totalAmount,
          subtotal: orderData.subtotal || orderData.totalAmount,
          tax_amount: orderData.tax_amount || 0,
          shipping_amount: orderData.shipping_amount || 0,
          discount_amount: orderData.discount_amount || 0,
          payment_method: orderData.payment_method || 'mpesa',
          payment_status: 'pending',
          shipping_address: orderData.shippingAddress || {},
          status: 'pending',
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