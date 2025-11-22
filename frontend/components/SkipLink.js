import React from 'react';
import { Box, useTheme } from '@mui/material';

const SkipLink = ({ href, children }) => {
  const theme = useTheme();

  return (
    <Box
      component="a"
      href={href}
      sx={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: theme.palette.primary.main,
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 100,
        borderRadius: '4px',
        fontWeight: 'bold',
        '&:focus': {
          top: '6px'
        }
      }}
    >
      {children}
    </Box>
  );
};

export default SkipLink;