import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box, Skeleton, useTheme, useMediaQuery } from '@mui/material';
import Link from 'next/link';
import axios from 'axios';
import Hero from '../components/Hero';
import Navigation from '../components/Navigation';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import useSmoothScroll from '../hooks/useSmoothScroll';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
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

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchProducts();
    fetchCategories();
  }, []);

  // Initialize smooth scrolling
  useSmoothScroll();

  const fetchProducts = async (retryCount = 0) => {
    if (isFetchingProducts) return;
    setIsFetchingProducts(true);
    try {
      setProductsError(null);
      setProductsLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data.slice(0, 6));
    } catch (error) {
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount);
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
    if (isFetchingCategories) return;
    setIsFetchingCategories(true);
    try {
      setCategoriesError(null);
      setCategoriesLoading(true);
      const response = await axios.get('/api/products/categories/all');
      setCategories(response.data);
    } catch (error) {
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount);
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
    <Box component="main" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <Box id="home">
        <Hero />
      </Box>

      {/* Features Section */}
      <Box
        component="section"
        id="features"
        sx={{
          py: { xs: 6, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Features />
        </Container>
      </Box>

      {/* Categories Section */}
      <Box
        component="section"
        id="categories"
        sx={{
          py: { xs: 6, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8, lg: 10 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                color: theme.palette.text.primary,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Shop by Category
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.5,
              }}
            >
              Discover our curated collection of premium wax melts and candles
            </Typography>
          </Box>

          <Grid
            container
            spacing={{ xs: 2, md: 3, lg: 4 }}
            sx={{ mb: { xs: 4, md: 6, lg: 8 } }}
          >
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: { xs: 2, md: 3 },
                      boxShadow: theme.custom?.shape?.shadows?.sm || '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme.palette.background.paper,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.custom?.shape?.shadows?.md || '0 4px 16px rgba(0,0,0,0.15)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Skeleton variant="text" width="70%" height={28} sx={{ mb: 2 }} />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} />
                      <Skeleton variant="rectangular" width="120px" height={40} sx={{ borderRadius: 2 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : categoriesError ? (
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                    backgroundColor: `${theme.palette.error.main}10`,
                    border: `1px solid ${theme.palette.error.main}30`,
                    borderRadius: { xs: 2, md: 3 },
                  }}
                >
                  <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                    {categoriesError}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchCategories}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Try Again
                  </Button>
                </Card>
              </Grid>
            ) : (
              categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: { xs: 2, md: 3 },
                      boxShadow: theme.custom?.shape?.shadows?.sm || '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.custom?.shape?.shadows?.lg || '0 8px 32px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 }, flexGrow: 1 }}>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1.25rem', md: '1.4rem' },
                          color: theme.palette.text.primary,
                          mb: 2,
                        }}
                      >
                        {category.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.6,
                          mb: 3,
                          fontSize: { xs: '0.9rem', md: '0.95rem' },
                        }}
                      >
                        {category.description}
                      </Typography>
                      <Button
                        component={Link}
                        href={`/category/${category.slug}`}
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', md: '0.95rem' },
                          borderColor: theme.palette.secondary.main,
                          color: theme.palette.secondary.main,
                          '&:hover': {
                            borderColor: theme.palette.secondary.dark,
                            backgroundColor: `${theme.palette.secondary.main}10`,
                            transform: 'translateY(-1px)',
                          }
                        }}
                      >
                        Browse {category.name}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Container>
      </Box>

      {/* Featured Products Section */}
      <Box
        component="section"
        id="products"
        sx={{
          py: { xs: 6, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8, lg: 10 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                color: theme.palette.text.primary,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Featured Products
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.5,
              }}
            >
              Handcrafted with love, designed for your relaxation
            </Typography>
          </Box>

          <Grid
            container
            spacing={{ xs: 2, md: 3, lg: 4 }}
          >
            {productsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: { xs: 2, md: 3 },
                      boxShadow: theme.custom?.shape?.shadows?.sm || '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme.palette.background.paper,
                      overflow: 'hidden',
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={{ xs: 200, md: 240, lg: 280 }}
                      sx={{ mb: 0 }}
                    />
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Skeleton variant="text" width="70%" height={28} sx={{ mb: 2 }} />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="90%" height={20} sx={{ mb: 2 }} />
                      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 3 }} />
                      <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: 2 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : productsError ? (
              <Grid item xs={12}>
                <Card
                  sx={{
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                    backgroundColor: `${theme.palette.error.main}10`,
                    border: `1px solid ${theme.palette.error.main}30`,
                    borderRadius: { xs: 2, md: 3 },
                  }}
                >
                  <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                    {productsError}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchProducts}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Try Again
                  </Button>
                </Card>
              </Grid>
            ) : (
              products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: { xs: 2, md: 3 },
                      boxShadow: theme.custom?.shape?.shadows?.sm || '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.custom?.shape?.shadows?.lg || '0 8px 32px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: { xs: 200, md: 240, lg: 280 },
                        backgroundColor: theme.palette.grey[200],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        },
                        '&:hover::before': {
                          opacity: 1,
                        }
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          textAlign: 'center',
                          px: 2,
                        }}
                      >
                        Product Image
                      </Typography>
                    </CardMedia>
                    <CardContent sx={{ p: { xs: 3, md: 4 }, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1.1rem', md: '1.25rem' },
                          color: theme.palette.text.primary,
                          mb: 1,
                          lineHeight: 1.3,
                        }}
                      >
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          fontSize: { xs: '0.85rem', md: '0.9rem' },
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.description}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', md: '1.25rem' },
                          mb: 3,
                        }}
                      >
                        £{product.base_price}
                      </Typography>
                      <Button
                        component={Link}
                        href={`/product/${product.id}`}
                        variant="contained"
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          py: { xs: 1.5, md: 2 },
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', md: '0.95rem' },
                          background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                            transform: 'translateY(-1px)',
                          }
                        }}
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

      {/* Testimonials Section */}
      <Box
        component="section"
        id="testimonials"
        sx={{
          py: { xs: 6, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Container maxWidth="lg">
          <Testimonials />
        </Container>
      </Box>

      {/* Newsletter Section */}
      <Box
        component="section"
        id="newsletter"
        sx={{
          py: { xs: 6, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Newsletter />
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}