import React, { useState } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardMedia, CardContent,
  Button, IconButton, Snackbar, Alert, CircularProgress
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Link from 'next/link';
import { useCart } from '../components/CartContext';
import { useWishlist } from '../components/WishlistContext';

export default function WishlistPage() {
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlist();
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [loadingProductId, setLoadingProductId] = useState(null);

  const handleAddToCart = async (product) => {
    setLoadingProductId(product.id);
    try {
      if (product.variants && product.variants.length > 0) {
        addToCart(
          { id: product.id, name: product.name, image: product.images?.[0] || null },
          product.variants[0],
          1
        );
      }
      setSnackbar({ open: true, message: `${product.name} added to cart` });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoadingProductId(null);
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <Box sx={{ backgroundColor: '#FAF8F3', minHeight: '100vh', pt: 4, pb: 8 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <FavoriteBorderIcon sx={{ fontSize: 80, color: '#C8B6DB', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Playfair Display", serif', color: '#3E2351' }}>
              Your wishlist is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Save items you love by clicking the heart icon on any product.
            </Typography>
            <Button
              variant="contained" size="large"
              component={Link} href="/products"
              sx={{ backgroundColor: '#C8B6DB', '&:hover': { backgroundColor: '#b8a6cb' }, borderRadius: 3, px: 4, py: 1.5 }}
            >
              Browse Products
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#FAF8F3', minHeight: '100vh', pt: 2, pb: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{
            fontFamily: '"Playfair Display", serif', fontWeight: 400,
            fontSize: { xs: '1.75rem', md: '2.25rem' }, color: '#3E2351'
          }}>
            My Wishlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {wishlistItems.map((product) => {
            const variant = product.variants?.[0];
            const price = variant?.price || product.base_price;

            return (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <Card sx={{
                  borderRadius: 2, border: '1px solid rgba(200,182,219,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                  height: '100%', display: 'flex', flexDirection: 'column'
                }}>
                  {/* Image */}
                  <Box sx={{ position: 'relative' }}>
                    <Link href={`/product/${product.id}`} passHref legacyBehavior>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 200, backgroundColor: '#f5f0eb', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {product.name}
                          </Typography>
                        )}
                      </CardMedia>
                    </Link>

                    {/* Remove button */}
                    <IconButton
                      size="small"
                      onClick={() => removeFromWishlist(product.id)}
                      sx={{
                        position: 'absolute', top: 8, right: 8,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'white', color: '#E6C88A' },
                        boxShadow: 1
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                    <Link href={`/product/${product.id}`} passHref legacyBehavior
                      style={{ textDecoration: 'none' }}>
                      <Typography variant="body2" fontWeight={600} noWrap
                        sx={{ color: '#3E2351', cursor: 'pointer', '&:hover': { color: '#C8B6DB' } }}>
                        {product.name}
                      </Typography>
                    </Link>

                    {variant && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                        {variant.name}
                      </Typography>
                    )}

                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#E6C88A', fontWeight: 700 }}>
                        {price ? `£${parseFloat(price).toFixed(2)}` : 'Price TBC'}
                      </Typography>

                      <Button
                        size="small" variant="contained"
                        onClick={() => handleAddToCart(product)}
                        disabled={loadingProductId === product.id}
                        startIcon={loadingProductId === product.id
                          ? <CircularProgress size={12} sx={{ color: 'white' }} />
                          : <ShoppingCartIcon sx={{ fontSize: '14px !important' }} />
                        }
                        sx={{
                          backgroundColor: '#3E2351', '&:hover': { backgroundColor: '#4A235A' },
                          fontSize: '0.7rem', py: 0.5, borderRadius: 2
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            component={Link} href="/products"
            sx={{ borderColor: '#C8B6DB', color: '#3E2351', borderRadius: 3, px: 4 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled"
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
