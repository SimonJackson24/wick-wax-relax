import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import appTheme from '../src/theme';
import Navigation from '../components/Navigation';
import PremiumHero from '../components/home/PremiumHero';
import ProductCard from '../components/ProductCard';
import { CartProvider } from '../components/CartContext';
import { WishlistProvider } from '../components/WishlistContext';
import { SubscriptionProvider } from '../components/SubscriptionContext';
import { PWAProvider } from '../components/PWAContext';
import { axe as axeConfig } from '../jest.accessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// The app's own theme — the accessibility rules only mean anything if the
// components are rendered with the tokens they ship with.
const theme = appTheme;

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
// The nav and the hero both read the cart / wishlist / subscription
// contexts, so every render has to sit inside those providers.
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <PWAProvider>
        <CartProvider>
          <WishlistProvider>
            <SubscriptionProvider>{component}</SubscriptionProvider>
          </WishlistProvider>
        </CartProvider>
      </PWAProvider>
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

  describe('PremiumHero Component', () => {
    const heroProduct = {
      id: 'hero-1',
      name: 'Showcase: Lavender Dream',
      slug: 'lavender-dream',
      description: 'Calming lavender with a soft vetiver base.',
      scent_profile: { mood: 'calming', top: 'Lavender' },
      base_price: 12,
      variants: [{ id: 'hero-1-v1', price: 12, inventory_quantity: 5 }],
    };

    it('should not have any accessibility violations', async () => {
      const { container } = renderWithTheme(<PremiumHero products={[heroProduct]} />);
      const results = await axe(container, axeConfig);
      expect(results).toHaveNoViolations();
    });

    it('should expose the scent as a live region for screen readers', () => {
      renderWithTheme(<PremiumHero products={[heroProduct]} />);
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion.textContent).toContain('Lavender Dream');
    });

    it('should expose the slide indicators as buttons', () => {
      renderWithTheme(<PremiumHero products={[heroProduct, { ...heroProduct, id: 'hero-2', name: 'Showcase: Fireside Vanilla' }]} />);
      const indicator = screen.getByLabelText('Show Lavender Dream');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-current', 'true');
    });

    it('should have a single primary call to action', () => {
      renderWithTheme(<PremiumHero products={[heroProduct]} />);
      const cta = screen.getByRole('link', { name: /shop this scent/i });
      expect(cta).toBeInTheDocument();
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

    it('should have proper ARIA attributes for favorite button when toggled', async () => {
      renderWithTheme(<ProductCard product={mockProduct} />);

      // Initially not favorited
      const favoriteButton = screen.getByLabelText(/add test product to favorites/i);
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

      // Toggle it
      await userEvent.click(favoriteButton);

      // After clicking, should be favorited
      const toggled = screen.getByLabelText(/remove test product from favorites/i);
      expect(toggled).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Global Accessibility Features', () => {
    it('should have proper focus styles', () => {
      // The focus ring is a global rule (styles/globals.css) — the page
      // stylesheet is not part of a component's rendered tree in jsdom, so
      // read the source of truth.
      const css = fs.readFileSync(
        path.join(__dirname, '../styles/globals.css'),
        'utf8'
      );
      expect(css).toContain(':focus-visible');
      expect(css).toContain('outline');
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