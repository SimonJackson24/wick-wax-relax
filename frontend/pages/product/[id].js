import { useState, useEffect, useCallback } from 'react';
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
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { motion } from 'framer-motion';
import axios from 'axios';
import SEOHead from '../../components/SEOHead';
import NavigationWithCategories from '../../components/NavigationWithCategories';
import ProductCard from '../../components/ProductCard';
import ProductGallery from '../../components/ProductGallery';
import FrequentlyBoughtTogether from '../../components/FrequentlyBoughtTogether';
import TrustBadges from '../../components/TrustBadges';
import StarRating from '../../components/StarRating';
import ReviewList from '../../components/ReviewList';
import ReviewForm from '../../components/ReviewForm';
import { useCart } from '../../components/CartContext';
import { useWishlist } from '../../components/WishlistContext';
import { useAuth } from '../../components/AuthContext';
import { useSubscription } from '../../components/SubscriptionContext';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToSubscription } = useSubscription();
  const theme = useTheme();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToSubscription, setAddingToSubscription] = useState(false);
  const [subMessage, setSubMessage] = useState('');
  const [message, setMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState('details');
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchRelatedProducts();
      fetchNewProducts();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      // Try UUID-based lookup first (existing format)
      let response = await axios.get(`/api/products/${id}`).catch(() => null);
      
      // Fall back to slug-based lookup (new SEO-friendly URLs)
      if (!response || !response.data || !response.data.id) {
        response = await axios.get(`/api/products/slug/${id}`).catch(() => null);
      }
      
      if (!response || !response.data || !response.data.id) {
        setMessage('Product not found');
        return;
      }
      
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

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const response = await axios.get(`/api/products/${id}/reviews?limit=10`);
      setReviews(response.data.reviews || []);
      setReviewStats({ average: response.data.averageRating || 0, count: response.data.reviewCount || 0 });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const handleReviewsToggle = () => {
    const newOpen = !reviewsOpen;
    setReviewsOpen(newOpen);
    if (newOpen && reviews.length === 0) fetchReviews();
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

  const handleAddToSubscription = async () => {
    if (!selectedVariant) { setSubMessage('Please select a variant'); return; }
    const sv = product.variants.find(v => v.id === selectedVariant);
    if (!sv) { setSubMessage('Variant not found'); return; }
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    setAddingToSubscription(true);
    try {
      addToSubscription(product, sv, quantity);
      setSubMessage('Added to subscription!');
      setTimeout(() => setSubMessage(''), 3000);
    } catch (e) {
      setSubMessage('Error adding to subscription');
    } finally {
      setAddingToSubscription(false);
    }
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
      <NavigationWithCategories />
      <SEOHead
        title={product ? `${product.name} — Wick Wax Relax` : 'Product — Wick Wax Relax'}
        description={product?.description || 'Hand-crafted premium home fragrance products from Wick Wax Relax.'}
        keywords={product ? `wax melts, candles, ${product.name}, home fragrance, UK` : 'wax melts, candles, home fragrance'}
        image={product?.image ? `https://wickwaxrelax.com${product.image}` : 'https://wickwaxrelax.com/images/hero-image.svg'}
        url={`https://wickwaxrelax.com/product/${product?.slug || id}`}
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

        {(message || subMessage) && (
          <Alert severity={(message || subMessage).includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message || subMessage}
          </Alert>
        )}

        {/* === FULL-WIDTH PRODUCT GALLERY === */}
        <Box sx={{ width: '100%', mb: 5 }}>
          <ProductGallery
            images={product.images || []}
            productName={product.name}
          />
        </Box>

        {/* === PRODUCT INFO — single column, centered === */}
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 400,
            fontSize: { xs: '1.875rem', md: '2.5rem' },
            lineHeight: 1.2,
            mb: 2
          }}>
            {product.name}
          </Typography>

          {/* Star rating inline near product name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <StarRating value={reviewStats.average} reviewCount={reviewStats.count} size="medium" />
            {reviewStats.count > 0 && (
              <Typography variant="body2" color="text.secondary">
                {reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'}
              </Typography>
            )}
          </Box>

          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.9, fontSize: '1.05rem' }}>
            {product.description}
          </Typography>

          {/* Scent profile chips — below description */}
          {product.scent_profile && (
            <Box sx={{ mb: 4 }}>
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
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Variant selector + price + stock */}
          {product.variants && product.variants.length > 0 && (
            <Box sx={{ mb: 4 }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 600, fontSize: '1.75rem' }}>
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

          {/* CTA buttons — full-width Add to Cart, Subscribe alongside */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <FormControl sx={{ minWidth: 90 }}>
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
                fullWidth
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedVariantData || selectedVariantData.inventory_quantity < quantity}
                sx={{
                  py: 1.75,
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

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAddToSubscription}
                disabled={addingToSubscription || !selectedVariantData || selectedVariantData.inventory_quantity < quantity}
                sx={{
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                  '&:hover': { backgroundColor: theme.palette.secondary.dark },
                  '&:disabled': { backgroundColor: theme.palette.grey[300], color: theme.palette.grey[600] }
                }}
                aria-label={`Add ${quantity} ${selectedVariantData?.name || 'item'} to subscription`}
              >
                {addingToSubscription ? '...' : 'Subscribe & Save — Set & Save'}
              </Button>
            </Box>
          </Box>

          {/* Accordions — below the purchase decision */}
          <Box sx={{ mb: 4 }}>
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
        </Box>

        {/* FULL-WIDTH TRUST BADGES — between product info and reviews */}
        <Box sx={{ py: 4, my: 5, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TrustBadges />
        </Box>

        <Box sx={{ mt: 6, mb: 6 }}>
          <Divider sx={{ mb: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h2" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, fontSize: { xs: '1.5rem', md: '1.75rem' } }}>
                Customer Reviews
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <StarRating value={reviewStats.average} reviewCount={reviewStats.count} size="medium" />
                {reviewStats.count === 0 && (
                  <Typography variant="body2" color="text.secondary">No reviews yet</Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RateReviewIcon />}
              onClick={() => setReviewFormOpen(!reviewFormOpen)}
              sx={{ borderRadius: 3 }}
            >
              {reviewFormOpen ? 'Cancel' : 'Write a Review'}
            </Button>
          </Box>

          <Collapse in={reviewFormOpen}>
            <Box sx={{ mb: 4 }}>
              <ReviewForm productId={id} onReviewSubmitted={() => { setReviewFormOpen(false); fetchReviews(); }} />
            </Box>
          </Collapse>

          <Button
            variant="text"
            onClick={handleReviewsToggle}
            endIcon={<ExpandMoreIcon sx={{ transform: reviewsOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
            sx={{ mb: 2, color: 'text.secondary' }}
          >
            {reviewsOpen ? 'Hide reviews' : `Show reviews${reviewStats.count > 0 ? ` (${reviewStats.count})` : ''}`}
          </Button>

          <Collapse in={reviewsOpen}>
            <ReviewList reviews={reviews} loading={reviewsLoading} />
          </Collapse>
        </Box>

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
                      onProductClick={(productId) => router.push(`/product/${productId}`)}
                      onAddToCart={(pid, vid) => console.log(`Quick add: ${pid} / ${vid}`)}
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
                    onProductClick={(productId) => router.push(`/product/${productId}`)}
                    onAddToCart={(pid, vid) => console.log(`Quick add: ${pid} / ${vid}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {product && <FrequentlyBoughtTogether productId={id} />}
      </Container>

    </>
  );
};