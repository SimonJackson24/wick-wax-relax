import React, { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Button, Divider,
  TextField, Alert, Grid, Chip, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
import { useRouter } from 'next/router';

const CartDrawer = ({ open, onClose }) => {
  const router = useRouter();
  const {
    cartItems, removeFromCart, updateQuantity, getCartTotal, getDiscountAmount,
    promoCode, promoError, applyPromoCode, removePromoCode,
    savedForLater, saveForLater, moveToCart
  } = useCart();
  const { addToWishlist } = useWishlist();
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const total = subtotal - discount;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoSuccess('');
    const result = await applyPromoCode(promoInput.trim());
    if (result.success) {
      setPromoSuccess(result.message);
      setPromoInput('');
    }
    setPromoLoading(false);
  };

  const handleSaveForLater = async (item) => {
    saveForLater(item);
    try {
      await addToWishlist(item.productId);
    } catch (e) {
      // guest user — wishlist API returns 401, silently ignore
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          backgroundColor: '#FAF8F3',
          borderLeft: '1px solid rgba(200, 182, 219, 0.3)',
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        p: 2, borderBottom: '1px solid rgba(200, 182, 219, 0.3)',
        background: 'linear-gradient(135deg, #3E2351 0%, #4A235A 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingBagIcon sx={{ color: '#E6C88A' }} />
          <Typography variant="h6" sx={{ color: '#E6C88A', fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>
            Your Cart
          </Typography>
          {cartItems.length > 0 && (
            <Chip label={cartItems.reduce((s, i) => s + i.quantity, 0)} size="small"
              sx={{ backgroundColor: '#E6C88A', color: '#3E2351', fontWeight: 700 }} />
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#E6C88A' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {cartItems.length === 0 && savedForLater.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingBagIcon sx={{ fontSize: 64, color: '#C8B6DB', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: '#3E2351' }}>Your cart is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add some lovely wax melts to get started
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/products"
              onClick={onClose}
              sx={{ backgroundColor: '#C8B6DB', '&:hover': { backgroundColor: '#b8a6cb' }, borderRadius: 3 }}
            >
              Browse Products
            </Button>
          </Box>
        ) : (
          <>
            {/* Cart Items */}
            {cartItems.map((item) => (
              <Box key={item.id} sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 2, border: '1px solid rgba(200,182,219,0.3)' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Thumbnail */}
                  <Box sx={{
                    width: 72, height: 72, flexShrink: 0, borderRadius: 1,
                    backgroundColor: '#f5f0eb', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No Image</Typography>
                    )}
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap
                      sx={{ color: '#3E2351', fontSize: '0.875rem' }}>
                      {item.productName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.variantName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E6C88A', fontWeight: 600, mt: 0.5 }}>
                      £{item.price.toFixed(2)}
                    </Typography>

                    {/* Qty controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Button
                        size="small" variant="outlined"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        sx={{ minWidth: 28, height: 28, p: 0, borderColor: '#C8B6DB', color: '#3E2351' }}
                      >-</Button>
                      <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <Button
                        size="small" variant="outlined"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        sx={{ minWidth: 28, height: 28, p: 0, borderColor: '#C8B6DB', color: '#3E2351' }}
                      >+</Button>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => removeFromCart(item.id)}
                      sx={{ color: '#C8B6DB' }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleSaveForLater(item)}
                      sx={{ color: '#B2C8BA' }}>
                      <BookmarkBorderIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}

            {/* Saved for Later */}
            {savedForLater.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }}>
                  <Chip label="Saved for Later" size="small"
                    sx={{ backgroundColor: '#B2C8BA', color: 'white', fontWeight: 600 }} />
                </Divider>
                {savedForLater.map((item) => (
                  <Box key={item.id} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'white', borderRadius: 1.5,
                    border: '1px solid rgba(178, 200, 186, 0.4)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 1,
                      backgroundColor: '#f5f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.productName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.variantName} - £{item.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined"
                      onClick={() => moveToCart(item)}
                      sx={{ borderColor: '#C8B6DB', color: '#3E2351', fontSize: '0.7rem', py: 0.5, px: 1 }}>
                      Move
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Footer — Order Summary */}
      {cartItems.length > 0 && (
        <Box sx={{ p: 2, borderTop: '2px solid rgba(200, 182, 219, 0.3)', backgroundColor: 'white' }}>
          {/* Promo Code */}
          <Box sx={{ mb: 2 }}>
            {promoCode ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${promoCode.code} (${promoCode.discount_type === 'percentage' ? promoCode.discount_value + '%' : '£' + promoCode.discount_value + ' off'})`}
                  onDelete={removePromoCode}
                  sx={{ backgroundColor: '#B2C8BA', color: 'white', flex: 1 }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  sx={{ flex: 1 }}
                  disabled={promoLoading}
                />
                <Button
                  size="small" variant="outlined"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  sx={{ borderColor: '#C8B6DB', color: '#3E2351', whiteSpace: 'nowrap' }}
                >
                  {promoLoading ? <CircularProgress size={16} /> : 'Apply'}
                </Button>
              </Box>
            )}
            {promoError && <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>{promoError}</Alert>}
            {promoSuccess && <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>{promoSuccess}</Alert>}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {/* Totals */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">£{subtotal.toFixed(2)}</Typography>
            </Box>
            {discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="success.main">Discount</Typography>
                <Typography variant="body2" color="success.main">-£{discount.toFixed(2)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#3E2351' }}>Total</Typography>
              <Typography variant="h6" sx={{ color: '#E6C88A', fontWeight: 700 }}>£{total.toFixed(2)}</Typography>
            </Box>
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth variant="contained" size="large"
              component={Link} href="/cart"
              onClick={onClose}
              sx={{
                backgroundColor: '#3E2351', '&:hover': { backgroundColor: '#4A235A' },
                borderRadius: 3, py: 1.5, fontWeight: 600
              }}
            >
              View Cart & Checkout
            </Button>
            <Button
              fullWidth variant="outlined" size="small"
              component={Link} href="/products"
              onClick={onClose}
              sx={{ borderColor: '#C8B6DB', color: '#3E2351', borderRadius: 3 }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default CartDrawer;
