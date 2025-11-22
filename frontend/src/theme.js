import { createTheme } from '@mui/material/styles';

// Create the theme with the new color palette and typography
const theme = createTheme({
  palette: {
    primary: {
      main: '#C8B6DB', // Muted lavender
      light: '#D8C6EB',
      dark: '#B8A6CB',
      contrastText: '#333333',
    },
    secondary: {
      main: '#E6C88A', // Warm gold
      light: '#F6D89A',
      dark: '#D6B87A',
      contrastText: '#333333',
    },
    tertiary: {
      main: '#B2C8BA', // Gentle sage
      light: '#C2D8CA',
      dark: '#A2B8AA',
      contrastText: '#333333',
    },
    background: {
      default: '#F5F2ED', // Warm sandy beige
      paper: '#FAF8F3', // Soft cream
    },
    text: {
      primary: '#333333', // Dark charcoal
      secondary: '#666666',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(2rem, 8vw, 4rem)',
      lineHeight: 1.1,
      color: '#333333',
    },
    h2: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(1.75rem, 5vw, 3rem)',
      lineHeight: 1.2,
      color: '#333333',
    },
    h3: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
      lineHeight: 1.3,
      color: '#333333',
    },
    h4: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(1.25rem, 3vw, 2rem)',
      lineHeight: 1.4,
      color: '#333333',
    },
    h5: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
      lineHeight: 1.4,
      color: '#333333',
    },
    h6: {
      fontFamily: '"Playfair Display", "Times New Roman", serif',
      fontWeight: 400,
      fontSize: 'clamp(1rem, 2vw, 1.25rem)',
      lineHeight: 1.5,
      color: '#333333',
    },
    body1: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#333333',
    },
    body2: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#666666',
    },
    button: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      textTransform: 'none',
    },
    subtitle1: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#666666',
    },
    subtitle2: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#666666',
    },
    caption: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#666666',
    },
    overline: {
      fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
      color: '#666666',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
        sizeLarge: {
          padding: '12px 30px',
          fontSize: '1.1rem',
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '0.9rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: '#C8B6DB',
              borderWidth: 1,
            },
            '&.Mui-focused fieldset': {
              borderColor: '#C8B6DB',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#666666',
            '&.Mui-focused': {
              color: '#C8B6DB',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(200, 182, 219, 0.08)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FAF8F3',
          color: '#333333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#C8B6DB',
          '&:hover': {
            color: '#B8A6CB',
            textDecoration: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '1rem',
          '&.Mui-selected': {
            color: '#C8B6DB',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default theme;