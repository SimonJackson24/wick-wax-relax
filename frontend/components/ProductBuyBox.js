import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axios from 'axios';

// The bespoke buy box — Amazon's information architecture (price framing,
// per-unit, stock urgency, variant picker, quantity, primary CTA) wearing
// Wick Wax & Relax's skin: soft lavender wash, serif price, brand-purple
// CTA, warm amber urgency. Deliberately NOT Amazon's grey-outlined box.

const gbp = (value) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const ProductBuyBox = ({
  product,
  variants = [],
  selectedVariantId,
  onVariantChange,
  quantity,
  onQuantityChange,
  onAddToCart,
  addingToCart,
  message,
  onSubscribe,
  subscribing,
  subscribeDisabled,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const selected = variants.find((v) => v.id === selectedVariantId) || null;
  const price = selected ? Number(selected.price) : Number(product.base_price);
  const rrp = product.rrp ? Number(product.rrp) : null;
  const savePct = rrp && rrp > price ? Math.round((1 - price / rrp) * 100) : null;

  // Stock urgency: the selected variant's inventory (or the total when
  // the product has no variants).
  const stock = selected
    ? (selected.inventory_quantity ?? 0)
    : variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
  const lowStock = stock > 0 && stock <= 5;
  const outOfStock = stock <= 0;

  // Per-unit price: Amazon-style "£9.99 / 100g" line under the price.
  const weight = product.weight_grams ? Number(product.weight_grams) : null;
  const per100g = weight ? (price / weight) * 100 : null;

  // Delivery estimate (Amazon-style promise line). Fetched once from the
  // live shipping rates; recomputed when the price (subtotal) changes
  // because free-over thresholds hinge on it.
  const [delivery, setDelivery] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    axios
      .get(
        `/api/shipping/estimate?country=GB&weightGrams=${weight ?? ''}&subtotal=${price * quantity}`
      )
      .then((res) => { if (!cancelled) setDelivery(res.data && res.data.estimate); })
      .catch(() => { if (!cancelled) setDelivery(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight, price, quantity]);

  // Royal Mail delivers Mon–Sat but not Sun; dispatch cut-off 14:00 on
  // working days. Compute the arrival window the shopper will see.
  const deliveryWindow = React.useMemo(() => {
    if (!delivery || delivery.daysMin == null) return null;
    const CUTOFF_HOUR = 14;
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const afterCutoff = now.getHours() >= CUTOFF_HOUR;
    let extraDay = (isSunday ? 1 : 0) + (afterCutoff ? 1 : 0);

    const addWorkingDays = (start, days) => {
      const d = new Date(start);
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) added++; // skip Sundays only (RM delivers Sat)
      }
      return d;
    };
    const from = addWorkingDays(now, delivery.daysMin + extraDay);
    const to = addWorkingDays(now, delivery.daysMax + extraDay);
    const fmt = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return {
      arrives: from.getTime() === to.getTime() ? fmt(from) : `${fmt(from)} – ${fmt(to)}`,
      cost: delivery.cost,
      methodName: delivery.name,
    };
  }, [delivery]);

  // "Order within Xh Ym" countdown to today's cut-off (or tomorrow's).
  const orderWithin = React.useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(14, 0, 0, 0);
    if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
    const mins = Math.max(0, Math.round((cutoff - now) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { h, m };
  }, []);

  return (
    <>
      <Box
        sx={{
          // Boutique card, not Amazon's grey rail
          bgcolor: 'rgba(200, 182, 219, 0.12)',
          border: `1px solid ${theme.palette.primary.light}`,
          borderRadius: '16px',
          p: { xs: 2.5, md: 3 },
          position: { md: 'sticky' },
          top: { md: 90 },
        }}
      >
        {/* Price block — serif, calm, with RRP framing */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '2rem', lineHeight: 1 }}
          >
            {gbp(price)}
          </Typography>
          {rrp && savePct && (
            <>
              <Typography
                variant="body1"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                {gbp(rrp)}
              </Typography>
              <Chip
                size="small"
                label={`Save ${savePct}%`}
                sx={{
                  bgcolor: 'rgba(156, 39, 176, 0.08)',
                  color: theme.palette.primary.dark,
                  fontWeight: 700,
                }}
              />
            </>
          )}
        </Box>
        {per100g && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            ({gbp(per100g)} per 100g)
          </Typography>
        )}

        {/* Stock urgency — warm amber, only when genuinely low */}
        {outOfStock ? (
          <Typography sx={{ mt: 1.5, fontWeight: 600 }} color="error">
            Out of stock — check back soon
          </Typography>
        ) : lowStock ? (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <LocalFireDepartmentIcon sx={{ fontSize: 18, color: '#ed6c02' }} />
            <Typography variant="body2" sx={{ color: '#ed6c02', fontWeight: 600 }}>
              Only {stock} left — selling fast
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
            In stock
          </Typography>
        )}

        {/* Amazon-style delivery promise: live from the shipping rates */}
        {deliveryWindow && !outOfStock && (
          <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <LocalShippingIcon sx={{ fontSize: 18, color: 'text.secondary', mt: '2px' }} />
            <Box>
              <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                Order within{' '}
                <Box component="span" sx={{ color: 'success.dark', fontWeight: 700 }}>
                  {orderWithin.h}h {orderWithin.m}m
                </Box>{' '}
                for delivery{' '}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {deliveryWindow.arrives}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {deliveryWindow.methodName} · {deliveryWindow.cost === 0 ? 'FREE delivery' : `${gbp(deliveryWindow.cost)} — FREE over £50`}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Variant picker — scent tiles, not a dropdown */}
        {variants.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {product.scent_profile?.primary || 'Option'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {variants.map((v) => {
                const active = v.id === selectedVariantId;
                return (
                  <Button
                    key={v.id}
                    size="small"
                    disabled={(v.inventory_quantity ?? 0) <= 0}
                    onClick={() => onVariantChange(v.id)}
                    variant={active ? 'contained' : 'outlined'}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      borderColor: active ? undefined : theme.palette.primary.light,
                      bgcolor: active ? undefined : 'transparent',
                    }}
                  >
                    {v.name}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Quantity + ATC */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '10px',
            }}
          >
            <IconButton size="small" onClick={() => onQuantityChange(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ width: 32, textAlign: 'center', fontWeight: 600 }}>{quantity}</Typography>
            <IconButton size="small" onClick={() => onQuantityChange(quantity + 1)} aria-label="Increase quantity">
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          <Button
            fullWidth
            variant="contained"
            disabled={outOfStock || addingToCart}
            onClick={onAddToCart}
            startIcon={<ShoppingBasketIcon />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.25,
              fontSize: '1rem',
            }}
          >
            {addingToCart ? 'Adding…' : outOfStock ? 'Sold out' : 'Add to Basket'}
          </Button>
        </Box>

        {message && (
          <Typography variant="body2" sx={{ mt: 1.5, color: theme.palette.success.dark }}>
            {message}
          </Typography>
        )}

        {/* Subscribe & Save — lives INSIDE the sticky card so it scrolls
            with the pricing box. Previously a sibling below the sticky
            element: the box pinned at top:90 while the button scrolled
            away, detaching the two CTAs. */}
        {onSubscribe && (
          <Button
            variant="outlined"
            fullWidth
            onClick={onSubscribe}
            disabled={subscribeDisabled || outOfStock}
            sx={{
              mt: 2,
              py: 1.25,
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '10px',
              textTransform: 'none',
              borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main,
              '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.06)' },
            }}
          >
            {subscribing ? 'Adding…' : 'Subscribe & Save — Set & Save'}
          </Button>
        )}
      </Box>

      {/* Mobile sticky purchase bar — thumb-reach checkout, Amazon-style,
          brand-skinned */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            p: 1.5,
            pb: 2,
            bgcolor: 'background.paper',
            borderTop: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 72 }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.15rem', lineHeight: 1 }}>
              {gbp(price)}
            </Typography>
            {lowStock && !outOfStock && (
              <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 600 }}>
                Only {stock} left
              </Typography>
            )}
          </Box>
          <Button
            fullWidth
            variant="contained"
            disabled={outOfStock || addingToCart}
            onClick={onAddToCart}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1 }}
          >
            {outOfStock ? 'Sold out' : 'Add to Basket'}
          </Button>
        </Box>
      )}
    </>
  );
};

export default ProductBuyBox;
