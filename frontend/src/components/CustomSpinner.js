// src/components/CustomSpinner.js
import { Box, keyframes } from '@mui/material';

// Create spinning animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Optional: Pulse animation for better effect
const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
`;

export default function CustomSpinner({ size = 80, text = "Loading..." }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        gap: 3,
        backgroundColor: '#FAFAFA',
      }}
    >
      {/* Spinning Logo Container */}
      <Box
        sx={{
          width: size,
          height: size,
          animation: `${spin} 1.5s linear infinite`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Your Logo - Replace with your actual logo */}
        <img
          src="/branchi_logo.png"
          alt="Branchi Arts"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>
      
      {/* Optional: Animated text */}
      <Box
        sx={{
          animation: `${pulse} 1.5s ease-in-out infinite`,
          textAlign: 'center',
        }}
      >
        <Box
          component="img"
          src="/brand-name.png" // Optional: Your brand name as image
          alt="Branchi Arts & Gifts"
          sx={{ height: 30, mb: 1 }}
        />
        <Box
          sx={{
            width: 40,
            height: 2,
            backgroundColor: '#2C3E50',
            margin: '0 auto',
            borderRadius: 1,
          }}
        />
        <Box sx={{ mt: 2, color: '#7F8C8D', fontSize: '0.875rem' }}>
          {text}
        </Box>
      </Box>
    </Box>
  );
}