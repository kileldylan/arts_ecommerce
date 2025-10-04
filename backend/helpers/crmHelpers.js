// backend/helpers/crmHelpers.js
const supabase = require('../config/supabase');

const CRMHelpers = {
  // Get all customers for an artist
  getCustomers: async (artistId, filters = {}) => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          customer_id,
          users!inner (
            id,
            name,
            email,
            phone,
            bio,
            avatar,
            created_at,
            user_type
          ),
          order_items (
            quantity,
            product_price,
            products!inner (
              artist_id
            )
          ),
          created_at
        `)
        .eq('users.user_type', 'customer')
        .eq('order_items.products.artist_id', artistId)
        .neq('status', 'cancelled');

      // Apply search filter
      if (filters.search) {
        query = query.or(`users.name.ilike.%${filters.search}%,users.email.ilike.%${filters.search}%,users.phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by customer and calculate metrics
      const customerMap = new Map();

      data.forEach(order => {
        const customer = order.users;
        if (!customerMap.has(customer.id)) {
          customerMap.set(customer.id, {
            ...customer,
            total_orders: 0,
            total_spent: 0,
            last_order_date: order.created_at,
            order_dates: [order.created_at]
          });
        }

        const customerData = customerMap.get(customer.id);
        customerData.total_orders += 1;
        
        // Calculate order total from items
        const orderTotal = order.order_items.reduce((sum, item) => 
          sum + (item.quantity * parseFloat(item.product_price || 0)), 0);
        customerData.total_spent += orderTotal;

        // Update last order date
        if (new Date(order.created_at) > new Date(customerData.last_order_date)) {
          customerData.last_order_date = order.created_at;
        }

        customerData.order_dates.push(order.created_at);
      });

      // Convert to array and calculate additional metrics
      let customers = Array.from(customerMap.values()).map(customer => {
        const daysSinceLastOrder = Math.floor(
          (new Date() - new Date(customer.last_order_date)) / (1000 * 60 * 60 * 24)
        );
        
        const averageOrderValue = customer.total_orders > 0 
          ? customer.total_spent / customer.total_orders 
          : 0;

        return {
          ...customer,
          total_spent: parseFloat(customer.total_spent.toFixed(2)),
          average_order_value: parseFloat(averageOrderValue.toFixed(2)),
          days_since_last_order: daysSinceLastOrder,
          joined_date: customer.created_at
        };
      });

      // Apply additional filters
      if (filters.minOrders) {
        customers = customers.filter(customer => customer.total_orders >= filters.minOrders);
      }

      if (filters.minSpent) {
        customers = customers.filter(customer => customer.total_spent >= filters.minSpent);
      }

      // Sort and limit
      customers.sort((a, b) => b.total_spent - a.total_spent);

      if (filters.limit) {
        customers = customers.slice(0, filters.limit);
      }

      return customers;
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  },

  // Get customer details with order history
  getCustomerDetails: async (customerId, artistId) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            product_price,
            products!inner (
              artist_id
            )
          )
        `)
        .eq('customer_id', customerId)
        .eq('order_items.products.artist_id', artistId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: customer, error: customerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', customerId)
        .eq('user_type', 'customer')
        .single();

      if (customerError) throw customerError;

      // Calculate metrics
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orders.length > 0 ? orders[0].created_at : null;
      const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].created_at : null;
      const daysSinceLastOrder = lastOrderDate 
        ? Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...customer,
        total_orders: totalOrders,
        total_spent: parseFloat(totalSpent.toFixed(2)),
        average_order_value: parseFloat(averageOrderValue.toFixed(2)),
        last_order_date: lastOrderDate,
        first_order_date: firstOrderDate,
        days_since_last_order: daysSinceLastOrder
      };
    } catch (error) {
      console.error('Get customer details error:', error);
      throw error;
    }
  },

  // Get customer order history
  getCustomerOrders: async (customerId, artistId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            product_price,
            product_name,
            products (
              name
            )
          )
        `)
        .eq('customer_id', customerId)
        .eq('order_items.products.artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(order => ({
        ...order,
        products: order.order_items.map(item => item.products?.name || item.product_name).join(', '),
        items_count: order.order_items.length,
        total_quantity: order.order_items.reduce((sum, item) => sum + item.quantity, 0)
      }));
    } catch (error) {
      console.error('Get customer orders error:', error);
      throw error;
    }
  },

  // Get customer lifetime value analysis
  getCustomerLTV: async (artistId) => {
    try {
      const customers = await CRMHelpers.getCustomers(artistId);

      return customers.map(customer => {
        let segment = 'New';
        if (customer.total_spent >= 10000) segment = 'VIP';
        else if (customer.total_spent >= 5000) segment = 'Premium';
        else if (customer.total_spent >= 1000) segment = 'Regular';

        const daysSinceFirstOrder = customer.joined_date 
          ? Math.floor((new Date() - new Date(customer.joined_date)) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          lifetime_value: customer.total_spent,
          order_count: customer.total_orders,
          days_since_first_order: daysSinceFirstOrder,
          days_since_last_order: customer.days_since_last_order,
          segment
        };
      }).sort((a, b) => b.lifetime_value - a.lifetime_value);
    } catch (error) {
      console.error('Get customer LTV error:', error);
      throw error;
    }
  },

  // Update customer notes
  updateCustomerNotes: async (customerId, artistId, notes) => {
    try {
      // Check if notes exist
      const { data: existingNotes, error: checkError } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .eq('artist_id', artistId)
        .single();

      let result;
      
      if (existingNotes) {
        // Update existing notes
        const { data, error } = await supabase
          .from('customer_notes')
          .update({
            notes,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId)
          .eq('artist_id', artistId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new notes
        const { data, error } = await supabase
          .from('customer_notes')
          .insert([{
            customer_id: customerId,
            artist_id: artistId,
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Update customer notes error:', error);
      throw error;
    }
  },

  // Get customer notes
  getCustomerNotes: async (customerId, artistId) => {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('notes')
        .eq('customer_id', customerId)
        .eq('artist_id', artistId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return data ? data.notes : null;
    } catch (error) {
      console.error('Get customer notes error:', error);
      throw error;
    }
  }
};

module.exports = CRMHelpers;