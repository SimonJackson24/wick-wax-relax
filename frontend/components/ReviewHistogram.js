import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Amazon-style rating breakdown — 5→1 bars with counts and percentages.
// Data comes from the reviews endpoint's `distribution` field.
const ReviewHistogram = ({ distribution = [], reviewCount, onSelectRating }) => {
  const theme = useTheme();
  const total = reviewCount !== undefined ? reviewCount : distribution.reduce((s, d) => s + d.count, 0);
  if (!total || distribution.length === 0) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: 340 }}>
      {distribution.map(({ rating, count }) => {
        const pct = Math.round((count / total) * 100);
        return (
          <Box
            key={rating}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.4,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
            role="button"
            tabIndex={0}
            aria-label={`${rating} star: ${count} reviews, ${pct}%`}
            onClick={onSelectRating ? () => onSelectRating(rating) : undefined}
          >
            <Typography variant="body2" sx={{ minWidth: 28, fontWeight: 500 }}>
              {rating}★
            </Typography>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(0,0,0,0.06)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
              {pct}%
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default ReviewHistogram;
