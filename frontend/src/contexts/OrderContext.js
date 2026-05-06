import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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
  
  const userIdRef = useRef(null);
  const userTypeRef = useRef(null);
  const artistIdRef = useRef(null);

  // Enhanced cache with shorter duration for orders
  const cacheRef = useRef({
    orders: null,
    ordersByStatus: new Map(),
    lastFetch: 0,
    cacheDuration: 5 * 60 * 1000,
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    if (profile) {
      userIdRef.current = profile.id;
      userTypeRef.current = profile.user_type;
      artistIdRef.current = profile.artist_id || profile.id;
    }
  }, [profile]);

  const ensureValidSession = async (operation = 'operation') => {
    try {
      if (validateSession) {
        const session = await validateSession();
        if (!session) throw new Error('No valid session. Please log in again.');
        return session;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) throw new Error('No active session. Please log in again.');
      return session;
    } catch (error) {
      console.error(`💥 Session validation failed:`, error);
      throw error;
    }
  };

  const processOrderData = useCallback((order) => {
    if (!order) return order;
    if (order.shipping_address && typeof order.shipping_address === 'string') {
      try {
        order.shipping_address = JSON.parse(order.shipping_address);
      } catch (e) {
        console.error('Error parsing shipping_address:', e);
      }
    }
    return order;
  }, []);

  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  };

  // OPTIMIZED: Get orders with pagination and caching - FIXED for mobile
  const getOrders = useCallback(async (options = {}) => {
    const { forceRefresh = false, status = null, page = 1, limit = 10 } = options;
    
    // ✅ PREVENT MULTIPLE CONCURRENT REQUESTS
    if (isFetchingRef.current && !forceRefresh) {
      console.log('⏳ Order fetch already in progress, waiting...');
      // Wait for existing request to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isFetchingRef.current) {
            clearInterval(checkInterval);
            resolve(cacheRef.current.orders || []);
          }
        }, 100);
      });
    }
    
    // Check cache (INCREASED DURATION)
    const now = Date.now();
    if (!forceRefresh && cacheRef.current.orders && 
        (now - cacheRef.current.lastFetch) < cacheRef.current.cacheDuration) {
      console.log('✅ Serving orders from cache');
      setOrders(cacheRef.current.orders);
      return cacheRef.current.orders;
    }

    // Set fetching flag
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching orders from Supabase...');
      
      await ensureValidSession('fetch orders');
      
      const currentUserId = await getCurrentUserId();
      
      // Get user profile - CACHE THIS TOO
      let userType = userTypeRef.current;
      if (!userType) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', currentUserId)
          .maybeSingle(); // Use maybeSingle to avoid errors
        if (profileData) {
          userType = profileData.user_type;
          userTypeRef.current = userType;
        }
      }
      
      // Build query - REMOVED PAGINATION FOR INITIAL LOAD (fetch all relevant orders)
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      
      // Apply authorization filters
      if (userType === 'admin') {
        // Admin sees all
      } else if (userType === 'artist') {
        query = query.eq('artist_id', currentUserId);
      } else {
        query = query.eq('customer_id', currentUserId);
      }
      
      // ✅ REMOVED pagination range for initial load - fetch all at once for better UX
      // Mobile networks handle one request better than multiple paginated requests
      
      const { data: ordersData, error: supabaseError } = await query;
      
      if (supabaseError) throw supabaseError;
      
      console.log(`✅ Successfully fetched ${ordersData?.length || 0} orders`);
      
      // Process orders
      const processedOrders = (ordersData || []).map(processOrderData);
      
      // Update cache with LONGER duration
      cacheRef.current.orders = processedOrders;
      cacheRef.current.lastFetch = now;
      cacheRef.current.cacheDuration = 5 * 60 * 1000; // 5 minutes
      
      setOrders(processedOrders);
      return processedOrders;
      
    } catch (err) {
      console.error('❌ Get orders error:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // OPTIMIZED: Get single order with caching
  const getOrder = useCallback(async (orderId, forceRefresh = false) => {
    if (!orderId) throw new Error('Order ID is required');

    // Check cache first
    if (!forceRefresh && cacheRef.current.orders) {
      const cachedOrder = cacheRef.current.orders.find(o => o.id === orderId);
      if (cachedOrder) {
        console.log(`✅ Serving order ${orderId} from cache`);
        return cachedOrder;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching order: ${orderId}`);
      
      await ensureValidSession('fetch order');
      
      const currentUserId = await getCurrentUserId();
      
      const { data: order, error: supabaseError } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('id', orderId)
        .single();

      if (supabaseError) throw supabaseError;
      if (!order) throw new Error('Order not found');
      
      // Authorization check
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUserId)
        .single();
      
      const isAdmin = profile?.user_type === 'admin';
      const isArtist = profile?.user_type === 'artist' && order.artist_id === currentUserId;
      const isCustomer = order.customer_id === currentUserId;
      
      if (!isAdmin && !isArtist && !isCustomer) {
        throw new Error('You do not have permission to view this order');
      }
      
      // Fetch customer and artist info in parallel for speed
      const [customerResult, artistResult] = await Promise.all([
        order.customer_id ? supabase.from('profiles').select('id, first_name, last_name, name, email, phone').eq('id', order.customer_id).single() : Promise.resolve({ data: null }),
        order.artist_id ? supabase.from('profiles').select('id, first_name, last_name, name, email').eq('id', order.artist_id).single() : Promise.resolve({ data: null })
      ]);
      
      if (customerResult.data) order.customer = customerResult.data;
      if (artistResult.data) order.artist = artistResult.data;
      
      return processOrderData(order);
      
    } catch (err) {
      console.error('❌ Get order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [processOrderData]);

  // OPTIMIZED: Create order
  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Creating order...');
      
      await ensureValidSession('create order');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');
      
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get artist_id from first product
      const firstProduct = orderData.items[0];
      const productId = firstProduct.productId || firstProduct.product_id;

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('artist_id')
        .eq('id', productId)
        .single();

      if (productError) throw new Error(`Invalid product ID: ${productId}`);

      let artistId = product.artist_id;
      
      // Convert numeric artist_id to UUID if needed
      const isNumber = /^\d+$/.test(String(artistId));
      if (isNumber) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('artist_id', artistId)
          .single();
        
        if (profile) {
          artistId = profile.id;
        } else {
          const { data: fallbackArtist } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_type', 'artist')
            .limit(1)
            .single();
          if (fallbackArtist) artistId = fallbackArtist.id;
        }
      }

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
          phone: orderData.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);
      
      // Insert order items in batch
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId || item.product_id,
        product_name: item.name || item.product_name,
        product_price: parseFloat(item.unitPrice || item.price),
        quantity: parseInt(item.quantity),
        total_price: parseFloat((item.unitPrice || item.price) * item.quantity),
        created_at: new Date().toISOString()
      }));
      
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }
      
      // Add status history (don't await - fire and forget)
      supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'pending',
        note: 'Order created',
        created_at: new Date().toISOString()
      });
      
      // M-PESA initiation
      let checkoutRequestId = null;
      if (orderData.payment_method === 'mpesa' && orderData.phone) {
        try {
          const { data: mpesaResult } = await supabase.functions.invoke('mpesa', {
            body: {
              route: 'stkpush',
              phone: orderData.phone,
              amount: Math.round(parseFloat(orderData.totalAmount)),
              orderId: order.id,
            }
          });
          
          if (mpesaResult?.success && mpesaResult.data?.CheckoutRequestID) {
            checkoutRequestId = mpesaResult.data.CheckoutRequestID;
            supabase.from('orders').update({ checkout_request_id: checkoutRequestId }).eq('id', order.id);
          }
        } catch (mpesaError) {
          console.error('M-Pesa error:', mpesaError);
        }
      }
      
      // Clear cache
      cacheRef.current.orders = null;
      
      return {
        success: true,
        order: { id: order.id, order_number: order.order_number, total_amount: order.total_amount },
        payment: { checkout_request_id: checkoutRequestId, initiated: !!checkoutRequestId }
      };
      
    } catch (err) {
      console.error('❌ Create order error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status, note = '') => {
    setLoading(true);
    setError(null);
    
    try {
      await ensureValidSession('update order');
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (updateError) throw updateError;
      
      // Fire and forget status history
      supabase.from('order_status_history').insert({
        order_id: orderId,
        status,
        note: note || `Status changed to ${status}`,
        created_at: new Date().toISOString()
      });
      
      cacheRef.current.orders = null;
      getOrders({ forceRefresh: true });
      
      return { success: true };
      
    } catch (err) {
      console.error('❌ Update order status error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOrders]);

  const getOrderStatus = useCallback(async (orderId) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, checkout_request_id')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      return order;
    } catch (err) {
      console.error('Get order status error:', err);
      return null;
    }
  }, []);

  const pollOrderStatus = useCallback(async (orderId, onComplete, onError) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = 3000;
    
    const checkStatus = async () => {
      attempts++;
      try {
        const data = await getOrderStatus(orderId);
        if (!data) throw new Error('Failed to fetch status');
        
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
        if (attempts >= maxAttempts) {
          if (onError) onError(err);
          return true;
        }
        return false;
      }
    };
    
    const poll = async () => {
      const shouldStop = await checkStatus();
      if (!shouldStop) setTimeout(poll, interval);
    };
    
    poll();
  }, [getOrderStatus]);

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

  const cancelOrder = useCallback(async (orderId, reason = '') => {
    return updateOrderStatus(orderId, 'cancelled', reason);
  }, [updateOrderStatus]);

  const clearError = useCallback(() => setError(null), []);
  const clearCache = useCallback(() => {
    cacheRef.current.orders = null;
    cacheRef.current.lastFetch = 0;
  }, []);

  // Initial load
  useEffect(() => {
    if (profile) getOrders();
  }, [profile?.id, getOrders]);

  const value = {
    orders,
    loading,
    error,
    pagination,
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
      return getOrders({ forceRefresh: true });
    }
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}