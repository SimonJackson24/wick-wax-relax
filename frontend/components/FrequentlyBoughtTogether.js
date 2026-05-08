import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, Button,
  IconButton, CircularProgress, Chip, Snackbar, Alert
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';
import axios from 'axios';
import { useCart } from './CartContext';

const FrequentlyBoughtTogether = ({ productId }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!productId) return;
    const fetchFbt = async () => {
      try {
        const response = await axios.get(`/api/products/${productId}/fbt`);
        setProducts(response.data || []);
      } catch (error) {
        console.error('Error fetching FBT products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFbt();
  }, [productId]);

  const handleAddAllToCart = async () => {
    if (products.length === 0) return;
    setAddingToCart(true);
    try {
      for (const product of products) {
        if (product.variants && product.variants.length > 0) {
          addToCart(
            { id: product.id, name: product.name, image: product.images?.[0] || null },
            product.variants[0],
            1
          );
        }
      }
      setSnackbar({ open: true, message: `${products.length} items added to cart!`, severity: 'success' });
    } catch (error) {
      console.error('Error adding FBT items to cart:', error);
      setSnackbar({ open: true, message: 'Failed to add items to cart', severity: 'error' });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={32} sx={{ color: '#C8B6DB' }} />
      </Box>
    );
  }

  if (products.length === 0) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h2" sx={{
          fontFamily: '"Playfair Display", serif', fontWeight: 400,
          fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#3E2351'
        }}>
          Frequently Bought Together
        </Typography>
        <Button
          variant="contained"
          size="medium"
          startIcon={addingToCart ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ShoppingCartIcon />}
          onClick={handleAddAllToCart}
          disabled={addingToCart}
          sx={{
            backgroundColor: '#E6C88A', color: '#3E2351', fontWeight: 600,
            '&:hover': { backgroundColor: '#d4b87a' }, borderRadius: 3,
          }}
        >
          Add All to Cart
        </Button>
      </Box>

      {/* Horizontal scroll container */}
      <Box sx={{
        display: 'flex', gap: 2, overflowX: 'auto', pb: 2,
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#C8B6DB', borderRadius: 3 },
      }}>
        {products.map((product) => {
          const variant = product.variants?.[0];
          const price = variant?.price || product.base_price;

          return (
            <Card key={product.id} sx={{
              width: 200, flexShrink: 0, borderRadius: 2,
              border: '1px solid rgba(200,182,219,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
            }}>
              <CardMedia
                component="div"
                sx={{
                  height: 160, backgroundColor: '#f5f0eb',
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
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" fontWeight={600} noWrap
                  sx={{ fontSize: '0.8rem', color: '#3E2351', mb: 0.5 }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#E6C88A', fontWeight: 700, mb: 1 }}>
                  £{parseFloat(price).toFixed(2)}
                </Typography>
                <Button
                  fullWidth size="small" variant="outlined"
                  onClick={() => {
                    if (variant) {
                      addToCart(
                        { id: product.id, name: product.name, image: product.images?.[0] || null },
                        variant, 1
                      );
                      setSnackbar({ open: true, message: `${product.name} added to cart`, severity: 'success' });
                    }
                  }}
                  startIcon={<ShoppingCartIcon sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    borderColor: '#C8B6DB', color: '#3E2351', fontSize: '0.7rem',
                    py: 0.5, '&:hover': { borderColor: '#C8B6DB', backgroundColor: 'rgba(200,182,219,0.08)' }
                  }}
                >
                  Add
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FrequentlyBoughtTogether;
