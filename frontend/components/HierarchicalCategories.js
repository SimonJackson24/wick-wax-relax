import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  LocalFlorist as FloralIcon,
  Spa as SpicyIcon,
  Eco as WoodyIcon,
  Opacity as FreshIcon,
  Restaurant as FruityIcon,
  AcUnit as WinterIcon,
  WbSunny as SummerIcon,
  Eco as SpringIcon,
  Park as AutumnIcon,
  Star as LimitedEditionIcon,
  TrendingUp as BestSellersIcon,
  Diamond as SignatureIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';

// Icon mapping for categories
const categoryIcons = {
  'seasons': null,
  'spring': <SpringIcon />,
  'summer': <SummerIcon />,
  'autumn': <AutumnIcon />,
  'winter': <WinterIcon />,
  'collections': null,
  'limited-edition': <LimitedEditionIcon />,
  'best-sellers': <BestSellersIcon />,
  'signature-series': <SignatureIcon />,
  'aroma-profiles': null,
  'floral': <FloralIcon />,
  'fruity': <FruityIcon />,
  'spicy': <SpicyIcon />,
  'fresh': <FreshIcon />,
  'woody': <WoodyIcon />,
};

const HierarchicalCategories = ({ 
  variant = 'default', // 'default', 'accordion', 'compact'
  showProductCount = true,
  maxLevels = 2,
  defaultExpanded = [],
  onCategoryClick,
  sx = {}
}) => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeCategory, setActiveCategory] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Set active category based on current route
  useEffect(() => {
    const pathSegments = router.asPath.split('/');
    const categoryIndex = pathSegments.indexOf('category');
    
    if (categoryIndex !== -1 && pathSegments[categoryIndex + 1]) {
      setActiveCategory(pathSegments[categoryIndex + 1]);
    }
  }, [router.asPath]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories/hierarchical/parents');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category.slug);
    
    if (onCategoryClick) {
      onCategoryClick(category);
    } else {
      // Navigate to category page
      router.push(`/category/${category.slug}`);
    }
  };

  const renderCategoryItem = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[category.id] || false;
    const isActive = activeCategory === category.slug;
    const icon = categoryIcons[category.slug] || null;

    if (variant === 'accordion') {
      return (
        <Accordion
          key={category.id}
          expanded={isExpanded}
          onChange={() => handleToggle(category.id)}
          sx={{
            boxShadow: 'none',
            '&:before': { display: 'none' },
            borderBottom: level === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            ...sx
          }}
        >
          <AccordionSummary
            expandIcon={hasChildren ? <ExpandMore /> : null}
            sx={{
              pl: level * 2,
              backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {icon && (
                <Box sx={{ mr: 1, color: isActive ? 'primary.main' : 'text.secondary' }}>
                  {icon}
                </Box>
              )}
              <Typography
                variant={level === 0 ? 'subtitle1' : 'body1'}
                sx={{
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'primary.main' : 'text.primary',
                  flexGrow: 1
                }}
              >
                {category.name}
              </Typography>
              {showProductCount && (
                <Chip
                  label={category.product_count || 0}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {hasChildren && (
              <List disablePadding>
                {category.children.map(child => renderCategoryItem(child, level + 1))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      );
    }

    if (variant === 'compact') {
      return (
        <ListItem
          key={category.id}
          disablePadding
          sx={{ pl: level * 2 }}
        >
          <ListItemButton
            selected={isActive}
            onClick={() => handleCategoryClick(category)}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            {icon && (
              <ListItemIcon sx={{ minWidth: 40 }}>
                {React.cloneElement(icon, {
                  color: isActive ? 'primary' : 'inherit'
                })}
              </ListItemIcon>
            )}
            <ListItemText
              primary={category.name}
              primaryTypographyProps={{
                variant: level === 0 ? 'subtitle2' : 'body2',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'primary.main' : 'text.primary'
              }}
            />
            {showProductCount && (
              <Chip
                label={category.product_count || 0}
                size="small"
                variant="outlined"
              />
            )}
          </ListItemButton>
        </ListItem>
      );
    }

    // Default variant
    return (
      <Box key={category.id}>
        <ListItem
          disablePadding
          sx={{ pl: level * 2 }}
        >
          <ListItemButton
            selected={isActive}
            onClick={() => handleCategoryClick(category)}
            sx={{
              borderRadius: 1,
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            {icon && (
              <ListItemIcon sx={{ minWidth: 40 }}>
                {React.cloneElement(icon, {
                  color: isActive ? 'primary' : 'inherit'
                })}
              </ListItemIcon>
            )}
            <ListItemText
              primary={category.name}
              secondary={category.description}
              primaryTypographyProps={{
                variant: level === 0 ? 'subtitle1' : 'body1',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'primary.main' : 'text.primary'
              }}
              secondaryTypographyProps={{
                variant: 'body2',
                color: 'text.secondary',
                noWrap: true
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {showProductCount && (
                <Chip
                  label={category.product_count || 0}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              )}
              {hasChildren && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(category.id);
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {category.children.map(child => renderCategoryItem(child, level + 1))}
            </List>
          </Collapse>
        )}
        {level === 0 && <Divider />}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading categories...</Typography>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No categories available</Typography>
      </Box>
    );
  }

  if (variant === 'accordion') {
    return (
      <Box sx={{ width: '100%', ...sx }}>
        {categories.map(category => renderCategoryItem(category))}
      </Box>
    );
  }

  return (
    <List
      sx={{
        width: '100%',
        p: 0,
        ...sx
      }}
      component="nav"
      aria-label="product categories"
    >
      {categories.map(category => renderCategoryItem(category))}
    </List>
  );
};

export default HierarchicalCategories;