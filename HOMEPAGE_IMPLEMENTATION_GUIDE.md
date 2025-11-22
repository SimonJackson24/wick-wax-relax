
# Wick Wax Relax Homepage Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the redesigned homepage for Wick Wax Relax, based on the specifications outlined in the Homepage Redesign Specification document.

## Prerequisites

Before implementing the redesigned homepage, ensure the following prerequisites are met:

1. The hierarchical categories system is fully implemented and the database migration is complete
2. The existing NavigationWithCategories component is properly integrated
3. The backend API endpoints for products and categories are functional
4. The Material-UI theme is configured with the new color palette

## Implementation Steps

### Step 1: Update the Material-UI Theme

First, update the Material-UI theme to reflect the new color palette and typography.

#### File: `frontend/src/theme.js`

```javascript
import { createTheme } from '@mui/material/styles';
import { PlayfairDisplay, Montserrat } from '@next/font/google';

const playfairDisplay = PlayfairDisplay({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#C8B6DB', // Muted lavender
      light: '#D8C6EB',
      dark: '#B8A6CB',
    },
    secondary: {
      main: '#E6C88A', // Warm gold
      light: '#F6D89A',
      dark: '#D6B87A',
    },
    tertiary: {
      main: '#B2C8BA', // Gentle sage
      light: '#C2D8CA',
      dark: '#A2B8AA',
    },
    background: {
      default: '#F5F2ED', // Warm sandy beige
      paper: '#FAF8F3', // Soft cream
    },
    text: {
      primary: '#333333', // Dark charcoal
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: montserrat.style.fontFamily,
    h1: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    h2: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    h3: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    h4: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    h5: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    h6: {
      fontFamily: playfairDisplay.style.fontFamily,
      fontWeight: 400,
    },
    button: {
      fontFamily: montserrat.style.fontFamily,
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: '10px 24px',
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export default theme;
```

### Step 2: Enhance the Hero Component

Update the Hero component to align with the new design philosophy.

#### File: `frontend/components/Hero.js`

```javascript
// Update the categorySlides array with new color schemes
const categorySlides = [
  {
    id: 'wax-melts',
    name: 'Wax Melts',
    description: 'Hand-poured soy wax melts for electric warmers. Experience our premium collection of floral, citrus, and seasonal scents.',
    customerBenefit: 'Create your perfect ambiance with long-lasting fragrances',
    backgroundImage: '/images/wax-melts-hero-enhanced.jpg',
    ctaText: 'Shop Wax Melts',
    ctaLink: '/category/wax-melts',
    colorScheme: {
      primary: '#C8B6DB', // Muted lavender
      secondary: '#E6C88A', // Warm gold
      accent: '#B2C8BA' // Gentle sage
    }
  },
  {
    id: 'candles',
    name: 'Candles',
    description: 'Premium soy wax candles with wooden wicks. Long-burning, clean-burning, and beautifully fragranced.',
    customerBenefit: 'Elevate your space with warm, inviting light and captivating scents',
    backgroundImage: '/images/candles-hero-enhanced.jpg',
    ctaText: 'Shop Candles',
    ctaLink: '/category/candles',
    colorScheme: {
      primary: '#E6C88A', // Warm gold
      secondary: '#C8B6DB', // Muted lavender
      accent: '#B2C8BA' // Gentle sage
    }
  },
  {
    id: 'bath-bombs',
    name: 'Bath Bombs',
    description: 'Fizzy bath bombs with therapeutic essential oils. Transform your bath into a luxurious spa experience.',
    customerBenefit: 'Indulge in a spa-like experience with nourishing ingredients',
    backgroundImage: '/images/bath-bombs-hero-enhanced.jpg',
    ctaText: 'Shop Bath Bombs',
    ctaLink: '/category/bath-bombs',
    colorScheme: {
      primary: '#B2C8BA', // Gentle sage
      secondary: '#C8B6DB', // Muted lavender
      accent: '#E6C88A' // Warm gold
    }
  },
  {
    id: 'diffusers',
    name: 'Diffusers',
    description: 'Reed diffusers for continuous fragrance. Elegant home decor that fills your space with lasting scents.',
    customerBenefit: 'Enjoy consistent fragrance that enhances your home environment',
    backgroundImage: '/images/diffusers-hero-enhanced.jpg',
    ctaText: 'Shop Diffusers',
    ctaLink: '/category/diffusers',
    colorScheme: {
      primary: '#C8B6DB', // Muted lavender
      secondary: '#B2C8BA', // Gentle sage
      accent: '#E6C88A' // Warm gold
    }
  }
];

// Add customer benefit display in the Hero component
// In the main content section, after the description:
<motion.p
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.5 }}
  style={{
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    maxWidth: '600px',
    textAlign: 'center',
    marginBottom: '2rem',
    margin: 0,
    fontStyle: 'italic'
  }}
>
  {currentSlideData.customerBenefit}
</motion.p>
```

