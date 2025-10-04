// controllers/crmController.js
const CRM = require('../models/CRM');

exports.getCustomers = async (req, res) => {
  try {
    const artistId = req.user.id;
    const { search, minOrders, minSpent, limit } = req.query;

    CRM.getCustomers(artistId, { search, minOrders, minSpent, limit }, (err, results) => {
      if (err) {
        console.error('CRM Error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch customers'
        });
      }

      res.json({
        success: true,
        data: results,
        total: results.length
      });
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
    CRM.getCustomerDetails(customerId, artistId, (err, customerDetails) => {
      if (err) {
        console.error('CRM Error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch customer details'
        });
      }

      if (customerDetails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Get customer orders
      CRM.getCustomerOrders(customerId, artistId, (err, orders) => {
        if (err) {
          console.error('CRM Error:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch customer orders'
          });
        }

        // Get customer notes
        CRM.getCustomerNotes(customerId, artistId, (err, notesResults) => {
          if (err) {
            console.error('CRM Error:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to fetch customer notes'
            });
          }

          res.json({
            success: true,
            data: {
              ...customerDetails[0],
              orders,
              notes: notesResults.length > 0 ? notesResults[0].notes : ''
            }
          });
        });
      });
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

    // This would need to be implemented with Supabase
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        segments: [
          { segment: 'VIP Customers', count: 0, revenue: 0 },
          { segment: 'Regular Customers', count: 0, revenue: 0 },
          { segment: 'New Customers', count: 0, revenue: 0 }
        ],
        message: 'Customer segmentation - implement with Supabase'
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

    const [ltv, segmentation, recentCustomers, topSpenders] = await Promise.all([
      new Promise((resolve, reject) => {
        CRM.getCustomerLTV(artistId, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        CRM.getCustomerSegmentation(artistId, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        CRM.getRecentCustomers(artistId, 5, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        CRM.getTopSpenders(artistId, 5, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ]);

    res.json({
      success: true,
      data: {
        lifetimeValue: ltv,
        segmentation,
        recentCustomers,
        topSpenders
      }
    });
  } catch (error) {
    console.error('CRM Error:', error);
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

    CRM.updateCustomerNotes(customerId, artistId, notes, (err, results) => {
      if (err) {
        console.error('CRM Error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update customer notes'
        });
      }

      res.json({
        success: true,
        message: 'Customer notes updated successfully'
      });
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

    CRM.getCustomers(artistId, { search: query, limit: 10 }, (err, results) => {
      if (err) {
        console.error('CRM Error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to search customers'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};