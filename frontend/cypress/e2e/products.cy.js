describe('Product Browsing and Filtering', () => {
  beforeEach(() => {
    cy.visit('/products');
  });

  describe('Product Listing Page', () => {
    it('should load products page successfully', () => {
      cy.contains('Products').should('be.visible');
      cy.get('[data-cy="product-grid"]').should('be.visible');
    });

    it('should display products with required information', () => {
      cy.get('[data-cy="product-card"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="product-card"]').first().within(() => {
        cy.get('[data-cy="product-name"]').should('be.visible');
        cy.get('[data-cy="product-price"]').should('be.visible');
        cy.get('[data-cy="product-image"]').should('be.visible');
      });
    });

    it('should handle empty product list gracefully', () => {
      // Mock empty response
      cy.intercept('GET', '/api/products', { products: [] }).as('emptyProducts');
      cy.reload();
      cy.contains('No products found').should('be.visible');
    });
  });

  describe('Product Filtering', () => {
    it('should filter products by category', () => {
      cy.get('[data-cy="category-filter"]').should('be.visible');
      cy.get('[data-cy="category-filter"]').select('Candles');
      cy.get('[data-cy="product-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Candle');
      });
    });

    it('should filter products by price range', () => {
      cy.get('[data-cy="price-min"]').type('10');
      cy.get('[data-cy="price-max"]').type('50');
      cy.get('[data-cy="apply-filter"]').click();

      cy.get('[data-cy="product-card"]').each(($card) => {
        cy.wrap($card).find('[data-cy="product-price"]').invoke('text').then((price) => {
          const numericPrice = parseFloat(price.replace('$', ''));
          expect(numericPrice).to.be.within(10, 50);
        });
      });
    });

    it('should handle invalid filter inputs', () => {
      cy.get('[data-cy="price-min"]').type('invalid');
      cy.get('[data-cy="apply-filter"]').click();
      cy.contains('Please enter valid price range').should('be.visible');
    });

    it('should clear filters correctly', () => {
      cy.get('[data-cy="category-filter"]').select('Candles');
      cy.get('[data-cy="clear-filters"]').click();
      cy.get('[data-cy="category-filter"]').should('have.value', '');
    });
  });

  describe('Product Search', () => {
    it('should search products by name', () => {
      cy.get('[data-cy="search-input"]').type('Lavender');
      cy.get('[data-cy="search-button"]').click();

      cy.get('[data-cy="product-card"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="product-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Lavender');
      });
    });

    it('should handle no search results', () => {
      cy.get('[data-cy="search-input"]').type('nonexistentproduct123');
      cy.get('[data-cy="search-button"]').click();
      cy.contains('No products found').should('be.visible');
    });

    it('should clear search results', () => {
      cy.get('[data-cy="search-input"]').type('test');
      cy.get('[data-cy="search-button"]').click();
      cy.get('[data-cy="clear-search"]').click();
      cy.get('[data-cy="search-input"]').should('have.value', '');
    });
  });

  describe('Product Sorting', () => {
    it('should sort products by price ascending', () => {
      cy.get('[data-cy="sort-select"]').select('price-asc');
      cy.get('[data-cy="product-price"]').then(($prices) => {
        const prices = $prices.map((i, el) => parseFloat(el.innerText.replace('$', ''))).get();
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).to.deep.equal(sortedPrices);
      });
    });

    it('should sort products by price descending', () => {
      cy.get('[data-cy="sort-select"]').select('price-desc');
      cy.get('[data-cy="product-price"]').then(($prices) => {
        const prices = $prices.map((i, el) => parseFloat(el.innerText.replace('$', ''))).get();
        const sortedPrices = [...prices].sort((a, b) => b - a);
        expect(prices).to.deep.equal(sortedPrices);
      });
    });

    it('should sort products alphabetically', () => {
      cy.get('[data-cy="sort-select"]').select('name-asc');
      cy.get('[data-cy="product-name"]').then(($names) => {
        const names = $names.map((i, el) => el.innerText).get();
        const sortedNames = [...names].sort();
        expect(names).to.deep.equal(sortedNames);
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when needed', () => {
      cy.get('[data-cy="pagination"]').should('be.visible');
    });

    it('should navigate to next page', () => {
      cy.get('[data-cy="next-page"]').click();
      cy.url().should('include', 'page=2');
    });

    it('should navigate to previous page', () => {
      cy.visit('/products?page=2');
      cy.get('[data-cy="prev-page"]').click();
      cy.url().should('include', 'page=1');
    });

    it('should handle invalid page numbers', () => {
      cy.visit('/products?page=999');
      cy.contains('Page not found').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      cy.viewport('iphone-6');
      cy.get('[data-cy="product-grid"]').should('be.visible');
      cy.get('[data-cy="mobile-filter-toggle"]').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="product-grid"]').should('be.visible');
      cy.get('[data-cy="filter-sidebar"]').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('[data-cy="product-grid"]').should('be.visible');
      cy.get('[data-cy="filter-sidebar"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="search-input"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="category-filter"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="product-card"]').first().focus();
      cy.focused().should('have.attr', 'data-cy', 'product-card');
    });

    it('should have sufficient color contrast', () => {
      // This would require additional accessibility testing tools
      cy.get('[data-cy="product-name"]').should('have.css', 'color');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/products', { statusCode: 500 }).as('apiError');
      cy.reload();
      cy.contains('Error loading products').should('be.visible');
    });

    it('should handle network timeouts', () => {
      cy.intercept('GET', '/api/products', { delay: 10000 }).as('slowApi');
      cy.reload();
      cy.contains('Loading').should('be.visible');
    });
  });
});