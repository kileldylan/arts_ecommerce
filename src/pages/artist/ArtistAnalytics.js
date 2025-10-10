// src/pages/artist/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  TextField,
  Chip,
  alpha,
  useTheme,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
  Download,
  BarChart,
  PieChart,
  DateRange,
  Sell,
  LocalShipping,
  Star
} from '@mui/icons-material';
import api from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';

const themeColors = {
  primary: '#2C3E50',
  secondary: '#E74C3C',
  accent: '#F39C12',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  background: '#FAFAFA',
  text: '#2C3E50',
  lightText: '#7F8C8D',
  border: '#ECF0F1'
};

const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
  <Card sx={{ 
    height: '100%',
    borderRadius: '12px',
    border: `1px solid ${alpha(color, 0.2)}`,
    background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 24px ${alpha(color, 0.15)}`
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: alpha(color, 0.1),
          borderRadius: '12px',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {React.cloneElement(icon, { 
            sx: { 
              fontSize: 24, 
              color: color 
            } 
          })}
        </Box>
        {trend && (
          <Chip 
            label={trend} 
            size="small" 
            color={trend.includes('+') ? 'success' : 'error'}
            variant="outlined"
          />
        )}
      </Box>
      
      <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text, mb: 1 }}>
        {value}
      </Typography>
      
      <Typography variant="h6" sx={{ color: themeColors.text, fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      
      <Typography variant="body2" sx={{ color: themeColors.lightText }}>
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);

const ProgressCard = ({ title, data, color }) => (
  <Card sx={{ 
    height: '100%',
    borderRadius: '12px',
    border: `1px solid ${themeColors.border}`,
    background: 'white'
  }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="600" sx={{ color: themeColors.text, mb: 3 }}>
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((item, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: themeColors.text, fontWeight: 500 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={item.percentage}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha(color, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                {item.subLabel}
              </Typography>
              <Typography variant="caption" sx={{ color: themeColors.lightText, fontWeight: 500 }}>
                {item.percentage}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/artist', {
        params: dateRange
      });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await api.get('/analytics/export', {
        params: { ...dateRange, format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography variant="h6" sx={{ color: themeColors.lightText }}>Loading analytics data...</Typography>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>No analytics data available</Typography>
      </Container>
    );
  }

  const topProductsData = analytics.topProducts?.map(product => ({
    label: product.name,
    value: `Ksh${product.total_revenue?.toLocaleString()}`,
    subLabel: `${product.total_sold} sold`,
    percentage: Math.round((product.total_revenue / analytics.sales.total_revenue) * 100)
  })) || [];

  const inventoryData = [
    {
      label: 'In Stock',
      value: `${analytics.inventory?.total_products - analytics.inventory?.out_of_stock - analytics.inventory?.low_stock} products`,
      subLabel: 'Available for sale',
      percentage: Math.round(((analytics.inventory?.total_products - analytics.inventory?.out_of_stock - analytics.inventory?.low_stock) / analytics.inventory?.total_products) * 100)
    },
    {
      label: 'Low Stock',
      value: `${analytics.inventory?.low_stock} products`,
      subLabel: 'Need restocking',
      percentage: Math.round((analytics.inventory?.low_stock / analytics.inventory?.total_products) * 100)
    },
    {
      label: 'Out of Stock',
      value: `${analytics.inventory?.out_of_stock} products`,
      subLabel: 'Not available',
      percentage: Math.round((analytics.inventory?.out_of_stock / analytics.inventory?.total_products) * 100)
    }
  ];

  return (
    <>
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: themeColors.background,
      py: 3,
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{ color: themeColors.text, mb: 1 }}>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: themeColors.lightText }}>
              Track your business performance and make data-driven decisions
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => exportReport('csv')}
            sx={{
              backgroundColor: themeColors.primary,
              borderRadius: '8px',
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: alpha(themeColors.primary, 0.9)
              }
            }}
          >
            Export Report
          </Button>
        </Box>

        {/* Date Range Selector */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: `1px solid ${themeColors.border}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DateRange sx={{ color: themeColors.primary }} />
            <Typography variant="h6" sx={{ color: themeColors.text }}>
              Date Range
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="outlined"
              onClick={fetchAnalytics}
              sx={{ minWidth: 120 }}
            >
              Apply
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={`Ksh${analytics.sales?.total_revenue?.toLocaleString() || '0'}`}
            subtitle={`${analytics.sales?.total_orders || '0'} orders • ${analytics.sales?.total_items_sold || '0'} items`}
            icon={<AttachMoney />}
            color={themeColors.success}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value={analytics.sales?.total_orders || '0'}
            subtitle={`${analytics.sales?.average_order_value ? `Avg: Ksh${Math.round(analytics.sales.average_order_value)}` : 'No average data'}`}
            icon={<ShoppingCart />}
            color={themeColors.primary}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Customers"
            value={analytics.customers?.total_customers || '0'}
            subtitle={`${analytics.customers?.new_customers_30d || '0'} new customers (30d)`}
            icon={<People />}
            color={themeColors.accent}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Inventory"
            value={analytics.inventory?.total_products || '0'}
            subtitle={`${analytics.inventory?.low_stock || '0'} low stock • ${analytics.inventory?.out_of_stock || '0'} out of stock`}
            icon={<Inventory />}
            color={themeColors.warning}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <ProgressCard
            title="Top Performing Products"
            data={topProductsData}
            color={themeColors.primary}
          />
        </Grid>

        {/* Inventory Status */}
        <Grid item xs={12} lg={6}>
          <ProgressCard
            title="Inventory Status"
            data={inventoryData}
            color={themeColors.accent}
          />
        </Grid>

        {/* Revenue Trends Chart Area */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: '12px',
            border: `1px solid ${themeColors.border}`,
            background: 'white'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="600" sx={{ color: themeColors.text }}>
                  Revenue Trends (Last 6 Months)
                </Typography>
                <Chip label="Monthly View" variant="outlined" />
              </Box>
              
              <Box sx={{ 
                height: 300, 
                backgroundColor: alpha(themeColors.background, 0.5),
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px dashed ${themeColors.border}`
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <BarChart sx={{ fontSize: 48, color: themeColors.lightText, mb: 2 }} />
                  <Typography variant="body1" sx={{ color: themeColors.lightText, mb: 1 }}>
                    Revenue Chart Visualization
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                    Integrate with Chart.js, Recharts, or ApexCharts
                  </Typography>
                </Box>
              </Box>

              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(themeColors.success, 0.1), borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ color: themeColors.success, fontWeight: 600 }}>
                      Ksh{analytics.trends?.[0]?.revenue?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                      Current Month
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(themeColors.primary, 0.1), borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                      {analytics.trends?.[0]?.orders_count || '0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                      Monthly Orders
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(themeColors.accent, 0.1), borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ color: themeColors.accent, fontWeight: 600 }}>
                      {analytics.customers?.new_customers_30d || '0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                      New Customers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(themeColors.warning, 0.1), borderRadius: '8px' }}>
                    <Typography variant="h6" sx={{ color: themeColors.warning, fontWeight: 600 }}>
                      {analytics.inventory?.low_stock || '0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.lightText }}>
                      Low Stock Items
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </>
  );
}