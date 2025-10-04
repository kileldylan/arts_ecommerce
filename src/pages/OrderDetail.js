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

const themeColors = {
  primary: '#2C3E50',
  accent: '#F39C12',
  background: '#FAFAFA',
  border: '#ECF0F1'
};

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
    if (id) fetchOrderData();
  }, [id, getOrder, getOrderHistory]);

  const getActiveStep = () => {
    if (!order) return 0;
    return statusSteps.indexOf(order.status);
  };

  if (loading || !order) {
    return (
      <>
        <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading order details...
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: themeColors.primary, fontWeight: 500 }}
        >
          Back
        </Button>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" fontWeight="700" gutterBottom>
                      Order #{order.order_number}
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
                      sx={{ mb: 1, fontWeight: '600' }}
                    />
                    <br />
                    <Chip
                      label={paymentStatusConfig[order.payment_status].label}
                      color={paymentStatusConfig[order.payment_status].color}
                      variant="outlined"
                      sx={{ fontWeight: '600' }}
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
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
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
                        primary={<Typography fontWeight="600">{item.product_name}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body2">Qty: {item.quantity}</Typography>
                            <Typography variant="body2">Price: ${item.product_price}</Typography>
                            {item.variant_name && (
                              <Typography variant="body2">Variant: {item.variant_name}</Typography>
                            )}
                          </Box>
                        }
                      />
                      <Typography variant="h6" color={themeColors.primary}>
                        ${item.total_price}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography>Subtotal</Typography></Grid>
                  <Grid item xs={6} textAlign="right"><Typography>${order.subtotal}</Typography></Grid>
                  <Grid item xs={6}><Typography>Shipping</Typography></Grid>
                  <Grid item xs={6} textAlign="right"><Typography>${order.shipping_amount}</Typography></Grid>
                  <Grid item xs={6}><Typography>Tax</Typography></Grid>
                  <Grid item xs={6} textAlign="right"><Typography>${order.tax_amount}</Typography></Grid>
                  <Grid item xs={6}><Typography>Discount</Typography></Grid>
                  <Grid item xs={6} textAlign="right"><Typography>- ${order.discount_amount}</Typography></Grid>
                  <Grid item xs={6}><Typography fontWeight="700">Total</Typography></Grid>
                  <Grid item xs={6} textAlign="right"><Typography fontWeight="700">${order.total_amount}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Details */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1 }} /> Customer
                </Typography>
                <Typography variant="body2">{order.customer_name}</Typography>
                <Typography variant="body2" color="text.secondary">{order.customer_email}</Typography>
                {order.customer_phone && (
                  <Typography variant="body2" color="text.secondary">{order.customer_phone}</Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1 }} /> Shipping
                </Typography>
                <Typography variant="body2">{order.shipping_address.street}</Typography>
                <Typography variant="body2">
                  {order.shipping_address.city}, {order.shipping_address.state}
                </Typography>
                <Typography variant="body2">{order.shipping_address.country}</Typography>
                <Typography variant="body2">{order.shipping_address.postal_code}</Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Payment sx={{ mr: 1 }} /> Payment
                </Typography>
                <Typography variant="body2" textTransform="capitalize">
                  {order.payment_method.replace('_', ' ')}
                </Typography>
                <Chip
                  label={paymentStatusConfig[order.payment_status].label}
                  color={paymentStatusConfig[order.payment_status].color}
                  size="small"
                  sx={{ mt: 1, fontWeight: '600' }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Status History */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Status History
                </Typography>
                <List>
                  {history.map((record, index) => (
                    <ListItem key={index} divider={index < history.length - 1}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: themeColors.accent }}>
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
                              sx={{ fontWeight: '600' }}
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
    </>
  );
}
