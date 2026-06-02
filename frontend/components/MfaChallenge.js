import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

/**
 * Two-step MFA component used in two modes:
 *
 *   1. ENROLL  — the admin is setting up 2FA for the first time. We show
 *                the QR code + a 6-digit code entry, then on success we
 *                show the recovery codes (one-time display).
 *
 *   2. VERIFY  — the admin already has 2FA enabled and just needs to
 *                provide a 6-digit code (or a recovery code) to complete
 *                login.
 *
 * Props:
 *   mfaToken:   string — the challenge token from /login
 *   mode:       'enroll' | 'verify' (derived from requiresEnrollment)
 *   onSuccess:  (user) => void  — called once MFA is complete
 *   onCancel:   () => void      — called if the user backs out
 */
export default function MfaChallenge({ mfaToken, requiresEnrollment, onSuccess, onCancel }) {
  const {
    enrollMfaStart,
    enrollMfaVerify,
    verifyMfa,
  } = useAuth();

  const [phase, setPhase] = useState(requiresEnrollment ? 'loading-qr' : 'enter-code');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Enrollment state
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [otpauthUrl, setOtpauthUrl] = useState(null);
  const [enrollCode, setEnrollCode] = useState('');

  // Verify state
  const [tab, setTab] = useState(0); // 0 = code, 1 = recovery
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Post-enroll recovery code display
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (requiresEnrollment) {
        const result = await enrollMfaStart();
        if (cancelled) return;
        if (!result.success) {
          setError(result.error || 'Failed to start enrollment');
          return;
        }
        setQrDataUrl(result.qrDataUrl);
        setSecret(result.secret);
        setOtpauthUrl(result.otpauthUrl);
        setPhase('scan-qr');
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [requiresEnrollment, enrollMfaStart]);

  const submitEnroll = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(enrollCode)) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    const result = await enrollMfaVerify(enrollCode);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRecoveryCodes(result.recoveryCodes);
    setPhase('show-recovery');
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (tab === 0 && !/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app');
      return;
    }
    if (tab === 1 && !/^[0-9a-f]{20}$/i.test(recoveryCode)) {
      setError('Enter a 20-character recovery code');
      return;
    }
    const result = await verifyMfa(mfaToken, {
      code: tab === 0 ? code : undefined,
      recoveryCode: tab === 1 ? recoveryCode : undefined,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.user);
  };

  const copySecret = () => {
    if (secret && navigator.clipboard) {
      navigator.clipboard.writeText(secret).then(
        () => setInfo('Secret copied to clipboard'),
        () => setInfo('Could not copy — please write the secret down manually')
      );
    }
  };

  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const blob = new Blob(
      [
        'Wick Wax & Relax — MFA recovery codes\n',
        'Generated: ' + new Date().toISOString() + '\n',
        '\n',
        'Each code can only be used ONCE. Treat these like passwords — anyone with them can sign in as you.\n',
        '\n',
        ...recoveryCodes.map((c, i) => `${i + 1}. ${c}\n`),
        '\n',
        'If you lose these, sign in with the codes above and regenerate new ones from your account settings.\n',
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wick-wax-mfa-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={8} sx={{ p: 4, borderRadius: 2, maxWidth: 480, width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SecurityIcon color="primary" />
        <Typography variant="h5" component="h2">
          Two-factor authentication
        </Typography>
        {onCancel && phase !== 'show-recovery' && (
          <Tooltip title="Cancel and return to login">
            <IconButton onClick={onCancel} sx={{ ml: 'auto' }} aria-label="Cancel MFA">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="info" sx={{ mb: 2 }} role="status">
          {info}
        </Alert>
      )}

      {phase === 'loading-qr' && (
        <Typography>Preparing your authenticator setup…</Typography>
      )}

      {phase === 'scan-qr' && (
        <Box component="form" onSubmit={submitEnroll}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Scan this QR code with Google Authenticator, 1Password, Authy,
            Bitwarden, or any other TOTP app. Then enter the 6-digit code
            the app shows you.
          </Typography>
          {qrDataUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <img
                src={qrDataUrl}
                alt="TOTP QR code"
                style={{ width: 256, height: 256, border: '1px solid #ddd' }}
              />
            </Box>
          )}
          {secret && (
            <Box sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Or enter this secret manually if you can't scan:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <TextField
                  value={secret}
                  size="small"
                  fullWidth
                  inputProps={{
                    readOnly: true,
                    'aria-label': 'TOTP secret for manual entry',
                    style: { fontFamily: 'monospace' },
                  }}
                />
                <Tooltip title="Copy secret">
                  <IconButton onClick={copySecret} aria-label="Copy TOTP secret">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          )}
          <TextField
            label="6-digit code"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            margin="normal"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              autoComplete: 'one-time-code',
              'aria-label': 'Six-digit TOTP code',
            }}
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={enrollCode.length !== 6}
          >
            Confirm and enable 2FA
          </Button>
        </Box>
      )}

      {phase === 'show-recovery' && recoveryCodes && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Two-factor authentication is now active on your account.
          </Alert>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
            Save your recovery codes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These 10 codes can each be used once if you lose access to your
            authenticator. We do not store them — if you lose these, you
            will be locked out of your admin account. Save them somewhere
            safe (password manager, printed paper in a safe).
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 2, fontFamily: 'monospace', bgcolor: 'grey.50' }}
            aria-label="Recovery codes"
          >
            {recoveryCodes.map((c, i) => (
              <Box key={c} sx={{ py: 0.25 }}>
                {String(i + 1).padStart(2, '0')}. {c}
              </Box>
            ))}
          </Paper>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadRecoveryCodes}
            >
              Download as .txt
            </Button>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  setInfo('Recovery codes copied to clipboard');
                }
              }}
            >
              Copy
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={recoveryConfirmed}
              onChange={(e) => setRecoveryConfirmed(e.target.checked)}
            />
            <Typography variant="body2">
              I have saved these recovery codes in a safe place.
            </Typography>
          </label>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!recoveryConfirmed}
            onClick={() => onSuccess(recoveryCodes && { id: 'pending' })}
          >
            Continue to admin
          </Button>
        </Box>
      )}

      {phase === 'enter-code' && (
        <Box component="form" onSubmit={submitVerify}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Enter the 6-digit code from your authenticator app.
          </Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Authenticator code" />
            <Tab label="Recovery code" />
          </Tabs>
          {tab === 0 ? (
            <TextField
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              fullWidth
              margin="normal"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                autoComplete: 'one-time-code',
                'aria-label': 'Six-digit TOTP code',
              }}
              autoFocus
            />
          ) : (
            <TextField
              label="20-character recovery code"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.trim().slice(0, 20))}
              fullWidth
              margin="normal"
              inputProps={{
                style: { fontFamily: 'monospace' },
                'aria-label': 'Recovery code',
              }}
              autoFocus
            />
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={
              (tab === 0 && code.length !== 6) ||
              (tab === 1 && recoveryCode.length !== 20)
            }
          >
            Verify
          </Button>
        </Box>
      )}
    </Paper>
  );
}
