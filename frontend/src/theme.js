import { createTheme } from '@mui/material/styles';

// "The Ritual" — editorial, gallery-led design system.
//
// The previous system used a pastel as the primary (button) colour and a
// beige page + beige cards, which read flat and dated. This version:
//   INK    near-black warm text
//   PLUM   deep aubergine — the single saturated brand colour, owns CTAs
//   LAVENDER/CLAY/GOLD  accents only (borders, washes, chips, badges)
//   PAPER  crisp white-cream page, SAND for section bands
//   Borders replace drop shadows; radius 6 not 12; no hover-lift.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3D2B3D', // PLUM — deep aubergine, candle-lit
      light: '#5A4260',
      dark: '#2A1D2A',
      contrastText: '#FDFCFA',
    },
    secondary: {
      main: '#C8B6DB', // LAVENDER — accent (retained brand tone, demoted)
      light: '#DDD0E9',
      dark: '#A995BD',
      contrastText: '#2A1D2A',
    },
    tertiary: {
      main: '#C9846B', // CLAY — warmth, urgency chips
      light: '#DCA08B',
      dark: '#A86853',
      contrastText: '#FFFFFF',
    },
    // `accent` is referenced 14 times across the app (auth pages, admin
    // panels) but was never defined in the palette — every one of those
    // renders threw "Cannot read properties of undefined (reading 'main')".
    // Mirrors `tertiary` so both names resolve to the same warm clay.
    accent: {
      main: '#C9846B',
      light: '#DCA08B',
      dark: '#A86853',
      contrastText: '#FFFFFF',
    },
    success: { main: '#4A7C59' },
    warning: { main: '#C9846B' },
    error: { main: '#B3261E' },
    info: { main: '#3D6B8E' },
    background: {
      default: '#FDFCFA', // PAPER — crisp
      paper: '#FFFFFF',
      subtle: '#F4EFE7', // SAND — section bands
    },
    text: {
      primary: '#1C1A1F', // INK
      secondary: '#6B6570',
    },
    divider: '#E8E2D9',
  },

  typography: {
    // next/font self-hosted families via CSS variables (see _app.js) —
    // falls back to the same named families if a variable is absent.
    fontFamily: 'var(--font-montserrat), "Montserrat", "Helvetica Neue", Arial, sans-serif',
    // Display — the editorial voice. Weight 500 gives real contrast
    // against the light body copy (previously everything was 400).
    h1: {
      fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
      fontWeight: 500,
      fontSize: 'clamp(2.75rem, 6.2vw, 4.75rem)',
      lineHeight: 1.04,
      letterSpacing: '-0.02em',
      color: '#1C1A1F',
    },
    h2: {
      fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
      fontWeight: 500,
      fontSize: 'clamp(2rem, 4.2vw, 3.25rem)',
      lineHeight: 1.1,
      letterSpacing: '-0.015em',
      color: '#1C1A1F',
    },
    h3: {
      fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
      fontWeight: 500,
      fontSize: 'clamp(1.6rem, 3vw, 2.35rem)',
      lineHeight: 1.16,
      letterSpacing: '-0.01em',
      color: '#1C1A1F',
    },
    h4: {
      fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
      fontWeight: 500,
      fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)',
      lineHeight: 1.25,
      color: '#1C1A1F',
    },
    h5: {
      fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.3,
      color: '#1C1A1F',
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
      color: '#1C1A1F',
    },
    body1: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.75,
      color: '#3A3740',
    },
    body2: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.7,
      color: '#6B6570',
    },
    button: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '0.9375rem',
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    subtitle1: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#3A3740',
    },
    subtitle2: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      color: '#3A3740',
    },
    caption: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#8A8494',
    },
    // The "expensive" signal — small tracked-out uppercase labels.
    overline: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
      fontSize: '0.6875rem',
      lineHeight: 1.6,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#8A8494',
    },
  },

  shape: { borderRadius: 6 },

  // Layered, natural shadows. A single soft shadow reads flat; stacking a
  // tight contact shadow with a wide ambient one reads as physical depth.
  shadows: [
    'none',
    '0 1px 2px rgba(28,26,31,0.04), 0 2px 8px rgba(28,26,31,0.05)',
    '0 2px 4px rgba(28,26,31,0.05), 0 8px 24px rgba(28,26,31,0.07)',
    '0 4px 8px rgba(28,26,31,0.06), 0 16px 40px rgba(28,26,31,0.09)',
    '0 8px 16px rgba(28,26,31,0.07), 0 32px 64px rgba(28,26,31,0.11)',
    '0 12px 24px rgba(28,26,31,0.08), 0 48px 96px rgba(28,26,31,0.13)',
    ...Array(19).fill('0 12px 24px rgba(28,26,31,0.08), 0 48px 96px rgba(28,26,31,0.13)'),
  ],

  // Design tokens used by the auth pages (signup / forgot-password /
  // reset-password). These pages read theme.custom.* — a section that was
  // never defined, so they crashed on render (in the browser too: the
  // pages were broken, they just weren't server-rendered so the build
  // never complained). Restored here, matching the new design language.
  custom: {
    shape: {
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        pill: 999,
      },
    },
    typography: {
      h1: { fontWeight: 500 },
      h2: { fontWeight: 500 },
      h3: { fontWeight: 500 },
      h4: { fontWeight: 500 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4, // editorial, not pill
          padding: '12px 26px',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.01em',
          transition: 'background-color 240ms ease-out, border-color 240ms ease-out, color 240ms ease-out',
          // No translateY hover — every element moving reads as template.
        },
        containedPrimary: {
          backgroundColor: '#3D2B3D',
          '&:hover': { backgroundColor: '#2A1D2A' },
          boxShadow: 'none',
        },
        containedSecondary: {
          backgroundColor: '#C8B6DB',
          color: '#2A1D2A',
          '&:hover': { backgroundColor: '#DDD0E9' },
        },
        outlined: {
          borderWidth: 1,
          borderColor: '#D8D0C6',
          color: '#1C1A1F',
          '&:hover': { borderColor: '#3D2B3D', backgroundColor: 'rgba(61,43,61,0.04)' },
        },
        sizeLarge: { padding: '14px 32px', fontSize: '1rem' },
        sizeSmall: { padding: '8px 16px', fontSize: '0.8125rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E8E2D9', // hairline border, not shadow
          boxShadow: 'none',
          backgroundImage: 'none',
          transition: 'border-color 240ms ease-out, box-shadow 320ms ease-out, transform 320ms cubic-bezier(0.2,0,0,1)',
          '&:hover': {
            borderColor: '#D8D0C6',
            boxShadow: '0 2px 4px rgba(28,26,31,0.05), 0 12px 28px rgba(28,26,31,0.08)',
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 2px rgba(28,26,31,0.04), 0 2px 8px rgba(28,26,31,0.05)' },
        elevation2: { boxShadow: '0 2px 4px rgba(28,26,31,0.05), 0 8px 24px rgba(28,26,31,0.07)' },
        elevation3: { boxShadow: '0 4px 8px rgba(28,26,31,0.06), 0 16px 40px rgba(28,26,31,0.09)' },
        elevation4: { boxShadow: '0 8px 16px rgba(28,26,31,0.07), 0 32px 64px rgba(28,26,31,0.11)' },
        elevation6: { boxShadow: '0 12px 24px rgba(28,26,31,0.08), 0 48px 96px rgba(28,26,31,0.13)' },
        elevation8: { boxShadow: '0 16px 32px rgba(28,26,31,0.09), 0 64px 120px rgba(28,26,31,0.15)' },
        elevation12: { boxShadow: '0 24px 48px rgba(28,26,31,0.10), 0 80px 160px rgba(28,26,31,0.16)' },
        elevation16: { boxShadow: '0 32px 64px rgba(28,26,31,0.11), 0 96px 200px rgba(28,26,31,0.17)' },
        elevation24: { boxShadow: '0 48px 96px rgba(28,26,31,0.12), 0 120px 240px rgba(28,26,31,0.18)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            '& fieldset': { borderColor: '#E0D9CF', borderWidth: 1 },
            '&:hover fieldset': { borderColor: '#C8B6DB' },
            '&.Mui-focused fieldset': { borderColor: '#3D2B3D', borderWidth: 1 },
          },
          '& .MuiInputLabel-root': { color: '#6B6570' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#3D2B3D' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: 'rgba(61,43,61,0.06)' } },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#FDFCFA', color: '#1C1A1F', boxShadow: 'none' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#3D2B3D',
          textDecoration: 'none',
          '&:hover': { color: '#C9846B' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E8E2D9' } },
    },
  },
});

export default theme;
