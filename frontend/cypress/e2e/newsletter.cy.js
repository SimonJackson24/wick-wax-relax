describe('Newsletter Subscription', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Newsletter Signup Form', () => {
    it('should display newsletter signup form', () => {
      cy.get('[data-cy="newsletter-form"]').should('be.visible');
      cy.get('[data-cy="newsletter-email"]').should('be.visible');
      cy.get('[data-cy="newsletter-submit"]').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('[data-cy="newsletter-email"]').type('invalid-email');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Please enter a valid email address').should('be.visible');
    });

    it('should require email field', () => {
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Email is required').should('be.visible');
    });

    it('should successfully subscribe with valid email', () => {
      const testEmail = `test${Date.now()}@example.com`;
      cy.get('[data-cy="newsletter-email"]').type(testEmail);
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Successfully subscribed to newsletter').should('be.visible');
    });

    it('should handle duplicate email subscriptions', () => {
      cy.get('[data-cy="newsletter-email"]').type('existing@example.com');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Email already subscribed').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('POST', '/api/newsletter/subscribe', { statusCode: 500 }).as('subscribeError');
      cy.get('[data-cy="newsletter-email"]').type('test@example.com');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Subscription failed').should('be.visible');
    });
  });

  describe('Newsletter Preferences', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
      cy.visit('/account/newsletter');
    });

    it('should load newsletter preferences page', () => {
      cy.contains('Newsletter Preferences').should('be.visible');
    });

    it('should display subscription options', () => {
      cy.get('[data-cy="product-updates"]').should('be.visible');
      cy.get('[data-cy="promotional-emails"]').should('be.visible');
      cy.get('[data-cy="weekly-newsletter"]').should('be.visible');
    });

    it('should update preferences successfully', () => {
      cy.get('[data-cy="product-updates"]').check();
      cy.get('[data-cy="promotional-emails"]').uncheck();
      cy.get('[data-cy="save-preferences"]').click();
      cy.contains('Preferences updated successfully').should('be.visible');
    });

    it('should unsubscribe from all newsletters', () => {
      cy.get('[data-cy="unsubscribe-all"]').check();
      cy.get('[data-cy="save-preferences"]').click();
      cy.contains('Successfully unsubscribed').should('be.visible');
    });
  });

  describe('Newsletter Content and Delivery', () => {
    it('should handle email verification', () => {
      // Simulate clicking verification link from email
      const verificationToken = 'valid-verification-token';
      cy.visit(`/newsletter/verify?token=${verificationToken}`);
      cy.contains('Email verified successfully').should('be.visible');
    });

    it('should handle invalid verification tokens', () => {
      cy.visit('/newsletter/verify?token=invalid-token');
      cy.contains('Invalid verification token').should('be.visible');
    });

    it('should handle expired verification tokens', () => {
      cy.visit('/newsletter/verify?token=expired-token');
      cy.contains('Verification link has expired').should('be.visible');
    });

    it('should allow resending verification email', () => {
      cy.visit('/newsletter/resend-verification');
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="resend-button"]').click();
      cy.contains('Verification email sent').should('be.visible');
    });
  });

  describe('Newsletter Analytics and Management', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'admin123');
      cy.visit('/admin/newsletter');
    });

    it('should display subscriber statistics', () => {
      cy.get('[data-cy="total-subscribers"]').should('be.visible');
      cy.get('[data-cy="active-subscribers"]').should('be.visible');
      cy.get('[data-cy="unsubscribed-count"]').should('be.visible');
    });

    it('should allow sending test newsletter', () => {
      cy.get('[data-cy="send-test"]').click();
      cy.get('[data-cy="test-email"]').type('admin@example.com');
      cy.get('[data-cy="send-test-button"]').click();
      cy.contains('Test newsletter sent').should('be.visible');
    });

    it('should create and send newsletter campaign', () => {
      cy.get('[data-cy="create-campaign"]').click();
      cy.get('[data-cy="campaign-subject"]').type('Test Campaign');
      cy.get('[data-cy="campaign-content"]').type('Test newsletter content');
      cy.get('[data-cy="send-campaign"]').click();
      cy.contains('Campaign sent successfully').should('be.visible');
    });

    it('should export subscriber list', () => {
      cy.get('[data-cy="export-subscribers"]').click();
      cy.contains('Export started').should('be.visible');
    });
  });

  describe('Responsive Newsletter Forms', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      cy.get('[data-cy="newsletter-form"]').should('be.visible');
      cy.get('[data-cy="newsletter-email"]').should('be.visible');
      cy.get('[data-cy="newsletter-submit"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="newsletter-form"]').should('have.css', 'max-width');
    });

    it('should work on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('[data-cy="newsletter-form"]').should('be.visible');
    });
  });

  describe('Newsletter Accessibility', () => {
    it('should have proper form labels', () => {
      cy.get('[data-cy="newsletter-email"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="newsletter-submit"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="newsletter-email"]').focus().type('test@example.com');
      cy.realPress('Tab');
      cy.focused().should('have.attr', 'data-cy', 'newsletter-submit');
    });

    it('should announce subscription status', () => {
      cy.get('[data-cy="newsletter-email"]').type('test@example.com');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.get('[data-cy="subscription-message"]').should('have.attr', 'role', 'status');
    });
  });

  describe('Newsletter Error Handling', () => {
    it('should handle network errors', () => {
      cy.intercept('POST', '/api/newsletter/subscribe', { forceNetworkError: true }).as('networkError');
      cy.get('[data-cy="newsletter-email"]').type('test@example.com');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Network error').should('be.visible');
    });

    it('should handle rate limiting', () => {
      // Simulate multiple rapid submissions
      for (let i = 0; i < 10; i++) {
        cy.get('[data-cy="newsletter-email"]').type(`test${i}@example.com`);
        cy.get('[data-cy="newsletter-submit"]').click();
      }
      cy.contains('Too many requests').should('be.visible');
    });

    it('should handle server maintenance', () => {
      cy.intercept('POST', '/api/newsletter/subscribe', { statusCode: 503 }).as('maintenance');
      cy.get('[data-cy="newsletter-email"]').type('test@example.com');
      cy.get('[data-cy="newsletter-submit"]').click();
      cy.contains('Service temporarily unavailable').should('be.visible');
    });
  });

  describe('GDPR Compliance', () => {
    it('should display privacy policy link', () => {
      cy.get('[data-cy="privacy-policy-link"]').should('be.visible');
    });

    it('should allow easy unsubscribe', () => {
      cy.visit('/newsletter/unsubscribe?email=test@example.com');
      cy.get('[data-cy="confirm-unsubscribe"]').click();
      cy.contains('Successfully unsubscribed').should('be.visible');
    });

    it('should handle data export requests', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/account/data-export');
      cy.get('[data-cy="request-export"]').click();
      cy.contains('Data export request submitted').should('be.visible');
    });

    it('should handle data deletion requests', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/account/delete-account');
      cy.get('[data-cy="confirm-deletion"]').type('DELETE');
      cy.get('[data-cy="delete-account"]').click();
      cy.contains('Account deletion initiated').should('be.visible');
    });
  });
});