// src/pages/artist/Orders.js - FIXED (no flickering)
import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  Alert
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const { orders, loading, error, getOrders, updateOrderStatus } = useOrders();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Load orders once on mount and when profile changes
  useEffect(() => {
    if (profile?.id) {
      loadOrders();
    }
  }, [profile?.id]);

  const loadOrders = async () => {
    try {
      await getOrders({ artist_id: profile?.artist_id || user?.id });
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const getOrderItems = (order) => {
    if (order.items && Array.isArray(order.items)) return order.items;
    if (order.order_items && Array.isArray(order.order_items)) return order.order_items;
    if (order.products && Array.isArray(order.products)) return order.products;
    return [];
  };

  const filteredOrders = React.useMemo(() => {
    if (tabValue === 'all') return orders;
    return orders.filter(order => order.status === tabValue);
  }, [orders, tabValue]);

  const confirmStatusChange = async () => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, selectedOrder.nextStatus, note);
      setStatusDialog(false);
      setNote('');
      // Refresh orders after update
      await loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenStatusDialog = (order, nextStatus) => {
    setSelectedOrder({ ...order, nextStatus });
    setStatusDialog(true);
  };

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={loadOrders}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Order Management
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Manage and track customer orders ({orders.length} total)
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${orders.length})`} value="all" />
            <Tab label={`Pending (${orders.filter(o => o.status === 'pending').length})`} value="pending" />
            <Tab label={`Confirmed (${orders.filter(o => o.status === 'confirmed').length})`} value="confirmed" />
            <Tab label={`Processing (${orders.filter(o => o.status === 'processing').length})`} value="processing" />
            <Tab label={`Shipped (${orders.filter(o => o.status === 'shipped').length})`} value="shipped" />
            <Tab label={`Delivered (${orders.filter(o => o.status === 'delivered').length})`} value="delivered" />
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
        filteredOrders.map((order) => {
          const nextStatusOptions = nextStatusMap[order.status] || [];
          const orderItems = getOrderItems(order);
          const totalAmount = order.total_amount || 0;
          const customerName = order.customer?.name || order.customer_name || 'Customer';
          const orderDate = order.created_at;
          const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString() : 'Date not available';

          return (
            <Card key={order.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6" fontWeight="bold">
                      {order.order_number || order.id?.slice(0, 8)}
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
                      Ksh {totalAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {orderItems.length} item(s)
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Chip
                      icon={statusConfig[order.status]?.icon || <Pending />}
                      label={statusConfig[order.status]?.label || order.status}
                      color={statusConfig[order.status]?.color || 'default'}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
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
                        onClick={() => handleOpenStatusDialog(order, nextStatusOptions[0])}
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
                            <Avatar sx={{ width: 40, height: 40 }} variant="rounded">
                              <ShoppingBag />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" noWrap>
                                {item.product_name || item.name || 'Product'}
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
        })
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => !updating && setStatusDialog(false)}>
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
            disabled={updating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={confirmStatusChange} variant="contained" disabled={updating}>
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}