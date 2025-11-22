import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';

const VirtualizedList = ({
  items,
  itemHeight = 200,
  containerHeight = 600,
  renderItem,
  loading = false,
  onLoadMore,
  hasMore = false,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightState, setContainerHeightState] = useState(containerHeight);
  const containerRef = useRef();

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeightState) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setScrollTop(scrollTop);

    // Load more when nearing the end
    if (onLoadMore && hasMore && !loading) {
      const threshold = totalHeight - containerHeightState * 2;
      if (scrollTop > threshold) {
        onLoadMore();
      }
    }
  }, [containerHeightState, totalHeight, onLoadMore, hasMore, loading]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      setContainerHeightState(container.clientHeight);
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        <Box
          sx={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <Box
              key={item.id || index}
              sx={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {renderItem(item, startIndex + index)}
            </Box>
          ))}
        </Box>
      </Box>

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            py: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default VirtualizedList;