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
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Pagination,
  Checkbox,
  FormControlLabel,
  Toolbar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  AddPhotoAlternate as AddPhotoIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import ClpLabelKit from '../../components/admin/ClpLabelKit';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    scent_profile: { primary: '', secondary: [] },
    base_price: '',
    categories: [],
    variants: [],
    images: []
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    name: '',
    price: '',
    inventory_quantity: 0,
    attributes: {}
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        search: searchTerm,
        category: selectedCategory
      });

      const response = await axios.get(`/api/admin/products?${params}`);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.pages);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/admin/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleCategoryFilter = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === products.length
        ? []
        : products.map(p => p.id)
    );
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        scent_profile: product.scent_profile,
        base_price: product.base_price,
        categories: product.categories.map(c => c.id),
        variants: product.variants,
        images: product.images || [],
        status: product.status || 'DRAFT',
        vat_rate: product.vat_rate != null ? product.vat_rate : 20,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        weight_grams: product.weight_grams != null ? product.weight_grams : '',
        clp_allergens: (product.clp_allergens || []).join(', '),
        clp_hazard_pictograms: (product.clp_hazard_pictograms || []).join(', '),
        clp_signal_word: product.clp_signal_word || '',
        clp_hazard_statements: (product.clp_hazard_statements || []).join(', '),
        clp_precautionary_statements: (product.clp_precautionary_statements || []).join(', '),
        ufi_code: product.ufi_code || '',
        clp_responsible_name: product.clp_responsible_name || '',
        clp_exempt: product.clp_exempt === true
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        scent_profile: { primary: '', secondary: [] },
        base_price: '',
        categories: [],
        variants: [],
        images: [],
        status: 'DRAFT',
        vat_rate: 20,
        meta_title: '',
        meta_description: '',
        weight_grams: '',
        clp_allergens: '',
        clp_hazard_pictograms: '',
        clp_signal_word: '',
        clp_hazard_statements: '',
        clp_precautionary_statements: '',
        ufi_code: '',
        clp_responsible_name: '',
        clp_exempt: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  // Comma-separated admin inputs → arrays for JSONB columns
  const toList = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const handleSaveProduct = async () => {
    try {
      // CLP gate mirrors the server-side check in routes/admin.js:
      // scented products going ACTIVE need complete CLP data; the exempt
      // tickbox bypasses (and audits) it.
      if (!productForm.clp_exempt && productForm.status === 'ACTIVE') {
        const missing = [];
        if (!productForm.clp_signal_word) missing.push('signal word');
        if (!toList(productForm.clp_hazard_pictograms).length) missing.push('hazard pictograms');
        if (!toList(productForm.clp_hazard_statements).length) missing.push('H-codes');
        if (!toList(productForm.clp_precautionary_statements).length) missing.push('P-codes');
        if (!productForm.clp_responsible_name) missing.push('responsible person');
        if (missing.length) {
          setError(`CLP data incomplete — required to go ACTIVE: ${missing.join(', ')}. Tick "CLP not required" if this product is exempt.`);
          return;
        }
      }

      const data = {
        ...productForm,
        base_price: parseFloat(productForm.base_price),
        vat_rate: parseFloat(productForm.vat_rate),
        weight_grams: productForm.weight_grams === '' ? null : parseInt(productForm.weight_grams, 10),
        clp_allergens: toList(productForm.clp_allergens),
        clp_hazard_pictograms: toList(productForm.clp_hazard_pictograms),
        clp_signal_word: productForm.clp_signal_word || null,
        clp_hazard_statements: toList(productForm.clp_hazard_statements),
        clp_precautionary_statements: toList(productForm.clp_precautionary_statements),
        clp_exempt: productForm.clp_exempt === true
      };

      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, data);
      } else {
        await axios.post('/api/admin/products', data);
      }

      handleCloseDialog();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`/api/admin/products/${productId}`);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      const operations = selectedProducts.map(id => ({ id, action: 'delete' }));
      await axios.post('/api/admin/products/bulk', { operations });
      setSelectedProducts([]);
      fetchProducts();
    } catch (err) {
      console.error('Error bulk deleting products:', err);
      setError('Failed to delete products');
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      if (editingProduct) {
        formData.append('productId', editingProduct.id);
      }

      const response = await axios.post('/api/upload/product-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProductForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...response.data.images]
      }));
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddVariant = () => {
    if (!newVariant.sku || !newVariant.name || !newVariant.price) return;

    setProductForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { ...newVariant }]
    }));

    setNewVariant({
      sku: '',
      name: '',
      price: '',
      inventory_quantity: 0,
      attributes: {}
    });
  };

  const handleRemoveVariant = (index) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Product Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Product
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Filters and Search */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={handleCategoryFilter}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <Paper sx={{ p: 1, mb: 2 }}>
              <Toolbar>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {selectedProducts.length} product(s) selected
                </Typography>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                >
                  Delete Selected
                </Button>
              </Toolbar>
            </Paper>
          )}

          {/* Products Table */}
          <TableContainer component={Paper}>
            {loading && <LinearProgress />}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Categories</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Variants</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {product.description?.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {product.categories?.map((category) => (
                          <Chip
                            key={category}
                            label={category}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>${product.base_price}</TableCell>
                    <TableCell>{product.variants?.length || 0}</TableCell>
                    <TableCell>
                      {product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(product)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="CLP Label Kit">
                        <IconButton onClick={() => setLabelProduct(product)}>
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteProduct(product.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}

          {/* Product Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Base Price"
                    type="number"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                    InputProps={{
                      startAdornment: <span>£</span>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Commerce: lifecycle, VAT (flip-of-switch accounting),
                    shipping weight. £ input is what the CUSTOMER pays. */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      label="Status"
                    >
                      <MenuItem value="DRAFT">Draft (hidden from store)</MenuItem>
                      <MenuItem value="ACTIVE">Active (visible)</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="VAT Rate (%)"
                    type="number"
                    value={productForm.vat_rate}
                    onChange={(e) => setProductForm({ ...productForm, vat_rate: e.target.value })}
                    helperText="Used when vat_registered is switched on"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Weight (g)"
                    type="number"
                    value={productForm.weight_grams}
                    onChange={(e) => setProductForm({ ...productForm, weight_grams: e.target.value })}
                    helperText="For shipping rates"
                  />
                </Grid>

                {/* SEO overrides — fall back to name/description when empty */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SEO Title (optional)"
                    value={productForm.meta_title}
                    onChange={(e) => setProductForm({ ...productForm, meta_title: e.target.value })}
                    helperText="Overrides the page title for search engines (leave empty to use the product name)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SEO Meta Description (optional)"
                    value={productForm.meta_description}
                    onChange={(e) => setProductForm({ ...productForm, meta_description: e.target.value })}
                    multiline
                    rows={2}
                    helperText="Overrides the search snippet text (~155 characters is ideal)"
                  />
                </Grid>

                {/* CLP compliance (N-1) — legally required for scented
                    candles/wax melts. Comma-separated lists. The exempt
                    tickbox bypasses the requirement (bath products,
                    accessories) — the tick IS the audit trail. */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={productForm.clp_exempt === true}
                        onChange={(e) => setProductForm({ ...productForm, clp_exempt: e.target.checked })}
                      />
                    }
                    label="CLP not required for this product (unscented / non-classified)"
                  />
                </Grid>
                {!productForm.clp_exempt && (
                <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CLP Signal Word"
                    value={productForm.clp_signal_word}
                    onChange={(e) => setProductForm({ ...productForm, clp_signal_word: e.target.value })}
                    helperText="DANGER or WARNING (leave empty if not applicable)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="UFI Code"
                    value={productForm.ufi_code}
                    onChange={(e) => setProductForm({ ...productForm, ufi_code: e.target.value })}
                    helperText="Required for EU sales (format: XXXX-XXXX-XXXX-XXXX)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="CLP Allergens"
                    value={productForm.clp_allergens}
                    onChange={(e) => setProductForm({ ...productForm, clp_allergens: e.target.value })}
                    helperText="Comma-separated, e.g. Eugenol, Linalool, Coumarin"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hazard Pictograms"
                    value={productForm.clp_hazard_pictograms}
                    onChange={(e) => setProductForm({ ...productForm, clp_hazard_pictograms: e.target.value })}
                    helperText="Comma-separated GHS codes, e.g. GHS02, GHS09"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Responsible Person / Company"
                    value={productForm.clp_responsible_name}
                    onChange={(e) => setProductForm({ ...productForm, clp_responsible_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hazard Statements (H-codes)"
                    value={productForm.clp_hazard_statements}
                    onChange={(e) => setProductForm({ ...productForm, clp_hazard_statements: e.target.value })}
                    helperText="Comma-separated, e.g. H317, H411"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Precautionary Statements (P-codes)"
                    value={productForm.clp_precautionary_statements}
                    onChange={(e) => setProductForm({ ...productForm, clp_precautionary_statements: e.target.value })}
                    helperText="Comma-separated, e.g. P102, P210, P280"
                  />
                </Grid>
                </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Categories</InputLabel>
                    <Select
                      multiple
                      value={productForm.categories}
                      onChange={(e) => setProductForm({ ...productForm, categories: e.target.value })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const category = categories.find(c => c.id === value);
                            return (
                              <Chip key={value} label={category?.name || value} size="small" />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Images Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Product Images</Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    {productForm.images?.map((image, index) => (
                      <Box key={index} position="relative">
                        <img
                          src={image.imageUrl}
                          alt={image.altText || 'Product image'}
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={imageUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    disabled={imageUploading}
                  >
                    {imageUploading ? 'Uploading...' : 'Upload Images'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Grid>

                {/* Variants Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Product Variants</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>SKU</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productForm.variants?.map((variant, index) => (
                          <TableRow key={index}>
                            <TableCell>{variant.sku}</TableCell>
                            <TableCell>{variant.name}</TableCell>
                            <TableCell>${variant.price}</TableCell>
                            <TableCell>{variant.inventory_quantity}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleRemoveVariant(index)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Add new variant row */}
                        <TableRow>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="SKU"
                              value={newVariant.sku}
                              onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Variant name"
                              value={newVariant.name}
                              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="Price"
                              value={newVariant.price}
                              onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="Stock"
                              value={newVariant.inventory_quantity}
                              onChange={(e) => setNewVariant({ ...newVariant, inventory_quantity: parseInt(e.target.value) || 0 })}
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="small" onClick={handleAddVariant}>
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSaveProduct} variant="contained">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* CLP Label Kit — print-ready 50×30mm compliance label + QR */}
          <ClpLabelKit product={labelProduct} onClose={() => setLabelProduct(null)} />
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default AdminProducts;