import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, TextField,
  Button, Avatar, Grid, Chip, Divider
} from '@mui/material';
import { Edit, Save, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function ArtistProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();

        if (data.social_media) {
          data.website = data.social_media.website;
          data.instagram = data.social_media.instagram;
          data.facebook = data.social_media.facebook;
          data.twitter = data.social_media.twitter;
        }

        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) fetchProfile();
  }, [user, token, API_BASE]);

  const handleAvatarChange = (e) => setAvatarFile(e.target.files[0]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('name', profileData.name || user?.name);
    formData.append('bio', profileData.bio || '');
    formData.append('specialty', profileData.specialty || '');
    formData.append('website', profileData.website || '');
    formData.append('instagram', profileData.instagram || '');
    formData.append('facebook', profileData.facebook || '');
    formData.append('twitter', profileData.twitter || '');
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setProfileData((prev) => ({ ...prev, ...data.user }));
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profileData) return <p>Failed to load profile.</p>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Artist Profile
      </Typography>

      <Grid container spacing={4}>
        {/* Left Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src={avatarFile ? URL.createObjectURL(avatarFile) : profileData.avatar}
              />
              {isEditing && (
                <Button component="label" startIcon={<CameraAlt />} variant="outlined" sx={{ mb: 3 }}>
                  Change Photo
                  <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                </Button>
              )}
              <Typography variant="h6">{profileData.name}</Typography>
              <Chip label={profileData.specialty} color="primary" sx={{ mt: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Member since {new Date(profileData.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Social Links</Typography>
            {['website', 'instagram', 'facebook', 'twitter'].map((field) =>
              isEditing ? (
                <TextField
                  key={field}
                  fullWidth
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={profileData[field] || ''}
                  onChange={(e) => setProfileData({ ...profileData, [field]: e.target.value })}
                  sx={{ mb: 2 }}
                />
              ) : (
                profileData[field] && (
                  <Typography key={field} variant="body2" sx={{ mb: 1 }}>
                    {field}: {profileData[field]}
                  </Typography>
                )
              )
            )}
          </Card>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Profile Information</Typography>
              {isEditing ? (
                <Button startIcon={<Save />} variant="contained" onClick={handleSave}>
                  Save Changes
                </Button>
              ) : (
                <Button startIcon={<Edit />} variant="outlined" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Bio */}
            <Typography variant="subtitle2">Bio</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={profileData.bio || ''}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                sx={{ mb: 3 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {profileData.bio || 'No bio yet.'}
              </Typography>
            )}

            {/* Portfolio */}
            <Typography variant="subtitle2">Portfolio</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={profileData.portfolio || ''}
                onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                sx={{ mb: 3 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {profileData.portfolio || 'No portfolio link.'}
              </Typography>
            )}

            {/* Specialty */}
            <Typography variant="subtitle2">Specialty</Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={profileData.specialty || ''}
                onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                sx={{ mb: 3 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {profileData.specialty}
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
