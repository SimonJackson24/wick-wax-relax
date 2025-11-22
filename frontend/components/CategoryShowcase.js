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
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/router';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CategoryIcon from '@mui/icons-material/Category';

const CategoryShowcase = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);

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

  const handleSubcategoryClick = (e, subcategorySlug) => {
    e.stopPropagation();
    router.push(`/category/${subcategorySlug}`);
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
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
      </Container>
    );
  }

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 12; // 1 column on mobile
    if (isTablet) return 6;  // 2 columns on tablet
    return 4;                // 3 columns on desktop
  };

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
            xs={getGridColumns()}
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
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => handleCategoryClick(category.slug)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={category.image_url || '/images/category-placeholder.jpg'}
                  alt={category.name}
                  sx={{
                    transition: 'transform 0.5s ease',
                    transform: hoveredCategory === category.id ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                
                {/* Category badge */}
                <Chip
                  icon={<CategoryIcon />}
                  label="Category"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: theme.palette.primary.main,
                    fontWeight: 'bold'
                  }}
                />
                
                {/* Product count badge */}
                <Chip
                  label={`${category.product_count || 0} Products`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: theme.palette.secondary.main,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.description}
                </Typography>
                
                {/* Subcategories - shown on hover */}
                {hoveredCategory === category.id && category.children && category.children.length > 0 && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    sx={{ mt: 2 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Subcategories:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      {category.children.slice(0, 3).map((child) => (
                        <Chip
                          key={child.id}
                          label={child.name}
                          size="small"
                          clickable
                          onClick={(e) => handleSubcategoryClick(e, child.slug)}
                          sx={{
                            backgroundColor: theme.palette.tertiary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.tertiary.dark
                            }
                          }}
                        />
                      ))}
                      {category.children.length > 3 && (
                        <Chip
                          label={`+${category.children.length - 3} more`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            color: theme.palette.text.secondary
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => handleCategoryClick(category.slug)}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: 'rgba(200, 182, 219, 0.08)'
                    }
                  }}
                >
                  Explore
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {categories.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="outlined"
            size="large"
            href="/categories"
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
            View All Categories
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CategoryShowcase;