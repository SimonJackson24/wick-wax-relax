import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';

// Revolut.js payment frame.
//
// Revolut.js is loaded from Revolut's CDN and mounts a secure card frame
// INSIDE our page — card data never touches our server (the same PCI
// model as Stripe Elements). The flow:
//
//   1. Order created server-side -> payment intent + clientSecret
//   2. RevolutPay(paymentIntentId, clientSecret) mounts the frame
//   3. confirmPayment() -> Revolut processes the card
//   4. On success the backend records the new payment status
//
// Requires REVOLUT_API_KEY on the backend so the intent is created in
// sandbox mode. Without a key, the order API returns an error and the
// checkout surfaces it rather than pretending to take money.

const REVOLUT_SCRIPT = 'https://js.revolut.com/web/v1/revolut.js';

let scriptPromise = null;

// Load Revolut.js once per page session.
function loadRevolutScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    if (window.RevolutPay) return resolve(window.RevolutPay);
    const existing = document.querySelector(`script[src="${REVOLUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.RevolutPay));
      existing.addEventListener('error', () => reject(new Error('Revolut.js failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = REVOLUT_SCRIPT;
    script.async = true;
    script.onload = () => (window.RevolutPay ? resolve(window.RevolutPay) : reject(new Error('Revolut.js loaded but RevolutPay is missing')));
    script.onerror = () => reject(new Error('Revolut.js failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const RevolutPayment = ({ paymentIntentId, clientSecret, email, amount, onPaid, onError }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');
  const revolutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadRevolutScript()
      .then((RevolutPay) => {
        if (cancelled || !containerRef.current) return;
        revolutRef.current = RevolutPay(paymentIntentId, clientSecret);
        revolutRef.current
          .create('card', { container: containerRef.current })
          .then(() => {
            if (!cancelled) setLoading(false);
          })
          .catch((err) => {
            if (cancelled) return;
            setLoading(false);
            setNotice(err && err.message ? err.message : 'Could not load the payment form');
            if (onError) onError(err);
          });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoading(false);
        setNotice(err.message);
        if (onError) onError(err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIntentId, clientSecret]);

  const handlePay = async () => {
    if (!revolutRef.current) return;
    setPaying(true);
    setNotice('');
    try {
      const result = await revolutRef.current.confirmPayment({ email });
      if (result && result.paymentStatus === 'succeeded') {
        if (onPaid) onPaid(result);
      } else {
        const message = (result && result.errorMessage) || 'Payment was not completed';
        setNotice(message);
        if (onError) onError(result);
      }
    } catch (err) {
      const message = (err && err.message) || 'Payment failed — please try again';
      setNotice(message);
      if (onError) onError(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <CreditCardIcon color="action" />
        <Typography variant="h6" fontWeight={600}>
          Payment
        </Typography>
      </Box>

      {amount != null && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Amount due: £{Number(amount).toFixed(2)}
        </Typography>
      )}

      <Box
        ref={containerRef}
        sx={{
          minHeight: loading ? 48 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {loading && <CircularProgress size={22} />}
      </Box>

      {notice && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handlePay}
        disabled={loading || paying || !revolutRef.current}
        sx={{ textTransform: 'none', fontWeight: 700, py: 1.5, fontSize: '1rem' }}
      >
        {paying ? 'Processing payment…' : 'Pay now'}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
        Card details are entered securely in Revolut&apos;s frame — they never touch our servers.
      </Typography>
    </Box>
  );
};

export default RevolutPayment;