### Step 3: Create the FeaturedProducts Component

Create a new FeaturedProducts component to showcase best-selling products.

#### File: `frontend/components/FeaturedProducts.js`

```javascript
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
```

### Step 4: Create the Testimonials Component

Create a new Testimonials component to display customer reviews.

#### File: `frontend/components/Testimonials.js`

```javascript
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'London, UK',
    rating: 5,
    text: 'The lavender wax melts have transformed my evening routine. The scent is so relaxing and lasts for hours!',
    product: 'Lavender Dreams Wax Melts',
    image: '/images/customer-sarah.jpg'
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'Manchester, UK',
    rating: 5,
    text: 'I bought the citrus candle as a gift and my friend absolutely loved it. The packaging was beautiful and the scent was amazing.',
    product: 'Citrus Burst Candle',
    image: '/images/customer-michael.jpg'
  },
  {
    id: 3,
    name: 'Emma Wilson',
    location: 'Bristol, UK',
    rating: 4,
    text: 'The bath bombs are incredible! They leave my skin feeling so soft and the scents are divine. Will definitely order again.',
    product: 'Rose Garden Bath Bomb',
    image: '/images/customer-emma.jpg'
  }
];

const Testimonials = () => {
  const theme = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <Box sx={{ py: 8, bgcolor: theme.palette.background.paper }}>
      <Container maxWidth="lg">
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
            What Our Customers Say
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Join thousands of customers who have transformed their homes with our products
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid
              item
              key={testimonial.id}
              xs={12}
              md={4}
              component={motion.div}
              variants={itemVariants}
              viewport={{ once: true }}
              custom={index}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <FormatQuoteIcon
                  sx={{
                    fontSize: 40,
                    color: theme.palette.primary.main,
                    opacity: 0.2,
                    position: 'absolute',
                    top: -10,
                    left: 10
                  }}
                />
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Rating value={testimonial.rating} precision={0.5} readOnly size="small" sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                    "{testimonial.text}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {testimonial.product}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={testimonial.image}
                      alt={testimonial.name}
                      sx={{ mr: 2, width: 48, height: 48 }}
                    />
                    <Box>
                      <Typography variant="subtitle1">{testimonial.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.location}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials;
```

### Step 5: Create the SeasonalPromo Component

Create a new SeasonalPromo component for seasonal promotions.

#### File: `frontend/components/SeasonalPromo.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';

const calculateTimeLeft = () => {
  const difference = +new Date('2024-06-01') - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  return timeLeft;
};

const CountdownTimer = ({ timeLeft }) => {
  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <Box key={interval} sx={{ textAlign: 'center', mx: 1 }}>
        <Typography variant="h4" component="span" sx={{ fontWeight: 'bold' }}>
          {timeLeft[interval]}
        </Typography>
        <Typography variant="body2" display="block">
          {interval}
        </Typography>
      </Box>
    );
  });

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      {timerComponents.length ? timerComponents : <Typography variant="h6">Expired</Typography>}
    </Box>
  );
};

const SeasonalPromo = () => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        py: 8,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/seasonal-promo-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400
            }}
          >
            Spring Collection Special
          </Typography>
          <Typography variant="h5" gutterBottom>
            20% Off All Floral Scents
          </Typography>

          <Box sx={{ mb: 4 }}>
            <CountdownTimer timeLeft={timeLeft} />
          </Box>

          <Button
            variant="contained"
            size="large"
            href="/category/spring"
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.text.primary,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: 50,
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark
              }
            }}
          >
            Shop Spring Collection
          </Button>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SeasonalPromo;
```

### Step 6: Create the NewCustomerCTA Component

Create a new NewCustomerCTA component for customer registration.

#### File: `frontend/components/NewCustomerCTA.js`

```javascript
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Star as StarIcon,
  LocalOffer as LocalOfferIcon,
  Cake as CakeIcon
} from '@mui/icons-material';

