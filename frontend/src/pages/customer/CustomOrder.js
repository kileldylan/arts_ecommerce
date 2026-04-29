// src/pages/customer/CustomerOrders.js - FIXED VERSION
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
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Pending,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

const statusConfig = {
  pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
  confirmed: { label: 'Confirmed', color: 'info', icon: <CheckCircle /> },
  processing: { label: 'Processing', color: 'primary', icon: <LocalShipping /> },
  shipped: { label: 'Shipped', color: 'secondary', icon: <LocalShipping /> },
  delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
  cancelled: { label: 'Cancelled', color: 'error', icon: <Pending /> },
  refunded: { label: 'Refunded', color: 'default', icon: <CheckCircle /> }
};

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  refunded: { label: 'Refunded', color: 'default' }
};

export default function CustomerOrders() {
  const [tabValue, setTabValue] = useState('all');
  const { orders, loading, error, getOrders } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log('Fetching orders for user:', user.id, 'type:', user.user_type);
      getOrders().catch(err => {
        console.error('Failed to fetch orders:', err);
      });
    }
  }, [user, getOrders]);

  // Filter orders based on tab
  const filteredOrders = tabValue === 'all' 
    ? orders 
    : orders.filter(order => order.status === tabValue);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your orders...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading orders: {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => getOrders()}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  const OrderCard = ({ order }) => {
    // Safely get order items - handle both array and object formats
    const orderItems = order.order_items || [];
    const itemsCount = Array.isArray(orderItems) ? orderItems.length : 0;
    
    // Safely format date
    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date not available';
    
    // Safely format amount
    const totalAmount = order.total_amount ? Number(order.total_amount).toLocaleString() : '0';
    
    return (
      <Card sx={{ mb: 2, transition: 'all 0.2s', '&:hover': { boxShadow: 3 } }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="h6" fontWeight="bold">
                {order.order_number || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {orderDate}
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" fontWeight="medium">
                Ksh {totalAmount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {itemsCount} item(s)
              </Typography>
            </Grid>

            <Grid item xs={12} md={2}>
              <Chip
                icon={statusConfig[order.status]?.icon}
                label={statusConfig[order.status]?.label || order.status || 'Unknown'}
                color={statusConfig[order.status]?.color || 'default'}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Chip
                label={paymentStatusConfig[order.payment_status]?.label || order.payment_status || 'Unknown'}
                color={paymentStatusConfig[order.payment_status]?.color || 'default'}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                View Details
              </Button>
            </Grid>
          </Grid>

          {itemsCount > 0 && Array.isArray(orderItems) && (
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
                          {item.product_name || 'Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.quantity} × Ksh {item.product_price?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
                {orderItems.length > 3 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
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

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          My Orders
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Track your purchases and order history
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="All Orders" value="all" />
              <Tab label="Pending" value="pending" />
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
                  ? "You haven't placed any orders yet."
                  : `You don't have any ${tabValue} orders.`
                }
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/shop')}
              >
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </Container>
      <Footer />
    </>
  );
}