import React from 'react';
import { Box, Typography, Link } from '@mui/material';

/**
 * Announcement bar — the trust strip. Amazon does this as a banner; we do
 * it as a single tracked-out line so it reads as confidence, not urgency.
 */
const AnnouncementBar = ({ messages }) => {
  const items = messages || [
    'Free UK delivery over £25',
    '30-day returns',
    'Hand-poured in the UK',
    'Plastic-free packaging',
  ];

  return (
    <Box
      sx={{
        backgroundColor: '#3D2B3D',
        color: '#F4EFE7',
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 1.5, md: 3 },
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item, i) => (
          <React.Fragment key={item}>
            {i > 0 && (
              <Box
                aria-hidden
                sx={{
                  width: 3, height: 3, borderRadius: '50%',
                  backgroundColor: 'rgba(244,239,231,0.45)', flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="overline"
              sx={{ color: 'inherit', whiteSpace: 'nowrap', fontSize: '0.6875rem' }}
            >
              {item}
            </Typography>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default AnnouncementBar;
