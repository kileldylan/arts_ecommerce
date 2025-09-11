// src/pages/artist/ArtistProfile.js
import React, { useState, useEffect } from 'react';
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
  Divider,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit, Save, CameraAlt, Link } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/NavBar';

export default function ArtistProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    specialty: '',
    website: '',
    instagram: '',
    facebook: '',
    twitter: '',
    isAcceptingCommissions: false,
    commissionDetails: ''
  });

  useEffect(() => {
    // Load profile data from API
    if (user) {
      // Simulated data - replace with API call
      setProfileData({
        bio: user.bio || 'Passionate artist creating unique pieces...',
        specialty: user.specialty || 'Mixed Media',
        website: user.website || '',
        instagram: user.instagram || '',
        facebook: user.facebook || '',
        twitter: user.twitter || '',
        isAcceptingCommissions: user.isAcceptingCommissions || false,
        commissionDetails: user.commissionDetails || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Save profile data to API
    console.log('Saving profile:', profileData);
    setIsEditing(false);
    // Add API call here
  };

  return (
    <>
    <Navbar/>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Artist Profile
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                src={user?.avatar}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Button startIcon={<CameraAlt />} variant="outlined" sx={{ mb: 3 }}>
                Change Photo
              </Button>
              <Typography variant="h6">{user?.name}</Typography>
              <Chip label={profileData.specialty} color="primary" sx={{ mt: 1 }} />
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(user?.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Links
              </Typography>
              {isEditing ? (
                <>
                  <TextField
                    fullWidth
                    label="Website"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    sx={{ mb: 2 }}
                    placeholder="https://yourwebsite.com"
                  />
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData({...profileData, instagram: e.target.value})}
                    sx={{ mb: 2 }}
                    placeholder="@username"
                  />
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={profileData.facebook}
                    onChange={(e) => setProfileData({...profileData, facebook: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Twitter/X"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData({...profileData, twitter: e.target.value})}
                  />
                </>
              ) : (
                <Box>
                  {profileData.website && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Link sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">{profileData.website}</Typography>
                    </Box>
                  )}
                  {profileData.instagram && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">📷 {profileData.instagram}</Typography>
                    </Box>
                  )}
                  {profileData.facebook && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">📘 {profileData.facebook}</Typography>
                    </Box>
                  )}
                  {profileData.twitter && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">🐦 {profileData.twitter}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Bio</Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell your story and what inspires your art..."
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {profileData.bio || 'No bio added yet.'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profileData.isAcceptingCommissions}
                        onChange={(e) => setProfileData({...profileData, isAcceptingCommissions: e.target.checked})}
                        disabled={!isEditing}
                      />
                    }
                    label="Accepting commission requests"
                  />
                </Grid>

                {profileData.isAcceptingCommissions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Commission Details</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={profileData.commissionDetails}
                        onChange={(e) => setProfileData({...profileData, commissionDetails: e.target.value})}
                        placeholder="Describe your commission process, pricing, and timeline..."
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {profileData.commissionDetails || 'No commission details added.'}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </>
  );
}