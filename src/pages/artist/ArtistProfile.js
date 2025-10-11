import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, TextField,
  Button, Avatar, Grid, Chip, Divider, Alert, CircularProgress,
  LinearProgress
} from '@mui/material';
import { Edit, Save, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';

export default function ArtistProfile() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user) {
          setError('No user found. Please log in.');
          return;
        }

        // Use the profile from AuthContext, but fetch fresh data to ensure we have everything
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
          setError('Failed to load profile');
          return;
        }

        setProfileData(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setError('');
    }
  };

  const uploadAvatar = async (file, userId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let avatarUrl = profileData?.avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, user.id);
      }

      // Prepare update data
      const updateData = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        bio: profileData.bio || '',
        specialty: profileData.specialty || '',
        website: profileData.website || '',
        instagram: profileData.instagram || '',
        facebook: profileData.facebook || '',
        twitter: profileData.twitter || '',
        updated_at: new Date().toISOString(),
      };

      // Add avatar URL if we have a new one
      if (avatarUrl) {
        updateData.avatar = avatarUrl;
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh the profile in AuthContext
      await refreshProfile();
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setProfileData(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  // Show error state
  if (error && !profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  // Show no profile state
  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No profile found. Please complete your profile setup.
        </Alert>
      </Container>
    );
  }

  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown Artist';
  const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : profileData.avatar;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Artist Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src={avatarUrl}
                alt={fullName}
              />
              {isEditing && (
                <Button 
                  component="label" 
                  startIcon={<CameraAlt />} 
                  variant="outlined" 
                  sx={{ mb: 3 }}
                  disabled={saving}
                >
                  Change Photo
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                </Button>
              )}
              <Typography variant="h6">{fullName}</Typography>
              <Chip 
                label={profileData.specialty || 'Artist'} 
                color="primary" 
                sx={{ mt: 1 }} 
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Social Links</Typography>
            {['website', 'instagram', 'facebook', 'twitter'].map((platform) =>
              isEditing ? (
                <TextField
                  key={platform}
                  fullWidth
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={profileData[platform] || ''}
                  onChange={(e) => handleSocialMediaChange(platform, e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={saving}
                  placeholder={`Your ${platform} URL`}
                />
              ) : (
                profileData[platform] && (
                  <Typography key={platform} variant="body2" sx={{ mb: 1 }}>
                    {platform}: {profileData[platform]}
                  </Typography>
                )
              )
            )}
            {!isEditing && !['website', 'instagram', 'facebook', 'twitter'].some(p => profileData[p]) && (
              <Typography variant="body2" color="text.secondary">
                No social links added yet.
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Profile Information</Typography>
              {isEditing ? (
                <Button 
                  startIcon={saving ? <CircularProgress size={16} /> : <Save />} 
                  variant="contained" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <Button 
                  startIcon={<Edit />} 
                  variant="outlined" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Name Fields */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">First Name</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={profileData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {profileData.first_name || 'Not set'}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Last Name</Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={profileData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {profileData.last_name || 'Not set'}
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Bio */}
            <Typography variant="subtitle2">Bio</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={profileData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                sx={{ mb: 3 }}
                disabled={saving}
                placeholder="Tell us about yourself and your art..."
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {profileData.bio || 'No bio yet.'}
              </Typography>
            )}

            {/* Specialty */}
            <Typography variant="subtitle2">Specialty</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={profileData.specialty || ''}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                sx={{ mb: 3 }}
                disabled={saving}
                placeholder="e.g., Painting, Sculpture, Digital Art..."
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {profileData.specialty || 'No specialty specified'}
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}