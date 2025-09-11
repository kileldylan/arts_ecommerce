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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Pending,
  MoreVert
} from '@mui/icons-material';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/NavBar';

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

  const handleStatusChange = (newStatus) => {
    setStatusDialog(true);
    handleMenuClose();
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

    return (
      <Card sx={{ mb: 2, transition: 'all 0.2s', '&:hover': { boxShadow: 3 } }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="h6" fontWeight="bold">
                {order.order_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(order.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                Customer: {order.customer_name}
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" fontWeight="medium">
                Ksh {order.total_amount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.items.length} item(s)
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Chip
                icon={statusConfig[order.status].icon}
                label={statusConfig[order.status].label}
                color={statusConfig[order.status].color}
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

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={1}>
            {order.items.slice(0, 3).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={item.product_images?.[0]?.image_url}
                    sx={{ width: 40, height: 40 }}
                    variant="rounded"
                  >
                    <ShoppingBag />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" noWrap>
                      {item.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} × Ksh {item.product_price}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading orders...
        </Typography>
      </Container>
    );
  }

  return (
    <>
    <Navbar/>
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
    </>
  );
}