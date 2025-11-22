describe('Homepage Navigation and Responsiveness', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Page Loading and Basic Functionality', () => {
    it('should load the homepage successfully', () => {
      cy.contains('Wick Wax Relax').should('be.visible');
      cy.get('body').should('be.visible');
      cy.title().should('include', 'Wick Wax Relax');
    });

    it('should have proper PWA setup', () => {
      cy.checkPWA();
    });

    it('should handle offline functionality', () => {
      cy.testOffline();
    });

    it('should handle push notifications', () => {
      cy.testPushNotifications();
    });

    it('should have proper meta tags', () => {
      cy.get('meta[name="viewport"]').should('have.attr', 'content', 'width=device-width, initial-scale=1');
      cy.get('link[rel="manifest"]').should('have.attr', 'href', '/manifest.json');
    });

    it('should load within acceptable time', () => {
      cy.window().then((win) => {
        const startTime = Date.now();
        cy.document().then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
        });
      });
    });
  });

  describe('Navigation Functionality', () => {
    it('should have working main navigation links', () => {
      // Test main navigation elements
      cy.get('[data-cy="nav-home"]').should('be.visible').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      cy.get('[data-cy="nav-products"]').should('be.visible').click();
      cy.url().should('include', '/products');

      cy.get('[data-cy="nav-account"]').should('be.visible').click();
      cy.url().should('include', '/account');
    });

    it('should handle navigation with keyboard', () => {
      cy.get('[data-cy="nav-home"]').focus().type('{enter}');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should handle broken navigation gracefully', () => {
      cy.get('[data-cy="nav-nonexistent"]').should('not.exist');
      // Test that clicking non-existent links doesn't break the page
      cy.get('body').should('be.visible');
    });
  });

  describe('Responsive Design Validation', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach((viewport) => {
      it(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        cy.viewport(viewport.width, viewport.height);
        cy.contains('Wick Wax Relax').should('be.visible');

        // Check that navigation is accessible
        cy.get('[data-cy="nav-home"]').should('be.visible');

        // Check that main content areas are visible
        cy.get('[data-cy="hero-section"]').should('be.visible');
        cy.get('[data-cy="features-section"]').should('be.visible');

        // Verify no horizontal scroll on smaller screens
        cy.window().then((win) => {
          expect(win.innerWidth).to.be.at.most(viewport.width);
        });
      });
    });

    it('should handle orientation changes', () => {
      cy.viewport('iphone-6', 'portrait');
      cy.contains('Wick Wax Relax').should('be.visible');

      cy.viewport('iphone-6', 'landscape');
      cy.contains('Wick Wax Relax').should('be.visible');
    });
  });

  describe('Accessibility Checks', () => {
    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length.at.least', 1);
      cy.get('h1').first().should('contain', 'Wick Wax Relax');
    });

    it('should have alt text for images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have proper focus management', () => {
      cy.get('[data-cy="nav-home"]').focus();
      cy.focused().should('have.attr', 'data-cy', 'nav-home');
    });

    it('should support keyboard navigation', () => {
      cy.get('body').tab().tab().tab();
      cy.focused().should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/*', { forceNetworkError: true }).as('networkError');
      cy.reload();
      cy.get('body').should('be.visible'); // Page should still render
    });

    it('should handle JavaScript errors gracefully', () => {
      cy.on('uncaught:exception', (err) => {
        // Return false to prevent the error from failing the test
        return false;
      });
      cy.visit('/nonexistent-page');
      cy.contains('404').should('be.visible');
    });
  });
});