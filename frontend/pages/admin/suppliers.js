import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
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
  Chip,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';
import axios from 'axios';

const SuppliersManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    payment_terms: '',
    lead_time_days: '',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        website: supplier.website || '',
        payment_terms: supplier.payment_terms || '',
        lead_time_days: supplier.lead_time_days || '',
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        payment_terms: '',
        lead_time_days: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      payment_terms: '',
      lead_time_days: '',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSupplier) {
        await axios.put(`/api/suppliers/${editingSupplier.id}`, formData);
      } else {
        await axios.post('/api/suppliers', formData);
      }
      handleCloseDialog();
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Failed to save supplier');
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await axios.delete(`/api/suppliers/${supplierId}`);
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier');
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              <BusinessIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Supplier Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Supplier
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Lead Time (Days)</TableCell>
                    <TableCell>Products</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>{supplier.lead_time_days || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${supplier.product_count || 0} products`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={supplier.is_active ? 'Active' : 'Inactive'}
                          color={supplier.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(supplier)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(supplier.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Supplier Dialog */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Supplier Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Lead Time (Days)"
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Payment Terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={!formData.name.trim()}
              >
                {editingSupplier ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default SuppliersManagement;