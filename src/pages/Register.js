// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContexts';
import {
  Card, CardContent, TextField, Button, Typography, Box,
  Divider, Alert, Container, Radio, RadioGroup, FormControlLabel,
  FormLabel, Stepper, Step, StepLabel, Grid,
  InputAdornment, IconButton, OutlinedInput, InputLabel
} from '@mui/material';
import { Visibility, VisibilityOff, Google, GitHub } from '@mui/icons-material';

const steps = ['Account Type', 'Basic Information', 'Additional Details'];

export default function Register() {
  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    // Customer specific
    phone: '',
    // Artist specific
    bio: '',
    specialty: '',
    portfolio: '',
    socialMedia: '',
    // Admin specific (will be invite only)
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        return setError('Please fill in all required fields');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match');
      }
      setActiveStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    setError('');
  };

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  const handleClickShowConfirmPassword = () => {
    setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      userType: userType,
      phone: formData.phone,
      bio: formData.bio,
      specialty: formData.specialty,
      portfolio: formData.portfolio,
      socialMedia: formData.socialMedia,
      inviteCode: formData.inviteCode
    };

    const result = await register(userData);
    
    if (result.success) {
      navigate(userType === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    alert(`${provider} registration will be implemented in Phase 3`);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <FormLabel component="legend" sx={{ mb: 2 }}>Select your account type</FormLabel>
            <RadioGroup value={userType} onChange={(e) => setUserType(e.target.value)}>
              <FormControlLabel 
                value="customer" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Customer</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse and purchase beautiful art and jewelry pieces
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="artist" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Artist/Creator</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sell your creations and grow your audience
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="admin" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Administrator</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage platform operations (invite only)
                    </Typography>
                  </Box>
                } 
              />
            </RadioGroup>
          </Box>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={formData.name}
                onChange={handleChange('name')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                required
                fullWidth
                name="password"
                type={formData.showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange('password')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
              <OutlinedInput
                required
                fullWidth
                name="confirmPassword"
                type={formData.showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {formData.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={2}>
            {userType === 'customer' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="+254 XXX XXX XXX"
                />
              </Grid>
            )}
            
            {userType === 'artist' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="specialty"
                    label="Artistic Specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange('specialty')}
                    placeholder="e.g., Jewelry, Painting, Sculpture"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    id="bio"
                    label="Short Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange('bio')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="portfolio"
                    label="Portfolio Link"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange('portfolio')}
                    placeholder="https://yourportfolio.com"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="socialMedia"
                    label="Social Media"
                    name="socialMedia"
                    value={formData.socialMedia}
                    onChange={handleChange('socialMedia')}
                    placeholder="Instagram, Twitter, etc."
                  />
                </Grid>
              </>
            )}
            
            {userType === 'admin' && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="inviteCode"
                  label="Admin Invite Code"
                  name="inviteCode"
                  value={formData.inviteCode}
                  onChange={handleChange('inviteCode')}
                />
              </Grid>
            )}
          </Grid>
        );
      
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <Card elevation={3} sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', color: 'primary.main' }}>
              Join Ujamaa Collective
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              Create your account in a few simple steps
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                  >
                    Back
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ px: 4 }}
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ px: 4 }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
                
                {activeStep === 0 && (
                  <>
                    <Divider sx={{ my: 3 }}>or</Divider>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Google />}
                    sx={{ py: 1.5 }}
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                    >
                    Google
                    </Button>
                    <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GitHub />}
                    sx={{ py: 1.5 }}
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/github'}
                    >
                    GitHub
                    </Button>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Link to="/login" style={{ textDecoration: 'none', fontWeight: 600 }}>
                          Sign in
                        </Link>
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}