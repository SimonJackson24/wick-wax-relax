import React, { useState } from 'react';
import {
  Container, Box, Typography, Grid, Button, Divider,
  TextField, Alert, CircularProgress, IconButton, Chip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../components/CartContext';
import { useWishlist } from '../components/WishlistContext';
import { getDeliveryDate, getShippingCost } from '../utils/shipping';

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems, removeFromCart, updateQuantity, clearCart,
    getCartTotal, getDiscountAmount, promoCode, promoError,
    applyPromoCode, removePromoCode, savedForLater,
    saveForLater, moveToCart, removeSavedForLater
  } = useCart();
  const { addToWishlist } = useWishlist();
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const total = subtotal - discount;
  const shippingCost = getShippingCost(total);
  const finalTotal = total + shippingCost;

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

  const handleRemove = async (item) => {
    setRemovingId(item.id);
    removeFromCart(item.id);
    setRemovingId(null);
  };

  const handleSaveForLater = async (item) => {
    saveForLater(item);
    try {
      await addToWishlist(item.productId);
    } catch (e) {
      // guest — wishlist API returns 401, silently ignore
    }
  };

  if (cartItems.length === 0 && savedForLater.length === 0) {
    return (
      <Box sx={{ backgroundColor: '#FAF8F3', minHeight: '100vh', pt: 4, pb: 8 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ShoppingBagIcon sx={{ fontSize: 80, color: '#C8B6DB', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Playfair Display", serif', color: '#3E2351' }}>
              Your cart is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Looks like you have not added anything to your cart yet.
            </Typography>
            <Button
              variant="contained" size="large"
              component={Link} href="/products"
              sx={{ backgroundColor: '#C8B6DB', '&:hover': { backgroundColor: '#b8a6cb' }, borderRadius: 3, px: 4, py: 1.5 }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#FAF8F3', minHeight: '100vh', pt: 2, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{
            fontFamily: '"Playfair Display", serif', fontWeight: 400,
            fontSize: { xs: '1.75rem', md: '2.25rem' }, color: '#3E2351'
          }}>
            Shopping Cart
          </Typography>
          {cartItems.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} items
            </Typography>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Left — Cart Items + Saved for Later */}
          <Grid item xs={12} md={7}>
            {/* Cart Items */}
            {cartItems.map((item) => (
              <Box key={item.id} sx={{
                display: 'flex', gap: 2, mb: 2, p: 2, backgroundColor: 'white',
                borderRadius: 2, border: '1px solid rgba(200,182,219,0.3)',
                position: 'relative'
              }}>
                {/* Product Image */}
                <Box sx={{
                  width: 96, height: 96, flexShrink: 0, borderRadius: 1.5,
                  backgroundColor: '#f5f0eb', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                  <Typography variant="body1" fontWeight={600} noWrap sx={{ color: '#3E2351', mb: 0.25 }}>
                    {item.productName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.variantName}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#E6C88A', fontWeight: 600 }}>
                    £{item.price.toFixed(2)}
                  </Typography>

                  {/* Quantity */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                    <Button
                      size="small" variant="outlined"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      sx={{ minWidth: 32, height: 32, p: 0, borderColor: '#C8B6DB', color: '#3E2351' }}
                    >-</Button>
                    <Typography sx={{ minWidth: 28, textAlign: 'center' }}>{item.quantity}</Typography>
                    <Button
                      size="small" variant="outlined"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      sx={{ minWidth: 32, height: 32, p: 0, borderColor: '#C8B6DB', color: '#3E2351' }}
                    >+</Button>
                  </Box>
                </Box>

                {/* Actions + Subtotal */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <IconButton size="small" onClick={() => handleRemove(item)} disabled={removingId === item.id}
                    sx={{ color: '#C8B6DB' }}>
                    {removingId === item.id ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
                  </IconButton>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: '#3E2351' }}>
                      £{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                    <IconButton size="small" onClick={() => handleSaveForLater(item)}
                      sx={{ color: '#B2C8BA', mt: 0.5 }} title="Save for later">
                      <BookmarkBorderIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}

            {cartItems.length > 0 && (
              <Box sx={{ mt: 1, mb: 3 }}>
                <Button size="small" color="error" variant="text" onClick={clearCart}
                  startIcon={<DeleteOutlineIcon />}>
                  Clear Cart
                </Button>
              </Box>
            )}

            {/* Saved for Later */}
            {savedForLater.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }}>
                  <Chip label="Saved for Later" icon={<BookmarkBorderIcon />}
                    sx={{ backgroundColor: '#B2C8BA', color: 'white', fontWeight: 600 }} />
                </Divider>
                {savedForLater.map((item) => (
                  <Box key={item.id} sx={{
                    display: 'flex', gap: 2, mb: 2, p: 2, backgroundColor: 'white',
                    borderRadius: 2, border: '1px solid rgba(178,200,186,0.4)'
                  }}>
                    <Box sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1,
                      backgroundColor: '#f5f0eb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.productName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#3E2351' }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.variantName} - £{item.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                      <Button size="small" variant="contained"
                        onClick={() => moveToCart(item)}
                        sx={{ backgroundColor: '#C8B6DB', '&:hover': { backgroundColor: '#b8a6cb' }, fontSize: '0.75rem' }}>
                        Move to Cart
                      </Button>
                      <IconButton size="small" onClick={() => removeSavedForLater(item.id)}
                        sx={{ color: '#C8B6DB' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          {/* Right — Order Summary */}
          <Grid item xs={12} md={5}>
            <Box sx={{
              backgroundColor: 'white', borderRadius: 2, p: 3,
              border: '1px solid rgba(200,182,219,0.3)', position: 'sticky', top: 80
            }}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', mb: 2, color: '#3E2351' }}>
                Order Summary
              </Typography>

              {/* Promo Code */}
              {promoCode ? (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${promoCode.code} — ${promoCode.discount_type === 'percentage' ? promoCode.discount_value + '%' : '£' + promoCode.discount_value + ' off'} applied`}
                    onDelete={removePromoCode}
                    sx={{ width: '100%', justifyContent: 'flex-start', backgroundColor: '#B2C8BA', color: 'white', '& .MuiChip-deleteIcon': { color: 'white' } }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    disabled={promoLoading}
                    sx={{ flex: 1 }}
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
              {promoError && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '0.8rem' }}>{promoError}</Alert>}
              {promoSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '0.8rem' }}>{promoSuccess}</Alert>}

              <Divider sx={{ mb: 2 }} />

              {/* Totals */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">£{subtotal.toFixed(2)}</Typography>
                </Box>
                {discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="success.main">Discount</Typography>
                    <Typography variant="body2" color="success.main">-£{discount.toFixed(2)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Shipping</Typography>
                  <Typography variant="body2">
                    {shippingCost === 0 ? (
                      <Chip label="Free" size="small" sx={{ backgroundColor: '#B2C8BA', color: 'white', height: 20, fontSize: '0.7rem' }} />
                    ) : `£${shippingCost.toFixed(2)}`}
                  </Typography>
                </Box>
                {shippingCost > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                    Est. delivery: {getDeliveryDate()}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#3E2351' }}>Total</Typography>
                <Typography variant="h6" sx={{ color: '#E6C88A', fontWeight: 700 }}>£{finalTotal.toFixed(2)}</Typography>
              </Box>

              <Button
                fullWidth variant="contained" size="large"
                onClick={() => router.push('/checkout')}
                sx={{
                  backgroundColor: '#3E2351', '&:hover': { backgroundColor: '#4A235A' },
                  borderRadius: 3, py: 1.5, fontWeight: 600, fontSize: '1rem'
                }}
              >
                Proceed to Checkout
              </Button>

              <Button
                fullWidth variant="outlined" size="small"
                component={Link} href="/products"
                sx={{ mt: 1, borderColor: '#C8B6DB', color: '#3E2351', borderRadius: 3 }}
              >
                Continue Shopping
              </Button>

              {/* Trust Signals */}
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: <LocalShippingIcon sx={{ fontSize: 18 }} />, text: 'Free delivery on orders over £35' },
                  { icon: <AutorenewIcon sx={{ fontSize: 18 }} />, text: '30-day hassle-free returns' },
                  { icon: <SecurityIcon sx={{ fontSize: 18 }} />, text: 'Secure checkout guaranteed' },
                ].map(({ icon, text }) => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: '#B2C8BA' }}>{icon}</Box>
                    <Typography variant="caption" color="text.secondary">{text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
