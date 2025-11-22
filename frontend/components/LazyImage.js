import { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';

const LazyImage = ({
  src,
  alt,
  width,
  height,
  placeholder,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || '200px',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      className={className}
      {...props}
    >
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          {placeholder || 'Loading...'}
        </Box>
      )}

      {isInView && (
        <Box
          component="img"
          src={src}
          alt={alt}
          onLoad={handleLoad}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
    </Box>
  );
};

export default LazyImage;