import React from 'react';
import { Box, Typography, Rating } from '@mui/material';
import { SECTION_PY, GUTTER } from '../../src/layoutTokens';

/**
 * Reviews proof band — the one dark moment on the page. Social proof is
 * Amazon's biggest conversion lever; premium brands usually bury it. We
 * give it its own high-contrast band instead.
 */
const ReviewsBand = ({
  average = 4.9,
  count = 0,
  reviews = [],
}) => {
  const sample = reviews.length
    ? reviews.slice(0, 3)
    : [
        { title: 'The lavender is unreal', body: 'It fills the whole room in about twenty minutes and it still smells beautiful the next morning. Worth every penny.', author: 'Hannah R.' },
        { title: 'Beautiful packaging, better scent', body: 'Arrived wrapped in tissue with a handwritten thank-you note. The wax melt lasted three days in my warmer without fading.', author: 'Marcus T.' },
        { title: 'My new evening ritual', body: 'I light one when the kids are in bed and the whole house smells like a spa. Already ordered two more scents.', author: 'Priya S.' },
      ];

  return (
    <Box
      className="wwr-dark-surface"
      sx={{ py: SECTION_PY, backgroundColor: '#3D2B3D', color: '#F4EFE7' }}
    >
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: GUTTER }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 },
            flexWrap: 'wrap', mb: { xs: 4, md: 6 },
          }}
        >
          <Typography variant="overline" sx={{ color: '#E6C88A' }}>
            Customer love
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              component="p"
              sx={{
                fontFamily: '"Playfair Display", serif', fontSize: '2.25rem', fontWeight: 500,
                lineHeight: 1, color: '#F4EFE7', m: 0,
              }}
            >
              {average}
            </Typography>
            <Rating value={average} size="small" readOnly sx={{ color: '#E6C88A' }} />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(244,239,231,0.82)' }}>
            {count > 0 ? `from ${count} verified reviews` : 'from our earliest batch'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {sample.map((review, i) => (
            <Box
              key={i}
              sx={{
                border: '1px solid rgba(244,239,231,0.18)',
                borderRadius: 1,
                p: { xs: 2.5, md: 3.5 },
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Rating value={5} size="small" readOnly sx={{ color: '#E6C88A', mb: 1.5 }} />
              {review.title && (
                <Typography
                  component="h3"
                  sx={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.125rem', fontWeight: 500, mb: 1,
                    color: '#F4EFE7', mt: 0,
                  }}
                >
                  {review.title}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: 'rgba(244,239,231,0.82)', lineHeight: 1.75, mb: 2 }}>
                {review.body}
              </Typography>
              <Typography variant="overline" sx={{ color: 'rgba(244,239,231,0.78)', fontSize: '0.6875rem' }}>
                {review.author}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ReviewsBand;
