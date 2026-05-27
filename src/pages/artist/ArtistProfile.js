import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, Box, Card, CardContent, TextField,
  Button, Avatar, Grid, Chip, Divider, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import { Edit, Save, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';

export default function ArtistProfile() {
  const { user, profile, refreshProfile, loading: authLoading, updateProfileImmediately } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Cancel previous requests
  const abortControllerRef = useRef(null);

  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      // Use AuthContext's cached profile first
      if (!forceRefresh && profile) {
        console.log('✅ Using cached profile from AuthContext');
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
      setError('');
    }
  }, []);

  const uploadAvatar = useCallback(async (file, userId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
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
    
    let avatarUrl = profileData?.avatar;
    
    try {
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, user.id);
        const updatedWithAvatar = { ...profileData, avatar: avatarUrl };
        setProfileData(updatedWithAvatar);
        if (updateProfileImmediately) updateProfileImmediately(updatedWithAvatar);
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
        phone: profileData.phone || '',
        updated_at: new Date().toISOString(),
      };
      
      if (avatarUrl) updateData.avatar = avatarUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      if (refreshProfile) await refreshProfile(true);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [profileData, avatarFile, user?.id, refreshProfile, updateProfileImmediately, uploadAvatar]);

  const handleInputChange = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  }, []);

  if (loading || authLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
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
  
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown Artist';
  const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : profileData.avatar;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>Artist Profile</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }} src={avatarUrl} alt={fullName} />
              {isEditing && (
                <Button component="label" startIcon={<CameraAlt />} variant="outlined" sx={{ mb: 3 }} disabled={saving}>
                  Change Photo
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </Button>
              )}
              <Typography variant="h6">{fullName}</Typography>
              <Chip label={profileData.specialty || 'Artist'} color="primary" sx={{ mt: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Contact & Social Links</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Phone</Typography>
            {isEditing ? (
              <TextField fullWidth value={profileData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} sx={{ mb: 2 }} disabled={saving} />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{profileData.phone || 'No phone number'}</Typography>
            )}
            
            {['website', 'instagram', 'facebook', 'twitter'].map((platform) => isEditing ? (
              <TextField key={platform} fullWidth label={platform.charAt(0).toUpperCase() + platform.slice(1)} value={profileData[platform] || ''} onChange={(e) => handleInputChange(platform, e.target.value)} sx={{ mb: 2 }} disabled={saving} />
            ) : profileData[platform] && (
              <Typography key={platform} variant="body2" sx={{ mb: 1 }}>{platform}: {profileData[platform]}</Typography>
            ))}
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Profile Information</Typography>
              {isEditing ? (
                <Button startIcon={saving ? <CircularProgress size={16} /> : <Save />} variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <Button startIcon={<Edit />} variant="outlined" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">First Name</Typography>
                {isEditing ? (
                  <TextField fullWidth value={profileData.first_name || ''} onChange={(e) => handleInputChange('first_name', e.target.value)} disabled={saving} />
                ) : (
                  <Typography variant="body2" color="text.secondary">{profileData.first_name || 'Not set'}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Last Name</Typography>
                {isEditing ? (
                  <TextField fullWidth value={profileData.last_name || ''} onChange={(e) => handleInputChange('last_name', e.target.value)} disabled={saving} />
                ) : (
                  <Typography variant="body2" color="text.secondary">{profileData.last_name || 'Not set'}</Typography>
                )}
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2">Bio</Typography>
            {isEditing ? (
              <TextField fullWidth multiline rows={4} value={profileData.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} sx={{ mb: 3 }} disabled={saving} />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{profileData.bio || 'No bio yet.'}</Typography>
            )}
            
            <Typography variant="subtitle2">Specialty</Typography>
            {isEditing ? (
              <TextField fullWidth value={profileData.specialty || ''} onChange={(e) => handleInputChange('specialty', e.target.value)} sx={{ mb: 3 }} disabled={saving} />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{profileData.specialty || 'No specialty specified'}</Typography>
            )}
            
            <Typography variant="subtitle2">Portfolio</Typography>
            {isEditing ? (
              <TextField fullWidth value={profileData.portfolio || ''} onChange={(e) => handleInputChange('portfolio', e.target.value)} disabled={saving} />
            ) : (
              <Typography variant="body2" color="text.secondary">{profileData.portfolio || 'No portfolio link'}</Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}