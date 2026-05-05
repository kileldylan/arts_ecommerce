import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Person,
  LocationOn,
  Payment,
  CheckCircle,
  Pending,
  LocalShipping,
  CalendarToday,
  Receipt,
  ErrorOutline
} from '@mui/icons-material';
import { useOrders } from '../contexts/OrderContext';

const themeColors = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  accent: '#f59e0b'
};

const statusConfig = {
  pending: { label: 'Pending', color: 'warning', icon: <Pending /> },
  confirmed: { label: 'Confirmed', color: 'primary', icon: <CheckCircle /> },
  processing: { label: 'Processing', color: 'primary', icon: <LocalShipping /> },
  shipped: { label: 'Shipped', color: 'secondary', icon: <LocalShipping /> },
  delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
  cancelled: { label: 'Cancelled', color: 'error', icon: <Pending /> },
  refunded: { label: 'Refunded', color: 'default', icon: <CheckCircle /> }
};

const paymentConfig = {
  pending: { label: 'Pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  refunded: { label: 'Refunded', color: 'default' }
};

const StatusBadge = ({ status, paymentStatus }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Chip
      icon={statusConfig[status]?.icon}
      label={statusConfig[status]?.label || status}
      color={statusConfig[status]?.color || 'default'}
      variant="filled"
      sx={{ fontWeight: 600, fontSize: '0.875rem', height: 32 }}
    />
    <Chip
      label={paymentConfig[paymentStatus]?.label || paymentStatus}
      color={paymentConfig[paymentStatus]?.color || 'default'}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.875rem', height: 32 }}
    />
  </Stack>
);

const InfoCard = ({ title, icon, children, sx = {} }) => (
  <Card sx={{ 
    borderRadius: 2, 
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: `1px solid ${themeColors.border}`,
    height: '100%',
    ...sx 
  }}>
    <CardContent sx={{ p: 3 }}>
      <Typography 
        variant="h6" 
        fontWeight={600} 
        gutterBottom 
        color={themeColors.textPrimary}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
      >
        {icon}
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder, loading: contextLoading } = useOrders();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching order with ID:', id);
        
        const orderData = await getOrder(id);
        
        console.log('Received order data:', orderData);
        
        if (!orderData) {
          setError('Order not found');
          return;
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order data:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOrderData();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [id, getOrder]);

  const getActiveStep = () => {
    if (!order) return 0;
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const index = steps.indexOf(order.status);
    return index === -1 ? 0 : index;
  };

  // Safe parsing of shipping address
  const getShippingAddress = () => {
    if (!order?.shipping_address) return null;
    
    try {
      if (typeof order.shipping_address === 'string') {
        return JSON.parse(order.shipping_address);
      }
      return order.shipping_address;
    } catch (error) {
      console.error('Error parsing shipping address:', error);
      return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          icon={<ErrorOutline />}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/customer/orders')}>
              Back to Orders
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight={600}>Error Loading Order</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Container>
    );
  }

  // Show not found state
  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/customer/orders')}>
              Back to Orders
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight={600}>Order Not Found</Typography>
          <Typography variant="body2">The order you're looking for doesn't exist or you don't have access to it.</Typography>
        </Alert>
      </Container>
    );
  }

  const shippingAddress = getShippingAddress();
  
  // Get customer info with safe fallbacks
  const customerName = order.customer?.first_name || 
                      order.customer?.name || 
                      order.last_name || 
                      order.customer_name || 
                      'Customer';
  
  const customerEmail = order.customer?.email || 
                        order.customer_email || 
                        order.email || 
                        'Not provided';
  
  const customerPhone = order.customer?.phone || 
                        order.phone || 
                        order.customer_phone || 
                        order.phone_number || 
                        'Not provided';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customer/orders')}
          sx={{
            alignSelf: 'flex-start',
            color: themeColors.textSecondary,
            '&:hover': {
              backgroundColor: themeColors.background,
              color: themeColors.textPrimary
            },
            px: 2,
            py: 1
          }}
        >
          Back to Orders
        </Button>

        {/* Order Header Card */}
        <Card sx={{ 
          borderRadius: 2, 
          background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}15)`,
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Typography variant="h3" fontWeight={700} color={themeColors.textPrimary}>
                    Order #{order.order_number || order.id}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center" color={themeColors.textSecondary}>
                      <CalendarToday sx={{ fontSize: 20 }} />
                      <Typography variant="body1">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'Date not available'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack alignItems={{ md: 'flex-end' }} spacing={2}>
                  <StatusBadge 
                    status={order.status || 'pending'} 
                    paymentStatus={order.payment_status || 'pending'} 
                  />
                </Stack>
              </Grid>
            </Grid>

            {/* Progress Stepper */}
            <Box sx={{ mt: 4 }}>
              <Stepper activeStep={getActiveStep()} alternativeLabel>
                {['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': { 
                          fontSize: '0.875rem', 
                          fontWeight: 500,
                          color: themeColors.textSecondary
                        },
                        '& .Mui-active .MuiStepLabel-label': { 
                          color: themeColors.primary,
                          fontWeight: 600
                        },
                        '& .Mui-completed .MuiStepLabel-label': { 
                          color: themeColors.success,
                          fontWeight: 600
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Order Summary Section - Horizontal Layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <InfoCard title="Order Summary" icon={<Receipt />}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Subtotal:</Typography>
                <Typography variant="body1" fontWeight={600}>Ksh {(order.subtotal || 0).toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Shipping:</Typography>
                <Typography variant="body1" fontWeight={600}>Ksh {(order.shipping_amount || 0).toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Tax:</Typography>
                <Typography variant="body1" fontWeight={600}>Ksh {(order.tax_amount || 0).toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Discount:</Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.error}>- Ksh {(order.discount_amount || 0).toLocaleString()}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>Total:</Typography>
                <Typography variant="h6" fontWeight={700} color={themeColors.primary}>Ksh {(order.total_amount || order.total || 0).toLocaleString()}</Typography>
              </Stack>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Customer Information" icon={<Person />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600}>{customerName}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{customerPhone}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{customerEmail}</Typography>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Shipping Address" icon={<LocationOn />}>
            {shippingAddress ? (
              <Stack spacing={1}>
                <Typography variant="body1" fontWeight={600}>{shippingAddress.street || shippingAddress.address || 'Not provided'}</Typography>
                <Typography variant="body2" color={themeColors.textSecondary}>
                  {shippingAddress.city || ''}, {shippingAddress.state || shippingAddress.county || ''}
                </Typography>
                <Typography variant="body2" color={themeColors.textSecondary}>{shippingAddress.country || 'Kenya'}</Typography>
                <Typography variant="body2" color={themeColors.textSecondary}>{shippingAddress.postal_code || shippingAddress.zip || ''}</Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color={themeColors.textSecondary}>No shipping address provided</Typography>
            )}
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Payment Information" icon={<Payment />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600} textTransform="capitalize">
                {order.payment_method?.replace(/_/g, ' ') || 'Not specified'}
              </Typography>
              <Chip
                label={paymentConfig[order.payment_status]?.label || order.payment_status || 'Pending'}
                color={paymentConfig[order.payment_status]?.color || 'warning'}
                size="small"
                sx={{ fontWeight: 600, alignSelf: 'flex-start' }}
              />
              {order.mpesa_receipt_number && (
                <Typography variant="caption" color={themeColors.textSecondary}>
                  Receipt: {order.mpesa_receipt_number}
                </Typography>
              )}
            </Stack>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Order Items Section */}
      {order.order_items && order.order_items.length > 0 ? (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Order Items ({order.order_items.length})
            </Typography>
            <Stack spacing={2}>
              {order.order_items.map((item, index) => (
                <Box key={index}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>{item.product_name || item.name}</Typography>
                      <Typography variant="body2" color={themeColors.textSecondary}>
                        Quantity: {item.quantity} × Ksh {(item.product_price || item.price || 0).toLocaleString()}
                      </Typography>
                      {item.variant && (
                        <Typography variant="caption" color={themeColors.textSecondary}>
                          Variant: {item.variant}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      Ksh {(item.total_price || item.total || (item.quantity * (item.product_price || item.price)) || 0).toLocaleString()}
                    </Typography>
                  </Stack>
                  {index < order.order_items.length - 1 && <Divider />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="body1" color={themeColors.textSecondary} textAlign="center">
              No items found for this order
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}