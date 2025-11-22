import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useCart } from '../../components/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0].id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setMessage('Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setMessage('Please select a variant');
      return;
    }

    const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
    if (!selectedVariantData) {
      setMessage('Selected variant not found');
      return;
    }

    setAddingToCart(true);
    try {
      addToCart(product, selectedVariantData, quantity);
      setMessage('Added to cart successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage('Error adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const selectedVariantData = product?.variants?.find(v => v.id === selectedVariant);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Product not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="div"
              sx={{
                height: 400,
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Product Image
              </Typography>
            </CardMedia>
          </Card>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {product.name}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.description}
            </Typography>

            {/* Scent Profile */}
            {product.scent_profile && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Scent Profile
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(product.scent_profile).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${value}`} variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Variant</InputLabel>
                  <Select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    label="Variant"
                  >
                    {product.variants.map((variant) => (
                      <MenuItem key={variant.id} value={variant.id}>
                        {variant.name} - £{variant.price}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedVariantData && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" color="primary">
                      £{selectedVariantData.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedVariantData.inventory_quantity} in stock
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Quantity and Add to Cart */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <FormControl sx={{ minWidth: 80 }}>
                <InputLabel id="quantity-label">Qty</InputLabel>
                <Select
                  labelId="quantity-label"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  label="Qty"
                  aria-describedby="quantity-helper"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="large"
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedVariantData || selectedVariantData.inventory_quantity < quantity}
                sx={{ flexGrow: 1 }}
                aria-label={`Add ${quantity} ${selectedVariantData?.name || 'item'} to cart`}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </Box>

            {/* Variant Details */}
            {selectedVariantData && selectedVariantData.attributes && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(selectedVariantData.attributes).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${value}`} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}