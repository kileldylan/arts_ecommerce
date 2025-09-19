const axios = require('axios');
const db = require('../config/db');
const { generateTimestamp, formatPhoneNumber } = require('../utils/mpesaUtils');

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortCode: process.env.MPESA_SHORTCODE,
  passKey: process.env.MPESA_PASSKEY,
  callbackURL: process.env.MPESA_CALLBACK_URL || `${process.env.BASE_URL}/api/mpesa/callback`,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
};

const MPESA_BASE_URL = MPESA_CONFIG.environment === 'sandbox'
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

// Generate M-Pesa access token
const generateMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to generate M-Pesa access token');
  }
};

// Initiate STK Push
exports.initiateSTKPush = async (req, res) => {
  try {
    let { phoneNumber, amount, orderId, accountReference } = req.body;

    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, amount, and order ID are required'
      });
    }

    // ✅ sanitize amount (integer only for Daraja)
    amount = parseInt(amount, 10);
    if (isNaN(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const accessToken = await generateMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = Buffer.from(
      `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`
    ).toString('base64');

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const requestData = {
      BusinessShortCode: MPESA_CONFIG.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackURL,
      AccountReference: accountReference || 'Branchi Arts',
      TransactionDesc: `Payment for Order ${orderId}`
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      requestData,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.data.CheckoutRequestID) {
      return res.status(500).json({
        success: false,
        message: 'No CheckoutRequestID returned from M-Pesa',
        data: response.data
      });
    }

    // ✅ Insert transaction (no CAST)
    db.query(
      `INSERT INTO transactions 
        (order_id, transaction_ref, amount, payment_method, status, payment_details) 
       VALUES (?, ?, ?, 'mpesa', 'pending', ?)`,
      [orderId, response.data.CheckoutRequestID, amount, JSON.stringify(requestData)],
      (err, result) => {
        if (err) {
          console.error('Error inserting transaction:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        db.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['pending', orderId]);

        res.json({
          success: true,
          message: 'STK push initiated successfully',
          data: response.data,
          transactionId: result.insertId
        });
      }
    );
  } catch (error) {
    console.error('Error initiating STK push:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate M-Pesa payment',
      error: error.response?.data || error.message
    });
  }
};

// Callback handler
exports.mpesaCallback = (req, res) => {
  try {
    const callbackData = req.body;
    const stkCallback = callbackData.Body.stkCallback;

    if (stkCallback.ResultCode === 0) {
      // Success
      const items = stkCallback.CallbackMetadata.Item;
      const amount = items.find(item => item.Name === 'Amount').Value;
      const mpesaReceiptNumber = items.find(item => item.Name === 'MpesaReceiptNumber').Value;
      const phoneNumber = items.find(item => item.Name === 'PhoneNumber').Value;
      const checkoutRequestId = stkCallback.CheckoutRequestID;

      const extraDetails = {
        mpesaReceiptNumber,
        phoneNumber,
        amountPaid: amount
      };

      db.query(
        `UPDATE transactions 
         SET status = 'completed',
             payment_details = ?
         WHERE transaction_ref = ?`,
        [JSON.stringify(extraDetails), checkoutRequestId]
      );

      db.query(
        'SELECT order_id FROM transactions WHERE transaction_ref = ?',
        [checkoutRequestId],
        (err, rows) => {
          if (!err && rows.length > 0) {
            const orderId = rows[0].order_id;
            db.query('UPDATE orders SET payment_status = "paid", payment_date = NOW() WHERE id = ?', [orderId]);
            db.query(
              `INSERT INTO order_status_history (order_id, status, note, created_by) 
               VALUES (?, 'confirmed', ?, 1)`,
              [orderId, `Payment received via M-Pesa. Receipt: ${mpesaReceiptNumber}`]
            );
          }
        }
      );
    } else {
      // Failed payment
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultDesc = stkCallback.ResultDesc;

      const failDetails = { failureReason: resultDesc };

      db.query(
        `UPDATE transactions 
         SET status = 'failed', payment_details = ?
         WHERE transaction_ref = ?`,
        [JSON.stringify(failDetails), checkoutRequestId]
      );

      db.query('SELECT order_id FROM transactions WHERE transaction_ref = ?', [checkoutRequestId], (err, rows) => {
        if (!err && rows.length > 0) {
          db.query('UPDATE orders SET payment_status = "failed" WHERE id = ?', [rows[0].order_id]);
        }
      });
    }

    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
};

// Check payment status
exports.checkPaymentStatus = (req, res) => {
  const { orderId } = req.params;

  db.query(
    `SELECT o.payment_status, t.status as transaction_status, t.transaction_ref, 
            t.payment_details->>'$.mpesaReceiptNumber' as mpesa_receipt
     FROM orders o
     LEFT JOIN transactions t ON o.id = t.order_id
     WHERE o.id = ?
     ORDER BY t.created_at DESC
     LIMIT 1`,
    [orderId],
    (err, rows) => {
      if (err) {
        console.error('Error checking payment status:', err);
        return res.status(500).json({ success: false, message: 'Failed to check payment status' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = rows[0];
      res.json({
        success: true,
        paymentStatus: order.payment_status,
        transactionStatus: order.transaction_status,
        mpesaReceiptNumber: order.mpesa_receipt,
        transactionRef: order.transaction_ref
      });
    }
  );
};
