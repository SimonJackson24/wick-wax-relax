import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Link, useTheme } from '@mui/material';
import axios from 'axios';
import StarRating from './StarRating';

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`/api/products/${productId}/reviews`, {
        rating,
        title: title.trim() || undefined,
        review_text: reviewText.trim() || undefined,
      });
      setSubmitted(true);
      onReviewSubmitted?.();
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError('You must be logged in to submit a review.');
      } else {
        setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authError) {
    return (
      <Box sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>{authError}</Typography>
        <Button component={Link} href="/auth/login" variant="contained" sx={{ mt: 1 }}>Log In</Button>
      </Box>
    );
  }

  if (submitted) {
    return <Alert severity="success" sx={{ borderRadius: 2 }}>Thank you! Your review has been submitted and will appear shortly.</Alert>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{
      p: 3,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
    }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Write a Review</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Your Rating <span aria-hidden="true" style={{ color: theme.palette.error.main }}>*</span>
        </Typography>
        <StarRating
          value={rating}
          onChange={(_, newValue) => { setRating(newValue); if (error) setError(''); }}
          showCount={false}
          size="large"
        />
        {rating > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]} — click to change
          </Typography>
        )}
      </Box>

      <TextField
        fullWidth
        label="Review Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 200))}
        size="small"
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 200, 'aria-label': 'Review title' }}
        helperText={`${title.length}/200`}
      />

      <TextField
        fullWidth
        label="Your Review (optional)"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value.slice(0, 2000))}
        size="small"
        multiline
        rows={4}
        sx={{ mb: 2 }}
        inputProps={{ maxLength: 2000, 'aria-label': 'Review text' }}
        helperText={`${reviewText.length}/2000`}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{ backgroundColor: theme.palette.primary.main, '&:hover': { backgroundColor: theme.palette.primary.dark }, px: 4, borderRadius: 3 }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </Box>
  );
};

export default ReviewForm;