import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Pagination,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Sort as SortIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';
import ProductCard from '../../components/ProductCard';
import HierarchicalSearchFilters from '../../components/HierarchicalSearchFilters';

const CategoryPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { slug } = router.query;

  // State management
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Search and filter state
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Fetch category data when slug changes
  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category details
      const categoryResponse = await axios.get(`/api/categories/hierarchical/slug/${slug}`);
      const categoryData = categoryResponse.data.category;

      if (!categoryData) {
        setError('Category not found');
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // Fetch products in this category
      await fetchProducts(categoryData.id);

    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId, options = {}) => {
    try {
      const params = {
        page: options.page || pagination.page,
        limit: options.limit || pagination.limit,
        sortBy: options.sortBy || sortBy,
        sortOrder: options.sortOrder || sortOrder
      };

      const response = await axios.get(`/api/categories/hierarchical/${categoryId}/products`, { params });
      const data = response.data;

      setProducts(data.products || []);
      setPagination(data.pagination || pagination);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    }
  };

  // Handle filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setActiveFiltersCount(getActiveFiltersCount(newFilters));
  };

  // Handle apply filters
  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    setActiveFiltersCount(getActiveFiltersCount(appliedFilters));
    
    // Reset to first page and fetch products with new filters
    fetchProducts(category.id, {
      page: 1,
      sortBy,
      sortOrder
    });
    
    if (isMobile) {
      setFiltersOpen(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    setActiveFiltersCount(0);
    
    fetchProducts(category.id, {
      page: 1,
      sortBy,
      sortOrder
    });
  };

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder = 'ASC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    fetchProducts(category.id, {
      page: pagination.page,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    });
  };

  // Handle page change
  const handlePageChange = (event, page) => {
    fetchProducts(category.id, {
      page,
      sortBy,
      sortOrder
    });
  };

  // Get active filters count
  const getActiveFiltersCount = (filterObj) => {
    let count = 0;
    if (filterObj.categories && filterObj.categories.length > 0) count++;
    if (filterObj.scentProfile && filterObj.scentProfile.length > 0) count++;
    if (filterObj.inStock !== null && filterObj.inStock !== undefined) count++;
    if (filterObj.attributes && Object.keys(filterObj.attributes).length > 0) count++;
    if (filterObj.priceRange &&
        (filterObj.priceRange[0] !== 0 || filterObj.priceRange[1] !== 100)) count++;
    return count;
  };

  // Get sort options
  const sortOptions = [
    { value: 'name', label: 'Name: A to Z', sortOrder: 'ASC' },
    { value: 'name', label: 'Name: Z to A', sortOrder: 'DESC' },
    { value: 'price', label: 'Price: Low to High', sortOrder: 'ASC' },
    { value: 'price', label: 'Price: High to Low', sortOrder: 'DESC' },
    { value: 'created_at', label: 'Newest First', sortOrder: 'DESC' },
    { value: 'created_at', label: 'Oldest First', sortOrder: 'ASC' }
  ];

  // Render product grid
  const renderProductGrid = () => {
    if (products.length === 0 && !loading) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found in this category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or browse other categories
          </Typography>
          {activeFiltersCount > 0 && (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={viewMode === 'grid' ? 3 : 12}>
            <ProductCard
              product={product}
              viewMode={viewMode}
              onProductClick={(productId) => router.push(`/product/${productId}`)}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!category || !category.path) return null;

    return (
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link underline="hover" color="inherit" href="/">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/products">
          Products
        </Link>
        {category.path.map((pathItem, index) => {
          const isLast = index === category.path.length - 1;
          return isLast ? (
            <Typography key={pathItem.path_id} color="text.primary">
              {pathItem.path_name}
            </Typography>
          ) : (
            <Link
              key={pathItem.path_id}
              underline="hover"
              color="inherit"
              href={`/category/${pathItem.path_slug}`}
            >
              {pathItem.path_name}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push('/products')}>
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Category Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {category.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {category.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${category.product_count || 0} products`}
            size="small"
            color="primary"
          />
          {category.children && category.children.length > 0 && (
            <Chip
              label={`${category.children.length} subcategories`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Subcategories
          </Typography>
          <Grid container spacing={2}>
            {category.children.map((child) => (
              <Grid item key={child.id} xs={12} sm={6} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => router.push(`/category/${child.slug}`)}
                >
                  <Typography variant="h6" component="h3" gutterBottom>
                    {child.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {child.description}
                  </Typography>
                  <Chip
                    label={`${child.product_count || 0} products`}
                    size="small"
                    color="primary"
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Controls Bar */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Filter Toggle */}
          <Button
            variant={activeFiltersCount > 0 ? "contained" : "outlined"}
            startIcon={<FilterIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            color={activeFiltersCount > 0 ? "primary" : "inherit"}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{ ml: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
            )}
          </Button>

          {/* Sort */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Sort:
            </Typography>
            {sortOptions.map((option) => (
              <Button
                key={`${option.value}-${option.sortOrder}`}
                size="small"
                variant={sortBy === option.value && sortOrder === option.sortOrder ? "contained" : "outlined"}
                onClick={() => handleSortChange(option.value, option.sortOrder)}
                sx={{ mr: 1 }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            View:
          </Typography>
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <GridIcon />
          </IconButton>
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ListIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Filters Sidebar - Desktop */}
        {!isMobile && (
          <Grid item md={3}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <HierarchicalSearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
              />
            </Box>
          </Grid>
        )}

        {/* Products Grid */}
        <Grid item xs={12} md={9}>
          {/* Results Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {loading ? 'Loading...' : `${pagination.total} product${pagination.total !== 1 ? 's' : ''} found`}
            </Typography>
            {pagination.pages > 1 && (
              <Typography variant="body2" color="text.secondary">
                Page {pagination.page} of {pagination.pages}
              </Typography>
            )}
          </Box>

          {/* Products */}
          {renderProductGrid()}

          {/* Pagination */}
          {pagination.pages > 1 && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Filters Drawer - Mobile */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            transform: filtersOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
            zIndex: 1000,
            maxHeight: '80vh',
            overflow: 'auto',
            backgroundColor: 'background.paper',
            boxShadow: 3,
          }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Filters</Typography>
            <Button onClick={() => setFiltersOpen(false)}>Close</Button>
          </Box>
          <HierarchicalSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
        </Box>
      )}
    </Container>
  );
};

export default CategoryPage;