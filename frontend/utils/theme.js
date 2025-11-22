import { createTheme } from '@mui/material/styles';

// Color palette
const colors = {
  primary: {
    main: '#1a1a2e',      // Deep blue for primary elements
    light: '#343652',    // Lighter shade for hover states
    dark: '#0d0e17',     // Darker shade for accents
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ffd700',     // Gold for secondary elements and highlights
    light: '#ffdf3a',    // Lighter gold
    dark: '#ccaa00',     // Darker gold
    contrastText: '#1a1a1a',
  },
  accent: {
    main: '#ffb347',     // Warm orange for accents and CTAs
    light: '#ffc36a',    // Lighter orange
    dark: '#cc8f39',     // Darker orange
    contrastText: '#1a1a1a',
  },
  background: {
    default: '#f9f9f9',  // Light gray for page backgrounds
    paper: '#ffffff',    // White for card backgrounds
    dark: '#1a1a2e',      // Dark blue for dark sections
    overlay: 'rgba(26, 26, 46, 0.7)', // Semi-transparent overlay
  },
  text: {
    primary: '#1a1a2e',  // Deep blue for primary text
    secondary: '#666666', // Medium gray for secondary text
    disabled: '#999999', // Light gray for disabled text
    hint: '#aaaaaa',     // Very light gray for hints
    inverse: '#ffffff',  // White for text on dark backgrounds
    inverseSecondary: 'rgba(255, 255, 255, 0.8)', // Secondary text on dark backgrounds
  },
  error: {
    main: '#f44336',     // Red for errors
    light: '#ff7961',    // Lighter red
    dark: '#ba000d',     // Darker red
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',     // Green for success
    light: '#80e27e',    // Lighter green
    dark: '#087f23',     // Darker green
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',     // Orange for warnings
    light: '#ffb74d',    // Lighter orange
    dark: '#e65100',     // Darker orange
    contrastText: '#ffffff',
  },
  info: {
    main: '#2196f3',     // Blue for info
    light: '#6ec6ff',    // Lighter blue
    dark: '#0069c0',     // Darker blue
    contrastText: '#ffffff',
  },
  divider: 'rgba(0, 0, 0, 0.12)', // For dividers and borders
  border: 'rgba(0, 0, 0, 0.08)',  // For borders
  shadow: 'rgba(0, 0, 0, 0.1)',   // For shadows
};

// Typography
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 16, // Base font size in px
  h1: {
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    fontWeight: 700,
    fontSize: 'clamp(2rem, 8vw, 4rem)',
    lineHeight: 1.1,
    color: colors.text.primary,
    marginBottom: '1rem',
  },
  h2: {
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    fontWeight: 700,
    fontSize: 'clamp(1.75rem, 5vw, 3rem)',
    lineHeight: 1.2,
    color: colors.text.primary,
    marginBottom: '0.75rem',
  },
  h3: {
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    fontWeight: 600,
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
    lineHeight: 1.3,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  h4: {
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    fontWeight: 600,
    fontSize: 'clamp(1.25rem, 3vw, 2rem)',
    lineHeight: 1.4,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  h5: {
    fontFamily: '"Playfair Display", "Times New Roman", serif',
    fontWeight: 600,
    fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    lineHeight: 1.4,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  h6: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    lineHeight: 1.5,
    color: colors.text.primary,
    marginBottom: '0.5rem',
  },
  subtitle1: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: { xs: '1rem', sm: '1.1rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
  subtitle2: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
  body1: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    lineHeight: 1.6,
    color: colors.text.primary,
  },
  body2: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '0.875rem', sm: '0.95rem' },
    lineHeight: 1.6,
    color: colors.text.secondary,
  },
  button: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    lineHeight: 1.5,
    textTransform: 'none',
  },
  caption: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: { xs: '0.75rem', sm: '0.85rem' },
    lineHeight: 1.5,
    color: colors.text.secondary,
  },
  overline: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  // Custom typography for special elements
  script: {
    fontFamily: '"Dancing Script", "Great Vibes", "Allura", cursive',
    fontWeight: 700,
    fontSize: 'clamp(2rem, 8vw, 4rem)',
    lineHeight: 1.1,
    color: colors.text.primary,
  },
};

