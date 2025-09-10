// src/pages/artist/CRMDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider,
  alpha,
  Paper
} from '@mui/material';
import {
  Search,
  FilterList,
  Email,
  Phone,
  Person,
  ShoppingCart,
  AttachMoney,
  CalendarToday,
  Edit,
  Star,
  TrendingUp,
  Group,
  Loyalty
} from '@mui/icons-material';
import api from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/NavBar';

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

const CustomerCard = ({ customer, onEdit }) => (
  <Card sx={{ 
    borderRadius: '12px',
    border: `1px solid ${themeColors.border}`,
    background: 'white',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 56, 
            height: 56, 
            backgroundColor: alpha(themeColors.primary, 0.1),
            color: themeColors.primary,
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            {customer.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ color: themeColors.text }}>
              {customer.name}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.lightText, mb: 1 }}>
              {customer.email}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Phone sx={{ fontSize: 16 }} />} 
                label={customer.phone || 'No phone'} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                icon={<CalendarToday sx={{ fontSize: 16 }} />} 
                label={new Date(customer.joined_date).toLocaleDateString()} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={() => onEdit(customer)} size="small">
          <Edit />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <ShoppingCart sx={{ fontSize: 20, color: themeColors.primary, mr: 1 }} />
              <Typography variant="h6" sx={{ color: themeColors.text }}>
                {customer.total_orders}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: themeColors.lightText }}>
              Total Orders
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <AttachMoney sx={{ fontSize: 20, color: themeColors.success, mr: 1 }} />
              <Typography variant="h6" sx={{ color: themeColors.text }}>
                Ksh{Math.round(customer.total_spent || 0).toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: themeColors.lightText }}>
              Total Spent
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Chip 
          icon={<Star sx={{ color: '#FFD700' }} />}
          label={customer.total_spent > 10000 ? 'VIP' : customer.total_spent > 5000 ? 'Premium' : 'Regular'}
          color={customer.total_spent > 10000 ? 'warning' : customer.total_spent > 5000 ? 'primary' : 'default'}
          variant="outlined"
        />
      </Box>
    </CardContent>
  </Card>
);

export default function CRMDashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minOrders: '',
    minSpent: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/crm/customers', {
        params: {
          search: searchTerm,
          minOrders: filters.minOrders,
          minSpent: filters.minSpent
        }
      });
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleUpdateCustomer = async (updates) => {
    try {
      await api.put(`/crm/customers/${selectedCustomer.id}`, updates);
      setEditDialogOpen(false);
      fetchCustomers(); // Refresh data
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
  const avgOrderValue = totalRevenue / customers.reduce((sum, customer) => sum + (customer.total_orders || 0), 1);
  const vipCustomers = customers.filter(c => c.total_spent > 10000).length;

  return (
    <>
    <Navbar/>
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
              Customer Relationship Management
            </Typography>
            <Typography variant="body1" sx={{ color: themeColors.lightText }}>
              Manage your customers and build lasting relationships
            </Typography>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: `1px solid ${themeColors.border}`
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: themeColors.lightText, mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    width: '200'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Min Orders"
                value={filters.minOrders}
                onChange={(e) => setFilters({...filters, minOrders: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Min Spent (Ksh)"
                value={filters.minSpent}
                onChange={(e) => setFilters({...filters, minSpent: e.target.value})}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="All time customers"
            icon={<Group />}
            color={themeColors.primary}
            trend="+8.2%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`Ksh${Math.round(totalRevenue).toLocaleString()}`}
            subtitle="From all customers"
            icon={<AttachMoney />}
            color={themeColors.success}
            trend="+12.5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Order Value"
            value={`Ksh${Math.round(avgOrderValue).toLocaleString()}`}
            subtitle="Per customer order"
            icon={<TrendingUp />}
            color={themeColors.accent}
            trend="+5.7%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="VIP Customers"
            value={vipCustomers}
            subtitle="Spent over Ksh10,000"
            icon={<Loyalty />}
            color={themeColors.warning}
            trend="+3.1%"
          />
        </Grid>
      </Grid>

      {/* Customers Grid */}
      <Grid container spacing={3}>
        {customers.map((customer) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
            <CustomerCard 
              customer={customer} 
              onEdit={handleEditCustomer}
            />
          </Grid>
        ))}
      </Grid>

      {customers.length === 0 && !loading && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: 'white',
          borderRadius: '12px',
          border: `1px solid ${themeColors.border}`
        }}>
          <Person sx={{ fontSize: 64, color: themeColors.lightText, mb: 2 }} />
          <Typography variant="h6" sx={{ color: themeColors.text, mb: 1 }}>
            No customers found
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.lightText }}>
            {searchTerm || filters.minOrders || filters.minSpent 
              ? 'Try adjusting your search criteria' 
              : 'You haven\'t had any customers yet'
            }
          </Typography>
        </Box>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Edit Customer
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: themeColors.lightText, mb: 3 }}>
            Update customer information and notes
          </Typography>
          
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            placeholder="Add notes about this customer..."
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Status"
            select
            defaultValue="active"
            sx={{ mb: 2 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="vip">VIP</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Tags"
            placeholder="Add tags (comma-separated)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleUpdateCustomer({})}
            sx={{
              backgroundColor: themeColors.primary,
              '&:hover': {
                backgroundColor: alpha(themeColors.primary, 0.9)
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
}