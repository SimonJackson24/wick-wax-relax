import { createTheme } from '@mui/material/styles';

// Luxury Candle & Wax Melt Theme
const colors = {
  primary: {
    main: '#722f37',      // Deep burgundy for primary elements
    light: '#9d4a55',    // Lighter burgundy for hover states
    dark: '#4a1c22',     // Darker burgundy for accents
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#d4af37',     // Antique gold for secondary elements
    light: '#e6c85c',    // Lighter antique gold
    dark: '#b8941f',     // Darker antique gold
    contrastText: '#2c1810',
  },
  accent: {
    main: '#c9a96e',     // Warm bronze for accents and CTAs
    light: '#d4b889',    // Lighter bronze
    dark: '#a8894f',     // Darker bronze
    contrastText: '#2c1810',
  },
  background: {
    default: '#faf8f5',  // Warm cream for page backgrounds
    paper: '#ffffff',    // Pure white for card backgrounds
    dark: '#2c1810',      // Deep charcoal for dark sections
    overlay: 'rgba(44, 24, 16, 0.8)', // Warm brown overlay
    luxury: '#f5f1eb',   // Luxury beige background
  },
  text: {
    primary: '#2c1810',  // Deep charcoal for primary text
    secondary: '#6b5b4f', // Warm taupe for secondary text
    disabled: '#a09487', // Muted gray for disabled text
    hint: '#c4b5a6',     // Light taupe for hints
    inverse: '#ffffff',  // White for text on dark backgrounds
    inverseSecondary: 'rgba(255, 255, 255, 0.9)', // Cream white for secondary text
  },
  error: {
    main: '#8b2635',     // Deep red for errors
    light: '#b33d4f',    // Lighter red
    dark: '#5d1a23',     // Darker red
    contrastText: '#ffffff',
  },
  success: {
    main: '#7a6b47',     // Warm olive for success
    light: '#9b8560',    // Lighter olive
    dark: '#5a4f35',     // Darker olive
    contrastText: '#ffffff',
  },
  warning: {
    main: '#c9a96e',     // Bronze for warnings
    light: '#d4b889',    // Lighter bronze
    dark: '#a8894f',     // Darker bronze
    contrastText: '#2c1810',
  },
  info: {
    main: '#8b7d6b',     // Warm taupe for info
    light: '#a89984',    // Lighter taupe
    dark: '#6b5f52',     // Darker taupe
    contrastText: '#ffffff',
  },
  divider: 'rgba(44, 24, 16, 0.12)', // Warm brown for dividers
  border: 'rgba(44, 24, 16, 0.08)',  // Subtle brown for borders
  shadow: 'rgba(44, 24, 16, 0.1)',   // Warm brown for shadows
};

// Elegant Typography
const typography = {
  fontFamily: '"Crimson Text", "Playfair Display", "Times New Roman", serif',
  fontSize: 16,
  h1: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 600,
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    lineHeight: 1.1,
    color: colors.text.primary,
    marginBottom: '1.5rem',
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 600,
    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
    lineHeight: 1.2,
    color: colors.text.primary,
    marginBottom: '1.25rem',
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 500,
    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
    lineHeight: 1.3,
    color: colors.text.primary,
    marginBottom: '1rem',
  },
  h4: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 500,
    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
    lineHeight: 1.4,
    color: colors.text.primary,
    marginBottom: '0.75rem',
  },
  h5: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 500,
    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
    lineHeight: 1.4,
    color: colors.text.primary,
    marginBottom: '0.75rem',
  },
  h6: {
    fontFamily: '"Crimson Text", "Playfair Display", serif',
    fontWeight: 500,
    fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
    lineHeight: 1.5,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  subtitle1: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '1.1rem', sm: '1.2rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
    letterSpacing: '0.01em',
  },
  subtitle2: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '1rem', sm: '1.1rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
    letterSpacing: '0.01em',
  },
  body1: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '1rem', sm: '1.1rem' },
    lineHeight: 1.7,
    color: colors.text.primary,
  },
  body2: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '0.9rem', sm: '1rem' },
    lineHeight: 1.6,
    color: colors.text.secondary,
  },
  button: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: { xs: '1rem', sm: '1.1rem' },
    lineHeight: 1.5,
    textTransform: 'none',
    letterSpacing: '0.02em',
  },
  caption: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '0.8rem', sm: '0.9rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
  overline: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeight: 500,
    fontSize: '0.8rem',
    lineHeight: 1.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  script: {
    fontFamily: '"Dancing Script", "Great Vibes", "Allura", cursive',
    fontWeight: 700,
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    lineHeight: 1.1,
    color: colors.text.primary,
    letterSpacing: '0.02em',
  },
};

// Luxury Spacing
const spacing = {
  unit: 8,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
  xxxl: 96,
  sectionPadding: {
    mobile: 64,
    tablet: 80,
    desktop: 96,
  },
  containerPadding: {
    xs: 20,
    sm: 32,
    md: 48,
    lg: 64,
  },
  cardPadding: {
    xs: 32,
    md: 40,
  },
  gridGap: {
    xs: 24,
    md: 32,
  },
  headerHeight: {
    mobile: 72,
    desktop: 88,
  },
  footerPadding: {
    mobile: 64,
    desktop: 80,
  },
};

