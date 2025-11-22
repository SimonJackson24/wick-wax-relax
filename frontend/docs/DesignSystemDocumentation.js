/**
 * Wick Wax & Relax Design System Documentation
 * 
 * This file contains documentation for the design system used in the Wick Wax & Relax application.
 * It explains how to use the design system and its various components.
 */

/**
 * TABLE OF CONTENTS
 * 
 * 1. Overview
 * 2. Color Palette
 * 3. Typography
 * 4. Spacing and Layout
 * 5. Border Radius and Shadows
 * 6. Responsive Design
 * 7. Component Usage
 * 8. Best Practices
 */

/**
 * 1. OVERVIEW
 * 
 * The Wick Wax & Relax design system is built on top of Material-UI (MUI) and provides
 * a consistent look and feel across all components of the application. The design system
 * is defined in frontend/utils/theme.js and includes color palette, typography, spacing,
 * border radius, shadows, and responsive design rules.
 * 
 * To use the design system in a component:
 * 
 * ```jsx
 * import { useTheme } from '@mui/material/styles';
 * 
 * function MyComponent() {
 *   const theme = useTheme();
 *   
 *   return (
 *     <Box sx={{ 
 *       backgroundColor: theme.palette.background.default,
 *       p: theme.custom.spacing.md,
 *       borderRadius: theme.custom.shape.borderRadius.md
 *     }}>
 *       <Typography variant="h1" sx={{ color: theme.palette.text.primary }}>
 *         Hello World
 *       </Typography>
 *     </Box>
 *   );
 * }
 * ```
 */

/**
 * 2. COLOR PALETTE
 * 
 * The color palette is organized into semantic categories:
 * 
 * - Primary: Deep blue (#1a1a2e) for main branding elements
 * - Secondary: Gold (#ffd700) for highlights and secondary elements
 * - Accent: Warm orange (#ffb347) for CTAs and accents
 * - Background: Light gray (#f9f9f9) for page backgrounds, white for cards
 * - Text: Various shades for different text hierarchies
 * - Status colors: Error, success, warning, info for different states
 * 
 * Usage:
 * 
 * ```jsx
 * <Box sx={{ backgroundColor: theme.palette.primary.main }}>
 *   <Typography sx={{ color: theme.palette.text.inverse }}>
 *     Text on primary background
 *   </Typography>
 * </Box>
 * 
 * <Button variant="contained" color="secondary">
 *   Secondary Button
 * </Button>
 * 
 * <Box sx={{ backgroundColor: `${theme.palette.error.main}10` }}>
 *   Error state background
 * </Box>
 * ```
 */

/**
 * 3. TYPOGRAPHY
 * 
 * The typography system includes a hierarchy of font sizes and weights:
 * 
 * - Headings (h1-h6): Playfair Display serif font, decreasing sizes
 * - Body text: Roboto sans-serif font
 * - Special script font for decorative elements
 * 
 * All typography is responsive, with sizes that scale based on viewport width.
 * 
 * Usage:
 * 
 * ```jsx
 * <Typography variant="h1">Main Heading</Typography>
 * <Typography variant="h2">Subheading</Typography>
 * <Typography variant="body1">Body text</Typography>
 * <Typography variant="body2">Secondary body text</Typography>
 * 
 * // Custom styling using theme typography
 * <Typography sx={{ 
 *   fontFamily: theme.custom.typography.script.fontFamily,
 *   fontSize: theme.custom.typography.script.fontSize
 * }}>
 *   Decorative text
 * </Typography>
 * ```
 */

/**
 * 4. SPACING AND LAYOUT
 * 
 * The spacing system uses an 8px base unit:
 * 
 * - xs: 8px (0.5rem)
 * - sm: 16px (1rem)
 * - md: 24px (1.5rem)
 * - lg: 32px (2rem)
 * - xl: 48px (3rem)
 * - xxl: 64px (4rem)
 * - xxxl: 96px (6rem)
 * 
 * Component-specific spacing is also defined:
 * 
 * - sectionPadding: For section top/bottom padding
 * - containerPadding: For container left/right padding
 * - cardPadding: For card content padding
 * - gridGap: For grid gaps
 * 
 * Usage:
 * 
 * ```jsx
 * <Box sx={{ p: theme.custom.spacing.md, m: theme.custom.spacing.lg }}>
 *   Padding and margin using custom spacing
 * </Box>
 * 
 * // Section padding
 * <Box sx={{ py: theme.custom.spacing.sectionPadding.mobile, md: theme.custom.spacing.sectionPadding.desktop }}>
 *   Section content
 * </Box>
 * ```
 */

