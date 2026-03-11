import React from 'react';
import { Box } from '@mui/material';

const Logo = ({ sx }) => {
  return (
    <Box
      component="svg"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ ...sx }}
    >
      <rect width="512" height="512" rx="120" fill="#1a237e"/>
      <path d="M160 120H320L360 160V400H160V120Z" fill="white"/>
      <path d="M320 120V160H360L320 120Z" fill="#e0e0e0" fillOpacity="0.8"/>
      <circle cx="360" cy="360" r="70" fill="#3949ab" stroke="white" strokeWidth="12"/>
      <path d="M330 360L352 382L395 339" stroke="white" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="195" y="200" width="120" height="12" rx="6" fill="white" fillOpacity="0.3"/>
      <rect x="295" y="120" width="1" height="1" fill="none" /> {/* Spacer */}
      <rect x="195" y="240" width="80" height="12" rx="6" fill="white" fillOpacity="0.3"/>
      <rect x="195" y="280" width="100" height="12" rx="6" fill="white" fillOpacity="0.3"/>
    </Box>
  );
};

export default Logo;
