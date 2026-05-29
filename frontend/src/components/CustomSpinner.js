// src/components/CustomSpinner.js
import { Box, Typography, keyframes } from '@mui/material';

// Wood grain ripple animation
const woodGrainRipple = keyframes`
  0% {
    stroke-dashoffset: 200;
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0.3;
  }
`;

// Sawdust particle float
const floatParticle = keyframes`
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100px) translateX(30px) rotate(180deg);
    opacity: 0;
  }
`;

// Chisel carve animation (text reveal)
const carveText = keyframes`
  0% {
    clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
    opacity: 0;
    letter-spacing: 8px;
  }
  30% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    letter-spacing: normal;
    opacity: 1;
  }
`;

// Wood ring pulse (organic)
const woodRingPulse = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.5;
    stroke-width: 2;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.2;
    stroke-width: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
    stroke-width: 2;
  }
`;

// Grain line movement
const grainMove = keyframes`
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 100%;
  }
`;

// Dotted ring animation (like wood beads)
const beadRing = keyframes`
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -150;
  }
`;

export default function CustomSpinner({ size = 80, text = 'Loading' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #2c1810 0%, #3e2723 50%, #2c1810 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Wood grain texture overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(139, 69, 19, 0.1) 0px,
            rgba(139, 69, 19, 0.1) 2px,
            transparent 2px,
            transparent 8px
          )`,
          pointerEvents: 'none',
          animation: `${grainMove} 20s linear infinite`,
        }}
      />

      {/* Floating sawdust particles */}
      {[...Array(12)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: i % 2 === 0 ? '4px' : '6px',
            height: i % 2 === 0 ? '6px' : '4px',
            backgroundColor: '#d4a373',
            borderRadius: '50%',
            opacity: 0,
            left: `${30 + (i * 7)}%`,
            top: `${40 + (i * 3)}%`,
            animation: `${floatParticle} ${3 + (i * 0.3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Main container */}
      <Box
        sx={{
          position: 'relative',
          width: size * 2.5,
          height: size * 2.5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* SVG Spinner - Wood ring design */}
        <Box
          sx={{
            position: 'relative',
            width: size * 2,
            height: size * 2,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {/* Outer wood ring */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#8b5a2b"
              strokeWidth="2"
              strokeDasharray="8 6"
              opacity="0.4"
            />
            
            {/* Animated outer ring - like wood grain */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#c4923a"
              strokeWidth="2.5"
              strokeDasharray="200"
              strokeDashoffset="200"
              strokeLinecap="round"
              sx={{
                animation: `${woodGrainRipple} 3s ease-in-out infinite`,
              }}
            />

            {/* Middle ring - wood bead effect */}
            <circle
              cx="100"
              cy="100"
              r="65"
              fill="none"
              stroke="#a06e2c"
              strokeWidth="3"
              strokeDasharray="4 12"
              sx={{
                animation: `${beadRing} 4s linear infinite`,
              }}
            />

            {/* Inner ring - pulsing */}
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke="#d4a373"
              strokeWidth="1.5"
              strokeDasharray="10 8"
              sx={{
                animation: `${woodRingPulse} 2s ease-in-out infinite`,
              }}
            />

            {/* Organic wood grain spiral */}
            <path
              d="M 100 10 A 90 90 0 1 1 99.9 10"
              fill="none"
              stroke="#e8c38a"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.6"
              sx={{
                animation: `${spin} 8s linear infinite`,
              }}
            />
          </svg>

          {/* Center wood knot */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #6b3a1a 0%, #4a2512 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(210, 150, 75, 0.3)',
            }}
          />
        </Box>

        {/* "Loading" text with wood-carved animation */}
        <Box
          sx={{
            overflow: 'hidden',
            display: 'inline-block',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontWeight: 400,
              letterSpacing: '4px',
              color: '#d4a373',
              textTransform: 'uppercase',
              position: 'relative',
              display: 'inline-block',
              animation: `${carveText} 2.5s ease-out forwards`,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(210, 150, 75, 0.2), transparent)',
                animation: 'shine 1.5s ease-in-out infinite',
              },
              '@keyframes shine': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            }}
          >
            {text}
          </Typography>
        </Box>

        {/* Wood grain underline */}
        <Box
          sx={{
            width: '60%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #d4a373, #8b5a2b, #d4a373, transparent)',
            borderRadius: '50%',
            animation: `${woodRingPulse} 1.5s ease-in-out infinite`,
          }}
        />
      </Box>
    </Box>
  );
}

// Keep the spin keyframe for the spiral animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;
