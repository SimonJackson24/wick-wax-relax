import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    display_order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/categories');
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent_id: category.parent_id || '',
        display_order: category.display_order || 0
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        display_order: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    try {
      const data = {
        ...categoryForm,
        display_order: parseInt(categoryForm.display_order)
      };

      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory.id}`, data);
      } else {
        await axios.post('/api/admin/categories', data);
      }

      handleCloseDialog();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/api/admin/categories/${categoryId}`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    }
  };

  const getCategoryHierarchy = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';

    const hierarchy = [category.name];
    let parentId = category.parent_id;

    while (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        hierarchy.unshift(parent.name);
        parentId = parent.parent_id;
      } else {
        break;
      }
    }

    return hierarchy.join(' > ');
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Category Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Category
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            {loading && <LinearProgress />}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Hierarchy</TableCell>
                  <TableCell>Display Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {category.name}
                        </Typography>
                        {category.parent_id && (
                          <Chip
                            label="Subcategory"
                            size="small"
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {category.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getCategoryHierarchy(category.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(category)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteCategory(category.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Category Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Slug"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  helperText="URL-friendly identifier"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  multiline
                  rows={2}
                />
                <FormControl fullWidth>
                  <InputLabel>Parent Category (optional)</InputLabel>
                  <Select
                    value={categoryForm.parent_id}
                    onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                    label="Parent Category (optional)"
                  >
                    <MenuItem value="">
                      <em>None (Top Level)</em>
                    </MenuItem>
                    {getParentCategories().map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Display Order"
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                  helperText="Lower numbers appear first"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSaveCategory} variant="contained">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminCategories;