import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, TextField,
  Button, Avatar, Grid, Chip, Divider, Alert, CircularProgress
} from '@mui/material';
import { Edit, Save, CameraAlt, Email, Phone } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabaseClient';

export default function CustomerProfile() {
  const { user, refreshProfile, loading: authLoading, updateProfileImmediately } = useAuth();
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

        // Fetch fresh profile data from Supabase profiles table
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
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, etc.)');
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
      const fileName = `${userId}/customer-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Uploading customer avatar to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar: ' + error.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let avatarUrl = profileData?.avatar_url || profileData?.avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile, user.id);

          // Optimistically update UI
          const updatedWithAvatar = {
            ...profileData,
            avatar_url: avatarUrl,
            avatar: avatarUrl
          };
          setProfileData(updatedWithAvatar);
          if (updateProfileImmediately) {
            updateProfileImmediately(updatedWithAvatar);
          }
        } catch (uploadError) {
          setError(uploadError.message);
          return;
        }
      }

      // Prepare update data for profiles table (matches your schema)
      const updateData = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        updated_at: new Date().toISOString(),
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
        updateData.avatar = avatarUrl; // keep compatibility
      }

      console.log('Updating customer profile:', updateData);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh AuthContext profile
      if (refreshProfile) {
        await refreshProfile(true);
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }

  if (error && !profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No profile found. Please complete your profile setup.
        </Alert>
      </Container>
    );
  }

  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Customer';
  const displayAvatar = avatarFile ? URL.createObjectURL(avatarFile) : (profileData.avatar_url || profileData.avatar || '/default-avatar.png');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        My Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Left Section - Avatar & Role */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 140, height: 140, mx: 'auto', mb: 2 }}
              src={displayAvatar}
              alt={fullName}
            />
            {isEditing && (
              <Button
                component="label"
                startIcon={<CameraAlt />}
                variant="outlined"
                sx={{ mb: 2 }}
                disabled={saving}
              >
                Change Photo
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </Button>
            )}
            <Typography variant="h6">{fullName}</Typography>
            <Chip label="Customer" color="primary" sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Member since {new Date(profileData.created_at).toLocaleDateString()}
            </Typography>
          </Card>

          {/* Contact Info Card */}
          <Card sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Email (readonly) */}
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email fontSize="small" /> Email
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.email}
            </Typography>

            {/* Phone */}
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone fontSize="small" /> Phone
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={profileData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={saving}
                placeholder="Your phone number"
                size="small"
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profileData.phone || 'Not provided'}
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Right Section - Editable Profile Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Account Information</Typography>
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
                <Button startIcon={<Edit />} variant="outlined" onClick={() => setIsEditing(true)}>
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
                    size="small"
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
                    size="small"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {profileData.last_name || 'Not set'}
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Bio (optional for customers) */}
            <Typography variant="subtitle2">Bio (Optional)</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={profileData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={saving}
                placeholder="Tell us a little about yourself..."
                sx={{ mb: 3 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {profileData.bio || 'No bio added yet.'}
              </Typography>
            )}

            {/* Additional info (like delivery address - optional) */}
            <Typography variant="subtitle2">Default Address (Optional)</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={2}
                value={profileData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={saving}
                placeholder="Your default delivery address"
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {profileData.address || 'No address saved'}
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}