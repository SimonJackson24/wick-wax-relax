const express = require('express');
const router = express.Router();
const hierarchicalCategoriesService = require('../services/hierarchicalCategories');
const productService = require('../services/product');

// Get all hierarchical categories
router.get('/hierarchical', async (req, res) => {
  try {
    const categories = await hierarchicalCategoriesService.getAllHierarchicalCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching hierarchical categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get parent categories with their children
router.get('/hierarchical/parents', async (req, res) => {
  try {
    const categories = await hierarchicalCategoriesService.getParentCategoriesWithChildren();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching parent categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by slug with full path
router.get('/hierarchical/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await hierarchicalCategoriesService.getCategoryBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Get products by category (including subcategories)
router.get('/hierarchical/:categoryId/products', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };
    
    const result = await hierarchicalCategoriesService.getProductsByCategory(categoryId, options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get categories for product
router.get('/hierarchical/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const categories = await hierarchicalCategoriesService.getProductCategories(productId);
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ error: 'Failed to fetch product categories' });
  }
});

// Get category filters for search
router.get('/hierarchical/filters', async (req, res) => {
  try {
    const filters = await hierarchicalCategoriesService.getCategoryFilters();
    res.json({ filters });
  } catch (error) {
    console.error('Error fetching category filters:', error);
    res.status(500).json({ error: 'Failed to fetch category filters' });
  }
});

// Create new category (admin only)
router.post('/hierarchical', async (req, res) => {
  try {
    const categoryData = req.body;
    const category = await hierarchicalCategoriesService.createCategory(categoryData);
    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (admin only)
router.put('/hierarchical/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const category = await hierarchicalCategoriesService.updateCategory(id, categoryData);
    res.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/hierarchical/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await hierarchicalCategoriesService.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.message.includes('Cannot delete category with subcategories')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Add product to category (admin only)
router.post('/hierarchical/product/:productId/category/:categoryId', async (req, res) => {
  try {
    const { productId, categoryId } = req.params;
    await hierarchicalCategoriesService.addProductToCategory(productId, categoryId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding product to category:', error);
    res.status(500).json({ error: 'Failed to add product to category' });
  }
});

// Remove product from category (admin only)
router.delete('/hierarchical/product/:productId/category/:categoryId', async (req, res) => {
  try {
    const { productId, categoryId } = req.params;
    await hierarchicalCategoriesService.removeProductFromCategory(productId, categoryId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing product from category:', error);
    res.status(500).json({ error: 'Failed to remove product from category' });
  }
});

// Update product categories (admin only)
router.put('/hierarchical/product/:productId/categories', async (req, res) => {
  try {
    const { productId } = req.params;
    const { categoryIds } = req.body;
    await hierarchicalCategoriesService.updateProductCategories(productId, categoryIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating product categories:', error);
    res.status(500).json({ error: 'Failed to update product categories' });
  }
});

// Migrate existing categories to new hierarchy (admin only)
router.post('/hierarchical/migrate', async (req, res) => {
  try {
    await hierarchicalCategoriesService.migrateExistingCategories();
    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Error migrating categories:', error);
    res.status(500).json({ error: 'Failed to migrate categories' });
  }
});

// Legacy category endpoints for backward compatibility

// Get all categories (legacy)
router.get('/', async (req, res) => {
  try {
    const categories = await productService.getAllCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category (legacy)
router.post('/', async (req, res) => {
  try {
    const categoryData = req.body;
    const category = await productService.createCategory(categoryData);
    res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (legacy)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const category = await productService.updateCategory(id, categoryData);
    res.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (legacy)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;