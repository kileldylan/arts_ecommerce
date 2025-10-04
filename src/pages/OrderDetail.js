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
  List,
  ListItem,
  Button,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Stack
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
  TrackChanges
} from '@mui/icons-material';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';

// Enhanced color palette
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
};

const paymentConfig = {
  pending: { label: 'Pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  refunded: { label: 'Refunded', color: 'default' },
};

// Status Badge Component
const StatusBadge = ({ status, paymentStatus }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Chip
      icon={statusConfig[status]?.icon}
      label={statusConfig[status]?.label}
      color={statusConfig[status]?.color}
      variant="filled"
      sx={{ 
        fontWeight: 600, 
        fontSize: '0.875rem',
        height: 32
      }}
    />
    <Chip
      label={paymentConfig[paymentStatus]?.label}
      color={paymentConfig[paymentStatus]?.color}
      variant="outlined"
      sx={{ 
        fontWeight: 600, 
        fontSize: '0.875rem',
        height: 32
      }}
    />
  </Stack>
);

// Info Card Component
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
    return ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status);
  };

  if (loading || !order) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: themeColors.primary }} size={40} />
          <Typography variant="h6" color={themeColors.textSecondary}>
            Loading order details...
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
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
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
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
                {['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, index) => (
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
                        },
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
                <Typography variant="body2" color={themeColors.textSecondary}>
                  Subtotal:
                </Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary}>
                  Ksh {order.subtotal}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>
                  Shipping:
                </Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary}>
                  Ksh {order.shipping_amount}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>
                  Tax:
                </Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary}>
                  Ksh {order.tax_amount}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color={themeColors.textSecondary}>
                  Discount:
                </Typography>
                <Typography variant="body1" fontWeight={600} color={themeColors.error}>
                  - Ksh {order.discount_amount}
                </Typography>
              </Stack>
              <Divider sx={{ borderColor: themeColors.border }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700} color={themeColors.textPrimary}>
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight={700} color={themeColors.primary}>
                  Ksh {order.total_amount}
                </Typography>
              </Stack>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Customer Information" icon={<Person />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary}>
                {order.customer_name}
              </Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>
                {order.customer_email}
              </Typography>
              {order.customer_phone && (
                <Typography variant="body2" color={themeColors.textSecondary}>
                  {order.customer_phone}
                </Typography>
              )}
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Shipping Address" icon={<LocationOn />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary}>
                {order.shipping_address.street}
              </Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>
                {order.shipping_address.city}, {order.shipping_address.state}
              </Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>
                {order.shipping_address.country}
              </Typography>
              <Typography variant="body2" color={themeColors.textSecondary}>
                {order.shipping_address.postal_code}
              </Typography>
            </Stack>
          </InfoCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <InfoCard title="Payment Information" icon={<Payment />}>
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600} color={themeColors.textPrimary} textTransform="capitalize">
                {order.payment_method.replace('_', ' ')}
              </Typography>
              <Chip
                label={paymentConfig[order.payment_status]?.label}
                color={paymentConfig[order.payment_status]?.color}
                size="small"
                sx={{ 
                  fontWeight: 600,
                  alignSelf: 'flex-start'
                }}
              />
            </Stack>
          </InfoCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Right Column - Status History */}
        <Grid item xs={12} lg={4}>
          <InfoCard 
            title="Status History" 
            icon={<TrackChanges />}
          >
            <List sx={{ py: 0 }}>
              {history.map((record, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
                      <Avatar sx={{ 
                        bgcolor: themeColors.primary, 
                        width: 40, 
                        height: 40,
                        mt: 0.5 
                      }}>
                        {statusConfig[record.status]?.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={statusConfig[record.status]?.label}
                            color={statusConfig[record.status]?.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="body2" color={themeColors.textSecondary}>
                            by {record.created_by_name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color={themeColors.textSecondary} sx={{ mb: 0.5 }}>
                          {new Date(record.created_at).toLocaleString()}
                        </Typography>
                        {record.note && (
                          <Typography variant="body2" color={themeColors.textPrimary} sx={{ fontStyle: 'italic' }}>
                            {record.note}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </ListItem>
                  {index < history.length - 1 && (
                    <Divider sx={{ borderColor: themeColors.border }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </InfoCard>
        </Grid>
      </Grid>
    </Container>
  );
}