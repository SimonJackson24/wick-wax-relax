import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import axios from 'axios';

const FeaturedProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/api/products/featured');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`;
  };

  const handleAddToCart = (productId, variantId) => {
    // Add to cart logic
    console.log(`Added to cart: Product ${productId}, Variant ${variantId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <Box
        component={motion.div}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        sx={{ textAlign: 'center', mb: 6 }}
      >
        <Typography
          variant="h3"
          component="h2"
          gutterBottom
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 400,
            color: theme.palette.text.primary
          }}
        >
          Discover Our Bestsellers
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: '600px', mx: 'auto' }}
        >
          Handcrafted with love to transform your space into a sanctuary of relaxation
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid
            item
            key={product.id}
            xs={12}
            sm={6}
            md={4}
            lg={3}
            component={motion.div}
            variants={itemVariants}
            viewport={{ once: true }}
            custom={index}
          >
            <ProductCard
              product={product}
              variant="featured"
              showQuickAdd={true}
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button
          variant="outlined"
          size="large"
          href="/products"
          sx={{
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 50,
            '&:hover': {
              borderColor: theme.palette.tertiary.main,
              color: theme.palette.tertiary.main,
              backgroundColor: 'rgba(178, 200, 186, 0.04)'
            }
          }}
        >
          View All Products
        </Button>
      </Box>
    </Container>
  );
};

export default FeaturedProducts;