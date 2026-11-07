import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Rating } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCart } from '../CartContext';

const gbp = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value) || 0);

/**
 * Minimal product card — border, not shadow; price, notes, rating and stock
 * urgency visible; quick-add without leaving the grid.
 */
const HomeProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const variants = product.variants || [];
  const variant = variants[0] || null;
  const price = variant ? variant.price : product.base_price;
  const stock = variants.length
    ? variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    : 0;
  const lowStock = stock > 0 && stock <= 5;
  const outOfStock = stock <= 0;

  const notes = product.scent_profile
    ? Object.entries(product.scent_profile)
        .filter(([, value]) => typeof value === 'string' && value)
        .slice(0, 2)
        .map(([, value]) => value)
        .join(' · ')
    : '';

  const image = product.image_url || product.image ||
    (product.images && product.images[0] && (product.images[0].image_url || product.images[0])) ||
    '/images/placeholder-product.svg';

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || outOfStock) return;
    await addToCart({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      price: variant.price,
      image,
      quantity: 1,
    });
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 240ms ease-out, box-shadow 320ms ease-out, transform 320ms cubic-bezier(0.2,0,0,1)',
        '&:hover': {
          borderColor: 'rgba(28,26,31,0.10)',
          boxShadow: '0 2px 4px rgba(28,26,31,0.05), 0 14px 32px rgba(28,26,31,0.09)',
          transform: 'translateY(-4px)',
        },
        '&:hover .quick-add': { opacity: 1, transform: 'translateY(0)' },
      }}
    >
      <Link href={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none' }}>
        <Box sx={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', bgcolor: '#F4EFE7' }}>
          <Box
            component="img"
            src={image}
            alt={product.name}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {product.rrp && Number(product.rrp) > Number(price) && (
            <Box
              sx={{
                position: 'absolute', top: 10, left: 10,
                backgroundColor: '#3D2B3D', color: '#F4EFE7',
                px: 1, py: 0.4, borderRadius: 0.5,
              }}
            >
              <Typography variant="overline" sx={{ color: 'inherit', fontSize: '0.625rem' }}>
                Save {Math.round((1 - Number(price) / Number(product.rrp)) * 100)}%
              </Typography>
            </Box>
          )}
          {outOfStock && (
            <Box
              sx={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(253,252,250,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.primary' }}>
                Sold out
              </Typography>
            </Box>
          )}
        </Box>
      </Link>

      <Box sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: { xs: '0.9375rem', md: '1.0625rem' },
            fontWeight: 500,
            color: 'text.primary',
            mb: 0.25,
          }}
          noWrap
        >
          {product.name}
        </Typography>

        {notes && (
          <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontSize: '0.75rem' }}>
            {notes}
          </Typography>
        )}

        {product.rating && product.rating.count > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <Rating value={product.rating.average} size="small" readOnly sx={{ fontSize: '0.875rem' }} />
            <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
              {product.rating.count}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {gbp(price)}
            </Typography>
            {product.rrp && Number(product.rrp) > Number(price) && (
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                {gbp(product.rrp)}
              </Typography>
            )}
          </Box>

          {lowStock && (
            <Typography variant="caption" sx={{ color: 'tertiary.main', fontWeight: 600, display: 'block', mb: 1 }}>
              Only {stock} left
            </Typography>
          )}

          <Button
            className="quick-add"
            onClick={handleQuickAdd}
            disabled={outOfStock}
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<AddIcon sx={{ fontSize: '1rem !important' }} />}
            sx={{
              opacity: { xs: 1, md: 0 },
              transform: { md: 'translateY(4px)' },
              transition: 'opacity 220ms ease-out, transform 220ms ease-out',
            }}
          >
            {outOfStock ? 'Sold out' : 'Quick add'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default HomeProductCard;
