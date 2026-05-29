// src/pages/customer/CustomerProfile.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Paper,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Fade,
  Slide,
  Zoom,
  InputAdornment,
  Snackbar,
  Skeleton
} from '@mui/material';
import {
  Edit,
  Save,
  CameraAlt,
  Email,
  Phone,
  LocationOn,
  Info,
  Favorite,
  ShoppingBag,
  History,
  Logout,
  CheckCircle,
  Close,
  CreditCard,
  Security,
  Notifications,
  Language,
  Support,
  WhatsApp,
  Instagram,
  Facebook,
  Twitter,
  VerifiedUser,
  Star,
  LocalShipping,
  ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import CustomSpinner from '../../components/CustomSpinner';
import Footer from '../../components/Footer';

import { useNavigate } from 'react-router-dom';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CustomerProfile() {
  const { user, profile, refreshProfile, loading: authLoading, updateProfileImmediately, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const abortControllerRef = useRef(null);

  // Stats data (mock - replace with real data from your backend)
  const stats = {
    totalOrders: 24,
    totalSpent: 45280,
    wishlistItems: 8,
    memberSince: profile?.created_at || new Date().toISOString()
  };

  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      if (!forceRefresh && profile) {
        setProfileData(profile);
        setLoading(false);
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      setProfileData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && !authLoading) loadProfile();
  }, [user, authLoading, loadProfile]);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  }, []);

  const uploadAvatar = useCallback(async (file, userId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/customer-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, cacheControl: '3600' });
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return publicUrl;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    let avatarUrl = profileData?.avatar_url || profileData?.avatar;
    
    try {
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, user.id);
        const updatedWithAvatar = { ...profileData, avatar_url: avatarUrl, avatar: avatarUrl };
        setProfileData(updatedWithAvatar);
        if (updateProfileImmediately) updateProfileImmediately(updatedWithAvatar);
      }
      
      const updateData = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        address: profileData.address || '',
        city: profileData.city || '',
        postal_code: profileData.postal_code || '',
        updated_at: new Date().toISOString(),
      };
      
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      if (refreshProfile) await refreshProfile(true);
      
      setSuccess('Profile updated successfully!');
      setSnackbarOpen(true);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [profileData, avatarFile, user?.id, refreshProfile, updateProfileImmediately, uploadAvatar]);

  const handleInputChange = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (authLoading || loading) {
    return <CustomSpinner text={authLoading ? 'Verifying your account...' : 'Loading your profile...'} />;
  }
  
  if (error && !profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => loadProfile(true)}>Retry</Button>
      </Container>
    );
  }
  
  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No profile found. Please complete your profile setup.</Alert>
      </Container>
    );
  }
  
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Customer';
  const displayAvatar = avatarPreview || profileData.avatar_url || profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=D4AF37&color=fff&size=140`;
  const memberDate = new Date(profileData.created_at || stats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
          color: 'white',
          pt: 4,
          pb: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                My Account
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Manage your profile, orders and preferences
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Logout
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, pb: 6 }}>
        {/* Main Profile Card */}
        <Card sx={{ borderRadius: 4, overflow: 'visible', position: 'relative' }}>
          {/* Edit/Save Button Floating */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            {isEditing ? (
              <Button
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: '#27AE60',
                  '&:hover': { bgcolor: '#219653' }
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : (
              <Button
                startIcon={<Edit />}
                variant="outlined"
                onClick={() => setIsEditing(true)}
                sx={{
                  borderColor: '#D4AF37',
                  color: '#D4AF37',
                  '&:hover': { borderColor: '#C5A028', bgcolor: 'rgba(212, 175, 55, 0.05)' }
                }}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          <Grid container>
            {/* Left Column - Profile Info */}
            <Grid item xs={12} md={4} sx={{ borderRight: { md: 1 }, borderColor: 'divider' }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                {/* Avatar Section */}
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isEditing && (
                        <Tooltip title="Change photo">
                          <IconButton
                            component="label"
                            sx={{
                              bgcolor: '#D4AF37',
                              color: '#2C1810',
                              '&:hover': { bgcolor: '#C5A028' },
                              width: 32,
                              height: 32
                            }}
                          >
                            <CameraAlt sx={{ fontSize: 16 }} />
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <Avatar
                      src={displayAvatar}
                      alt={fullName}
                      sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        mb: 2,
                        border: '4px solid #D4AF37',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }}
                    />
                  </Badge>
                </Box>

                <Typography variant="h5" fontWeight="700" gutterBottom>
                  {fullName}
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Chip
                    label="Verified Customer"
                    size="small"
                    icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: '#E8F5E9', color: '#27AE60' }}
                  />
                  <Chip
                    label="Gold Member"
                    size="small"
                    icon={<Star sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: '#FFF8E1', color: '#D4AF37' }}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Member since {memberDate}
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight="700" color="primary">
                        {stats.totalOrders}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Orders</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight="700" color="primary">
                        Ksh {stats.totalSpent.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Spent</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <Typography variant="h6" fontWeight="700" color="primary">
                        {stats.wishlistItems}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Wishlist</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Contact Info */}
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Contact Information
                  </Typography>
                  
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Email sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Email Address</Typography>
                        <Typography variant="body2">{user?.email}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Phone sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                        {isEditing ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={profileData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={saving}
                            placeholder="+254 700 000 000"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body2">{profileData.phone || 'Not provided'}</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocationOn sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Default Address</Typography>
                        {isEditing ? (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              value={profileData.address || ''}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              disabled={saving}
                              placeholder="Street address"
                              variant="outlined"
                              sx={{ mt: 0.5, mb: 1 }}
                            />
                            <Stack direction="row" spacing={1}>
                              <TextField
                                fullWidth
                                size="small"
                                value={profileData.city || ''}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="City"
                              />
                              <TextField
                                fullWidth
                                size="small"
                                value={profileData.postal_code || ''}
                                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                placeholder="Postal code"
                              />
                            </Stack>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2">
                              {profileData.address || 'Not provided'}
                              {profileData.city && `, ${profileData.city}`}
                              {profileData.postal_code && ` (${profileData.postal_code})`}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Tabs */}
            <Grid item xs={12} md={8}>
              <Box sx={{ px: 4, py: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root.Mui-selected': { color: '#D4AF37' },
                    '& .MuiTabs-indicator': { bgcolor: '#D4AF37' }
                  }}
                >
                  <Tab icon={<Info />} label="About Me" iconPosition="start" />
                  <Tab icon={<ShoppingBag />} label="Order History" iconPosition="start" />
                  <Tab icon={<Favorite />} label="Wishlist" iconPosition="start" />
                  <Tab icon={<Security />} label="Preferences" iconPosition="start" />
                </Tabs>

                {/* About Me Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    About {fullName.split(' ')[0]}
                  </Typography>
                  
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
                    Bio
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={profileData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={saving}
                      placeholder="Tell us a little about yourself..."
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {profileData.bio || 'No bio added yet. Click edit to tell us about yourself.'}
                    </Typography>
                  )}

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Preferences
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="600">Communication</Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Notifications sx={{ fontSize: 16, color: '#D4AF37' }} />
                            <Typography variant="caption">Email notifications enabled</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WhatsApp sx={{ fontSize: 16, color: '#25D366' }} />
                            <Typography variant="caption">WhatsApp updates opted in</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="600">Connected Social</Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Instagram sx={{ fontSize: 16, color: '#E4405F' }} />
                            <Typography variant="caption">@branchiarts_fan</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Facebook sx={{ fontSize: 16, color: '#1877F2' }} />
                            <Typography variant="caption">Not connected</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Order History Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Recent Orders
                  </Typography>
                  
                  {[1, 2, 3].map((order) => (
                    <Card key={order} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Order #{10000 + order}</Typography>
                            <Typography variant="subtitle1" fontWeight="600">Ksh {Math.floor(5000 + Math.random() * 10000)}</Typography>
                          </Box>
                          <Chip
                            label={order === 1 ? 'Delivered' : order === 2 ? 'Shipped' : 'Processing'}
                            size="small"
                            sx={{
                              bgcolor: order === 1 ? '#E8F5E9' : order === 2 ? '#E3F2FD' : '#FFF3E0',
                              color: order === 1 ? '#27AE60' : order === 2 ? '#2196F3' : '#FF9800'
                            }}
                          />
                          <Button size="small" endIcon={<ArrowForward />}>View Details</Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button fullWidth variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                    View All Orders
                  </Button>
                </TabPanel>

                {/* Wishlist Tab */}
                <TabPanel value={tabValue} index={2}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Your Wishlist ({stats.wishlistItems} items)
                  </Typography>
                  
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Favorite sx={{ fontSize: 48, color: '#D4AF37', opacity: 0.5, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      You haven't added any items to your wishlist yet.
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#D4AF37', '&:hover': { bgcolor: '#C5A028' } }}
                      onClick={() => navigate('/customer/dashboard')}
                    >
                      Browse Products
                    </Button>
                  </Box>
                </TabPanel>

                {/* Preferences Tab */}
                <TabPanel value={tabValue} index={3}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Account Settings
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                          <Security sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                          Security
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Button variant="outlined" size="small">Change Password</Button>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                          <Notifications sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                          Notifications
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Email notifications for order updates</Typography>
                            <Chip label="Enabled" size="small" color="success" />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">SMS notifications for promotions</Typography>
                            <Chip label="Disabled" size="small" />
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Container>

      <Footer/>
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }} onClose={() => setSnackbarOpen(false)}>
          {success || 'Profile updated successfully!'}
        </Alert>
      </Snackbar>
    </Box>
  );
}