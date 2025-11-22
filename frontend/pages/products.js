import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Drawer,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import HierarchicalSearchFilters from '../components/HierarchicalSearchFilters';
import ProductCard from '../components/ProductCard';

const ProductsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  // State management
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Initialize from URL query params
  useEffect(() => {
    const { q, categories, minPrice, maxPrice, page, sortBy: sort, sortOrder: order } = router.query;

    if (q) setSearchQuery(q);
    if (categories) {
      // Handle both single category and multiple categories
      const categoryIds = Array.isArray(categories) ? categories : [categories];
      setFilters(prev => ({ ...prev, categories: categoryIds }));
    }
    if (minPrice || maxPrice) {
      setFilters(prev => ({
        ...prev,
        priceRange: [
          minPrice ? parseFloat(minPrice) : 0,
          maxPrice ? parseFloat(maxPrice) : 100
        ]
      }));
    }
    if (sort) setSortBy(sort);
    if (order) setSortOrder(order);

    // Load products with current filters
    loadProducts({
      query: q || '',
      categories: categories ? (Array.isArray(categories) ? categories : [categories]) : [],
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      page: page ? parseInt(page) : 1,
      sortBy: sort || 'name',
      sortOrder: order || 'ASC'
    });
  }, [router.query]);

  // Load products function
  const loadProducts = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Convert categories to comma-separated string for API
      const categoriesParam = searchParams.categories && searchParams.categories.length > 0
        ? searchParams.categories.join(',')
        : '';

      const params = new URLSearchParams({
        q: searchParams.query || searchQuery,
        categories: categoriesParam,
        minPrice: searchParams.minPrice || filters.priceRange?.[0] || '',
        maxPrice: searchParams.maxPrice || filters.priceRange?.[1] || '',
        scentProfile: (searchParams.scentProfile || filters.scentProfile || []).join(','),
        inStock: searchParams.inStock || filters.inStock || '',
        sortBy: searchParams.sortBy || sortBy,
        sortOrder: searchParams.sortOrder || sortOrder,
        page: searchParams.page || pagination.page,
        limit: searchParams.limit || pagination.limit,
        includeVariants: 'true'
      });

      const response = await axios.get(`/api/search/products?${params}`);
      const data = response.data;

      setProducts(data.products || []);
      setPagination(data.pagination || pagination);

      // Update URL without causing a page reload
      const urlParams = new URLSearchParams();
      if (searchParams.query) urlParams.set('q', searchParams.query);
      if (categoriesParam) urlParams.set('categories', categoriesParam);
      if (searchParams.minPrice) urlParams.set('minPrice', searchParams.minPrice);
      if (searchParams.maxPrice) urlParams.set('maxPrice', searchParams.maxPrice);
      if (searchParams.page && searchParams.page > 1) urlParams.set('page', searchParams.page);

      const newUrl = `/products${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      router.replace(newUrl, undefined, { shallow: true });

    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, sortOrder, pagination.page, pagination.limit, router]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    loadProducts({
      query,
      page: 1, // Reset to first page on new search
      ...filters,
      sortBy,
      sortOrder
    });
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
    loadProducts({
      query: searchQuery,
      ...appliedFilters,
      sortBy,
      sortOrder,
      page: 1 // Reset to first page when applying filters
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
    loadProducts({
      query: searchQuery,
      sortBy,
      sortOrder,
      page: 1
    });
  };

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder = 'ASC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    loadProducts({
      query: searchQuery,
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: 1
    });
  };

  // Handle page change
  const handlePageChange = (event, page) => {
    loadProducts({
      query: searchQuery,
      ...filters,
      sortBy,
      sortOrder,
      page
    });
  };

  // Get active filters count
  const getActiveFiltersCount = (filterObj) => {
    let count = 0;
    if (filterObj.categories && filterObj.categories.length > 0) count += filterObj.categories.length;
    if (filterObj.scentProfile && filterObj.scentProfile.length > 0) count++;
    if (filterObj.inStock !== null && filterObj.inStock !== undefined) count++;
    if (filterObj.attributes && Object.keys(filterObj.attributes).length > 0) {
      count += Object.values(filterObj.attributes).flat().length;
    }
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
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Products
        </Typography>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <SearchBar
            placeholder="Search products, categories, or SKUs..."
            onSearch={handleSearch}
            fullWidth
          />
        </Box>

        {/* Search Summary */}
        {(searchQuery || activeFiltersCount > 0) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery && (
                <Chip
                  label={`"${searchQuery}"`}
                  onDelete={() => handleSearch('')}
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              {activeFiltersCount > 0 && (
                <Chip
                  label={`${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
                  onDelete={handleClearFilters}
                  size="small"
                  color="primary"
                />
              )}
            </Typography>
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

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Products */}
          {!loading && renderProductGrid()}

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

export default ProductsPage;