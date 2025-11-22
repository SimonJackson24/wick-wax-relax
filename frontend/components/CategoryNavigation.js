import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Collapse,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const CategoryNavigation = ({
  isOpen = false,
  onClose = () => {},
  variant = 'dropdown' // 'dropdown' or 'sidebar'
}) => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const dropdownRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isMobile, onClose]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryClick = (category) => {
    // Navigate to category page
    router.push(`/categories/${category.slug}`);
    onClose();
  };

  const handleSubcategoryClick = (category, subcategory) => {
    // Navigate to subcategory page
    router.push(`/categories/${category.slug}/${subcategory.slug}`);
    onClose();
  };

  // Organize categories by hierarchy
  const organizedCategories = categories.reduce((acc, category) => {
    if (!category.parent_id) {
      // Main category
      acc.main.push({
        ...category,
        subcategories: categories.filter(sub => sub.parent_id === category.id)
      });
    }
    return acc;
  }, { main: [], sub: [] });

  // Loading state
  if (loading) {
    return (
      <Paper
        ref={dropdownRef}
        sx={{
          position: variant === 'dropdown' ? 'absolute' : 'static',
          top: variant === 'dropdown' ? '100%' : 'auto',
          left: 0,
          right: 0,
          zIndex: 1300,
          minWidth: 280,
          maxWidth: 400,
          mt: variant === 'dropdown' ? 1 : 0,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
          p: 2
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading categories...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper
        ref={dropdownRef}
        sx={{
          position: variant === 'dropdown' ? 'absolute' : 'static',
          top: variant === 'dropdown' ? '100%' : 'auto',
          left: 0,
          right: 0,
          zIndex: 1300,
          minWidth: 280,
          maxWidth: 400,
          mt: variant === 'dropdown' ? 1 : 0,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
          p: 2
        }}
      >
        <Alert severity="error" sx={{ mb: 0 }}>
          {error}
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (organizedCategories.main.length === 0) {
    return (
      <Paper
        ref={dropdownRef}
        sx={{
          position: variant === 'dropdown' ? 'absolute' : 'static',
          top: variant === 'dropdown' ? '100%' : 'auto',
          left: 0,
          right: 0,
          zIndex: 1300,
          minWidth: 280,
          maxWidth: 400,
          mt: variant === 'dropdown' ? 1 : 0,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
          p: 2
        }}
      >
        <Box textAlign="center" py={4}>
          <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No Categories Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for new product categories.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Paper
            ref={dropdownRef}
            sx={{
              position: variant === 'dropdown' ? 'absolute' : 'static',
              top: variant === 'dropdown' ? '100%' : 'auto',
              left: 0,
              right: 0,
              zIndex: 1300,
              minWidth: 280,
              maxWidth: 400,
              mt: variant === 'dropdown' ? 1 : 0,
              boxShadow: theme.shadows[8],
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {organizedCategories.main.map((category, index) => (
                  <Box key={category.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (category.subcategories.length > 0) {
                            toggleCategoryExpansion(category.id);
                          } else {
                            handleCategoryClick(category);
                          }
                        }}
                        sx={{
                          py: 2,
                          px: 3,
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 500,
                                color: theme.palette.text.primary
                              }}
                            >
                              {category.name}
                            </Typography>
                          }
                          secondary={
                            category.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  mt: 0.5
                                }}
                              >
                                {category.description}
                              </Typography>
                            )
                          }
                        />
                        {category.subcategories.length > 0 && (
                          <Box sx={{ ml: 1 }}>
                            {expandedCategories.has(category.id) ? (
                              <ExpandLessIcon sx={{ color: theme.palette.text.secondary }} />
                            ) : (
                              <ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />
                            )}
                          </Box>
                        )}
                      </ListItemButton>
                    </ListItem>

                    {/* Subcategories */}
                    {category.subcategories.length > 0 && (
                      <Collapse in={expandedCategories.has(category.id)} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {category.subcategories.map((subcategory) => (
                            <ListItem key={subcategory.id} disablePadding>
                              <ListItemButton
                                onClick={() => handleSubcategoryClick(category, subcategory)}
                                sx={{
                                  py: 1.5,
                                  px: 6, // Indent subcategories
                                  '&:hover': {
                                    backgroundColor: theme.palette.action.selected,
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      {subcategory.name}
                                    </Typography>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    )}

                    {/* Divider between main categories */}
                    {index < organizedCategories.main.length - 1 && (
                      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mx: 2 }} />
                    )}
                  </Box>
                ))}
              </List>
            </Box>

            {/* Footer with "View All Categories" link */}
            <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
              <Link href="/categories" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  View All Categories →
                </Typography>
              </Link>
            </Box>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoryNavigation;