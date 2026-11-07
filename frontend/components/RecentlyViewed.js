import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Typography, useTheme } from '@mui/material';

// Recently viewed strip (Amazon's "Recently viewed items" pattern).
// Stores lightweight product cards in localStorage; renders horizontal
// scroll cards. Client-only by nature — never blocks SSR.

const STORAGE_KEY = 'wwr-recently-viewed';
const MAX_ITEMS = 12;

export function recordRecentlyViewed(product) {
  if (!product || !product.id || typeof window === 'undefined') return;
  try {
    const entry = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.base_price,
      image: (product.images && product.images[0]) || null,
    };
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = [entry, ...list.filter((x) => x.id !== entry.id)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* storage unavailable — feature silently off */ }
}

const RecentlyViewed = ({ excludeId }) => {
  const theme = useTheme();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setItems(excludeId ? list.filter((x) => x.id !== excludeId) : list);
    } catch { setItems([]); }
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 2 }}
      >
        Recently viewed
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          '::-webkit-scrollbar': { height: 6 },
        }}
      >
        {items.map((item) => (
          <Link key={item.id} href={`/product/${item.slug || item.id}`} style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                minWidth: 140,
                maxWidth: 140,
                p: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                '&:hover': { borderColor: theme.palette.primary.main },
              }}
            >
              {item.image ? (
                <Box
                  component="img"
                  src={item.image.image_url || item.image}
                  alt={item.name}
                  sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <Box sx={{ width: '100%', height: 100, borderRadius: '8px', bgcolor: 'rgba(200,182,219,0.15)' }} />
              )}
              <Typography variant="body2" noWrap sx={{ mt: 1, fontWeight: 500 }}>
                {item.name}
              </Typography>
              {item.price != null && (
                <Typography variant="body2" color="text.secondary">
                  £{Number(item.price).toFixed(2)}
                </Typography>
              )}
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
};

export default RecentlyViewed;
