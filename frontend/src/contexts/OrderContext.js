// contexts/OrderContext.js - COMPLETE FIX FOR UUID ISSUE
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
  
  // Use refs to prevent dependency issues
  const userIdRef = useRef(null);
  const userTypeRef = useRef(null);
  const artistIdRef = useRef(null);

  // Cache for orders
  const cacheRef = useRef({
    orders: null,
    lastFetch: 0,
    cacheDuration: 1 * 60 * 1000
  });

  // Update refs when profile changes
  useEffect(() => {
    if (profile) {
      userIdRef.current = profile.id;
      userTypeRef.current = profile.user_type;
      // IMPORTANT: Store artist_id as is (could be number or string)
      artistIdRef.current = profile.artist_id || profile.id;
      console.log('Profile loaded:', { 
        userType: userTypeRef.current, 
        artistId: artistIdRef.current,
        userId: userIdRef.current 
      });
    }
  }, [profile]);

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

  // Helper to safely get current user's ID as UUID
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id; // This is the UUID from auth.users
  };

  // Helper to get user's profile ID (which might be number or UUID)
  const getUserProfileId = async () => {
    // First try from profile ref
    if (userIdRef.current) return userIdRef.current;
    
    // Otherwise fetch from database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    return profileData?.id || user.id;
  };

  // Get all orders - FIXED UUID HANDLING
  const getOrders = useCallback(async (filters = {}) => {
    // Check cache
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
      
      await ensureValidSession('fetch orders');
      
      // Get current user UUID
      const currentUserId = await getCurrentUserId();
      console.log('Current user UUID:', currentUserId);
      
      // Get user profile to determine type and artist_id
      let userType = userTypeRef.current;
      let artistId = artistIdRef.current;
      
      if (!userType) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, artist_id')
          .eq('id', currentUserId)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else if (profileData) {
          userType = profileData.user_type;
          artistId = profileData.artist_id;
          // Update refs
          userTypeRef.current = userType;
          artistIdRef.current = artistId;
        }
      }
      
      console.log('User type:', userType, 'Artist ID:', artistId);
      
      // Build query - START WITH ALL ORDERS FIRST
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters based on user type - BUT ONLY IF VALUES ARE VALID
      if (userType === 'artist') {
        // CRITICAL FIX: Check if artistId is a valid UUID
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(artistId));
        
        if (artistId && isValidUUID) {
          console.log('Filtering orders for artist with UUID:', artistId);
          query = query.eq('artist_id', artistId);
        } else {
          console.log('Artist ID is not a valid UUID, fetching correct ID...');
          // Fetch the correct UUID for this artist
          const { data: artistData } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_type', 'artist')
            .eq('email', (await supabase.auth.getUser()).data.user?.email)
            .single();
          
          if (artistData?.id) {
            query = query.eq('artist_id', artistData.id);
          } else {
            // If no valid artist ID, return empty results
            console.log('No valid artist ID found, returning empty orders');
            setOrders([]);
            return [];
          }
        }
      } else if (userType === 'customer') {
        // For customers, filter by customer_id (which should be UUID)
        console.log('Filtering orders for customer with UUID:', currentUserId);
        query = query.eq('customer_id', currentUserId);
      }
      
      // Apply additional text filters if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status && filters.payment_status !== 'all') {
        query = query.eq('payment_status', filters.payment_status);
      }
      
      const { data: ordersData, error: supabaseError } = await query;
      
      if (supabaseError) {
        console.error('Supabase query error:', supabaseError);
        // If error is about UUID syntax, try without the filter
        if (supabaseError.message?.includes('invalid input syntax for type uuid')) {
          console.log('UUID error detected, fetching without ID filter...');
          // Fetch all orders and filter client-side
          const { data: allOrders } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (*)
            `)
            .order('created_at', { ascending: false });
          
          // Filter client-side
          let filteredOrders = allOrders || [];
          if (userType === 'artist' && artistIdRef.current) {
            filteredOrders = filteredOrders.filter(o => String(o.artist_id) === String(artistIdRef.current));
          } else if (userType === 'customer') {
            filteredOrders = filteredOrders.filter(o => String(o.customer_id) === String(currentUserId));
          }
          
          ordersData = filteredOrders;
        } else {
          throw supabaseError;
        }
      }
      
      console.log(`✅ Successfully fetched ${ordersData?.length || 0} orders`);
      
      // Fetch customer and artist profiles for enrichment
      let enrichedOrders = ordersData || [];
      
      if (ordersData && ordersData.length > 0) {
        const customerIds = [...new Set(ordersData.map(order => order.customer_id).filter(id => id))];
        const artistIds = [...new Set(ordersData.map(order => order.artist_id).filter(id => id))];
        
        // Fetch customers
        let customers = {};
        if (customerIds.length > 0) {
          const { data: customerData } = await supabase
            .from('profiles')
            .select('id, name, email, phone')
            .in('id', customerIds);
          
          if (customerData) {
            customers = customerData.reduce((acc, customer) => {
              acc[customer.id] = customer;
              return acc;
            }, {});
          }
        }
        
        // Fetch artists
        let artists = {};
        if (artistIds.length > 0) {
          const { data: artistData } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', artistIds);
          
          if (artistData) {
            artists = artistData.reduce((acc, artist) => {
              acc[artist.id] = artist;
              return acc;
            }, {});
          }
        }
        
        enrichedOrders = ordersData.map(order => ({
          ...order,
          customer: customers[order.customer_id] || null,
          artist: artists[order.artist_id] || null
        }));
      }
      
      // Update cache
      cacheRef.current.orders = enrichedOrders;
      cacheRef.current.lastFetch = now;
      
      setOrders(enrichedOrders);
      return enrichedOrders;
      
    } catch (err) {
      console.error('❌ Get orders error:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single order
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
  }, [processOrderData]);

// Create new order - WITH M-PESA INTEGRATION (FULLY FIXED)
// In OrderContext.js - FIXED createOrder function

const createOrder = useCallback(async (orderData) => {
  setLoading(true);
  setError(null);
  
  try {
    console.log('📝 Creating order directly in Supabase...');
    console.log('Order data received:', orderData);
    
    await ensureValidSession('create order');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }
    
    console.log('Current user ID:', user.id);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get artist_id from first product
    const firstProduct = orderData.items[0];
    const productId = firstProduct.productId || firstProduct.product_id;

    console.log('Looking up product ID:', productId);

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('artist_id')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      throw new Error(`Invalid product ID: ${productId}`);
    }

    let artistId = product.artist_id;
    console.log('Raw artist_id from product:', artistId, 'Type:', typeof artistId);

    // Convert numeric artist_id to UUID if needed
    const isNumber = /^\d+$/.test(String(artistId));
    if (isNumber) {
      console.log(`Converting numeric artist_id "${artistId}" to UUID...`);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('artist_id', artistId)
        .single();

      if (profileError || !profile) {
        console.warn('Could not find profile with artist_id =', artistId, ', falling back to first artist profile');
        const { data: fallbackArtist, error: fallbackError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_type', 'artist')
          .limit(1)
          .single();

        if (fallbackError || !fallbackArtist) {
          throw new Error('No artist profile found to associate with this order');
        }
        artistId = fallbackArtist.id;
        console.log('Using fallback artist UUID:', artistId);
      } else {
        artistId = profile.id;
        console.log('Converted numeric artist_id to UUID:', artistId);
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(String(artistId))) {
      console.error('Final artistId is not a valid UUID:', artistId);
      throw new Error(`Invalid artist UUID: ${artistId}`);
    }

    console.log('✅ Final artist UUID to use:', artistId);

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
    
    if (orderError) {
      console.error('Order insert error:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }
    
    console.log('✅ Order created with ID:', order.id);
    
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
    
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('Order items error:', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }
    
    console.log('✅ Order items inserted:', orderItems.length);
    
    // Add status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
      note: 'Order created',
      created_at: new Date().toISOString()
    });
    
    // ✅ FIXED M-PESA INITIATION
    let checkoutRequestId = null;

    if (orderData.payment_method === 'mpesa' && orderData.phone) {
      try {
        console.log('🔄 Initiating M-Pesa via Supabase Edge Function...');
        
        // ✅ Call the edge function with the correct path
        const { data: mpesaResult, error: mpesaError } = await supabase.functions.invoke('mpesa', {
          body: {
            route: 'stkpush',
            phone: orderData.phone,
            amount: Math.round(parseFloat(orderData.totalAmount)),
            orderId: order.id,
          }
        });
        
        console.log('🔍 M-Pesa Edge Function Response (raw):', mpesaResult);
        
        if (mpesaError) {
          console.error('❌ M-Pesa Edge Function error object:', mpesaError);
          throw new Error(`M-Pesa error: ${mpesaError.message}`);
        }
        
        // ✅ CRITICAL FIX: Properly extract CheckoutRequestID from response
        // The edge function returns { success: true, data: { CheckoutRequestID: "...", ... } }
        if (mpesaResult && mpesaResult.success) {
          if (mpesaResult.data && mpesaResult.data.CheckoutRequestID) {
            checkoutRequestId = mpesaResult.data.CheckoutRequestID;
            console.log('✅✅✅ Extracted CheckoutRequestID from mpesaResult.data:', checkoutRequestId);
          } else if (mpesaResult.CheckoutRequestID) {
            checkoutRequestId = mpesaResult.CheckoutRequestID;
            console.log('✅✅✅ Extracted CheckoutRequestID from mpesaResult root:', checkoutRequestId);
          } else {
            console.error('❌ Response missing CheckoutRequestID:', mpesaResult);
          }
        } else if (mpesaResult && mpesaResult.CheckoutRequestID) {
          checkoutRequestId = mpesaResult.CheckoutRequestID;
          console.log('✅✅✅ Extracted CheckoutRequestID directly:', checkoutRequestId);
        } else {
          console.error('❌ Unexpected response structure:', mpesaResult);
        }
        
        // Update order with checkout_request_id if we got one
        if (checkoutRequestId) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              checkout_request_id: checkoutRequestId,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
            
          if (updateError) {
            console.error('Failed to update order with checkout ID:', updateError);
          } else {
            console.log('✅ Order updated with CheckoutRequestID:', checkoutRequestId);
          }
        } else {
          console.warn('⚠️ No CheckoutRequestID received from M-Pesa API');
        }
        
      } catch (mpesaError) {
        console.error('🔥 M-Pesa initiation error:', mpesaError);
        // Don't throw - order is created, just payment initiation failed
        setError('Order created but payment initiation failed: ' + mpesaError.message);
      }
    }
    
    // Clear cache
    cacheRef.current.orders = null;
    
    const result = {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount
      },
      payment: {
        checkout_request_id: checkoutRequestId,
        initiated: !!checkoutRequestId
      }
    };
    
    console.log('📦 Returning result to Checkout component:', result);
    
    return result;
    
  } catch (err) {
    console.error('❌ Create order error:', err);
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  // Update order status
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
      
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status,
          note: note || `Status changed to ${status}`,
          created_at: new Date().toISOString()
        });
      
      cacheRef.current.orders = null;
      
      setTimeout(() => {
        getOrders();
      }, 100);
      
      return { success: true };
      
    } catch (err) {
      console.error('❌ Update order status error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getOrders]);

  // Get order status
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.orders = null;
    cacheRef.current.lastFetch = 0;
  }, []);

  // Initial load
  useEffect(() => {
    if (profile) {
      getOrders();
    }
  }, [profile?.id, getOrders]);

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