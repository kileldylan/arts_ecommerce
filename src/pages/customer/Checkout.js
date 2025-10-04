import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart,
  LocationOn,
  Payment,
} from '@mui/icons-material';
import { useOrders } from '../../contexts/OrderContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

// Modern color palette
const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  white: '#FFFFFF',
  border: '#ECF0F1'
};

export default function Checkout() {
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Kenya',
    postal_code: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const { createOrder } = useOrders();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Order totals (no tax)
  const subtotal = getCartTotal();
  const shipping = subtotal > 100 ? 0 : 150; // Example: free shipping over 100
  const total = subtotal + shipping;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/dashboard');
    }
  }, [cart, navigate]);

  // ✅ Handle M-Pesa payment
  const handleMpesaPayment = async () => {
    setPaymentProcessing(true);
    setError('');

    try {
      const orderData = {
        artist_id: cart[0].artist_id,
        total_amount: total,
        subtotal: subtotal,
        tax_amount: 0, // removed tax
        shipping_amount: shipping,
        discount_amount: 0,
        payment_method: 'mpesa',
        shipping_address: shippingAddress,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
          total_price: item.quantity * item.price
        }))
      };

      const orderResponse = await createOrder(orderData);

      if (orderResponse && orderResponse.id) {
        // format phone
        let mpesaPhone = phoneNumber.replace(/\D/g, '');
        if (mpesaPhone.startsWith('0')) {
          mpesaPhone = '254' + mpesaPhone.substring(1);
        } else if (mpesaPhone.startsWith('+254')) {
          mpesaPhone = mpesaPhone.substring(1);
        } else if (mpesaPhone.length === 9) {
          mpesaPhone = '254' + mpesaPhone;
        }

        const response = await fetch('http://localhost:5000/api/mpesa/stkpush', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            phoneNumber: mpesaPhone,
            amount: Math.max(1, Math.floor(total)), // ✅ ensure valid integer
            orderId: orderResponse.id
          })
        });

        const data = await response.json();

        if (data.success) {
          pollPaymentStatus(orderResponse.id);
        } else {
          setError('Failed to initiate M-Pesa payment: ' + (data.message || 'Unknown error'));
          setPaymentProcessing(false);
        }
      } else {
        setError('Failed to create order: ' + (orderResponse?.message || 'Unknown error'));
        setPaymentProcessing(false);
      }
    } catch (error) {
      setError('Error processing M-Pesa payment: ' + error.message);
      setPaymentProcessing(false);
    }
  };

  // ✅ Poll payment status
  const pollPaymentStatus = async (orderId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/mpesa/status/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          if (data.paymentStatus === 'paid') {
            setPaymentStatus('completed');
            setPaymentProcessing(false);
            setMpesaDialogOpen(false);
            clearCart();
            navigate('/customer/orders');
          } else if (data.transactionStatus === 'failed') {
            setPaymentStatus('failed');
            setPaymentProcessing(false);
            setError('M-Pesa payment failed. Please try again.');
          } else if (data.paymentStatus === 'pending') {
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (paymentMethod === 'mpesa') {
      setMpesaDialogOpen(true);
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        artist_id: cart[0].artist_id,
        total_amount: total,
        subtotal: subtotal,
        tax_amount: 0, // removed tax
        shipping_amount: shipping,
        discount_amount: 0,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
          total_price: item.quantity * item.price
        }))
      };

      const orderResponse = await createOrder(orderData);
      
      if (orderResponse && orderResponse.success) {
        clearCart();
        navigate('/order-success');
      } else {
        setError('Failed to create order: ' + (orderResponse?.message || 'Unknown error'));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: themeColors.text, mb: 2 }}>
          Your cart is empty
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: themeColors.primary,
            '&:hover': { backgroundColor: alpha(themeColors.primary, 0.9) }
          }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: themeColors.text }}>
          Checkout
        </Typography>

        <Grid container spacing={4}>
          {/* Shipping + Payment */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: '16px', border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: themeColors.text,
                  mb: 3
                }}>
                  <LocationOn sx={{ mr: 1, color: themeColors.accent }} /> Shipping Address
                </Typography>
                
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Street Address"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        label="City"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        label="State/Province"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        label="Postal Code"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        label="Country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: themeColors.text,
                    mb: 3
                  }}>
                    <Payment sx={{ mr: 1, color: themeColors.accent }} /> Payment Method
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Payment Method"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value="mpesa">M-Pesa</MenuItem>
                      <MenuItem value="card">Credit/Debit Card</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cash_on_delivery">Cash on Delivery</MenuItem>
                    </Select>
                  </FormControl>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{
                      backgroundColor: themeColors.primary,
                      py: 2,
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      '&:hover': {
                        backgroundColor: alpha(themeColors.primary, 0.9),
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {loading ? 'Processing...' : `Place Order - Ksh${total.toFixed(2)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '16px', border: `1px solid ${themeColors.border}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: themeColors.text,
                  mb: 3
                }}>
                  <ShoppingCart sx={{ mr: 1, color: themeColors.accent }} /> Order Summary
                </Typography>

                <Box sx={{ mb: 3 }}>
                  {cart.map((item, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2,
                      p: 2,
                      backgroundColor: alpha(themeColors.background, 0.5),
                      borderRadius: '8px'
                    }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: themeColors.text }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.lightText }}>
                          {item.quantity} × Ksh{item.price}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ color: themeColors.text }}>
                        Ksh{(item.quantity * item.price).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">Subtotal</Typography>
                    <Typography variant="body1">Ksh{subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">Shipping</Typography>
                    <Typography variant="body1">
                      {shipping === 0 ? (
                        <Chip label="FREE" size="small" color="success" />
                      ) : (
                        `Ksh${shipping.toFixed(2)}`
                      )}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: themeColors.text }}>
                    Total
                  </Typography>
                  <Typography variant="h6" sx={{ color: themeColors.primary }}>
                    Ksh{total.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* M-Pesa Payment Dialog */}
        <Dialog open={mpesaDialogOpen} onClose={() => !paymentProcessing && setMpesaDialogOpen(false)}>
          <DialogTitle>M-Pesa Payment</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Enter your M-Pesa phone number to receive a payment prompt:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Phone Number"
              type="tel"
              fullWidth
              variant="outlined"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 07XX XXX XXX"
              disabled={paymentProcessing}
              sx={{ mt: 2 }}
            />
            {paymentProcessing && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">
                  {paymentStatus === 'pending' 
                    ? 'Waiting for payment confirmation...' 
                    : 'Processing payment...'}
                </Typography>
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setMpesaDialogOpen(false)} 
              disabled={paymentProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMpesaPayment} 
              disabled={!phoneNumber || paymentProcessing}
              variant="contained"
            >
              {paymentProcessing ? 'Processing...' : 'Pay with M-Pesa'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
