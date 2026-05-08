import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { motion } from 'framer-motion';
import axios from 'axios';
import SEOHead from '../../components/SEOHead';
import ProductCard from '../../components/ProductCard';
import TrustBadges from '../../components/TrustBadges';
import { useCart } from '../../components/CartContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const theme = useTheme();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState('details');

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchRelatedProducts();
      fetchNewProducts();
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

  const fetchRelatedProducts = async () => {
    setRelatedLoading(true);
    try {
      const response = await axios.get(`/api/products/related/${id}`);
      setRelatedProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const fetchNewProducts = async () => {
    try {
      const response = await axios.get('/api/products/new');
      const newArrivals = (response.data || []).filter(p => p.id !== id);
      setNewProducts(newArrivals.slice(0, 4));
    } catch (error) {
      console.error('Error fetching new products:', error);
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

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  const handleAddToCartInline = (productId, variantId) => {
    console.log(`Quick add: ${productId} / ${variantId}`);
  };

  const selectedVariantData = product?.variants?.find(v => v.id === selectedVariant);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
        <Typography sx={{ mt: 2 }}>Loading product...</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Product not found.</Alert>
      </Container>
    );
  }

  return (
    <>
      <SEOHead
        title={product ? `${product.name} — Wick Wax Relax` : 'Product — Wick Wax Relax'}
        description={product?.description || 'Hand-crafted premium home fragrance products from Wick Wax Relax.'}
        keywords={product ? `wax melts, candles, ${product.name}, home fragrance, UK` : 'wax melts, candles, home fragrance'}
        image={product?.image ? `https://wickwaxrelax.com${product.image}` : 'https://wickwaxrelax.com/images/hero-image.svg'}
        url={`https://wickwaxrelax.com/product/${id}`}
        type="product"
        product={product ? {
          name: product.name,
          description: product.description,
          image: product.image ? `https://wickwaxrelax.com${product.image}` : 'https://wickwaxrelax.com/images/hero-image.svg',
          price: selectedVariantData?.price || product.price,
          availability: selectedVariantData?.inventory_quantity > 0 ? 'in_stock' : 'out_of_stock',
          category: product.category
        } : undefined}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            <Link href="/" passHref legacyBehavior>
              <Typography
                component="a"
                sx={{ color: theme.palette.text.secondary, textDecoration: 'none', '&:hover': { color: theme.palette.primary.main } }}
              >
                Home
              </Typography>
            </Link>
            <Link href="/products" passHref legacyBehavior>
              <Typography
                component="a"
                sx={{ color: theme.palette.text.secondary, textDecoration: 'none', '&:hover': { color: theme.palette.primary.main } }}
              >
                Products
              </Typography>
            </Link>
            <Typography color="text.primary" aria-current="page">
              {product.name}
            </Typography>
          </Breadcrumbs>
        </Box>

        {message && (
          <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <CardMedia
                component="div"
                sx={{
                  height: 500,
                  backgroundColor: '#f5f0eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2
                }}
              >
                <Typography variant="h5" color="text.secondary" textAlign="center" sx={{ p: 4 }}>
                  {product.name}<br />
                  <Typography variant="body2" color="text.disabled">Product Image</Typography>
                </Typography>
              </CardMedia>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
                fontSize: { xs: '1.75rem', md: '2.25rem' }
              }}>
                {product.name}
              </Typography>

              {product.scent_profile && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(product.scent_profile).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.8 }}>
                {product.description}
              </Typography>

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
                          {variant.name} — £{variant.price}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedVariantData && (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                        £{selectedVariantData.price}
                      </Typography>
                      <Typography variant="body2" color={selectedVariantData.inventory_quantity <= 5 ? 'warning.main' : 'text.secondary'}>
                        {selectedVariantData.inventory_quantity > 0
                          ? `${selectedVariantData.inventory_quantity} in stock`
                          : 'Out of stock'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
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
                      <MenuItem key={num} value={num}>{num}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={addingToCart || !selectedVariantData || selectedVariantData.inventory_quantity < quantity}
                  sx={{
                    flexGrow: 1,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': { backgroundColor: theme.palette.primary.dark },
                    '&:disabled': { backgroundColor: theme.palette.grey[300] }
                  }}
                  aria-label={`Add ${quantity} ${selectedVariantData?.name || 'item'} to cart`}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Accordion
                expanded={expandedAccordion === 'details'}
                onChange={() => setExpandedAccordion(expandedAccordion === 'details' ? false : 'details')}
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px !important', '&:before': { display: 'none' }, mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Product Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedVariantData && selectedVariantData.attributes ? (
                    <Box component="dl" sx={{ m: 0 }}>
                      {Object.entries(selectedVariantData.attributes).map(([key, value]) => (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
                          <Typography component="dt" variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{key}</Typography>
                          <Typography component="dd" variant="body2" sx={{ textAlign: 'right', maxWidth: '60%' }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No additional details available.</Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px !important', '&:before': { display: 'none' }, mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>How to Use</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    Place one wax melt cube in your wax warmer. Allow the fragrance to fill the room. Replace when scent fades, typically after 8-12 hours of use. Keep away from direct sunlight and heat sources.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion
                elevation={0}
                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Candle Care Guide</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    For candle products: trim the wick to 5mm before each burn. Allow the wax to melt pool to the edges on first burn (2-3 hours) to prevent tunnelling. Never burn for more than 4 hours. Keep away from draughts. Discontinue use when 10mm of wax remains.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Grid>
        </Grid>

        <TrustBadges />

        {(relatedProducts.length > 0 || relatedLoading) && (
          <Box sx={{ mt: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400
              }}>
                You May Also Like
              </Typography>
              <Typography variant="body1" color="text.secondary">
                More products from our collection
              </Typography>
            </Box>

            {relatedLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {relatedProducts.map((product, index) => (
                  <Grid
                    item
                    xs={6}
                    sm={4}
                    md={3}
                    key={product.id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                  >
                    <ProductCard
                      product={product}
                      variant="featured"
                      showQuickAdd={true}
                      onProductClick={handleProductClick}
                      onAddToCart={handleAddToCartInline}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {newProducts.length > 0 && (
          <Box sx={{ mt: 8, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
              <Box>
                <Typography variant="h4" component="h2" gutterBottom sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 400
                }}>
                  New Arrivals
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Just landed in the collection
                </Typography>
              </Box>
              <Button
                variant="outlined"
                href="/products"
                sx={{
                  borderRadius: 50,
                  px: 3,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': { borderColor: theme.palette.primary.dark, backgroundColor: 'transparent' }
                }}
              >
                View All
              </Button>
            </Box>

            <Grid container spacing={3}>
              {newProducts.map((product, index) => (
                <Grid
                  item
                  xs={6}
                  sm={4}
                  md={3}
                  key={product.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  <ProductCard
                    product={product}
                    variant="featured"
                    showQuickAdd={true}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCartInline}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
}