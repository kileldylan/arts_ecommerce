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
  Button,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
  confirmed: { label: 'Confirmed', color: 'info', icon: <CheckCircle /> },
  processing: { label: 'Processing', color: 'primary', icon: <LocalShipping /> },
  shipped: { label: 'Shipped', color: 'secondary', icon: <LocalShipping /> },
  delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
  cancelled: { label: 'Cancelled', color: 'error', icon: <Pending /> },
  refunded: { label: 'Refunded', color: 'default', icon: <CheckCircle /> }
};

const nextStatusMap = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: []
};

export default function ArtistOrders() {
  const [tabValue, setTabValue] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [note, setNote] = useState('');
  const { orders, loading, getOrders, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getOrders({ artist_id: user.id });
    }
  }, [user, getOrders]);

  // Safely get order items (handle different data structures)
  const getOrderItems = (order) => {
    // Check different possible locations for items
    if (order.items && Array.isArray(order.items)) {
      return order.items;
    }
    if (order.order_items && Array.isArray(order.order_items)) {
      return order.order_items;
    }
    if (order.products && Array.isArray(order.products)) {
      return order.products;
    }
    // Return empty array if no items found
    return [];
  };

  const filteredOrders = tabValue === 'all' 
    ? orders 
    : orders.filter(order => order.status === tabValue);

  const handleMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const confirmStatusChange = async () => {
    try {
      await updateOrderStatus(selectedOrder.id, selectedOrder.nextStatus, note);
      setStatusDialog(false);
      setNote('');
      getOrders({ artist_id: user.id }); // Refresh orders
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const OrderCard = ({ order }) => {
    const nextStatusOptions = nextStatusMap[order.status] || [];
    const orderItems = getOrderItems(order);
    const itemCount = orderItems.length;
    
    // Calculate total amount safely
    const totalAmount = order.total_amount || 
                        order.total || 
                        order.amount || 
                        (orderItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)) || 
                        0;

    // Get customer name safely
    const customerName = order.customer_name || 
                         order.customer?.name || 
                         order.user?.name || 
                         'Customer';

    // Format date safely
    const orderDate = order.created_at || order.createdAt || order.date;
    const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Date not available';

    return (
      <Card sx={{ mb: 2, transition: 'all 0.2s', '&:hover': { boxShadow: 3 } }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="h6" fontWeight="bold">
                {order.order_number || order.id?.slice(0, 8) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formattedDate}
              </Typography>
              <Typography variant="body2">
                Customer: {customerName}
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" fontWeight="medium">
                Ksh {typeof totalAmount === 'number' ? totalAmount.toLocaleString() : totalAmount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {itemCount} item(s)
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Chip
                icon={statusConfig[order.status]?.icon || <Pending />}
                label={statusConfig[order.status]?.label || order.status}
                color={statusConfig[order.status]?.color || 'default'}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/orders/${order.id}`)}
                sx={{ mr: 1 }}
              >
                View Details
              </Button>
              
              {nextStatusOptions.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => {
                    setSelectedOrder({ ...order, nextStatus: nextStatusOptions[0] });
                    handleMenuOpen(e, { ...order, nextStatus: nextStatusOptions[0] });
                  }}
                >
                  Update Status
                </Button>
              )}
            </Grid>
          </Grid>

          {orderItems.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={1}>
                {orderItems.slice(0, 3).map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={item.product_images?.[0]?.image_url || item.image_url || item.image}
                        sx={{ width: 40, height: 40 }}
                        variant="rounded"
                      >
                        <ShoppingBag />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" noWrap>
                          {item.product_name || item.name || item.title || 'Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.quantity || 1} × Ksh {item.product_price || item.price || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
                {orderItems.length > 3 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      +{orderItems.length - 3} more items
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Order Management
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Manage and track customer orders
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Orders" value="all" />
            <Tab label="Pending" value="pending" />
            <Tab label="Confirmed" value="confirmed" />
            <Tab label="Processing" value="processing" />
            <Tab label="Shipped" value="shipped" />
            <Tab label="Delivered" value="delivered" />
          </Tabs>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingBag sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 'all' 
                ? "You don't have any orders yet."
                : `You don't have any ${tabValue} orders.`
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>
          Update Order Status to {selectedOrder?.nextStatus && statusConfig[selectedOrder.nextStatus]?.label}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note (Optional)"
            fullWidth
            multiline
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button onClick={confirmStatusChange} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}