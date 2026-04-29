// backend/models/Order.js - COMPLETE REWRITE FOR SUPABASE
const supabase = require('../config/supabase');

// Helper function to generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

const Order = {
  // Create new order
  create: async (orderData) => {
    const {
      customer_id,
      artist_id,
      total_amount,
      subtotal,
      tax_amount = 0,
      shipping_amount = 0,
      discount_amount = 0,
      payment_method,
      shipping_address,
      billing_address = null,
      customer_note = null,
      items
    } = orderData;

    const order_number = generateOrderNumber();

    console.log('Creating order with:', {
      customer_id,
      artist_id,
      total_amount,
      order_number
    });

    // Step 1: Insert the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_id,
        artist_id,
        total_amount: parseFloat(total_amount),
        subtotal: parseFloat(subtotal),
        tax_amount: parseFloat(tax_amount),
        shipping_amount: parseFloat(shipping_amount),
        discount_amount: parseFloat(discount_amount),
        payment_method,
        payment_status: 'pending',
        status: 'pending',
        shipping_address: shipping_address,
        billing_address: billing_address,
        customer_note: customer_note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    console.log('Order created successfully:', order.id);

    // Step 2: Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: parseFloat(item.product_price),
        quantity: parseInt(item.quantity),
        total_price: parseFloat(item.total_price),
        variant_id: item.variant_id || null,
        variant_name: item.variant_name || null,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
        // Rollback: delete the order
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }
    }

    // Step 3: Add status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        status: 'pending',
        note: 'Order created',
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Status history error:', historyError);
      // Don't throw, just log - order is still created
    }

    // Return the complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('Fetch order error:', fetchError);
      return order;
    }

    return completeOrder;
  },

  // Find order by ID
  findById: async (id) => {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        customer:customer_id (name, email, phone),
        artist:artist_id (name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      ...order,
      shipping_address: typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address
    };
  },

  // Find orders with filters
  findAll: async (filters = {}) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id (name, email),
        artist:artist_id (name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.artist_id) {
      query = query.eq('artist_id', filters.artist_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Parse JSON fields
    const parsedOrders = orders.map(order => ({
      ...order,
      shipping_address: typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address,
      billing_address: order.billing_address && typeof order.billing_address === 'string'
        ? JSON.parse(order.billing_address)
        : order.billing_address
    }));

    return parsedOrders;
  },

  // Update order status
  updateStatus: async (orderId, status, note, createdBy) => {
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Add status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        note: note || `Status changed to ${status}`,
        created_by: createdBy,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding status history:', historyError);
    }

    return { success: true };
  },

  // Update payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  },

  // Get order status history
  getStatusHistory: async (orderId) => {
    const { data: history, error } = await supabase
      .from('order_status_history')
      .select('*, created_by_user:created_by (name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return history;
  },

  // Add transaction
  addTransaction: async (transactionData) => {
    const {
      order_id,
      transaction_ref,
      amount,
      payment_method,
      status = 'pending',
      payment_details = null
    } = transactionData;

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        order_id,
        transaction_ref,
        amount,
        payment_method,
        status,
        payment_details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transaction;
  }
};

module.exports = Order;