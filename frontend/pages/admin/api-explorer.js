import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Select, FormControl, InputLabel,
  Button, Accordion, AccordionSummary, AccordionDetails, Chip, CircularProgress,
  Alert, List, ListItem, ListItemText, Divider, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';

// Raw API Explorer — Simon's requirement: every endpoint inspectable and
// callable from the admin, for manually verifying integrations.
//
// The manifest below is the curated catalog of the platform's API surface
// (kept in sync with backend/routes/*). Calls carry the admin session and
// the CSRF double-submit pair, exactly like the rest of the admin UI — so
// anything you can do here, the admin can already do; this just makes it
// visible and testable.

const ENDPOINTS = [
  { group: 'Products (public storefront)' },
  { m: 'GET', p: '/api/products', note: 'ACTIVE products (list)' },
  { m: 'GET', p: '/api/products/featured', note: 'Featured 8' },
  { m: 'GET', p: '/api/products/new', note: 'Newest 8' },
  { m: 'GET', p: '/api/products/{uuid|slug}', note: 'PDP payload by id or slug' },
  { m: 'GET', p: '/api/products/{uuid}/reviews?sortBy=recent&rating=', note: 'Reviews + distribution' },
  { m: 'GET', p: '/api/products/{uuid}/questions', note: 'Q&A list' },
  { group: 'Categories' },
  { m: 'GET', p: '/api/categories', note: 'Flat list' },
  { m: 'GET', p: '/api/categories/hierarchical/parents', note: 'Tree roots' },
  { m: 'GET', p: '/api/categories/hierarchical/slug/{slug}', note: 'Category by slug' },
  { group: 'Search' },
  { m: 'GET', p: '/api/search/products?q=&minPrice=&maxPrice=&minRating=&sortBy=relevance', note: 'Faceted search' },
  { m: 'GET', p: '/api/search/suggestions?q=', note: 'Typeahead' },
  { m: 'GET', p: '/api/search/filters', note: 'Available facets' },
  { group: 'Admin — products & catalogue' },
  { m: 'GET', p: '/api/admin/products?page=1&limit=20&status=', note: 'Admin list (any status)' },
  { m: 'POST', p: '/api/admin/products', note: 'Create — body: name, description, scent_profile, base_price, variants[], categories[], + commerce/CLP fields' },
  { m: 'PUT', p: '/api/admin/products/{uuid}', note: 'Update core + commerce' },
  { m: 'DELETE', p: '/api/admin/products/{uuid}', note: 'Delete' },
  { m: 'GET', p: '/api/admin/categories', note: 'Categories' },
  { group: 'Admin — orders & ops' },
  { m: 'GET', p: '/api/admin/orders?page=1', note: 'Orders list' },
  { m: 'GET', p: '/api/admin/inventory', note: 'Stock levels' },
  { m: 'GET', p: '/api/admin/analytics/overview', note: 'Dashboard metrics' },
  { group: 'Admin — platform' },
  { m: 'GET', p: '/api/admin/settings', note: 'All settings incl. VAT switch' },
  { m: 'PUT', p: '/api/admin/settings/general/vat_registered', note: 'Body: { value: "true"|"false" } — the VAT flip' },
  { m: 'GET', p: '/api/seo/...', note: 'SEO tools (MFA-gated on server)' },
  { group: 'Health & diagnostics' },
  { m: 'GET', p: '/api/health', note: 'DB + Redis liveness (public, LB-facing)' },
];

const METHOD_COLORS = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'error' };

const ApiExplorer = () => {
  const theme = useTheme();
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/health');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    axios.get('/api/health').then((r) => setHealth(r.data)).catch(() => setHealth(null));
  }, []);

  const send = async () => {
    setSending(true);
    setResponse(null);
    try {
      // Mutating requests need the CSRF double-submit pair, same as the
      // rest of the admin app: take the cookie from any safe /api call.
      let headers = {};
      if (method !== 'GET') {
        const safe = await axios.get('/api/products');
        const raw = (safe.headers['set-cookie'] || []).find((c) => c.includes('csrfToken'));
        if (raw) {
          const token = decodeURIComponent(raw.split('csrfToken=')[1].split(';')[0]);
          headers['X-CSRF-Token'] = token;
        }
      }
      const res = await axios({
        method,
        url: path,
        headers,
        data: ['GET', 'DELETE'].includes(method) || !body.trim() ? undefined : JSON.parse(body),
        validateStatus: () => true, // explorer shows every status, never throws
      });
      setResponse({ status: res.status, statusText: res.statusText, data: res.data });
    } catch (e) {
      setResponse({ status: 0, statusText: 'Request failed', data: { error: e.message, hint: body.trim() ? 'Check the JSON body syntax' : 'Check the path' } });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 1 }}>
          API Explorer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The platform's API surface — inspect and call any endpoint with your admin session.
          Mutating requests carry the same CSRF protection as the admin UI.
        </Typography>

        {health && (
          <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <MonitorHeartIcon color={health.status === 'OK' ? 'success' : 'error'} />
            <Typography variant="body2">
              System: <strong>{health.status}</strong>
              {' · '}db: <strong>{health.checks?.db}</strong>
              {' · '}redis: <strong>{String(health.checks?.redis).slice(0, 40)}</strong>
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 110 }}>
              <InputLabel>Method</InputLabel>
              <Select value={method} onChange={(e) => setMethod(e.target.value)} label="Method">
                {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              sx={{ flex: 1, minWidth: 300 }}
              label="Path (replace {placeholders})"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
            <Button variant="contained" startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />} onClick={send} disabled={sending} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Send
            </Button>
          </Box>
          {method !== 'GET' && method !== 'DELETE' && (
            <TextField
              fullWidth
              multiline
              rows={5}
              label="JSON body"
              placeholder='{"name": "Lavender Dream", "base_price": 12.50}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{ fontFamily: 'monospace' }}
            />
          )}
        </Paper>

        {response && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                label={`${response.status} ${response.statusText}`}
                color={response.status >= 200 && response.status < 300 ? 'success' : response.status >= 500 ? 'error' : 'warning'}
              />
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0, p: 2, borderRadius: 2, maxHeight: 420, overflow: 'auto',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                fontSize: '0.8rem', fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(response.data, null, 2)}
            </Box>
          </Paper>
        )}

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Endpoint catalogue ({ENDPOINTS.filter((e) => e.m).length})</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              {ENDPOINTS.map((e, i) => e.group ? (
                <React.Fragment key={`g${i}`}>
                  <Divider />
                  <ListItem><ListItemText primary={<Typography variant="subtitle2" fontWeight={700}>{e.group}</Typography>} /></ListItem>
                </React.Fragment>
              ) : (
                <ListItem
                  key={i}
                  button
                  onClick={() => { setMethod(e.m); setPath(e.p.split('?')[0]); }}
                  secondaryAction={<Typography variant="caption" color="text.secondary">{e.note}</Typography>}
                >
                  <Chip size="small" label={e.m} color={METHOD_COLORS[e.m]} sx={{ mr: 1.5, minWidth: 54 }} />
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{e.p}</Typography>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </AdminLayout>
    </AdminProtectedRoute>
  );
};

export default ApiExplorer;
