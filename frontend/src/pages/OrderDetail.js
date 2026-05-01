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
  Alert
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
  Receipt
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
  const { getOrder, getOrderHistory, loading } = useOrders();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setError(null);
        const orderData = await getOrder(id);
        
        if (!orderData) {
          setError('Order not found');
          return;
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order data:', error);
        setError(error.message || 'Failed to load order details');
      }
    };
    
    if (id) {
      fetchOrderData();
    }
  }, [id, getOrder]);

  const getActiveStep = () => {
    if (!order) return 0;
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const index = steps.indexOf(order.status);
    return index === -1 ? 0 : index;
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/customer/orders')}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  // If no order and not loading, show not found
  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Order not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/customer/orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  // Parse shipping address if it's a string
  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;

  // Get customer info from order
  const customerName = order.customer?.first_name || order.last_name || 'Customer';
  const customerEmail = order.customer?.email || order.customer_email || 'Not provided';
  const customerPhone = order.customer?.phone || order.phone || order.customer_phone || 'Not provided';

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
                    Order #{order.order_number}
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
                  <StatusBadge status={order.status} paymentStatus={order.payment_status} />
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
                <Typography variant="body1" fontWeight={600}>Ksh {order.subtotal?.toLocaleString() || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Shipping:</Typography>
                <Typography variant="body1" fontWeight={600}>Ksh {order.shipping_amount?.toLocaleString() || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Tax:</Typography>
                <Typography variant="body1" fontWeight={600}>Ksh {order.tax_amount?.toLocaleString() || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>Discount:</Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.error}>- Ksh {order.discount_amount?.toLocaleString() || 0}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>Total:</Typography>
                <Typography variant="h6" fontWeight={700} color={themeColors.primary}>Ksh {order.total_amount?.toLocaleString() || 0}</Typography>
              </Stack>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Customer Information" icon={<Person />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600}>{customerName}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{customerEmail}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{customerPhone}</Typography>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Shipping Address" icon={<LocationOn />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600}>{shippingAddress?.street || 'Not provided'}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>
                {shippingAddress?.city || ''}, {shippingAddress?.state || ''}
              </Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{shippingAddress?.country || ''}</Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>{shippingAddress?.postal_code || ''}</Typography>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Payment Information" icon={<Payment />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600} textTransform="capitalize">
                {order.payment_method?.replace('_', ' ') || 'Not specified'}
              </Typography>
              <Chip
                label={paymentConfig[order.payment_status]?.label || order.payment_status}
                color={paymentConfig[order.payment_status]?.color || 'default'}
                size="small"
                sx={{ fontWeight: 600, alignSelf: 'flex-start' }}
              />
            </Stack>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Order Items Section */}
      {order.order_items && order.order_items.length > 0 && (
        <Card sx={{ borderRadius: 2, border: `1px solid ${themeColors.border}` }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Order Items
            </Typography>
            <Stack spacing={2}>
              {order.order_items.map((item, index) => (
                <Box key={index}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>{item.product_name}</Typography>
                      <Typography variant="body2" color={themeColors.textSecondary}>
                        Quantity: {item.quantity} × Ksh {item.product_price?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      Ksh {item.total_price?.toLocaleString()}
                    </Typography>
                  </Stack>
                  {index < order.order_items.length - 1 && <Divider />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}