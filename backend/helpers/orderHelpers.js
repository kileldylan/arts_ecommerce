// backend/helpers/orderHelpers.js
const supabase = require('../config/supabase');

const OrderHelpers = {
  // Generate unique order number
  generateOrderNumber: () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  },

  // Create order with items (transaction-like behavior)
  createOrderWithItems: async (orderData) => {
    try {
      const orderNumber = OrderHelpers.generateOrderNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: orderData.customer_id,
          artist_id: orderData.artist_id,
          total_amount: orderData.total_amount,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount || 0,
          shipping_amount: orderData.shipping_amount || 0,
          discount_amount: orderData.discount_amount || 0,
          payment_method: orderData.payment_method,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address || null,
          customer_note: orderData.customer_note || null,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          total_price: item.total_price,
          variant_id: item.variant_id || null,
          variant_name: item.variant_name || null,
          created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          // If items fail, delete the order (compensating action)
          await supabase.from('orders').delete().eq('id', order.id);
          throw itemsError;
        }
      }

      // Create initial status history
      await supabase
        .from('order_status_history')
        .insert([{
          order_id: order.id,
          status: 'pending',
          note: 'Order created',
          created_by: orderData.customer_id,
          created_at: new Date().toISOString()
        }]);

      return order;
    } catch (error) {
      console.error('Create order with items error:', error);
      throw error;
    }
  },

  // Get complete order with items and user info
  getCompleteOrder: async (orderId) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers:users!orders_customer_id_fkey(name, email, phone),
          artists:users!orders_artist_id_fkey(name, email),
          order_items(
            *,
            products(slug, images)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Parse JSON fields and format data
      return {
        ...order,
        shipping_address: typeof order.shipping_address === 'string' 
          ? JSON.parse(order.shipping_address) 
          : order.shipping_address,
        billing_address: order.billing_address 
          ? (typeof order.billing_address === 'string' 
            ? JSON.parse(order.billing_address) 
            : order.billing_address)
          : null,
        order_items: order.order_items.map(item => ({
          ...item,
          product_images: item.products?.images 
            ? (typeof item.products.images === 'string' 
              ? JSON.parse(item.products.images) 
              : item.products.images)
            : []
        }))
      };
    } catch (error) {
      console.error('Get complete order error:', error);
      throw error;
    }
  },

  // Update order status with history
  updateOrderStatus: async (orderId, status, note, createdBy) => {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Add status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert([{
          order_id: orderId,
          status: status,
          note: note || `Status changed to ${status}`,
          created_by: createdBy,
          created_at: new Date().toISOString()
        }]);

      if (historyError) {
        console.error('Error adding status history:', historyError);
      }

      return { success: true };
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }
};

module.exports = OrderHelpers;