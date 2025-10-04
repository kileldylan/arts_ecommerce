// backend/helpers/analyticsHelpers.js
const supabase = require('../config/supabase');

const AnalyticsHelpers = {
  // Get sales analytics for artist
  getSalesAnalytics: async (artistId, startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          total_amount,
          status,
          payment_status,
          created_at,
          order_items (
            quantity,
            product_price,
            products!inner (
              artist_id
            )
          )
        `)
        .eq('order_items.products.artist_id', artistId)
        .gte('created_at', startDate)
        .lte('created_at', `${endDate}T23:59:59.999Z`)
        .neq('status', 'cancelled');

      if (error) throw error;

      const paidOrders = data.filter(order => order.payment_status === 'paid');
      
      const totalRevenue = paidOrders.reduce((sum, order) => {
        const orderTotal = order.order_items.reduce((itemSum, item) => 
          itemSum + (item.quantity * parseFloat(item.product_price || 0)), 0);
        return sum + orderTotal;
      }, 0);

      const totalOrders = data.length;
      const pendingOrders = data.filter(order => order.status === 'pending').length;
      const completedOrders = data.filter(order => order.status === 'delivered').length;
      const totalItemsSold = data.reduce((sum, order) => 
        sum + order.order_items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0);

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalItemsSold,
        conversionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0,
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Sales analytics error:', error);
      throw error;
    }
  },

  // Get revenue trends
  getRevenueTrends: async (artistId, period = 'monthly') => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          total_amount,
          created_at,
          payment_status,
          order_items (
            products!inner (
              artist_id
            )
          )
        `)
        .eq('order_items.products.artist_id', artistId)
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const groupedData = data.reduce((acc, order) => {
        const date = new Date(order.created_at);
        let periodKey;

        if (period === 'daily') {
          periodKey = order.created_at.split('T')[0];
        } else if (period === 'weekly') {
          const weekNumber = Math.ceil(date.getDate() / 7);
          periodKey = `${date.getFullYear()}-W${weekNumber}`;
        } else {
          periodKey = order.created_at.substring(0, 7);
        }

        if (!acc[periodKey]) {
          acc[periodKey] = { revenue: 0, orders: 0 };
        }

        acc[periodKey].revenue += parseFloat(order.total_amount || 0);
        acc[periodKey].orders += 1;

        return acc;
      }, {});

      return Object.entries(groupedData).map(([period, data]) => ({
        period,
        revenue: parseFloat(data.revenue.toFixed(2)),
        orders_count: data.orders
      }));
    } catch (error) {
      console.error('Revenue trends error:', error);
      throw error;
    }
  },

  // Get top products
  getTopProducts: async (artistId, limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_price,
          products (
            id,
            name,
            category_id,
            categories (
              name
            ),
            artist_id
          )
        `)
        .eq('products.artist_id', artistId)
        .order('quantity', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Group by product and calculate totals
      const productMap = new Map();

      data.forEach(item => {
        const product = item.products;
        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            category_name: product.categories?.name,
            total_sold: 0,
            total_revenue: 0,
            average_price: 0
          });
        }

        const productData = productMap.get(product.id);
        productData.total_sold += item.quantity;
        productData.total_revenue += item.quantity * parseFloat(item.product_price || 0);
      });

      // Calculate averages and convert to array
      return Array.from(productMap.values()).map(product => ({
        ...product,
        average_price: product.total_sold > 0 ? (product.total_revenue / product.total_sold).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('Top products error:', error);
      throw error;
    }
  },

  // Get customer analytics
  getCustomerAnalytics: async (artistId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          customer_id,
          total_amount,
          created_at,
          order_items (
            products!inner (
              artist_id
            )
          )
        `)
        .eq('order_items.products.artist_id', artistId)
        .neq('status', 'cancelled');

      if (error) throw error;

      const uniqueCustomers = new Set(data.map(order => order.customer_id));
      const totalRevenue = data.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const averageOrderValue = data.length > 0 ? totalRevenue / data.length : 0;
      
      // Get new customers in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = new Set(
        data
          .filter(order => new Date(order.created_at) >= thirtyDaysAgo)
          .map(order => order.customer_id)
      );

      const highestOrderValue = Math.max(...data.map(order => parseFloat(order.total_amount || 0)));

      return {
        totalCustomers: uniqueCustomers.size,
        new_customers_30d: newCustomers.size,
        average_customer_value: parseFloat(averageOrderValue.toFixed(2)),
        highest_order_value: highestOrderValue
      };
    } catch (error) {
      console.error('Customer analytics error:', error);
      throw error;
    }
  },

  // Get inventory insights
  getInventoryInsights: async (artistId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('quantity, price, is_published')
        .eq('artist_id', artistId);

      if (error) throw error;

      const totalProducts = data.length;
      const outOfStock = data.filter(product => product.quantity === 0).length;
      const lowStock = data.filter(product => product.quantity > 0 && product.quantity <= 5).length;
      const publishedProducts = data.filter(product => product.is_published).length;
      
      const averagePrice = data.length > 0 
        ? data.reduce((sum, product) => sum + parseFloat(product.price || 0), 0) / data.length 
        : 0;
      
      const totalInventoryValue = data.reduce((sum, product) => 
        sum + (parseFloat(product.price || 0) * (product.quantity || 0)), 0);

      return {
        total_products: totalProducts,
        out_of_stock: outOfStock,
        low_stock: lowStock,
        average_price: parseFloat(averagePrice.toFixed(2)),
        total_inventory_value: parseFloat(totalInventoryValue.toFixed(2)),
        published_products: publishedProducts
      };
    } catch (error) {
      console.error('Inventory insights error:', error);
      throw error;
    }
  }
};

module.exports = AnalyticsHelpers;