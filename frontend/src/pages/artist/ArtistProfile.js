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
  Snackbar,
  Rating,
  LinearProgress
} from '@mui/material';
import {
  Edit,
  Save,
  CameraAlt,
  Email,
  Phone,
  LocationOn,
  Info,
  ShoppingBag,
  History,
  Logout,
  CheckCircle,
  Close,
  Language,
  Instagram,
  Facebook,
  Twitter,
  VerifiedUser,
  Star,
  LocalShipping,
  ArrowForward,
  Palette,
  Brush,
  WorkspacePremium,
  Link as LinkIcon,
  WhatsApp,
  Storefront,
  TrendingUp,
  Inventory,
  MonetizationOn,
  Assignment,
  YouTube
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import CustomSpinner from '../../components/CustomSpinner';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ArtistProfile() {
  const { user, profile, refreshProfile, loading: authLoading, updateProfileImmediately, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const abortControllerRef = useRef(null);

  // Artist stats (mock - replace with real data from your backend)
  const artistStats = {
    totalProducts: 48,
    totalOrders: 127,
    totalRevenue: 245780,
    averageRating: 4.8,
    totalReviews: 89,
    memberSince: profile?.created_at || new Date().toISOString()
  };

  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
    if (user && !authLoading) {
      loadProfile();
    }
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

  const handleCoverChange = useCallback((e) => {
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
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setError('');
    }
  }, []);

  const uploadImage = useCallback(async (file, userId, type) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('artist-assets')
      .upload(filePath, file, { upsert: true, cacheControl: '3600' });
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('artist-assets').getPublicUrl(filePath);
    return publicUrl;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    let avatarUrl = profileData?.avatar;
    let coverUrl = profileData?.cover_image;
    
    try {
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, user.id, 'avatar');
        const updatedWithAvatar = { ...profileData, avatar: avatarUrl };
        setProfileData(updatedWithAvatar);
        if (updateProfileImmediately) updateProfileImmediately(updatedWithAvatar);
      }
      
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, user.id, 'cover');
      }
      
      const updateData = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        specialty: profileData.specialty || '',
        portfolio: profileData.portfolio || '',
        website: profileData.website || '',
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        twitter: profileData.twitter || '',
        youtube: profileData.youtube || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        studio_name: profileData.studio_name || '',
        years_experience: profileData.years_experience || '',
        art_style: profileData.art_style || '',
        updated_at: new Date().toISOString(),
      };
      
      if (avatarUrl) updateData.avatar = avatarUrl;
      if (coverUrl) updateData.cover_image = coverUrl;
      
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
      setCoverFile(null);
      setCoverPreview(null);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [profileData, avatarFile, coverFile, user?.id, refreshProfile, updateProfileImmediately, uploadImage]);

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
    return <CustomSpinner text={authLoading ? 'Verifying your account...' : 'Loading your artist profile...'} />;
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
        <Alert severity="warning">No profile found. Please complete your artist profile setup.</Alert>
      </Container>
    );
  }
  
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Artist';
  const studioName = profileData.studio_name || `${fullName}'s Studio`;
  const displayAvatar = avatarPreview || profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=D4AF37&color=fff&size=140`;
  const displayCover = coverPreview || profileData.cover_image || 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200';
  const memberDate = new Date(profileData.created_at || artistStats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Hero Banner with Cover Image */}
      <Box sx={{ position: 'relative' }}>
        {/* Cover Image */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 180, sm: 240, md: 280 },
            backgroundImage: `url(${displayCover})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(44, 62, 80, 0.4), rgba(44, 62, 80, 0.7))'
            }
          }}
        >
          {isEditing && (
            <Tooltip title="Change Cover Image">
              <Button
                component="label"
                variant="contained"
                size="small"
                startIcon={<CameraAlt />}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  zIndex: 2,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                }}
              >
                Change Cover
                <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Header Content */}
        <Box sx={{ bgcolor: '#2C3E50', color: 'white', py: 2 }}>
          <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h4" fontWeight="700" gutterBottom>
                  Artist Studio
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Manage your art, portfolio and business settings
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
      </Box>

      <Container maxWidth="lg" sx={{ mt: -6, pb: 6 }}>
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
            {/* Left Column - Artist Info */}
            <Grid item xs={12} md={4} sx={{ borderRight: { md: 1 }, borderColor: 'divider' }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                {/* Avatar Section */}
                <Box sx={{ position: 'relative', display: 'inline-block', mt: -8 }}>
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
                        width: 140,
                        height: 140,
                        mx: 'auto',
                        mb: 2,
                        border: '4px solid white',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }}
                    />
                  </Badge>
                </Box>

                <Typography variant="h5" fontWeight="700" gutterBottom>
                  {fullName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {studioName}
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                  <Chip
                    label={profileData.specialty || 'Visual Artist'}
                    size="small"
                    icon={<Brush sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: '#E3F2FD', color: '#1976D2' }}
                  />
                  <Chip
                    label="Verified Artist"
                    size="small"
                    icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                    sx={{ bgcolor: '#E8F5E9', color: '#27AE60' }}
                  />
                  {parseInt(profileData.years_experience) > 5 && (
                    <Chip
                      label="Master Artisan"
                      size="small"
                      icon={<WorkspacePremium sx={{ fontSize: 14 }} />}
                      sx={{ bgcolor: '#FFF8E1', color: '#D4AF37' }}
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Artist since {memberDate}
                </Typography>

                {/* Artist Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <Inventory sx={{ fontSize: 20, color: '#D4AF37', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight="700" color="primary">
                        {artistStats.totalProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Products</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <ShoppingBag sx={{ fontSize: 20, color: '#D4AF37', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight="700" color="primary">
                        {artistStats.totalOrders}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Orders</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <MonetizationOn sx={{ fontSize: 20, color: '#D4AF37', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight="700" color="primary">
                        Ksh {artistStats.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
                      <Star sx={{ fontSize: 20, color: '#D4AF37', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight="700" color="primary">
                        {artistStats.averageRating}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Rating</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Contact & Social Info */}
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Contact Information
                  </Typography>
                  
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Email sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2">{user?.email}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Phone sx={{ fontSize: 18, color: '#D4AF37' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Phone</Typography>
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
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        {isEditing ? (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              value={profileData.address || ''}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              placeholder="Street address"
                              sx={{ mt: 0.5, mb: 1 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              value={profileData.city || ''}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              placeholder="City"
                            />
                          </>
                        ) : (
                          <Typography variant="body2">
                            {profileData.city ? `${profileData.address || ''} ${profileData.city}` : 'Location not set'}
                          </Typography>
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
                  <Tab icon={<Palette />} label="About & Art" iconPosition="start" />
                  <Tab icon={<Storefront />} label="Business" iconPosition="start" />
                  <Tab icon={<TrendingUp />} label="Performance" iconPosition="start" />
                  <Tab icon={<Assignment />} label="Recent Orders" iconPosition="start" />
                </Tabs>

                {/* About & Art Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    About {fullName.split(' ')[0]}
                  </Typography>
                  
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
                    Artist Bio
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={profileData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={saving}
                      placeholder="Tell your artistic journey, inspiration, and story..."
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {profileData.bio || 'No bio added yet. Click edit to share your artistic story with customers.'}
                    </Typography>
                  )}

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Art & Craftsmanship
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="600">Specialty / Medium</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={profileData.specialty || ''}
                          onChange={(e) => handleInputChange('specialty', e.target.value)}
                          placeholder="e.g., Wood Intarsia, Carving, Sculpture"
                          disabled={saving}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {profileData.specialty || 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="600">Art Style</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={profileData.art_style || ''}
                          onChange={(e) => handleInputChange('art_style', e.target.value)}
                          placeholder="e.g., Contemporary, Traditional, Abstract"
                          disabled={saving}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {profileData.art_style || 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="600">Years of Experience</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={profileData.years_experience || ''}
                          onChange={(e) => handleInputChange('years_experience', e.target.value)}
                          placeholder="e.g., 10"
                          disabled={saving}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {profileData.years_experience ? `${profileData.years_experience} years` : 'Not specified'}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight="600">Studio Name</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={profileData.studio_name || ''}
                          onChange={(e) => handleInputChange('studio_name', e.target.value)}
                          placeholder="Your studio/brand name"
                          disabled={saving}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {profileData.studio_name || `${fullName}'s Studio`}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Business Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Business Settings
                  </Typography>
                  
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 2, mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      <Storefront sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                      Shop Management
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Inventory />}
                          onClick={() => navigate('/artist/products')}
                          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                          Manage Products ({artistStats.totalProducts})
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ShoppingBag />}
                          onClick={() => navigate('/artist/orders')}
                          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                          View Orders ({artistStats.totalOrders})
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </TabPanel>

                {/* Performance Tab */}
                <TabPanel value={tabValue} index={2}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Performance Overview
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                          Sales Performance
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">This Month</Typography>
                            <Typography variant="caption" fontWeight="600">Ksh 45,280</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={65} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">This Quarter</Typography>
                            <Typography variant="caption" fontWeight="600">Ksh 128,450</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">All Time</Typography>
                            <Typography variant="caption" fontWeight="600">Ksh {artistStats.totalRevenue.toLocaleString()}</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                        <Star sx={{ fontSize: 40, color: '#FFB800', mb: 1 }} />
                        <Typography variant="h3" fontWeight="700">{artistStats.averageRating}</Typography>
                        <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                        <Rating value={artistStats.averageRating} precision={0.1} readOnly sx={{ mt: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Based on {artistStats.totalReviews} reviews
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                        <TrendingUp sx={{ fontSize: 40, color: '#27AE60', mb: 1 }} />
                        <Typography variant="h3" fontWeight="700">+23%</Typography>
                        <Typography variant="body2" color="text.secondary">Sales Growth</Typography>
                        <Typography variant="caption" color="text.secondary">Compared to last month</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Recent Orders Tab */}
                <TabPanel value={tabValue} index={3}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Recent Customer Orders
                  </Typography>
                  
                  {[1, 2, 3].map((order) => (
                    <Card key={order} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Order #{10000 + order}</Typography>
                            <Typography variant="subtitle2" fontWeight="600">Custom Wood Art Piece</Typography>
                            <Typography variant="body2" fontWeight="600">Ksh {Math.floor(5000 + Math.random() * 10000)}</Typography>
                          </Box>
                          <Chip
                            label={order === 1 ? 'Completed' : order === 2 ? 'In Progress' : 'Pending'}
                            size="small"
                            sx={{
                              bgcolor: order === 1 ? '#E8F5E9' : order === 2 ? '#FFF3E0' : '#FFEBEE',
                              color: order === 1 ? '#27AE60' : order === 2 ? '#FF9800' : '#F44336'
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
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Container>

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