// Elegant Shapes
const shape = {
  borderRadius: {
    none: 0,
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
    pill: '9999px',
    circle: '50%',
  },
  shadows: {
    none: 'none',
    xs: '0 2px 8px rgba(44, 24, 16, 0.08), 0 1px 3px rgba(44, 24, 16, 0.06)',
    sm: '0 4px 12px rgba(44, 24, 16, 0.1), 0 2px 6px rgba(44, 24, 16, 0.06)',
    md: '0 8px 20px rgba(44, 24, 16, 0.12), 0 4px 10px rgba(44, 24, 16, 0.08)',
    lg: '0 16px 32px rgba(44, 24, 16, 0.15), 0 8px 16px rgba(44, 24, 16, 0.1)',
    xl: '0 24px 48px rgba(44, 24, 16, 0.18), 0 12px 24px rgba(44, 24, 16, 0.12)',
    colored: {
      primary: '0 6px 20px rgba(114, 47, 55, 0.25)',
      secondary: '0 6px 20px rgba(212, 175, 55, 0.25)',
      accent: '0 6px 20px rgba(201, 169, 110, 0.25)',
    },
  },
  outline: {
    width: 1,
    color: colors.border,
  },
};

// Luxury Component Overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius.pill,
        fontWeight: typography.button.fontWeight,
        textTransform: typography.button.textTransform,
        padding: `${spacing.md}px ${spacing.lg}px`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: typography.button.fontSize,
        boxShadow: 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: shape.shadows.colored.secondary,
        },
      },
      contained: {
        background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.accent.main} 100%)`,
        color: colors.secondary.contrastText,
        border: `2px solid ${colors.secondary.main}`,
        '&:hover': {
          background: `linear-gradient(135deg, ${colors.accent.main} 0%, ${colors.secondary.main} 100%)`,
          borderColor: colors.accent.main,
          boxShadow: shape.shadows.colored.accent,
        },
      },
      outlined: {
        borderWidth: 2,
        borderColor: colors.secondary.main,
        color: colors.secondary.main,
        backgroundColor: 'transparent',
        '&:hover': {
          borderWidth: 2,
          borderColor: colors.secondary.dark,
          backgroundColor: `${colors.secondary.main}08`,
          color: colors.secondary.dark,
        },
      },
      sizeLarge: {
        padding: `${spacing.lg}px ${spacing.xl}px`,
        fontSize: '1.2rem',
      },
      sizeSmall: {
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontSize: '0.95rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius.lg,
        boxShadow: shape.shadows.sm,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.background.paper,
        '&:hover': {
          boxShadow: shape.shadows.lg,
          transform: 'translateY(-6px)',
          borderColor: colors.secondary.light,
        },
        overflow: 'hidden',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: shape.borderRadius.pill,
          backgroundColor: colors.background.default,
          '& fieldset': {
            borderColor: colors.border,
            borderWidth: 2,
          },
          '&:hover fieldset': {
            borderColor: colors.secondary.main,
            borderWidth: 2,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.secondary.main,
            borderWidth: 3,
          },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: shape.shadows.sm,
        backdropFilter: 'blur(20px)',
        backgroundColor: `${colors.background.paper}F0`,
        borderBottom: `1px solid ${colors.border}`,
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      h1: typography.h1,
      h2: typography.h2,
      h3: typography.h3,
      h4: typography.h4,
      h5: typography.h5,
      h6: typography.h6,
      subtitle1: typography.subtitle1,
      subtitle2: typography.subtitle2,
      body1: typography.body1,
      body2: typography.body2,
      button: typography.button,
      caption: typography.caption,
      overline: typography.overline,
    },
  },
  MuiContainer: {
    styleOverrides: {
      root: {
        paddingLeft: { xs: spacing.sm, sm: spacing.md, md: spacing.lg },
        paddingRight: { xs: spacing.sm, sm: spacing.md, md: spacing.lg },
      },
    },
  },
  MuiGrid: {
    styleOverrides: {
      root: {
        '&.MuiGrid-item': {
          paddingLeft: { xs: spacing.sm / 2, sm: spacing.md / 2, md: spacing.lg / 2 },
          paddingRight: { xs: spacing.sm / 2, sm: spacing.md / 2, md: spacing.lg / 2 },
        },
      },
    },
  },
};

// Create the luxury theme
const luxuryTheme = createTheme({
  palette: colors,
  typography: typography,
  spacing: spacing.unit,
  shape: {
    borderRadius: shape.borderRadius.md,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: components,
  shadows: [
    shape.shadows.none,
    shape.shadows.xs,
    shape.shadows.sm,
    shape.shadows.md,
    shape.shadows.lg,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
    shape.shadows.xl,
  ],
  custom: {
    colors,
    typography,
    spacing,
    shape,
  },
});

export default luxuryTheme;