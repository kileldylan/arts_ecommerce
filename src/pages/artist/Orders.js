// src/pages/artist/Orders.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Tab,
  Tabs,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Pending,
  Cancel,
  Visibility
} from '@mui/icons-material';

const orderStatus = {
  pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
  confirmed: { label: 'Confirmed', color: 'info', icon: <CheckCircle /> },
  shipped: { label: 'Shipped', color: 'primary', icon: <LocalShipping /> },
  delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
  cancelled: { label: 'Cancelled', color: 'error', icon: <Cancel /> }
};

export default function Orders() {
  const [tabValue, setTabValue] = useState('all');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingDialog, setTrackingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  // Mock data - replace with API call
  useEffect(() => {
    setOrders([
      {
        id: 1,
        orderNumber: 'ORD-001',
        customer: { name: 'John Doe', email: 'john@example.com' },
        items: [{ name: 'Wooden Sculpture', price: 89.99, quantity: 1 }],
        total: 89.99,
        status: 'pending',
        orderDate: '2024-01-15',
        shippingAddress: {
          street: '123 Main St',
          city: 'Nairobi',
          country: 'Kenya'
        }
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        customer: { name: 'Jane Smith', email: 'jane@example.com' },
        items: [
          { name: 'Beaded Necklace', price: 45.99, quantity: 2 },
          { name: 'Painting', price: 199.99, quantity: 1 }
        ],
        total: 291.97,
        status: 'confirmed',
        orderDate: '2024-01-14',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Mombasa',
          country: 'Kenya'
        }
      }
    ]);
  }, []);

  const filteredOrders = tabValue === 'all' 
    ? orders 
    : orders.filter(order => order.status === tabValue);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const handleAddTracking = () => {
    if (selectedOrder && trackingNumber) {
      handleUpdateStatus(selectedOrder.id, 'shipped');
      setTrackingDialog(false);
      setTrackingNumber('');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Order Management
      </Typography>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Orders" value="all" />
            <Tab label="Pending" value="pending" />
            <Tab label="Confirmed" value="confirmed" />
            <Tab label="Shipped" value="shipped" />
            <Tab label="Delivered" value="delivered" />
            <Tab label="Cancelled" value="cancelled" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {filteredOrders.map((order) => (
              <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography variant="body2">
                        {order.customer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.customer.email}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography variant="body2" fontWeight="bold">
                        ${order.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.length} item(s)
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Chip
                        icon={orderStatus[order.status].icon}
                        label={orderStatus[order.status].label}
                        color={orderStatus[order.status].color}
                        variant={order.status === 'pending' ? 'outlined' : 'filled'}
                      />
                    </Grid>

                    <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => setSelectedOrder(order)}
                        sx={{ mr: 1 }}
                      >
                        Details
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedOrder(order);
                            setTrackingDialog(true);
                          }}
                        >
                          Mark Shipped
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders will appear here when customers purchase your artwork
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md">
        <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Customer Information</Typography>
                <Typography>{selectedOrder.customer.name}</Typography>
                <Typography color="text.secondary">{selectedOrder.customer.email}</Typography>
                
                <Typography variant="h6" sx={{ mt: 2 }}>Shipping Address</Typography>
                <Typography>{selectedOrder.shippingAddress.street}</Typography>
                <Typography>{selectedOrder.shippingAddress.city}</Typography>
                <Typography>{selectedOrder.shippingAddress.country}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6">Order Items</Typography>
                {selectedOrder.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{item.quantity} x {item.name}</Typography>
                    <Typography>${(item.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6">${selectedOrder.total}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Number Dialog */}
      <Dialog open={trackingDialog} onClose={() => setTrackingDialog(false)}>
        <DialogTitle>Add Tracking Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tracking Number"
            fullWidth
            variant="outlined"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackingDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTracking} variant="contained">
            Save Tracking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}