const NewCustomerCTA = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic
    console.log('Register with:', email, password);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <Box sx={{ py: 8, bgcolor: theme.palette.background.default }}>
      <Container maxWidth="md">
        <Grid container spacing={4} alignItems="center">
          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            variants={itemVariants}
            viewport={{ once: true }}
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
              Join the Wick Wax Relax Family
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create an account to enjoy exclusive benefits and be the first to know about new products and special offers.
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <StarIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Earn points with every purchase" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocalOfferIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Receive exclusive member discounts" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CakeIcon sx={{ color: theme.palette.secondary.main }} />
                </ListItemIcon>
                <ListItemText primary="Special birthday gift" />
              </ListItem>
            </List>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            component={motion.div}
            variants={itemVariants}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h5" gutterBottom>
                Create Your Account
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark
                    }
                  }}
                >
                  Create Account
                </Button>

                <Divider sx={{ my: 2 }}>OR</Divider>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
                  >
                    Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }}
                  >
                    Facebook
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default NewCustomerCTA;
```

### Step 7: Create the CategoryShowcase Component

Create a new CategoryShowcase component to display product categories.

#### File: `frontend/components/CategoryShowcase.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/router';

const CategoryShowcase = () => {
  const theme = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentCategoriesWithChildren();
  }, []);

  const fetchParentCategoriesWithChildren = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/parents');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categorySlug) => {
    router.push(`/category/${categorySlug}`);
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
    return null; // Add a loading skeleton if needed
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
          Shop by Category
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: '600px', mx: 'auto' }}
        >
          Find the perfect scent for every mood and occasion
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category, index) => (
          <Grid
            item
            key={category.id}
            xs={12}
            sm={6}
            md={4}
            component={motion.div}
            variants={itemVariants}
            viewport={{ once: true }}
            custom={index}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => handleCategoryClick(category.slug)}
            >
              <CardMedia
                component="img"
                height="200"
                image={category.image_url || '/images/category-placeholder.jpg'}
                alt={category.name}
              />
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.description}
                </Typography>
                <Typography variant="body2" color="primary">
                  {category.product_count || 0} Products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default CategoryShowcase;
```

### Step 8: Enhance the ProductCard Component

Update the ProductCard component to include the new design features.

#### File: `frontend/components/ProductCard.js`

```javascript
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Rating,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ProductCard = ({ 
  product, 
  variant = 'default', 
  showQuickAdd = false, 
  onProductClick, 
  onAddToCart 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product.id, product.variants[0].id);
    }
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product.id);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        borderRadius: 3,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProductClick}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height={variant === 'featured' ? 200 : 240}
          image={product.image}
          alt={product.name}
          sx={{
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        
        {/* Product badges */}
        {product.isNew && (
          <Chip
            label="New"
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: '#C8B6DB',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
        
        {product.isOnSale && (
          <Chip
            label="Sale"
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: '#E6C88A',
              color: '#333333',
              fontWeight: 'bold'
            }}
          />
        )}
        
        {/* Quick add button */}
        {showQuickAdd && isHovered && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={handleAddToCart}
              sx={{
                backgroundColor: '#B2C8BA',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#A2B8AA'
                }
              }}
            >
              Quick Add
            </Button>
          </Box>
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h3">
          {product.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {product.description}
        </Typography>
        
        {/* Product rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={product.rating || 4} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviewCount || 12})
          </Typography>
        </Box>
        
        <Typography variant="h6" color="primary">
          £{product.price}
          {product.originalPrice && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through', ml: 1 }}
            >
              £{product.originalPrice}
            </Typography>
          )}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={handleProductClick}
          sx={{ color: '#C8B6DB' }}
        >
          View
        </Button>
        <IconButton
          color="primary"
          onClick={handleAddToCart}
          sx={{ color: '#B2C8BA' }}
        >
          <ShoppingCartIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
```

### Step 9: Update the HomePage Component

Update the HomePage component to include all the new sections.

#### File: `frontend/pages/index.js`

```javascript
import React from 'react';
import { Box } from '@mui/material';
import NavigationWithCategories from '../components/NavigationWithCategories';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import CategoryShowcase from '../components/CategoryShowcase';
import Testimonials from '../components/Testimonials';
import SeasonalPromo from '../components/SeasonalPromo';
import NewCustomerCTA from '../components/NewCustomerCTA';

const HomePage = () => {
  return (
    <>
      <NavigationWithCategories />
      <Hero />
      <FeaturedProducts />
      <CategoryShowcase />
      <SeasonalPromo />
      <Testimonials />
      <NewCustomerCTA />
      
      <Box component="footer" sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 Wick Wax &