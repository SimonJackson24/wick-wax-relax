import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import HierarchicalCategories from '../../components/HierarchicalCategories';

const AdminHierarchicalCategories = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    level: 2,
    display_order: 0,
    is_active: true,
    meta_title: '',
    meta_description: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories/hierarchical');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleAddCategory = (parentId = null, level = 1) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: parentId || '',
      level: level,
      display_order: 0,
      is_active: true,
      meta_title: '',
      meta_description: '',
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || '',
      level: category.level || 2,
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await axios.delete(`/api/categories/hierarchical/${category.id}`);
        setSuccess('Category deleted successfully');
        fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        setError(err.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // Update existing category
        await axios.put(`/api/categories/hierarchical/${editingCategory.id}`, formData);
        setSuccess('Category updated successfully');
      } else {
        // Create new category
        await axios.post('/api/categories/hierarchical', formData);
        setSuccess('Category created successfully');
      }
      
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMigrateCategories = async () => {
    if (window.confirm('Are you sure you want to migrate existing categories to the new hierarchy? This action cannot be undone.')) {
      try {
        await axios.post('/api/categories/hierarchical/migrate');
        setSuccess('Categories migrated successfully');
        fetchCategories();
      } catch (err) {
        console.error('Error migrating categories:', err);
        setError(err.response?.data?.error || 'Failed to migrate categories');
      }
    }
  };

  const renderCategoryRow = (category, level = 0) => {
    const isExpanded = expandedCategories[category.id] || false;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <React.Fragment key={category.id}>
        <TableRow sx={{ backgroundColor: level % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {hasChildren && (
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpand(category.id)}
                  sx={{ mr: 1 }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
              {!hasChildren && (
                <Box sx={{ width: 40, height: 40 }} />
              )}
              {level > 0 && (
                <Box sx={{ width: level * 20, height: 1, backgroundColor: 'divider', mr: 1 }} />
              )}
              {hasChildren ? (
                isExpanded ? <FolderOpenIcon /> : <FolderIcon />
              ) : (
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'grey.300' }} />
              )}
              <Typography variant="body1" sx={{ ml: 1, fontWeight: level === 0 ? 600 : 400 }}>
                {category.name}
              </Typography>
            </Box>
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {category.description}
            </Typography>
          </TableCell>
          <TableCell>{category.level}</TableCell>
          <TableCell>{category.display_order}</TableCell>
          <TableCell>
            <Chip
              label={category.is_active !== false ? 'Active' : 'Inactive'}
              color={category.is_active !== false ? 'success' : 'default'}
              size="small"
            />
          </TableCell>
          <TableCell>{category.product_count || 0}</TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditCategory(category)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteCategory(category)}
              >
                <DeleteIcon />
              </IconButton>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAddCategory(category.id, category.level + 1)}
              >
                Add Subcategory
              </Button>
            </Box>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && category.children.map(child => renderCategoryRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // Get parent categories for dropdown
  const getParentCategories = () => {
    const flattenCategories = (cats, level = 0) => {
      let result = [];
      cats.forEach(cat => {
        result.push({
          id: cat.id,
          name: `${'—'.repeat(level)} ${cat.name}`,
          level: cat.level
        });
        if (cat.children) {
          result = [...result, ...flattenCategories(cat.children, level + 1)];
        }
      });
      return result;
    };
    
    return flattenCategories(categories);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Loading categories...</Typography>
      </Container>
    );
  }

  return (
    <AdminProtectedRoute>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/admin">
            Admin Dashboard
          </Link>
          <Typography color="text.primary">Hierarchical Categories</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Hierarchical Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleMigrateCategories}
            >
              Migrate Existing Categories
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAddCategory()}
            >
              Add Root Category
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Categories Table */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Display Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map(category => renderCategoryRow(category))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Category Preview */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Category Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <HierarchicalCategories
            variant="accordion"
            showProductCount={true}
          />
        </Paper>

        {/* Add/Edit Category Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  helperText="URL-friendly version of the name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Parent Category</InputLabel>
                  <Select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">None (Root Category)</MenuItem>
                    {getParentCategories().map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Order"
                  name="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meta Title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleInputChange}
                  helperText="Title for SEO (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meta Description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  helperText="Description for SEO (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      name="is_active"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} variant="contained">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminProtectedRoute>
  );
};

export default AdminHierarchicalCategories;