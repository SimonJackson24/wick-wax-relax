import { Box, Typography, Chip, Skeleton, useTheme } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import StarRating from './StarRating';

const ReviewCard = ({ review }) => {
  const theme = useTheme();
  const formattedDate = new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <Box sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <StarRating value={review.rating} showCount={false} size="small" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {review.verified_purchase && (
            <Chip icon={<VerifiedIcon sx={{ fontSize: 14 }} />} label="Verified Purchase" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
          )}
          <Typography variant="caption" color="text.secondary">{formattedDate}</Typography>
        </Box>
      </Box>
      {review.title && <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>{review.title}</Typography>}
      {review.review_text && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{review.review_text}</Typography>}
      {review.helpful_count > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <ThumbUpOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">{review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful</Typography>
        </Box>
      )}
    </Box>
  );
};

const ReviewList = ({ reviews = [], loading = false }) => {
  const theme = useTheme();
  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2 }}>
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="60%" height={16} />
          </Box>
        ))}
      </Box>
    );
  }
  if (reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5, px: 3, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>No reviews yet</Typography>
        <Typography variant="body2" color="text.disabled">Be the first to review this product!</Typography>
      </Box>
    );
  }
  return (
    <Box>
      {reviews.map((review, index) => (
        <Box key={review.id || index}>
          <ReviewCard review={review} />
        </Box>
      ))}
    </Box>
  );
};

export default ReviewList;