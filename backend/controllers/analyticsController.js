// backend/controllers/analyticsController.js
const { supabase } = require('../server');

const analyticsController = {
  getArtistAnalytics: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get artist analytics from Supabase
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('*')
        .eq('artist_id', userId)
        .eq('status', 'completed');

      if (salesError) throw salesError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('artist_id', userId);

      if (productsError) throw productsError;

      // Calculate analytics
      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalProducts = productsData?.length || 0;

      res.json({
        success: true,
        data: {
          totalSales,
          totalRevenue,
          totalProducts,
          popularProducts: productsData?.slice(0, 5) || [],
          recentSales: salesData?.slice(0, 10) || []
        },
        message: 'Artist analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Artist analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch artist analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  exportReports: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get data for export
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('*')
        .eq('artist_id', userId)
        .eq('status', 'completed');

      if (salesError) throw salesError;

      res.json({
        success: true,
        data: {
          sales: salesData || [],
          exportedAt: new Date().toISOString(),
          totalRecords: salesData?.length || 0
        },
        message: 'Reports exported successfully'
      });
    } catch (error) {
      console.error('Export reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export reports',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getSalesOverTime: async (req, res) => {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const { data: salesData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('artist_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) throw error;

      // Group sales by date
      const salesByDate = {};
      salesData?.forEach(sale => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        if (!salesByDate[date]) {
          salesByDate[date] = { date, count: 0, revenue: 0 };
        }
        salesByDate[date].count += 1;
        salesByDate[date].revenue += sale.total_amount || 0;
      });

      const salesOverTime = Object.values(salesByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      res.json({
        success: true,
        data: {
          salesOverTime,
          period,
          totalSales: salesData?.length || 0,
          totalRevenue: salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        },
        message: 'Sales over time data retrieved successfully'
      });
    } catch (error) {
      console.error('Sales over time error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales over time data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = analyticsController;