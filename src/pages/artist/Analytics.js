// src/pages/artist/Analytics.js
import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Navbar from '../../components/NavBar';

const salesData = [
  { month: 'Jan', sales: 1200, orders: 8 },
  { month: 'Feb', sales: 1800, orders: 12 },
  { month: 'Mar', sales: 1500, orders: 10 },
  { month: 'Apr', sales: 2200, orders: 15 },
  { month: 'May', sales: 2800, orders: 18 },
  { month: 'Jun', sales: 3500, orders: 22 }
];

const categoryData = [
  { name: 'Jewelry', value: 45 },
  { name: 'Paintings', value: 25 },
  { name: 'Sculptures', value: 15 },
  { name: 'Textiles', value: 10 },
  { name: 'Other', value: 5 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  return (
    <>
    <Navbar/>
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" fontWeight="bold">
          Sales Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select defaultValue="6months" label="Time Range">
            <MenuItem value="1month">Last Month</MenuItem>
            <MenuItem value="3months">Last 3 Months</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                $12,400
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                85
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                42
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                4.8
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#6366f1" name="Sales ($)" />
                  <Bar dataKey="orders" fill="#ec4899" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Categories Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Products */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Products
              </Typography>
              <Grid container spacing={2}>
                {[
                  { name: 'Maasai Beaded Necklace', sales: 28, revenue: 1287.72 },
                  { name: 'African Landscape Painting', sales: 15, revenue: 2999.85 },
                  { name: 'Wooden Elephant Sculpture', sales: 12, revenue: 1079.88 },
                  { name: 'Kiondo Basket', sales: 10, revenue: 499.90 },
                  { name: 'Kitenge Fabric Wall Art', sales: 8, revenue: 639.92 }
                ].map((product, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {product.name}
                      </Typography>
                      <Typography variant="body2">
                        {product.sales} sales • ${product.revenue}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
}