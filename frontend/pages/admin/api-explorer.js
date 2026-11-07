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

// GENERATED from backend/server.js mounts × router definitions in
// backend/routes/*.js — regenerate when routes change.
const ENDPOINTS = [
    { group: '/api/admin (18)' },
    { m: 'GET', p: '/api/admin/dashboard' },
    { m: 'GET', p: '/api/admin/analytics/sales' },
    { m: 'GET', p: '/api/admin/analytics/products' },
    { m: 'GET', p: '/api/admin/analytics/customers' },
    { m: 'GET', p: '/api/admin/users' },
    { m: 'GET', p: '/api/admin/users/:id' },
    { m: 'PATCH', p: '/api/admin/users/:id' },
    { m: 'GET', p: '/api/admin/export/:type' },
    { m: 'GET', p: '/api/admin/products' },
    { m: 'GET', p: '/api/admin/products/:id' },
    { m: 'POST', p: '/api/admin/products' },
    { m: 'PUT', p: '/api/admin/products/:id' },
    { m: 'DELETE', p: '/api/admin/products/:id' },
    { m: 'POST', p: '/api/admin/products/bulk' },
    { m: 'GET', p: '/api/admin/categories' },
    { m: 'POST', p: '/api/admin/categories' },
    { m: 'PUT', p: '/api/admin/categories/:id' },
    { m: 'DELETE', p: '/api/admin/categories/:id' },
    { group: '/api/admin/settings (11)' },
    { m: 'GET', p: '/api/admin/settings/' },
    { m: 'GET', p: '/api/admin/settings/category/:category' },
    { m: 'GET', p: '/api/admin/settings/:category/:key' },
    { m: 'PUT', p: '/api/admin/settings/:category/:key' },
    { m: 'POST', p: '/api/admin/settings/bulk' },
    { m: 'DELETE', p: '/api/admin/settings/:category/:key' },
    { m: 'GET', p: '/api/admin/settings/:category/:key/audit' },
    { m: 'GET', p: '/api/admin/settings/export/all' },
    { m: 'POST', p: '/api/admin/settings/import' },
    { m: 'GET', p: '/api/admin/settings/summary/dashboard' },
    { m: 'POST', p: '/api/admin/settings/validate/:category/:key' },
    { group: '/api/amazon (8)' },
    { m: 'POST', p: '/api/amazon/sync-inventory' },
    { m: 'GET', p: '/api/amazon/inventory' },
    { m: 'GET', p: '/api/amazon/orders' },
    { m: 'POST', p: '/api/amazon/pricing' },
    { m: 'POST', p: '/api/amazon/sync-catalog' },
    { m: 'GET', p: '/api/amazon/reports/sales' },
    { m: 'POST', p: '/api/amazon/webhook' },
    { m: 'GET', p: '/api/amazon/health' },
    { group: '/api/auth (15)' },
    { m: 'POST', p: '/api/auth/register' },
    { m: 'POST', p: '/api/auth/login' },
    { m: 'POST', p: '/api/auth/mfa/enroll-start' },
    { m: 'POST', p: '/api/auth/mfa/enroll-verify' },
    { m: 'POST', p: '/api/auth/mfa/verify' },
    { m: 'POST', p: '/api/auth/mfa/disable' },
    { m: 'POST', p: '/api/auth/mfa/recovery-codes' },
    { m: 'GET', p: '/api/auth/mfa/status' },
    { m: 'GET', p: '/api/auth/verify' },
    { m: 'GET', p: '/api/auth/profile' },
    { m: 'POST', p: '/api/auth/refresh' },
    { m: 'POST', p: '/api/auth/logout' },
    { m: 'POST', p: '/api/auth/forgot-password' },
    { m: 'POST', p: '/api/auth/reset-password' },
    { m: 'GET', p: '/api/auth/verify-reset-token/:token' },
    { group: '/api/categories (17)' },
    { m: 'GET', p: '/api/categories/hierarchical' },
    { m: 'GET', p: '/api/categories/hierarchical/parents' },
    { m: 'GET', p: '/api/categories/hierarchical/slug/:slug' },
    { m: 'GET', p: '/api/categories/hierarchical/:categoryId/products' },
    { m: 'GET', p: '/api/categories/hierarchical/product/:productId' },
    { m: 'GET', p: '/api/categories/hierarchical/filters' },
    { m: 'POST', p: '/api/categories/hierarchical' },
    { m: 'PUT', p: '/api/categories/hierarchical/:id' },
    { m: 'DELETE', p: '/api/categories/hierarchical/:id' },
    { m: 'POST', p: '/api/categories/hierarchical/product/:productId/category/:categoryId' },
    { m: 'DELETE', p: '/api/categories/hierarchical/product/:productId/category/:categoryId' },
    { m: 'PUT', p: '/api/categories/hierarchical/product/:productId/categories' },
    { m: 'POST', p: '/api/categories/hierarchical/migrate' },
    { m: 'GET', p: '/api/categories/' },
    { m: 'POST', p: '/api/categories/' },
    { m: 'PUT', p: '/api/categories/:id' },
    { m: 'DELETE', p: '/api/categories/:id' },
    { group: '/api/etsy (13)' },
    { m: 'POST', p: '/api/etsy/sync-inventory' },
    { m: 'GET', p: '/api/etsy/listings' },
    { m: 'GET', p: '/api/etsy/listings/:listingId' },
    { m: 'PUT', p: '/api/etsy/listings/:listingId/inventory' },
    { m: 'POST', p: '/api/etsy/listings' },
    { m: 'PATCH', p: '/api/etsy/listings/:listingId' },
    { m: 'GET', p: '/api/etsy/orders' },
    { m: 'GET', p: '/api/etsy/orders/:receiptId' },
    { m: 'PUT', p: '/api/etsy/orders/:receiptId/status' },
    { m: 'GET', p: '/api/etsy/reviews' },
    { m: 'GET', p: '/api/etsy/stats' },
    { m: 'POST', p: '/api/etsy/webhook' },
    { m: 'GET', p: '/api/etsy/health' },
    { group: '/api/export (8)' },
    { m: 'GET', p: '/api/export/invoice/:orderId' },
    { m: 'POST', p: '/api/export/invoices/bulk' },
    { m: 'GET', p: '/api/export/orders/csv' },
    { m: 'GET', p: '/api/export/orders/items/csv' },
    { m: 'GET', p: '/api/export/customer/summary/csv' },
    { m: 'GET', p: '/api/export/stats' },
    { m: 'GET', p: '/api/export/download/:fileName' },
    { m: 'POST', p: '/api/export/cleanup' },
    { group: '/api/gdpr (5)' },
    { m: 'GET', p: '/api/gdpr/export/:id' },
    { m: 'DELETE', p: '/api/gdpr/delete/:id' },
    { m: 'POST', p: '/api/gdpr/consent/:id' },
    { m: 'GET', p: '/api/gdpr/consent/:id' },
    { m: 'GET', p: '/api/gdpr/portability/:id' },
    { group: '/api/inventory (9)' },
    { m: 'GET', p: '/api/inventory/' },
    { m: 'GET', p: '/api/inventory/alerts' },
    { m: 'POST', p: '/api/inventory/alerts/send' },
    { m: 'POST', p: '/api/inventory/sync/:channel' },
    { m: 'PATCH', p: '/api/inventory/bulk' },
    { m: 'GET', p: '/api/inventory/audit' },
    { m: 'GET', p: '/api/inventory/reports' },
    { m: 'GET', p: '/api/inventory/reports/movements' },
    { m: 'GET', p: '/api/inventory/reports/value' },
    { group: '/api/orders (14)' },
    { m: 'POST', p: '/api/orders/' },
    { m: 'POST', p: '/api/orders/guest' },
    { m: 'GET', p: '/api/orders/' },
    { m: 'GET', p: '/api/orders/:id' },
    { m: 'PATCH', p: '/api/orders/:id/status' },
    { m: 'POST', p: '/api/orders/:id/confirm-payment' },
    { m: 'GET', p: '/api/orders/admin/stats' },
    { m: 'POST', p: '/api/orders/:id/tracking' },
    { m: 'GET', p: '/api/orders/:id/tracking' },
    { m: 'POST', p: '/api/orders/:id/tracking/refresh' },
    { m: 'POST', p: '/api/orders/bulk/status' },
    { m: 'GET', p: '/api/orders/admin/analytics' },
    { m: 'POST', p: '/api/orders/:id/notify' },
    { m: 'GET', p: '/api/orders/admin/dashboard/:status' },
    { group: '/api/products (12)' },
    { m: 'GET', p: '/api/products/:id/reviews' },
    { m: 'POST', p: '/api/products/:id/reviews/photo' },
    { m: 'POST', p: '/api/products/:id/reviews' },
    { m: 'GET', p: '/api/products/' },
    { m: 'GET', p: '/api/products/featured' },
    { m: 'GET', p: '/api/products/new' },
    { m: 'GET', p: '/api/products/related/:id' },
    { m: 'GET', p: '/api/products/category/:categorySlug' },
    { m: 'GET', p: '/api/products/categories/all' },
    { m: 'GET', p: '/api/products/:id/fbt' },
    { m: 'GET', p: '/api/products/slug/:slug' },
    { m: 'GET', p: '/api/products/:id' },
    { group: '/api/promo (2)' },
    { m: 'POST', p: '/api/promo/validate' },
    { m: 'GET', p: '/api/promo/codes' },
    { group: '/api/push (7)' },
    { m: 'POST', p: '/api/push/subscribe' },
    { m: 'POST', p: '/api/push/unsubscribe' },
    { m: 'POST', p: '/api/push/test' },
    { m: 'POST', p: '/api/push/order-status' },
    { m: 'POST', p: '/api/push/product-available' },
    { m: 'POST', p: '/api/push/promotion' },
    { m: 'GET', p: '/api/push/vapid-public-key' },
    { group: '/api/search (15)' },
    { m: 'GET', p: '/api/search/products' },
    { m: 'GET', p: '/api/search/advanced' },
    { m: 'GET', p: '/api/search/suggestions' },
    { m: 'GET', p: '/api/search/popular' },
    { m: 'GET', p: '/api/search/filters' },
    { m: 'POST', p: '/api/search/facets' },
    { m: 'GET', p: '/api/search/related/:productId' },
    { m: 'POST', p: '/api/search/analytics/log' },
    { m: 'GET', p: '/api/search/sku/:sku' },
    { m: 'GET', p: '/api/search/category/:categorySlug' },
    { m: 'GET', p: '/api/search/admin/products' },
    { m: 'GET', p: '/api/search/admin/analytics' },
    { m: 'GET', p: '/api/search/health' },
    { m: 'POST', p: '/api/search/admin/clear-cache' },
    { m: 'POST', p: '/api/search/admin/reindex' },
    { group: '/api/seo (13)' },
    { m: 'GET', p: '/api/seo/meta/:pageType/:id?' },
    { m: 'GET', p: '/api/seo/sitemap.xml' },
    { m: 'GET', p: '/api/seo/robots.txt' },
    { m: 'POST', p: '/api/seo/analyze' },
    { m: 'GET', p: '/api/seo/report' },
    { m: 'POST', p: '/api/seo/duplicate-check' },
    { m: 'POST', p: '/api/seo/generate-slug' },
    { m: 'POST', p: '/api/seo/recommendations' },
    { m: 'POST', p: '/api/seo/bulk-analysis' },
    { m: 'GET', p: '/api/seo/performance' },
    { m: 'GET', p: '/api/seo/settings' },
    { m: 'PUT', p: '/api/seo/settings' },
    { m: 'GET', p: '/api/seo/health' },
    { group: '/api/subscriptions (21)' },
    { m: 'GET', p: '/api/subscriptions/plans' },
    { m: 'GET', p: '/api/subscriptions/plans/:planId' },
    { m: 'POST', p: '/api/subscriptions/calculate-savings' },
    { m: 'GET', p: '/api/subscriptions/' },
    { m: 'GET', p: '/api/subscriptions/:subscriptionId' },
    { m: 'POST', p: '/api/subscriptions/' },
    { m: 'PATCH', p: '/api/subscriptions/:subscriptionId' },
    { m: 'POST', p: '/api/subscriptions/:subscriptionId/pause' },
    { m: 'POST', p: '/api/subscriptions/:subscriptionId/resume' },
    { m: 'POST', p: '/api/subscriptions/:subscriptionId/cancel' },
    { m: 'GET', p: '/api/subscriptions/user/summary' },
    { m: 'GET', p: '/api/subscriptions/admin/all' },
    { m: 'POST', p: '/api/subscriptions/admin/plans' },
    { m: 'PATCH', p: '/api/subscriptions/admin/plans/:planId' },
    { m: 'DELETE', p: '/api/subscriptions/admin/plans/:planId' },
    { m: 'POST', p: '/api/subscriptions/admin/process-orders' },
    { m: 'GET', p: '/api/subscriptions/admin/analytics' },
    { m: 'GET', p: '/api/subscriptions/admin/attention-required' },
    { m: 'POST', p: '/api/subscriptions/validate-address' },
    { m: 'GET', p: '/api/subscriptions/status-colors' },
    { m: 'GET', p: '/api/subscriptions/health' },
    { group: '/api/suppliers (11)' },
    { m: 'GET', p: '/api/suppliers/' },
    { m: 'GET', p: '/api/suppliers/:id' },
    { m: 'POST', p: '/api/suppliers/' },
    { m: 'PUT', p: '/api/suppliers/:id' },
    { m: 'DELETE', p: '/api/suppliers/:id' },
    { m: 'GET', p: '/api/suppliers/:id/products' },
    { m: 'POST', p: '/api/suppliers/:id/products' },
    { m: 'PUT', p: '/api/suppliers/:supplierId/products/:productId' },
    { m: 'DELETE', p: '/api/suppliers/:supplierId/products/:productId' },
    { m: 'GET', p: '/api/suppliers/:id/orders' },
    { m: 'POST', p: '/api/suppliers/:id/orders' },
    { group: '/api/sync (9)' },
    { m: 'POST', p: '/api/sync/inventory' },
    { m: 'POST', p: '/api/sync/orders' },
    { m: 'POST', p: '/api/sync/product/:variantId' },
    { m: 'GET', p: '/api/sync/status' },
    { m: 'GET', p: '/api/sync/history' },
    { m: 'GET', p: '/api/sync/discrepancies' },
    { m: 'POST', p: '/api/sync/schedule' },
    { m: 'POST', p: '/api/sync/schedule/stop' },
    { m: 'GET', p: '/api/sync/health' },
    { group: '/api/tracking (6)' },
    { m: 'GET', p: '/api/tracking/:orderId' },
    { m: 'POST', p: '/api/tracking/:orderId/tracking' },
    { m: 'POST', p: '/api/tracking/:orderId/refresh' },
    { m: 'PATCH', p: '/api/tracking/:orderId/status' },
    { m: 'GET', p: '/api/tracking/:orderId/history' },
    { m: 'POST', p: '/api/tracking/webhook/royal-mail' },
    { group: '/api/upload (4)' },
    { m: 'POST', p: '/api/upload/product-image' },
    { m: 'POST', p: '/api/upload/product-images' },
    { m: 'DELETE', p: '/api/upload/product-image/:id' },
    { m: 'PUT', p: '/api/upload/product-image/:id' },
    { group: '/api/users (5)' },
    { m: 'GET', p: '/api/users/profile' },
    { m: 'GET', p: '/api/users/addresses' },
    { m: 'POST', p: '/api/users/addresses' },
    { m: 'PUT', p: '/api/users/addresses/:id' },
    { m: 'DELETE', p: '/api/users/addresses/:id' },
    { group: '/api/wishlist (6)' },
    { m: 'GET', p: '/api/wishlist/' },
    { m: 'POST', p: '/api/wishlist/' },
    { m: 'DELETE', p: '/api/wishlist/:productId' },
    { m: 'GET', p: '/api/wishlist/check/:productId' },
    { m: 'GET', p: '/api/wishlist/count' },
    { m: 'DELETE', p: '/api/wishlist/' },
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
