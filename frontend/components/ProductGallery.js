import React, { useState } from 'react';
import {
  Box, Typography, Dialog, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const ProductGallery = ({ images = [], productName = '' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const imageList = Array.isArray(images)
    ? images
    : images ? [images] : [];

  const hasMultiple = imageList.length > 1;

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (!zoomOpen) return;
    if (e.key === 'Escape') setZoomOpen(false);
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  if (imageList.length === 0) {
    return (
      <Box sx={{
        height: 500, backgroundColor: '#f5f0eb', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(200,182,219,0.3)'
      }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          {productName}<br />
          <Typography variant="body2" color="text.disabled">No images available</Typography>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ userSelect: 'none' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Image */}
      <Box
        sx={{
          position: 'relative', height: isMobile ? 320 : 500,
          backgroundColor: '#f5f0eb', borderRadius: 2, overflow: 'hidden',
          border: '1px solid rgba(200,182,219,0.3)', cursor: 'zoom-in',
          '&:hover .zoom-hint': { opacity: 1 },
        }}
        onClick={() => setZoomOpen(true)}
      >
        <img
          src={imageList[activeIndex]}
          alt={`${productName} — image ${activeIndex + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <Box className="zoom-hint" sx={{
          position: 'absolute', bottom: 12, right: 12,
          backgroundColor: 'rgba(62,35,81,0.7)', borderRadius: 2,
          p: 0.75, opacity: 0, transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'center', gap: 0.5,
        }}>
          <ZoomInIcon sx={{ color: 'white', fontSize: 18 }} />
          <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
            Click to zoom
          </Typography>
        </Box>
      </Box>

      {/* Thumbnail Strip */}
      {hasMultiple && (
        <Box sx={{
          display: 'flex', gap: 1, mt: 1, overflowX: 'auto', pb: 1,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#C8B6DB', borderRadius: 2 },
        }}>
          {imageList.map((img, idx) => (
            <Box
              key={idx}
              onClick={() => setActiveIndex(idx)}
              sx={{
                width: 72, height: 72, flexShrink: 0, borderRadius: 1.5,
                overflow: 'hidden', cursor: 'pointer',
                border: idx === activeIndex
                  ? '2px solid #C8B6DB'
                  : '2px solid transparent',
                opacity: idx === activeIndex ? 1 : 0.65,
                transition: 'all 0.2s',
                '&:hover': { opacity: 1, border: '2px solid #C8B6DB' }
              }}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Image Counter */}
      {hasMultiple && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {activeIndex + 1} of {imageList.length}
          </Typography>
        </Box>
      )}

      {/* Zoom Modal */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0,0,0,0.95)',
            boxShadow: 'none',
            maxHeight: '95vh',
          }
        }}
        BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
      >
        <Box sx={{
          position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', minHeight: '70vh', p: 2,
        }}>
          <img
            src={imageList[activeIndex]}
            alt={`${productName} — full size`}
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />

          {/* Close */}
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{
              position: 'absolute', top: 8, right: 8, color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Nav arrows */}
          {hasMultiple && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute', left: 8, color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute', right: 8, color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
        </Box>

        {/* Thumbnails in zoom modal */}
        {hasMultiple && (
          <Box sx={{
            display: 'flex', justifyContent: 'center', gap: 1, pb: 2, flexWrap: 'wrap'
          }}>
            {imageList.map((img, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveIndex(idx)}
                sx={{
                  width: 56, height: 56, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                  border: idx === activeIndex ? '2px solid #C8B6DB' : '2px solid transparent',
                  opacity: idx === activeIndex ? 1 : 0.6,
                  '&:hover': { opacity: 1 }
                }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', display: 'block', pb: 2 }}>
          {activeIndex + 1} / {imageList.length} — Press ESC to close
        </Typography>
      </Dialog>
    </Box>
  );
};

export default ProductGallery;
