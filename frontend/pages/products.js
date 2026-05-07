import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';
import SEOHead from '../components/SEOHead';
import SearchBar from '../components/SearchBar';
import HierarchicalSearchFilters from '../components/HierarchicalSearchFilters';
import ProductCard from '../components/ProductCard';

const ProductsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState('grid');

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Does NOT call loadProducts — avoids router.query → loadProducts → router.replace → router.query loop
  useEffect(() => {
    const { q, categories, minPrice, maxPrice, page, sortBy: sort, sortOrder: order } = router.query;
    if (q) setSearchQuery(q);
    if (categories) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Does NOT depend on router.query — breaks the shallow-routing re-render loop
  useEffect(() => {
    // On mount, skip load if URL params already set (handled by mount effect)
    const hasUrlParams = !!router.query.q || !!router.query.categories ||
                         !!router.query.minPrice || !!router.query.maxPrice ||
                         !!router.query.page;
    if (hasUrlParams && pagination.page === 1 && products.length === 0) {
      // initial mount load from URL — proceed
    }
    loadProducts({
      query: searchQuery,
      categories: filters.categories || [],
      minPrice: filters.priceRange?.[0] || null,
      maxPrice: filters.priceRange?.[1] || null,
      page: pagination.page,
      sortBy,
      sortOrder
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.categories, filters.priceRange?.[0], filters.priceRange?.[1],
      sortBy, sortOrder, pagination.page]);

  const loadProducts = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      setError(null);
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
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.priceRange, filters.scentProfile, filters.inStock, sortBy, sortOrder, pagination.page, pagination.limit]);

  const handleProductClick = useCallback((productId) => {
    router.push(`/product/${productId}`);
  }, [router]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const urlParams = new URLSearchParams();
    if (query) urlParams.set('q', query);
    if (filters.categories?.length) urlParams.set('categories', filters.categories.join(','));
    if (filters.priceRange?.[0]) urlParams.set('minPrice', filters.priceRange[0]);
    if (filters.priceRange?.[1] < 100) urlParams.set('maxPrice', filters.priceRange[1]);
    const newUrl = `/products${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    router.replace(newUrl, undefined, { shallow: true });
    loadProducts({ query, page: 1 });
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setActiveFiltersCount(getActiveFiltersCount(newFilters));
  };

  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    setActiveFiltersCount(getActiveFiltersCount(appliedFilters));
    const urlParams = new URLSearchParams();
    if (searchQuery) urlParams.set('q', searchQuery);
    if (appliedFilters.categories?.length) urlParams.set('categories', appliedFilters.categories.join(','));
    if (appliedFilters.priceRange?.[0]) urlParams.set('minPrice', appliedFilters.priceRange[0]);
    if (appliedFilters.priceRange?.[1] < 100) urlParams.set('maxPrice', appliedFilters.priceRange[1]);
    const newUrl = `/products${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    router.replace(newUrl, undefined, { shallow: true });
    loadProducts({ query: searchQuery, page: 1 });
    if (isMobile) setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveFiltersCount(0);
    router.replace('/products', undefined, { shallow: true });
    loadProducts({ query: searchQuery, page: 1 });
  };

  const handleSortChange = (newSortBy, newSortOrder = 'ASC') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    const urlParams = new URLSearchParams();
    if (searchQuery) urlParams.set('q', searchQuery);
    if (filters.categories?.length) urlParams.set('categories', filters.categories.join(','));
    if (filters.priceRange?.[0]) urlParams.set('minPrice', filters.priceRange[0]);
    if (filters.priceRange?.[1] < 100) urlParams.set('maxPrice', filters.priceRange[1]);
    urlParams.set('sortBy', newSortBy);
    urlParams.set('sortOrder', newSortOrder);
    const newUrl = `/products?${urlParams.toString()}`;
    router.replace(newUrl, undefined, { shallow: true });
    loadProducts({ query: searchQuery, sortBy: newSortBy, sortOrder: newSortOrder, page: 1 });
  };

  const handlePageChange = (event, page) => {
    const urlParams = new URLSearchParams();
    if (searchQuery) urlParams.set('q', searchQuery);
    if (filters.categories?.length) urlParams.set('categories', filters.categories.join(','));
    if (filters.priceRange?.[0]) urlParams.set('minPrice', filters.priceRange[0]);
    if (filters.priceRange?.[1] < 100) urlParams.set('maxPrice', filters.priceRange[1]);
    urlParams.set('sortBy', sortBy);
    urlParams.set('sortOrder', sortOrder);
    if (page > 1) urlParams.set('page', page);
    router.replace(`/products${urlParams.toString() ? `?${urlParams.toString()}` : ''}`, undefined, { shallow: true });
    setPagination(prev => ({ ...prev, page }));
  };

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

  const sortOptions = [
    { value: 'name', label: 'Name: A to Z', sortOrder: 'ASC' },
    { value: 'name', label: 'Name: Z to A', sortOrder: 'DESC' },
    { value: 'price', label: 'Price: Low to High', sortOrder: 'ASC' },
    { value: 'price', label: 'Price: High to Low', sortOrder: 'DESC' },
    { value: 'created_at', label: 'Newest First', sortOrder: 'DESC' },
    { value: 'created_at', label: 'Oldest First', sortOrder: 'ASC' }
  ];

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
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearFilters} sx={{ mt: 2 }}>
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
            <ProductCard product={product} viewMode={viewMode} onProductClick={handleProductClick} />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <SEOHead
        title="Shop Wax Melts, Candles & Home Fragrance — Wick Wax Relax"
        description="Browse our full range of hand-crafted soy wax melts, candles, bath bombs and reed diffusers. Eco-friendly, plastic-free packaging. Free UK delivery over £25."
        keywords="wax melts, candles, home fragrance, soy wax, bath bombs, diffusers, UK"
        url="https://wickwaxrelax.com/products"
        type="website"
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>Products</Typography>

        <Box sx={{ mb: 3 }}>
          <SearchBar placeholder="Search products, categories, or SKUs..." onSearch={handleSearch} fullWidth />
        </Box>

        {(searchQuery || activeFiltersCount > 0) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery && (
                <Chip
                  label={`"${searchQuery}"`}
                  onDelete={() => { setSearchQuery(''); router.replace('/products', undefined, { shallow: true }); }}
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

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant={activeFiltersCount > 0 ? "contained" : "outlined"}
              startIcon={<FilterIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              color={activeFiltersCount > 0 ? "primary" : "inherit"}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Chip label={activeFiltersCount} size="small" sx={{ ml: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              )}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Sort:</Typography>
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

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>View:</Typography>
            <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}><GridIcon /></IconButton>
            <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}><ListIcon /></IconButton>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
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

        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {loading ? 'Loading...' : `${pagination.total} product${pagination.total !== 1 ? 's' : ''} found`}
            </Typography>
            {pagination.pages > 1 && (
              <Typography variant="body2" color="text.secondary">Page {pagination.page} of {pagination.pages}</Typography>
            )}
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && renderProductGrid()}

          {pagination.pages > 1 && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pagination.pages} page={pagination.page} onChange={handlePageChange} color="primary" size={isMobile ? "small" : "medium"} />
            </Box>
          )}
        </Grid>
      </Grid>

      {isMobile && (
        <Box
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            transform: filtersOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease', zIndex: 1000,
            maxHeight: '80vh', overflow: 'auto',
            backgroundColor: 'background.paper', boxShadow: 3,
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
    </>
  );
};

export default ProductsPage;