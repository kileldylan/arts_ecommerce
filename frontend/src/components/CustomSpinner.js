// src/components/CustomSpinner.js
import { Box, keyframes } from '@mui/material';

// Cinematic rotate animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Cinematic pulse for the glow
const glow = keyframes`
  0% {
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.6));
    transform: scale(1.05);
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
    transform: scale(1);
  }
`;

// Orbiting ring animation
const orbitRing = keyframes`
  0% {
    transform: rotate(0deg);
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0.3;
  }
`;

// Second ring with opposite direction
const orbitRingReverse = keyframes`
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

export default function CustomSpinner({ size = 80 }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#0a0a0a', // Dark cinematic background
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cinematic vignette effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Main spinner container */}
      <Box
        sx={{
          position: 'relative',
          width: size * 2.5,
          height: size * 2.5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Orbiting ring 1 - outer */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid rgba(255, 255, 255, 0.15)`,
            borderTop: `2px solid rgba(255, 255, 255, 0.8)`,
            borderRight: `2px solid rgba(255, 255, 255, 0.4)`,
            animation: `${orbitRing} 3s linear infinite`,
          }}
        />
        
        {/* Orbiting ring 2 - middle, reverse direction */}
        <Box
          sx={{
            position: 'absolute',
            width: '75%',
            height: '75%',
            borderRadius: '50%',
            border: `1.5px solid rgba(255, 215, 0, 0.15)`,
            borderBottom: `1.5px solid rgba(255, 215, 0, 0.6)`,
            borderLeft: `1.5px solid rgba(255, 215, 0, 0.3)`,
            animation: `${orbitRingReverse} 2.5s linear infinite`,
          }}
        />
        
        {/* Orbiting ring 3 - inner */}
        <Box
          sx={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            borderTop: `1px solid rgba(255, 255, 255, 0.7)`,
            animation: `${spin} 1.8s linear infinite`,
          }}
        />

        {/* Logo with cinematic glow */}
        <Box
          sx={{
            width: size,
            height: size,
            animation: `${glow} 2s ease-in-out infinite`,
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src="/branchi_logo.png"
            alt="Branchi Arts"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'brightness(1.05) contrast(1.1)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}