/**
 * 5. BORDER RADIUS AND SHADOWS
 * 
 * Border radius values:
 * 
 * - none: 0
 * - xs: 4px (0.25rem)
 * - sm: 8px (0.5rem)
 * - md: 12px (0.75rem)
 * - lg: 16px (1rem)
 * - xl: 24px (1.5rem)
 * - xxl: 32px (2rem)
 * - pill: 9999px (for pill-shaped buttons)
 * - circle: 50% (for circular elements)
 * 
 * Shadow values:
 * 
 * - none: No shadow
 * - xs: Small shadow
 * - sm: Medium-small shadow
 * - md: Medium shadow
 * - lg: Large shadow
 * - xl: Extra large shadow
 * - colored: Themed shadows for primary, secondary, and accent colors
 * 
 * Usage:
 * 
 * ```jsx
 * <Card sx={{ 
 *   borderRadius: theme.custom.shape.borderRadius.lg,
 *   boxShadow: theme.custom.shape.shadows.md
 * }}>
 *   Card with custom border radius and shadow
 * </Card>
 * 
 * <Button sx={{ 
 *   borderRadius: theme.custom.shape.borderRadius.pill,
 *   boxShadow: theme.custom.shape.shadows.colored.secondary
 * }}>
 *   Pill button with colored shadow
 * </Button>
 * ```
 */

/**
 * 6. RESPONSIVE DESIGN
 * 
 * The design system includes responsive utilities for different screen sizes:
 * 
 * Breakpoints:
 * - xs: 0px
 * - sm: 600px
 * - md: 900px
 * - lg: 1200px
 * - xl: 1536px
 * 
 * Responsive utilities:
 * 
 * - fontSize: Responsive font sizes for different elements
 * - padding: Responsive padding values
 * - grid: Responsive grid settings
 * 
 * Usage:
 * 
 * ```jsx
 * // Responsive typography
 * <Typography sx={{ 
 *   fontSize: theme.custom.responsive.fontSize.heading
 * }}>
 *   Responsive heading
 * </Typography>
 * 
 * // Responsive spacing
 * <Box sx={{ 
 *   p: { xs: theme.custom.spacing.sm, md: theme.custom.spacing.lg }
 * }}>
 *   Responsive padding
 * </Box>
 * 
 * // Responsive grid
 * <Grid container spacing={theme.custom.responsive.grid.spacing}>
 *   <Grid item xs={12} md={6}>
 *     Responsive grid item
 *   </Grid>
 * </Grid>
 * ```
 */

/**
 * 7. COMPONENT USAGE
 * 
 * The design system includes styled components for common UI elements:
 * 
 * Buttons:
 * 
 * ```jsx
 * <Button variant="contained" color="primary">
 *   Primary Button
 * </Button>
 * 
 * <Button variant="outlined" color="secondary">
 *   Secondary Outlined Button
 * </Button>
 * 
 * <Button variant="contained" color="accent" size="large">
 *   Large Accent Button
 * </Button>
 * ```
 * 
 * Cards:
 * 
 * ```jsx
 * <Card>
 *   <CardContent>
 *     <Typography variant="h6">Card Title</Typography>
 *     <Typography variant="body2">Card content</Typography>
 *   </CardContent>
 * </Card>
 * ```
 * 
 * Text Fields:
 * 
 * ```jsx
 * <TextField
 *   label="Email"
 *   variant="outlined"
 *   fullWidth
 *   sx={{ mb: theme.custom.spacing.md }}
 * />
 * ```
 * 
 * Containers:
 * 
 * ```jsx
 * <Container maxWidth="lg">
 *   Content with responsive container padding
 * </Container>
 * ```
 */

/**
 * 8. BEST PRACTICES
 * 
 * 1. Use theme values instead of hardcoded values:
 *    - Good: `sx={{ p: theme.custom.spacing.md }}`
 *    - Bad: `sx={{ p: '24px' }}`
 * 
 * 2. Use semantic color names:
 *    - Good: `theme.palette.primary.main`
 *    - Bad: `'#1a1a2e'`
 * 
 * 3. Use responsive breakpoints:
 *    - Good: `sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}`
 *    - Bad: `sx={{ fontSize: '1.25rem' }}`
 * 
 * 4. Use the typography hierarchy:
 *    - Good: `<Typography variant="h2">Heading</Typography>`
 *    - Bad: `<Typography sx={{ fontSize: '2rem' }}>Heading</Typography>`
 * 
 * 5. Keep accessibility in mind:
 *    - Ensure color contrast meets WCAG standards
 *    - Use semantic HTML elements
 *    - Provide proper alt text for images
 * 
 * 6. Use the component variants:
 *    - Good: `<Button variant="contained" color="primary">`
 *    - Bad: Custom styled button that doesn't follow the design system
 */

export default {
  // This file is for documentation purposes only
  // It doesn't export any actual functionality
};