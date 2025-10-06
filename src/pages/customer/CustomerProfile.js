import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Card, CardContent, TextField, Button, Avatar,
  Grid, Divider
} from '@mui/material';
import { Edit, Save, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/profile/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user, token]);

  const handleAvatarChange = (e) => setAvatarFile(e.target.files[0]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('name', profileData.name || user?.name);
    formData.append('phone', profileData.phone || '');
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const res = await fetch('https://branchiartsgifts.vercel.app/api/users/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
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

  if (loading || !profileData) return <p>Loading...</p>;

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          My Profile
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
                  <Button
                    component="label"
                    startIcon={<CameraAlt />}
                    variant="outlined"
                    sx={{ mb: 3 }}
                  >
                    Change Photo
                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                  </Button>
                )}
                <Typography variant="h6">{profileData.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {profileData.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Account Information</Typography>
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

              {/* Name */}
              <Typography variant="subtitle2">Name</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  sx={{ mb: 3 }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {profileData.name}
                </Typography>
              )}

              {/* Phone */}
              <Typography variant="subtitle2">Phone</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  sx={{ mb: 3 }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {profileData.phone || 'Not provided'}
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
