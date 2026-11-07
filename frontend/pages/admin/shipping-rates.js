import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Tooltip, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, Switch, FormControlLabel, Alert, CircularProgress,
  Snackbar, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';

const ZONES = ['UK', 'EU', 'WORLDWIDE'];

const emptyForm = {
  zone: 'UK',
  method_code: '',
  name: '',
  description: '',
  price: '',
  min_weight_grams: '',
  max_weight_grams: '',
  free_over_amount: '',
  estimated_days_min: '',
  estimated_days_max: '',
  is_active: true,
  sort_order: 0,
};

const ShippingRates = () => {
  const theme = useTheme();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/shipping/admin/rates');
      setRates(res.data.rates || []);
    } catch {
      setNotice({ open: true, message: 'Could not load shipping rates', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (rate) => {
    setEditing(rate);
    setForm({
      zone: rate.zone,
      method_code: rate.method_code,
      name: rate.name,
      description: rate.description || '',
      price: String(rate.price),
      min_weight_grams: rate.min_weight_grams ?? '',
      max_weight_grams: rate.max_weight_grams ?? '',
      free_over_amount: rate.free_over_amount ?? '',
      estimated_days_min: rate.estimated_days_min ?? '',
      estimated_days_max: rate.estimated_days_max ?? '',
      is_active: rate.is_active !== false,
      sort_order: rate.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        zone: form.zone,
        method_code: form.method_code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        min_weight_grams: form.min_weight_grams === '' ? null : parseInt(form.min_weight_grams, 10),
        max_weight_grams: form.max_weight_grams === '' ? null : parseInt(form.max_weight_grams, 10),
        free_over_amount: form.free_over_amount === '' ? null : parseFloat(form.free_over_amount),
        estimated_days_min: form.estimated_days_min === '' ? null : parseInt(form.estimated_days_min, 10),
        estimated_days_max: form.estimated_days_max === '' ? null : parseInt(form.estimated_days_max, 10),
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };
      if (editing) {
        await axios.put(`/api/shipping/admin/rates/${editing.id}`, payload);
      } else {
        await axios.post('/api/shipping/admin/rates', payload);
      }
      setDialogOpen(false);
      setNotice({ open: true, message: editing ? 'Rate updated' : 'Rate created', severity: 'success' });
      load();
    } catch (err) {
      setNotice({
        open: true,
        message: err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Save failed',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rate) => {
    try {
      await axios.delete(`/api/shipping/admin/rates/${rate.id}`);
      setNotice({ open: true, message: 'Rate deleted', severity: 'success' });
      load();
    } catch {
      setNotice({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
              Shipping Rates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              What customers pay for delivery, per zone and weight band. A rate with a
              &ldquo;free over&rdquo; amount becomes free once the basket reaches it.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} sx={{ textTransform: 'none', fontWeight: 600 }}>
            New Rate
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Prices are seeded with standard Royal Mail rates — confirm them against your
          negotiated rates before going live. Weight bands: leave both blank for a flat
          rate; set a minimum/maximum to apply only to parcels in that band.
        </Alert>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Zone</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Weight band</TableCell>
                <TableCell align="right">Free over</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={20} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : rates.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No shipping rates yet</Typography></TableCell></TableRow>
              ) : rates.map((rate) => (
                <TableRow key={rate.id} hover>
                  <TableCell><Chip size="small" label={rate.zone} variant="outlined" /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{rate.method_code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{rate.name}</Typography>
                    {rate.description && <Typography variant="caption" color="text.secondary">{rate.description}</Typography>}
                  </TableCell>
                  <TableCell align="right">£{parseFloat(rate.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {rate.min_weight_grams == null && rate.max_weight_grams == null
                      ? 'Any'
                      : `${rate.min_weight_grams ?? 0}–${rate.max_weight_grams ?? '∞'} g`}
                  </TableCell>
                  <TableCell align="right">
                    {rate.free_over_amount != null ? `£${parseFloat(rate.free_over_amount).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell>
                    {rate.estimated_days_min == null ? '—'
                      : rate.estimated_days_min === rate.estimated_days_max
                        ? `${rate.estimated_days_min}d`
                        : `${rate.estimated_days_min}-${rate.estimated_days_max}d`}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={rate.is_active ? 'Active' : 'Inactive'} color={rate.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => openEdit(rate)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => remove(rate)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'Edit shipping rate' : 'New shipping rate'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Zone</InputLabel>
                <Select value={form.zone} label="Zone" onChange={(e) => setForm({ ...form, zone: e.target.value })}>
                  {ZONES.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Method code" value={form.method_code} onChange={(e) => setForm({ ...form, method_code: e.target.value })} helperText="e.g. RM_TRACKED_24" required />
              <TextField label="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <TextField label="Price (£)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Min weight (g)" type="number" value={form.min_weight_grams} onChange={(e) => setForm({ ...form, min_weight_grams: e.target.value })} />
                <TextField label="Max weight (g)" type="number" value={form.max_weight_grams} onChange={(e) => setForm({ ...form, max_weight_grams: e.target.value })} />
              </Box>
              <TextField label="Free over (£)" type="number" value={form.free_over_amount} onChange={(e) => setForm({ ...form, free_over_amount: e.target.value })} helperText="Basket value at which this rate becomes free (blank = never free)" />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Days min" type="number" value={form.estimated_days_min} onChange={(e) => setForm({ ...form, estimated_days_min: e.target.value })} />
                <TextField label="Days max" type="number" value={form.estimated_days_max} onChange={(e) => setForm({ ...form, estimated_days_max: e.target.value })} />
              </Box>
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
                label="Active (available to customers)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={saving || !form.name || !form.method_code || form.price === ''} sx={{ textTransform: 'none', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Save rate'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={notice.open} autoHideDuration={4000} onClose={() => setNotice({ ...notice, open: false })}>
          <Alert severity={notice.severity} onClose={() => setNotice({ ...notice, open: false })}>{notice.message}</Alert>
        </Snackbar>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default ShippingRates;
