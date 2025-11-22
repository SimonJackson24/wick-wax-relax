import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { axe as axeConfig } from '../jest.accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Create a theme for testing
const theme = createTheme();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    push: jest.fn(),
    query: {},
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test data for ProductCard
const mockProduct = {
  id: '1',
  name: 'Test Product',
  description: 'This is a test product description',
  image: '/test-image.jpg',
  price: 10.99,
  categories: ['Test Category'],
  variants: [
    {
      id: 'variant-1',
      price: 10.99,
      inventory_quantity: 5,
    },
  ],
  total_sold: 15,
};

// Helper function to render components with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Accessibility Tests', () => {
  describe('Navigation Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithTheme(<Navigation />);
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      renderWithTheme(<Navigation />);
      
      // Check for navigation landmark
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check for skip link
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      
      // Check for mobile menu button
      const menuButton = screen.getByLabelText('open navigation menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have keyboard accessible navigation links', () => {
      renderWithTheme(<Navigation />);
      
      // Check for main navigation links
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      
      // Check for cart button
      const cartButton = screen.getByLabelText(/shopping cart/i);
      expect(cartButton).toBeInTheDocument();
    });
  });

  describe('Hero Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithTheme(<Hero />);
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for carousel', () => {
      renderWithTheme(<Hero />);
      
      // Check for carousel region
      const carouselRegion = screen.getByRole('region');
      expect(carouselRegion).toBeInTheDocument();
      expect(carouselRegion).toHaveAttribute('aria-roledescription', 'carousel');
      expect(carouselRegion).toHaveAttribute('aria-label', 'Product category showcase');
      
      // Check for carousel controls
      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');
      const playButton = screen.getByLabelText(/pause auto-play|resume auto-play/i);
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(playButton).toBeInTheDocument();
      
      // Check for slide indicators
      const slideIndicators = screen.getAllByRole('tab');
      expect(slideIndicators.length).toBeGreaterThan(0);
    });

    it('should have keyboard accessible controls', () => {
      renderWithTheme(<Hero />);
      
      // Check for keyboard accessible controls
      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');
      const playButton = screen.getByLabelText(/pause auto-play|resume auto-play/i);
      
      expect(prevButton).toHaveAttribute('tabIndex', '0');
      expect(nextButton).toHaveAttribute('tabIndex', '0');
      expect(playButton).toHaveAttribute('tabIndex', '0');
    });

    it('should have live region for screen reader announcements', () => {
      renderWithTheme(<Hero />);
      
      // Check for live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('ProductCard Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithTheme(
        <ProductCard product={mockProduct} />
      );
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      renderWithTheme(<ProductCard product={mockProduct} />);
      
      // Check for article element
      const productCard = screen.getByRole('article');
      expect(productCard).toBeInTheDocument();
      
      // Check for product title
      const productTitle = screen.getByRole('heading', { name: mockProduct.name });
      expect(productTitle).toBeInTheDocument();
      
      // Check for product image
      const productImage = screen.getByAltText(mockProduct.name);
      expect(productImage).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderWithTheme(<ProductCard product={mockProduct} />);
      
      // Check for add to cart button
      const addToCartButton = screen.getByLabelText(/add test product to cart/i);
      expect(addToCartButton).toBeInTheDocument();
      
      // Check for favorite button
      const favoriteButton = screen.getByLabelText(/add test product to favorites/i);
      expect(favoriteButton).toBeInTheDocument();
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper ARIA attributes for favorite button when toggled', () => {
      const { rerender } = renderWithTheme(
        <ProductCard product={mockProduct} />
      );
      
      // Initially not favorited
      let favoriteButton = screen.getByLabelText(/add test product to favorites/i);
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
      
      // Toggle favorite state
      rerender(
        <ThemeProvider theme={theme}>
          <ProductCard product={mockProduct} />
        </ThemeProvider>
      );
      
      // After clicking, should be favorited
      favoriteButton = screen.getByLabelText(/remove test product from favorites/i);
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Global Accessibility Features', () => {
    it('should have proper focus styles', () => {
      const { container } = renderWithTheme(<Navigation />);
      
      // Check for focus visible styles
      const styleElement = container.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement.textContent).toContain(':focus-visible');
    });

    it('should have skip link', () => {
      renderWithTheme(<Navigation />);
      
      // Check for skip link
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });
});