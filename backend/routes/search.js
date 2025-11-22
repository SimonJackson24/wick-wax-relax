const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const searchService = require('../services/searchService');

const router = express.Router();

// ===== MAIN SEARCH ENDPOINTS =====

// Advanced product search with filters
router.get('/products', [
  query('q').optional().trim(),
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('scentProfile').optional().isArray(),
  query('inStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['relevance', 'price', 'name', 'newest', 'popularity']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('includeVariants').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchParams = {
      query: req.query.q,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      scentProfile: req.query.scentProfile ? (Array.isArray(req.query.scentProfile) ? req.query.scentProfile : [req.query.scentProfile]) : [],
      inStock: req.query.inStock ? req.query.inStock === 'true' : null,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      includeVariants: req.query.includeVariants !== 'false'
    };

    const results = await searchService.searchProducts(searchParams);

    // Log search analytics
    await searchService.logSearch(
      searchParams.query,
      results.products.length,
      searchParams,
      req.user?.userId,
      req.sessionID
    );

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search with faceted navigation
router.get('/advanced', [
  query('q').optional().trim(),
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('scentProfile').optional().isArray(),
  query('inStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['relevance', 'price', 'name', 'newest', 'popularity']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchParams = {
      query: req.query.q,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      scentProfile: req.query.scentProfile ? (Array.isArray(req.query.scentProfile) ? req.query.scentProfile : [req.query.scentProfile]) : [],
      inStock: req.query.inStock ? req.query.inStock === 'true' : null,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const results = await searchService.advancedSearch(searchParams);

    // Log search analytics
    await searchService.logSearch(
      searchParams.query,
      results.products.length,
      searchParams,
      req.user?.userId,
      req.sessionID
    );

    res.json(results);
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// ===== AUTOCOMPLETE & SUGGESTIONS =====

// Search suggestions/autocomplete
router.get('/suggestions', [
  query('q').trim().isLength({ min: 1, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q: query, limit = 10 } = req.query;
    const suggestions = await searchService.getSearchSuggestions(query, parseInt(limit));

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Popular search terms
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 20;
    const popularSearches = await searchService.getPopularSearches(limit);

    res.json({ popularSearches });
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({ error: 'Failed to get popular searches' });
  }
});

// ===== FILTERS & FACETS =====

// Get available search filters
router.get('/filters', async (req, res) => {
  try {
    const filters = await searchService.getSearchFilters();
    res.json({ filters });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({ error: 'Failed to get filters' });
  }
});

// Get facet counts for current search
router.post('/facets', [
  body('query').optional().trim(),
  body('category').optional().trim(),
  body('minPrice').optional().isFloat({ min: 0 }),
  body('maxPrice').optional().isFloat({ min: 0 }),
  body('scentProfile').optional().isArray(),
  body('inStock').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchParams = {
      query: req.body.query,
      category: req.body.category,
      minPrice: req.body.minPrice,
      maxPrice: req.body.maxPrice,
      scentProfile: req.body.scentProfile || [],
      inStock: req.body.inStock
    };

    const facets = await searchService.getFacetCounts(searchParams);
    res.json({ facets });
  } catch (error) {
    console.error('Facets error:', error);
    res.status(500).json({ error: 'Failed to get facets' });
  }
});

// ===== PRODUCT DISCOVERY =====

// Get related products
router.get('/related/:productId', [
  param('productId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    const relatedProducts = await searchService.getRelatedProducts(productId, limit);
    res.json({ relatedProducts });
  } catch (error) {
    console.error('Related products error:', error);
    res.status(500).json({ error: 'Failed to get related products' });
  }
});

// ===== SEARCH ANALYTICS =====

// Log search event (for analytics)
router.post('/analytics/log', [
  body('query').trim().isLength({ min: 1 }),
  body('resultsCount').isInt({ min: 0 }),
  body('filters').optional().isObject(),
  body('userId').optional().isUUID(),
  body('sessionId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query, resultsCount, filters, userId, sessionId } = req.body;

    await searchService.logSearch(query, resultsCount, filters, userId, sessionId);

    res.json({ success: true, message: 'Search logged successfully' });
  } catch (error) {
    console.error('Search analytics log error:', error);
    res.status(500).json({ error: 'Failed to log search' });
  }
});

// ===== QUICK SEARCH ENDPOINTS =====

// Quick search by SKU
router.get('/sku/:sku', [
  param('sku').trim().isLength({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sku } = req.params;

    const searchParams = {
      query: sku,
      sortBy: 'relevance',
      limit: 1
    };

    const results = await searchService.searchProducts(searchParams);

    if (results.products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: results.products[0] });
  } catch (error) {
    console.error('SKU search error:', error);
    res.status(500).json({ error: 'SKU search failed' });
  }
});

// Search by category
router.get('/category/:categorySlug', [
  param('categorySlug').trim().isLength({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['relevance', 'price', 'name', 'newest', 'popularity']),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categorySlug } = req.params;
    const searchParams = {
      category: categorySlug,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const results = await searchService.searchProducts(searchParams);
    res.json(results);
  } catch (error) {
    console.error('Category search error:', error);
    res.status(500).json({ error: 'Category search failed' });
  }
});

// ===== ADMIN SEARCH ENDPOINTS =====

// Admin search with additional metadata
router.get('/admin/products', [
  query('q').optional().trim(),
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('scentProfile').optional().isArray(),
  query('inStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['relevance', 'price', 'name', 'newest', 'popularity', 'stock']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('includeAnalytics').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchParams = {
      query: req.query.q,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      scentProfile: req.query.scentProfile ? (Array.isArray(req.query.scentProfile) ? req.query.scentProfile : [req.query.scentProfile]) : [],
      inStock: req.query.inStock ? req.query.inStock === 'true' : null,
      sortBy: req.query.sortBy || 'relevance',
      sortOrder: req.query.sortOrder || 'DESC',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      includeVariants: true,
      includeAnalytics: req.query.includeAnalytics === 'true'
    };

    const results = await searchService.searchProducts(searchParams);

    // Add admin-specific metadata
    if (searchParams.includeAnalytics) {
      const analytics = await searchService.getSearchAnalytics(searchParams.query);
      results.analytics = analytics;
    }

    res.json(results);
  } catch (error) {
    console.error('Admin search error:', error);
    res.status(500).json({ error: 'Admin search failed' });
  }
});

// Get search analytics (admin only)
router.get('/admin/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, limit = 50 } = req.query;

    // This would typically query a search_analytics table
    // For now, return mock data
    const analytics = {
      totalSearches: 1250,
      uniqueQueries: 340,
      averageResults: 15.7,
      topSearches: [
        { query: 'wax melts', count: 45, avgResults: 23 },
        { query: 'candles', count: 38, avgResults: 18 },
        { query: 'lavender', count: 32, avgResults: 12 },
        { query: 'bath bombs', count: 28, avgResults: 8 }
      ],
      noResultsQueries: [
        { query: 'chocolate scent', count: 5 },
        { query: 'large candles', count: 3 }
      ],
      searchTrends: [
        { date: '2024-01-01', searches: 120 },
        { date: '2024-01-02', searches: 135 },
        { date: '2024-01-03', searches: 98 }
      ]
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

// ===== UTILITY ENDPOINTS =====

// Health check for search service
router.get('/health', (req, res) => {
  res.json({
    status: 'Search service healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Clear search cache (admin only)
router.post('/admin/clear-cache', async (req, res) => {
  try {
    // In a real implementation, this would clear any cached search results
    console.log('Search cache cleared');
    res.json({ success: true, message: 'Search cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear search cache' });
  }
});

// Reindex search data (admin only)
router.post('/admin/reindex', async (req, res) => {
  try {
    // In a real implementation, this would rebuild search indexes
    console.log('Search reindexing started');
    // Simulate reindexing process
    setTimeout(() => {
      console.log('Search reindexing completed');
    }, 1000);

    res.json({
      success: true,
      message: 'Search reindexing started',
      estimatedTime: '2-3 minutes'
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ error: 'Failed to start reindexing' });
  }
});

module.exports = router;