import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { SITE_URL } from '../../utils/siteConfig';

// CLP Label Kit — generates the print-ready 50×30mm compliance label for
// a product, plus a QR code pointing at the product page's full Safety &
// Compliance section (#clp anchor, rendered by ClpDisclosure).
//
// The physical label carries the MANDATORY CLP elements (that is the law
// — the QR supplements it with the full plain-English detail, it never
// replaces it). Hazard pictograms render as GHS codes; drop the official
// diamond PNGs into public/images/clp/GHS02.png etc. and they will be
// used automatically when present.

const PICTOGRAM_NAMES = {
  GHS01: 'EXP', GHS02: 'FLAME', GHS03: 'OXID', GHS04: 'GAS',
  GHS05: 'CORR', GHS06: 'TOXIC', GHS07: 'HARM', GHS08: 'HEALTH', GHS09: 'ENV',
};

const ClpLabelKit = ({ product, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const clpUrl = product ? `${SITE_URL}/product/${product.slug}#clp` : '';

  useEffect(() => {
    if (!clpUrl) return;
    QRCode.toDataURL(clpUrl, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [clpUrl]);

  if (!product) return null;

  const allergens = product.clp_allergens || [];
  const pictograms = product.clp_hazard_pictograms || [];

  if (product.clp_exempt) {
    return (
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>CLP Label Kit — {product.name}</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            This product is marked <strong>CLP-exempt</strong> — no CLP label is
            generated for it. If that's wrong, untick "CLP not required" in the
            product form.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="clp-kit-no-print">CLP Label Kit — {product.name}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" className="clp-kit-no-print" sx={{ mb: 2 }}>
          Print on <strong>50 × 30mm</strong> thermal/sticker labels. The QR code
          supplements the label (links to the full Safety &amp; Compliance section) —
          the mandatory elements must remain physically printed. Add official GHS
          diamond images at <code>public/images/clp/GHS02.png</code> etc. to replace
          the text pictograms.
        </Alert>

        {/* The label itself — sized in mm for print, scaled on screen */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            className="clp-label"
            sx={{
              width: '380px', // on-screen approximation of 50mm
              transform: { xs: 'scale(0.85)', sm: 'none' },
              transformOrigin: 'top left',
              border: '2px solid #000',
              p: 1,
              fontFamily: '"Arial", sans-serif',
              bgcolor: '#fff',
              color: '#000',
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '11px', lineHeight: 1.2 }}>
              {product.name}
            </Typography>
            {product.clp_signal_word && (
              <Typography sx={{ fontWeight: 900, fontSize: '12px', lineHeight: 1.3 }}>
                {product.clp_signal_word}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 0.5, my: 0.5, alignItems: 'center' }}>
              {pictograms.map((code) => (
                <Box
                  key={code}
                  component="img"
                  src={`/images/clp/${code}.png`}
                  alt={code}
                  sx={{ width: 26, height: 26, border: '1.5px solid #d32f2f', transform: 'rotate(45deg)', objectFit: 'contain' }}
                  onError={(e) => {
                    // No official PNG — fall back to a text diamond
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ))}
              {pictograms.length > 0 && (
                <Typography sx={{ fontSize: '9px' }}>
                  {pictograms.map((c) => `${c}(${PICTOGRAM_NAMES[c] || '?'})`).join(' ')}
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: '9.5px', lineHeight: 1.35 }}>
              {(product.clp_hazard_statements || []).join(' ')}
            </Typography>
            <Typography sx={{ fontSize: '9.5px', lineHeight: 1.35 }}>
              {(product.clp_precautionary_statements || []).slice(0, 6).join(' ')}
            </Typography>
            {allergens.length > 0 && (
              <Typography sx={{ fontSize: '9px', lineHeight: 1.35 }}>
                Contains {allergens.join(', ')}. May produce an allergic reaction.
              </Typography>
            )}
            {product.ufi_code && (
              <Typography sx={{ fontSize: '9px' }}>UFI: {product.ufi_code}</Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 0.5 }}>
              <Typography sx={{ fontSize: '8.5px', lineHeight: 1.3, maxWidth: '70%' }}>
                {product.clp_responsible_name}
                {product.weight_grams ? ` · ${product.weight_grams}g` : ''}
              </Typography>
              {qrDataUrl && (
                <Box component="img" src={qrDataUrl} alt="Product safety info QR" sx={{ width: 52, height: 52 }} />
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className="clp-kit-no-print">
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print Label
        </Button>
      </DialogActions>

      {/* Print CSS: only the label prints, at true 50×30mm */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .clp-label, .clp-label * { visibility: visible; }
          .clp-kit-no-print { display: none !important; }
          .clp-label {
            position: absolute; left: 0; top: 0;
            width: 50mm !important; height: 30mm !important;
            transform: none !important; border: 1px solid #000;
          }
          @page { size: 50mm 30mm; margin: 0; }
        }
      `}</style>
    </Dialog>
  );
};

export default ClpLabelKit;
