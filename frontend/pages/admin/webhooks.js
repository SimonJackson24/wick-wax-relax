import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Tooltip, Accordion, AccordionSummary,
  AccordionDetails, Pagination, CircularProgress, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReplayIcon from '@mui/icons-material/Replay';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';

// Webhook console — the delivery audit trail (migration 027) written by
// routes/webhooks.js. Every inbound webhook appears here including
// rejected/failed ones; replay re-dispatches through the same handler.

const STATUS_COLORS = {
  PROCESSED: 'success', FAILED: 'error', REJECTED: 'warning', RECEIVED: 'default',
};

const WebhookConsole = () => {
  const theme = useTheme();
  const [deliveries, setDeliveries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/webhooks?page=${page}&limit=25`);
      setDeliveries(res.data.deliveries || []);
      const { pagination } = res.data;
      setTotalPages(Math.max(1, Math.ceil((pagination?.total || 0) / (pagination?.limit || 25))));
    } catch {
      setNotice('Could not load deliveries');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const replay = async (id) => {
    setNotice('');
    try {
      await axios.post(`/api/admin/webhooks/${id}/replay`);
      setNotice(`Replayed ${id.slice(0, 8)}… — refresh to see the new entry`);
      load();
    } catch (e) {
      setNotice(`Replay failed: ${e.response?.data?.error || e.message}`);
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 1 }}>
          Webhook Console
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Every inbound webhook is logged before verification — rejected and failed
          deliveries included. Replay re-dispatches the stored payload through the
          same handler (idempotency-protected).
        </Typography>

        {notice && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: theme.palette.action.hover }}>
            <Typography variant="body2">{notice}</Typography>
          </Paper>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signature</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={20} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : deliveries.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No webhook deliveries yet</Typography></TableCell></TableRow>
              ) : deliveries.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{new Date(d.created_at).toLocaleString('en-GB')}</TableCell>
                  <TableCell><Chip size="small" label={d.source} variant="outlined" /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.event_type || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={d.status} color={STATUS_COLORS[d.status] || 'default'} />
                    {d.error && (
                      <Tooltip title={d.error}><Chip size="small" label="err" color="error" variant="outlined" sx={{ ml: 0.5 }} /></Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{d.signature_valid === true ? '✓' : d.signature_valid === false ? '✗' : '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Replay"><Button size="small" startIcon={<ReplayIcon />} onClick={() => replay(d.id)}>Replay</Button></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} size="small" />
        </Box>

        {deliveries.length > 0 && (
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Raw deliveries (latest payloads)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ m: 0, p: 2, borderRadius: 2, maxHeight: 400, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.04)', fontSize: '0.75rem' }}>
                {JSON.stringify(deliveries, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default WebhookConsole;
