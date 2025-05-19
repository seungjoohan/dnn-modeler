import React from 'react';
import { Box } from '@mui/material';

export const FlowConnector: React.FC = () => (
  <Box
    sx={{
      height: 24,
      width: '100%',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Box
      sx={{
        width: 2,
        height: '100%',
        background: '#1976d2',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    />
  </Box>
); 