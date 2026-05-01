// contexts/OrderContext.js - USING SUPABASE DIRECTLY (like ProductContext)
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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
  const { profile, validateSession } = useAuth();

  // Simple frontend cache for orders
  const cacheRef = useRef({
    orders: null,
    lastFetch: 0,
    cacheDuration: 1 * 60 * 1000 // 1 minute cache for orders
  });

  // Session validation (copied from ProductContext)
  const ensureValidSession = async (operation = 'operation') => {
    try {
      console.log(`🔍 Validating session for ${operation}...`);
      
      if (validateSession) {
        const session = await validateSession();
        if (!session) {
          throw new Error('No valid session. Please log in again.');
        }
        return session;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        throw new Error('No active session. Please log in again.');
      }

      return session;
    } catch (error) {
      console.error(`💥 Session validation failed:`, error);
      throw error;
    }
  };

  // Helper to process order data (similar to processProductImages)
  const processOrderData = useCallback((order) => {
    if (!order) return order;
    
    // Parse shipping_address if it's a string
    if (order.shipping_address && typeof order.shipping_address === 'string') {
      try {
        order.shipping_address = JSON.parse(order.shipping_address);
      } catch (e) {
        console.error('Error parsing shipping_address:', e);
      }
    }
    
    return order;
  }, []);

  // Get all orders - DIRECT FROM SUPABASE (like getAllProducts)
  const getOrders = useCallback(async (filters = {}) => {
    // Check cache first
    const now = Date.now();
    if (cacheRef.current.orders && 
        (now - cacheRef.current.lastFetch) < cacheRef.current.cacheDuration) {
      console.log('✅ Serving orders from frontend cache');
      setOrders(cacheRef.current.orders);
      return cacheRef.current.orders;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching orders from Supabase...');
      
      // Validate session
      await ensureValidSession('fetch orders');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Build query - SIMPLE like products
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply user type filters (using the profile data)
      if (profile?.user_type === 'artist') {
        console.log('Filtering orders for artist:', profile.artist_id);
        query = query.eq('artist_id', profile.artist_id);
      } else if (profile?.user_type === 'customer') {
        console.log('Filtering orders for customer:', user.id);
        query = query.eq('customer_id', user.id);
      }
      
      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      
      const { data: ordersData, error: supabaseError } = await query;
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      console.log(`✅ Successfully fetched ${ordersData?.length || 0} orders`);
      
      // Fetch customer and artist profiles separately (like products does with categories)
      if (ordersData && ordersData.length > 0) {
        const customerIds = [...new Set(ordersData.map(order => order.customer_id).filter(id => id))];
        const artistIds = [...new Set(ordersData.map(order => order.artist_id).filter(id => id))];
        
        // Fetch customers
        let customers = {};
        if (customerIds.length > 0) {
          const { data: customerData, error: customerError } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .in('id', customerIds);
          
          if (!customerError && customerData) {
            customers = customerData.reduce((acc, customer) => {
              acc[customer.id] = customer;
              return acc;
            }, {});
          }
        }
        
        // Fetch artists
        let artists = {};
        if (artistIds.length > 0) {
          const { data: artistData, error: artistError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', artistIds);
          
          if (!artistError && artistData) {
            artists = artistData.reduce((acc, artist) => {
              acc[artist.id] = artist;
              return acc;
            }, {});
          }
        }
        
        // Enrich orders with customer/artist data
        const enrichedOrders = ordersData.map(order => ({
          ...order,
          customer: customers[order.customer_id] || null,
          artist: artists[order.artist_id] || null
        }));
        
        // Update cache
        cacheRef.current.orders = enrichedOrders;
        cacheRef.current.lastFetch = now;
        
        setOrders(enrichedOrders);
        return enrichedOrders;
      }
      
      // Update cache
      cacheRef.current.orders = ordersData || [];
      cacheRef.current.lastFetch = now;
      
      setOrders(ordersData || []);
      return ordersData || [];
      
    } catch (err) {
      console.error('❌ Get orders error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Get single order - DIRECT FROM SUPABASE (like getProduct)
  const getOrder = useCallback(async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching order: ${orderId}`);
      
      await ensureValidSession('fetch order');
      
      const { data: order, error: supabaseError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (supabaseError) throw supabaseError;
      
      // Fetch customer info
      if (order.customer_id) {
        const { data: customer } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .eq('id', order.customer_id)
          .single();
        
        if (customer) order.customer = customer;
      }
      
      // Fetch artist info
      if (order.artist_id) {
        const { data: artist } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', order.artist_id)
          .single();
        
        if (artist) order.artist = artist;
      }
      
      return processOrderData(order);
      
    } catch (err) {
      console.error('❌ Get order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new order - DIRECT TO SUPABASE (like createProduct)
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Creating order directly in Supabase...');
      
      await ensureValidSession('create order');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get artist_id from first product
      const firstProduct = orderData.items[0];
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('artist_id')
        .eq('id', firstProduct.product_id)
        .single();
      
      if (productError) {
        throw new Error('Invalid product ID');
      }
      
      let artistId = product.artist_id;
      
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          artist_id: artistId,
          total_amount: parseFloat(orderData.totalAmount),
          subtotal: parseFloat(orderData.subtotal || orderData.totalAmount),
          tax_amount: parseFloat(orderData.tax_amount || 0),
          shipping_amount: parseFloat(orderData.shipping_amount || 0),
          discount_amount: parseFloat(orderData.discount_amount || 0),
          payment_method: orderData.payment_method || 'mpesa',
          payment_status: 'pending',
          status: 'pending',
          shipping_address: typeof orderData.shippingAddress === 'object' 
            ? JSON.stringify(orderData.shippingAddress)
            : orderData.shippingAddress,
          customer_note: orderData.customer_note || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      console.log('✅ Order created:', order.id);
      
      // Insert order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId || item.product_id,
        product_name: item.name || item.product_name,
        product_price: parseFloat(item.unitPrice || item.price),
        quantity: parseInt(item.quantity),
        total_price: parseFloat((item.unitPrice || item.price) * item.quantity),
        created_at: new Date().toISOString()
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        // Rollback: delete the order
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }
      
      // Add status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'pending',
          note: 'Order created',
          created_at: new Date().toISOString()
        });
      
      // Clear cache
      cacheRef.current.orders = null;
      
      console.log('✅ Order created successfully');
      
      return {
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount
        }
      };
      
    } catch (err) {
      console.error('❌ Create order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status - DIRECT TO SUPABASE
  const updateOrderStatus = useCallback(async (orderId, status, note = '') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Updating order status: ${orderId} -> ${status}`);
      
      await ensureValidSession('update order');
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) throw updateError;
      
      // Add status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status,
          note: note || `Status changed to ${status}`,
          created_at: new Date().toISOString()
        });
      
      // Clear cache
      cacheRef.current.orders = null;
      
      // Refresh orders
      await getOrders();
      
      return { success: true };
      
    } catch (err) {
      console.error('❌ Update order status error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOrders]);

  // Get order status - DIRECT FROM SUPABASE
  const getOrderStatus = useCallback(async (orderId) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, checkout_request_id')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      
      return {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        checkout_request_id: order.checkout_request_id
      };
      
    } catch (err) {
      console.error('Get order status error:', err);
      return null;
    }
  }, []);

  // Poll order status (kept the same but using new getOrderStatus)
  const pollOrderStatus = useCallback(async (orderId, onComplete, onError) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = 3000;
    
    const checkStatus = async () => {
      attempts++;
      try {
        const data = await getOrderStatus(orderId);
        
        if (!data) {
          throw new Error('Failed to fetch status');
        }
        
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
  }, [getOrderStatus]);

  // Get order history - DIRECT FROM SUPABASE
  const getOrderHistory = useCallback(async (orderId) => {
    try {
      const { data: history, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return history || [];
      
    } catch (err) {
      console.error('Get order history error:', err);
      return [];
    }
  }, []);

  // Cancel order
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    return updateOrderStatus(orderId, 'cancelled', reason);
  }, [updateOrderStatus]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.orders = null;
    cacheRef.current.lastFetch = 0;
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
    refreshOrders: () => {
      clearCache();
      return getOrders();
    }
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}