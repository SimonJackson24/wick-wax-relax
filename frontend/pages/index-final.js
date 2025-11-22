import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box, Skeleton } from '@mui/material';
import Link from 'next/link';
import axios from 'axios';
import Hero from '../components/HeroGradient';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [categoriesError, setCategoriesError] = useState(null);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const hasFetchedRef = useRef(false);
  let useEffectRunCount = 0;
  let fetchProductsCount = 0;
  let fetchCategoriesCount = 0;

  useEffect(() => {
    useEffectRunCount++;
    console.log(`Index page: useEffect run #${useEffectRunCount} - Fetching products and categories`);
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async (retryCount = 0) => {
    if (isFetchingProducts) return; // Prevent duplicate calls
    fetchProductsCount++;
    console.log(`Index page: Fetching products #${fetchProductsCount} (retry ${retryCount})`);
    setIsFetchingProducts(true);
    try {
      setProductsError(null);
      setProductsLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data.slice(0, 6)); // Show first 6 products
    } catch (error) {
      console.error('Index page: Error fetching products:', error);
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(`Index page: Rate limited, retrying products in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchProducts(retryCount + 1), delay);
      } else {
        setProductsError('Failed to load products. Please try again.');
      }
    } finally {
      setProductsLoading(false);
      setIsFetchingProducts(false);
    }
  };

  const fetchCategories = async (retryCount = 0) => {
    if (isFetchingCategories) return; // Prevent duplicate calls
    fetchCategoriesCount++;
    console.log(`Index page: Fetching categories #${fetchCategoriesCount} (retry ${retryCount})`);
    setIsFetchingCategories(true);
    try {
      setCategoriesError(null);
      setCategoriesLoading(true);
      const response = await axios.get('/api/products/categories/all');
      setCategories(response.data);
    } catch (error) {
      console.error('Index page: Error fetching categories:', error);
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(`Index page: Rate limited, retrying categories in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchCategories(retryCount + 1), delay);
      } else {
        setCategoriesError('Failed to load categories. Please try again.');
      }
    } finally {
      setCategoriesLoading(false);
      setIsFetchingCategories(false);
    }
  };

  return (
    <Box component="main">
      {/* Hero Section */}
      <Hero />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Categories Section */}
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }} id="categories-heading">
          Shop by Category
        </Typography>
        <Grid
          container
          spacing={3}
          sx={{ mb: 6 }}
          component="section"
          aria-labelledby="categories-heading"
          role="region"
          aria-label="Product categories"
        >
          {categoriesLoading ? (
            // Skeleton for categories
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} />
                    <Skeleton variant="rectangular" width="120px" height={36} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : categoriesError ? (
            // Error state for categories
            <Grid item xs={12}>
              <Card sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff5f5', border: '1px solid #feb2b2' }}>
                <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                  {categoriesError}
                </Typography>
                <Button variant="contained" color="primary" onClick={fetchCategories}>
                  Try Again
                </Button>
              </Card>
            </Grid>
          ) : (
            categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                    <Button
                      component={Link}
                      href={`/category/${category.slug}`}
                      variant="outlined"
                      sx={{ mt: 2 }}
                    >
                      Browse {category.name}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Featured Products */}
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }} id="products-heading">
          Featured Products
        </Typography>
        <Grid
          container
          spacing={3}
          component="section"
          aria-labelledby="products-heading"
          role="region"
          aria-label="Featured products"
        >
          {productsLoading ? (
            // Skeleton for products
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="70%" height={28} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="90%" height={20} sx={{ mb: 2 }} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={36} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : productsError ? (
            // Error state for products
            <Grid item xs={12}>
              <Card sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff5f5', border: '1px solid #feb2b2' }}>
                <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                  {productsError}
                </Typography>
                <Button variant="contained" color="primary" onClick={fetchProducts}>
                  Try Again
                </Button>
              </Card>
            </Grid>
          ) : (
            products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
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
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                      £{product.base_price}
                    </Typography>
                    <Button
                      component={Link}
                      href={`/product/${product.id}`}
                      variant="contained"
                      fullWidth
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
}