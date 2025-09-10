// controllers/analyticsController.js
const Analytics = require('../models/Analytics');

exports.getArtistAnalytics = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { startDate = '2024-01-01', endDate = new Date().toISOString().split('T')[0] } = req.query;

    // Get all analytics data in parallel
    const [
      salesAnalytics,
      revenueTrends,
      topProducts,
      customerAnalytics,
      inventoryInsights
    ] = await Promise.all([
      new Promise((resolve, reject) => {
        Analytics.getSalesAnalytics(artistId, startDate, endDate, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        Analytics.getRevenueTrends(artistId, 'monthly', (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        Analytics.getTopProducts(artistId, 5, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        Analytics.getCustomerAnalytics(artistId, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        Analytics.getInventoryInsights(artistId, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      })
    ]);

    res.json({
      success: true,
      data: {
        sales: salesAnalytics,
        trends: revenueTrends,
        topProducts,
        customers: customerAnalytics,
        inventory: inventoryInsights,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

exports.exportReports = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { format = 'json', startDate, endDate } = req.query;

    // Get analytics data
    const analyticsData = await new Promise((resolve, reject) => {
      Analytics.getSalesAnalytics(artistId, startDate, endDate, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (format === 'csv') {
      // Generate CSV
      const csvData = Object.entries(analyticsData)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
      res.send(csvData);
    } else if (format === 'json') {
      res.json({
        success: true,
        data: analyticsData
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
};