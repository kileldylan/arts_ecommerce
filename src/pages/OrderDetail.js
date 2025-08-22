// src/pages/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Pending,
  Person,
  LocationOn,
  Payment,
  ArrowBack
} from '@mui/icons-material';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
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

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder, getOrderHistory, updateOrderStatus, loading } = useOrders();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderData = await getOrder(id);
        setOrder(orderData);
        
        const historyData = await getOrderHistory(id);
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching order data:', error);
      }
    };

    if (id) {
      fetchOrderData();
    }
  }, [id, getOrder, getOrderHistory]);

  const getActiveStep = () => {
    if (!order) return 0;
    return statusSteps.indexOf(order.status);
  };

  const canUpdateStatus = () => {
    if (!order || !user) return false;
    return user.user_type === 'artist' && order.artist_id === user.id;
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOrderStatus(id, newStatus, 'Status updated');
      const updatedOrder = await getOrder(id);
      setOrder(updatedOrder);
      
      const updatedHistory = await getOrderHistory(id);
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading order details...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        {/* Order Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {order.order_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                  <Chip
                    icon={statusConfig[order.status].icon}
                    label={statusConfig[order.status].label}
                    color={statusConfig[order.status].color}
                    size="large"
                    sx={{ mb: 1 }}
                  />
                  <br />
                  <Chip
                    label={paymentStatusConfig[order.payment_status].label}
                    color={paymentStatusConfig[order.payment_status].color}
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Stepper activeStep={getActiveStep()} sx={{ mt: 4 }}>
                {statusSteps.map((step) => (
                  <Step key={step}>
                    <StepLabel>{statusConfig[step].label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items ({order.items.length})
              </Typography>
              <List>
                {order.items.map((item, index) => (
                  <ListItem key={index} divider={index < order.items.length - 1}>
                    <ListItemIcon>
                      <Avatar
                        src={item.product_images?.[0]?.image_url}
                        sx={{ width: 60, height: 60 }}
                        variant="rounded"
                      >
                        <ShoppingBag />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.product_name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Quantity: {item.quantity}
                          </Typography>
                          <Typography variant="body2">
                            Price: ${item.product_price}
                          </Typography>
                          {item.variant_name && (
                            <Typography variant="body2">
                              Variant: {item.variant_name}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Typography variant="h6">
                      ${item.total_price}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Subtotal</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">${order.subtotal}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Shipping</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">${order.shipping_amount}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Tax</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">${order.tax_amount}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Discount</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">-${order.discount_amount}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6">Total</Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6">${order.total_amount}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Details */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} /> Customer Information
              </Typography>
              <Typography variant="body2">{order.customer_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.customer_email}
              </Typography>
              {order.customer_phone && (
                <Typography variant="body2" color="text.secondary">
                  {order.customer_phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1 }} /> Shipping Address
              </Typography>
              <Typography variant="body2">{order.shipping_address.street}</Typography>
              <Typography variant="body2">
                {order.shipping_address.city}, {order.shipping_address.state}
              </Typography>
              <Typography variant="body2">{order.shipping_address.country}</Typography>
              <Typography variant="body2">
                {order.shipping_address.postal_code}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Payment sx={{ mr: 1 }} /> Payment Method
              </Typography>
              <Typography variant="body2" textTransform="capitalize">
                {order.payment_method.replace('_', ' ')}
              </Typography>
              <Chip
                label={paymentStatusConfig[order.payment_status].label}
                color={paymentStatusConfig[order.payment_status].color}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Status History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status History
              </Typography>
              <List>
                {history.map((record, index) => (
                  <ListItem key={index} divider={index < history.length - 1}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {statusConfig[record.status].icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={statusConfig[record.status].label}
                            color={statusConfig[record.status].color}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            by {record.created_by_name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {new Date(record.created_at).toLocaleString()}
                          </Typography>
                          {record.note && (
                            <Typography variant="body2" color="text.secondary">
                              Note: {record.note}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}