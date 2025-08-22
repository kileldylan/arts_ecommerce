// src/pages/Checkout.js
import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  ShoppingCart,
  LocationOn,
  Payment
} from '@mui/icons-material';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';

// Mock cart data - you'll replace this with your actual cart context
const mockCart = {
  items: [
    {
      product_id: 1,
      product_name: "Test Product",
      product_price: 29.99,
      quantity: 2,
      total_price: 59.98,
      artist_id: 2
    }
  ],
  subtotal: 59.98,
  shipping: 5.99,
  tax: 4.20,
  total: 70.17
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
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        artist_id: mockCart.items[0].artist_id,
        total_amount: mockCart.total,
        subtotal: mockCart.subtotal,
        shipping_amount: mockCart.shipping,
        tax_amount: mockCart.tax,
        discount_amount: 0,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        items: mockCart.items
      };

      const result = await createOrder(orderData);
      navigate(`/orders/${result.order.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Checkout
      </Typography>

      <Grid container spacing={4}>
        {/* Shipping Address */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1 }} /> Shipping Address
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

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Payment sx={{ mr: 1 }} /> Payment Method
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="mpesa">M-Pesa</MenuItem>
                    <MenuItem value="card">Credit/Debit Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cash_on_delivery">Cash on Delivery</MenuItem>
                  </Select>
                </FormControl>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Place Order - $${mockCart.total}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ mr: 1 }} /> Order Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                {mockCart.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {item.quantity} × {item.product_name}
                    </Typography>
                    <Typography variant="body2">${item.total_price}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">${mockCart.subtotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Shipping</Typography>
                  <Typography variant="body2">${mockCart.shipping}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax</Typography>
                  <Typography variant="body2">${mockCart.tax}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">${mockCart.total}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}