// Spacing and padding rules
const spacing = {
  // Base spacing unit (8px)
  unit: 8,
  
  // Padding and margin values
  xs: 8,      // 0.5rem
  sm: 16,     // 1rem
  md: 24,     // 1.5rem
  lg: 32,     // 2rem
  xl: 48,     // 3rem
  xxl: 64,    // 4rem
  xxxl: 96,   // 6rem
  
  // Component-specific spacing
  sectionPadding: {
    mobile: 48,     // 3rem on mobile
    tablet: 64,     // 4rem on tablet
    desktop: 80,    // 5rem on desktop
  },
  containerPadding: {
    xs: 16,         // 1rem on mobile
    sm: 24,         // 1.5rem on small screens
    md: 32,         // 2rem on medium screens
    lg: 48,         // 3rem on large screens
  },
  cardPadding: {
    xs: 24,         // 1.5rem on mobile
    md: 32,         // 2rem on desktop
  },
  gridGap: {
    xs: 16,         // 1rem on mobile
    md: 24,         // 1.5rem on desktop
  },
  headerHeight: {
    mobile: 64,      // 4rem
    desktop: 80,    // 5rem
  },
  footerPadding: {
    mobile: 48,     // 3rem on mobile
    desktop: 64,    // 4rem on desktop
  },
};

// Border radius and shadow rules
const shape = {
  borderRadius: {
    none: 0,
    xs: 4,          // 0.25rem
    sm: 8,          // 0.5rem
    md: 12,         // 0.75rem
    lg: 16,         // 1rem
    xl: 24,         // 1.5rem
    xxl: 32,        // 2rem
    pill: '9999px',   // For pill-shaped buttons
    circle: '50%',  // For circular elements
  },
  shadows: {
    none: 'none',
    xs: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
    sm: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
    colored: {
      primary: '0 4px 15px rgba(26, 26, 46, 0.3)',
      secondary: '0 4px 15px rgba(255, 215, 0, 0.3)',
      accent: '0 4px 15px rgba(255, 179, 71, 0.3)',
    },
  },
  outline: {
    width: 1,
    color: colors.border,
  },
};

// Breakpoints
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Responsive utilities
const responsiveUtils = {
  // Responsive font sizes
  fontSize: {
    display: {
      xs: '2.5rem',
      sm: '3rem',
      md: '3.5rem',
      lg: '4rem',
    },
    heading: {
      xs: '1.5rem',
      sm: '1.75rem',
      md: '2rem',
      lg: '2.25rem',
    },
    body: {
      xs: '0.875rem',
      sm: '0.95rem',
      md: '1rem',
      lg: '1.1rem',
    },
  },
  // Responsive spacing
  padding: {
    section: {
      xs: `${spacing.md}px 0`,
      sm: `${spacing.lg}px 0`,
      md: `${spacing.xl}px 0`,
    },
    container: {
      xs: `0 ${spacing.sm}px`,
      sm: `0 ${spacing.md}px`,
      md: `0 ${spacing.lg}px`,
      lg: `0 ${spacing.xl}px`,
    },
  },
  // Responsive grid
  grid: {
    columns: {
      xs: 4,
      sm: 8,
      md: 12,
    },
    spacing: {
      xs: 2,
      sm: 3,
      md: 4,
    },
  },
};

// Component overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius.pill,
        fontWeight: typography.button.fontWeight,
        textTransform: typography.button.textTransform,
        padding: `${spacing.sm}px ${spacing.md}px`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
      contained: {
        boxShadow: shape.shadows.colored.secondary,
        '&:hover': {
          boxShadow: shape.shadows.lg,
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
        },
      },
      sizeLarge: {
        padding: `${spacing.md}px ${spacing.lg}px`,
        fontSize: '1.1rem',
      },
      sizeSmall: {
        padding: `${spacing.xs}px ${spacing.sm}px`,
        fontSize: '0.9rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius.lg,
        boxShadow: shape.shadows.sm,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: shape.shadows.md,
          transform: 'translateY(-4px)',
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
          '& fieldset': {
            borderColor: colors.border,
            borderWidth: 1,
          },
          '&:hover fieldset': {
            borderColor: colors.secondary.main,
            borderWidth: 1,
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.secondary.main,
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: shape.shadows.sm,
        backdropFilter: 'blur(10px)',
        backgroundColor: colors.background.overlay,
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
  MuiBox: {
    styleOverrides: {
      root: {
        // Add responsive padding and margin utilities
      },
    },
  },
};

// Create the theme
const theme = createTheme({
  palette: colors,
  typography: typography,
  spacing: spacing.unit,
  shape: {
    borderRadius: shape.borderRadius.md,
  },
  breakpoints: {
    values: breakpoints,
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
    shape.shadows.xl,
  ],
  // Custom properties for easier access
  custom: {
    colors,
    typography,
    spacing,
    shape,
    breakpoints,
    responsive: responsiveUtils,
  },
});

export default theme;