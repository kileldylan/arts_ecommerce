// backend/controllers/crmController.js
const { supabase } = require('../server');

exports.getCustomers = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { search, minOrders, minSpent, limit = 50 } = req.query;

    // Get customers from orders with user details
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(*)
      `)
      .eq('artist_id', artistId);

    if (search) {
      query = query.or(`user.name.ilike.%${search}%,user.email.ilike.%${search}%`);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('CRM Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customers'
      });
    }

    // Process customer data
    const customers = data?.map(order => ({
      id: order.user?.id,
      name: order.user?.name || 'Unknown',
      email: order.user?.email,
      phone: order.user?.phone,
      totalOrders: 1, // You can aggregate this later
      totalSpent: order.total_amount || 0,
      lastOrder: order.created_at
    })) || [];

    res.json({
      success: true,
      data: customers,
      total: customers.length
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;
    const artistId = req.user.id;

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customerId)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders Error:', ordersError);
    }

    // Get customer notes (if you have a notes table)
    const { data: notes, error: notesError } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (notesError) {
      console.error('Notes Error:', notesError);
    }

    res.json({
      success: true,
      data: {
        ...customer,
        orders: orders || [],
        notes: notes && notes.length > 0 ? notes[0].notes : ''
      }
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getCustomerSegmentation = async (req, res) => {
  try {
    const artistId = req.user.id;

    // Get customer segmentation data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('user_id, total_amount, created_at')
      .eq('artist_id', artistId)
      .eq('status', 'completed');

    if (error) {
      console.error('Segmentation Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch segmentation data'
      });
    }

    // Simple segmentation logic
    const customerStats = {};
    orders?.forEach(order => {
      if (!customerStats[order.user_id]) {
        customerStats[order.user_id] = {
          orderCount: 0,
          totalSpent: 0
        };
      }
      customerStats[order.user_id].orderCount++;
      customerStats[order.user_id].totalSpent += order.total_amount || 0;
    });

    const segments = {
      vip: { count: 0, revenue: 0 },
      regular: { count: 0, revenue: 0 },
      new: { count: 0, revenue: 0 }
    };

    Object.values(customerStats).forEach(stats => {
      if (stats.totalSpent > 10000 || stats.orderCount > 10) {
        segments.vip.count++;
        segments.vip.revenue += stats.totalSpent;
      } else if (stats.orderCount > 1) {
        segments.regular.count++;
        segments.regular.revenue += stats.totalSpent;
      } else {
        segments.new.count++;
        segments.new.revenue += stats.totalSpent;
      }
    });

    res.json({
      success: true,
      data: {
        segments: [
          { segment: 'VIP Customers', count: segments.vip.count, revenue: segments.vip.revenue },
          { segment: 'Regular Customers', count: segments.regular.count, revenue: segments.regular.revenue },
          { segment: 'New Customers', count: segments.new.count, revenue: segments.new.revenue }
        ],
        totalCustomers: Object.keys(customerStats).length,
        totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      }
    });
  } catch (error) {
    console.error('Segmentation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer segmentation'
    });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const artistId = req.user.id;

    // Get lifetime value data
    const { data: ltvData, error: ltvError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('artist_id', artistId)
      .eq('status', 'completed');

    // Get recent customers
    const { data: recentCustomers, error: recentError } = await supabase
      .from('orders')
      .select(`
        user:users(*),
        created_at
      `)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get top spenders
    const { data: topSpenders, error: spendersError } = await supabase
      .from('orders')
      .select(`
        user_id,
        user:users(name, email),
        total_amount
      `)
      .eq('artist_id', artistId)
      .eq('status', 'completed')
      .order('total_amount', { ascending: false })
      .limit(5);

    if (ltvError || recentError || spendersError) {
      console.error('Analytics Errors:', { ltvError, recentError, spendersError });
    }

    // Calculate analytics
    const lifetimeValue = ltvData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const avgOrderValue = ltvData?.length ? lifetimeValue / ltvData.length : 0;

    res.json({
      success: true,
      data: {
        lifetimeValue: {
          total: lifetimeValue,
          averageOrderValue: avgOrderValue,
          totalOrders: ltvData?.length || 0
        },
        segmentation: await this.getCustomerSegmentationData(artistId),
        recentCustomers: recentCustomers?.map(rc => ({
          id: rc.user?.id,
          name: rc.user?.name,
          email: rc.user?.email,
          firstOrder: rc.created_at
        })) || [],
        topSpenders: topSpenders?.map(ts => ({
          id: ts.user?.id,
          name: ts.user?.name,
          email: ts.user?.email,
          totalSpent: ts.total_amount
        })) || []
      }
    });
  } catch (error) {
    console.error('CRM Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics'
    });
  }
};

exports.updateCustomerNotes = async (req, res) => {
  try {
    const { customerId } = req.params;
    const artistId = req.user.id;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required'
      });
    }

    // Update or insert customer notes
    const { data, error } = await supabase
      .from('customer_notes')
      .upsert({
        customer_id: customerId,
        artist_id: artistId,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Update Notes Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update customer notes'
      });
    }

    res.json({
      success: true,
      message: 'Customer notes updated successfully',
      data: data
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Search Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search customers'
      });
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function for segmentation data
const getCustomerSegmentationData = async (artistId) => {
  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total_amount, status')
    .eq('artist_id', artistId)
    .eq('status', 'completed');

  if (!orders) return [];

  const customerStats = {};
  orders.forEach(order => {
    if (!customerStats[order.user_id]) {
      customerStats[order.user_id] = { orderCount: 0, totalSpent: 0 };
    }
    customerStats[order.user_id].orderCount++;
    customerStats[order.user_id].totalSpent += order.total_amount || 0;
  });

  return Object.entries(customerStats).map(([userId, stats]) => ({
    userId,
    ...stats
  }));
};