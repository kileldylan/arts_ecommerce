// backend/controllers/mpesaController.js
const axios = require('axios');
const supabase = require('../config/supabase');
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

    // ✅ Insert transaction using Supabase
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        order_id: orderId,
        transaction_ref: response.data.CheckoutRequestID,
        amount: amount,
        payment_method: 'mpesa',
        status: 'pending',
        payment_details: requestData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) {
      console.error('Error updating order:', orderError);
    }

    res.json({
      success: true,
      message: 'STK push initiated successfully',
      data: response.data,
      transactionId: transaction.id
    });
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
exports.mpesaCallback = async (req, res) => {
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

      // Update transaction status
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          payment_details: extraDetails,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_ref', checkoutRequestId)
        .select('order_id')
        .single();

      if (!transactionError && transaction) {
        // Update order payment status
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.order_id);

        // Add order status history
        await supabase
          .from('order_status_history')
          .insert([{
            order_id: transaction.order_id,
            status: 'confirmed',
            note: `Payment received via M-Pesa. Receipt: ${mpesaReceiptNumber}`,
            created_by: 1, // System user
            created_at: new Date().toISOString()
          }]);
      }
    } else {
      // Failed payment
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const resultDesc = stkCallback.ResultDesc;

      const failDetails = { failureReason: resultDesc };

      // Update transaction status to failed
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          payment_details: failDetails,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_ref', checkoutRequestId)
        .select('order_id')
        .single();

      if (!transactionError && transaction) {
        // Update order payment status to failed
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.order_id);
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order and latest transaction using Supabase
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select(`
        payment_status,
        transactions (
          status,
          transaction_ref,
          payment_details
        )
      `)
      .eq('id', orderId)
      .order('created_at', { foreignTable: 'transactions', ascending: false })
      .limit(1);

    if (orderError) {
      console.error('Error checking payment status:', orderError);
      return res.status(500).json({ success: false, message: 'Failed to check payment status' });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    const latestTransaction = order.transactions && order.transactions.length > 0 ? order.transactions[0] : null;

    let mpesaReceiptNumber = null;
    if (latestTransaction && latestTransaction.payment_details) {
      try {
        const paymentDetails = typeof latestTransaction.payment_details === 'string' 
          ? JSON.parse(latestTransaction.payment_details) 
          : latestTransaction.payment_details;
        mpesaReceiptNumber = paymentDetails.mpesaReceiptNumber;
      } catch (e) {
        console.error('Error parsing payment details:', e);
      }
    }

    res.json({
      success: true,
      paymentStatus: order.payment_status,
      transactionStatus: latestTransaction ? latestTransaction.status : null,
      mpesaReceiptNumber: mpesaReceiptNumber,
      transactionRef: latestTransaction ? latestTransaction.transaction_ref : null
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};