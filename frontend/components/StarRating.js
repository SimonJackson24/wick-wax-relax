import { Box, Typography, useTheme } from '@mui/material';
import Rating from '@mui/material/Rating';

const StarRating = ({
  value = 0,
  reviewCount = 0,
  showCount = true,
  size = 'medium',
  onChange,
}) => {
  const theme = useTheme();

  const sizeMap = {
    small: { star: 'small', typography: 'caption' },
    medium: { star: 'medium', typography: 'body2' },
    large: { star: 'large', typography: 'body1' },
  };

  const { star: starSize, typography: textVariant } = sizeMap[size] || sizeMap.medium;

  return (
    <Box
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      role="img"
      aria-label={`Rating: ${value} out of 5 stars${reviewCount > 0 ? ` (${reviewCount} reviews)` : ''}`}
    >
      <Rating
        value={value}
        precision={0.5}
        readOnly={!onChange}
        onChange={onChange}
        size={starSize}
        sx={{
          color: theme.palette.secondary.main,
          '& .MuiRating-iconFilled': { color: theme.palette.secondary.main },
          '& .MuiRating-iconEmpty': { color: theme.palette.grey[400] },
        }}
      />
      {showCount && reviewCount > 0 && (
        <Typography
          variant={textVariant}
          color="text.secondary"
          component="span"
          sx={{ ml: 0.25 }}
        >
          ({reviewCount})
        </Typography>
      )}
    </Box>
  );
};

export default StarRating;