describe('Checkout Process', () => {
  beforeEach(() => {
    // Setup: Login and add items to cart
    cy.login('test@example.com', 'password123');
    cy.visit('/product/1');
    cy.get('[data-cy="add-to-cart"]').click();
    cy.get('[data-cy="cart-icon"]').click();
    cy.get('[data-cy="checkout-button"]').click();
  });

  describe('Checkout Page Loading', () => {
    it('should load checkout page successfully', () => {
      cy.url().should('include', '/checkout');
      cy.contains('Checkout').should('be.visible');
    });

    it('should display order summary', () => {
      cy.get('[data-cy="order-summary"]').should('be.visible');
      cy.get('[data-cy="order-total"]').should('be.visible');
    });

    it('should display shipping form', () => {
      cy.get('[data-cy="shipping-form"]').should('be.visible');
      cy.get('[data-cy="shipping-firstName"]').should('be.visible');
      cy.get('[data-cy="shipping-lastName"]').should('be.visible');
      cy.get('[data-cy="shipping-address"]').should('be.visible');
    });

    it('should display payment form', () => {
      cy.get('[data-cy="payment-form"]').should('be.visible');
      cy.get('[data-cy="payment-cardNumber"]').should('be.visible');
      cy.get('[data-cy="payment-expiry"]').should('be.visible');
      cy.get('[data-cy="payment-cvc"]').should('be.visible');
    });
  });

  describe('Shipping Information', () => {
    it('should validate required shipping fields', () => {
      cy.get('[data-cy="place-order"]').click();
      cy.contains('First name is required').should('be.visible');
      cy.contains('Last name is required').should('be.visible');
      cy.contains('Address is required').should('be.visible');
    });

    it('should validate shipping address format', () => {
      cy.get('[data-cy="shipping-firstName"]').type('John');
      cy.get('[data-cy="shipping-lastName"]').type('Doe');
      cy.get('[data-cy="shipping-address"]').type('Invalid Address 123');
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Please enter a valid address').should('be.visible');
    });

    it('should save shipping information', () => {
      cy.get('[data-cy="shipping-firstName"]').type('John');
      cy.get('[data-cy="shipping-lastName"]').type('Doe');
      cy.get('[data-cy="shipping-address"]').type('123 Main St');
      cy.get('[data-cy="shipping-city"]').type('New York');
      cy.get('[data-cy="shipping-postalCode"]').type('10001');

      // Verify information is saved
      cy.reload();
      cy.get('[data-cy="shipping-firstName"]').should('have.value', 'John');
    });

    it('should handle international addresses', () => {
      cy.get('[data-cy="shipping-country"]').select('Canada');
      cy.get('[data-cy="shipping-firstName"]').type('Jean');
      cy.get('[data-cy="shipping-lastName"]').type('Dubois');
      cy.get('[data-cy="shipping-address"]').type('123 Rue Principale');
      cy.get('[data-cy="shipping-city"]').type('Montreal');
      cy.get('[data-cy="shipping-postalCode"]').type('H1A 1A1');
      cy.get('[data-cy="place-order"]').click();
      // Should proceed without validation errors
    });
  });

  describe('Payment Information', () => {
    beforeEach(() => {
      // Fill shipping info first
      cy.get('[data-cy="shipping-firstName"]').type('John');
      cy.get('[data-cy="shipping-lastName"]').type('Doe');
      cy.get('[data-cy="shipping-address"]').type('123 Main St');
      cy.get('[data-cy="shipping-city"]').type('New York');
      cy.get('[data-cy="shipping-postalCode"]').type('10001');
    });

    it('should validate payment card number', () => {
      cy.get('[data-cy="payment-cardNumber"]').type('1234');
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Invalid card number').should('be.visible');
    });

    it('should validate payment expiry date', () => {
      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1220'); // Expired
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Card has expired').should('be.visible');
    });

    it('should validate CVC', () => {
      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1230');
      cy.get('[data-cy="payment-cvc"]').type('12'); // Too short
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Invalid CVC').should('be.visible');
    });

    it('should process valid payment', () => {
      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1230');
      cy.get('[data-cy="payment-cvc"]').type('123');
      cy.get('[data-cy="place-order"]').click();
      cy.url().should('include', '/order-confirmation');
    });
  });

  describe('Order Summary and Modifications', () => {
    it('should display correct order total', () => {
      cy.get('[data-cy="order-total"]').should('be.visible');
      // Verify total matches cart total
      cy.get('[data-cy="cart-total"]').invoke('text').then((cartTotal) => {
        cy.get('[data-cy="order-total"]').should('contain', cartTotal);
      });
    });

    it('should apply discount codes', () => {
      cy.get('[data-cy="discount-code"]').type('SAVE10');
      cy.get('[data-cy="apply-discount"]').click();
      cy.contains('Discount applied').should('be.visible');
      cy.get('[data-cy="order-total"]').should('not.contain', '$0.00');
    });

    it('should handle invalid discount codes', () => {
      cy.get('[data-cy="discount-code"]').type('INVALID');
      cy.get('[data-cy="apply-discount"]').click();
      cy.contains('Invalid discount code').should('be.visible');
    });

    it('should update order when items are modified', () => {
      cy.get('[data-cy="order-item"]').first().within(() => {
        cy.get('[data-cy="quantity-increase"]').click();
      });
      cy.get('[data-cy="order-total"]').should('not.contain', '$0.00');
    });
  });

  describe('Checkout Flow Edge Cases', () => {
    it('should handle checkout with empty cart', () => {
      // Clear cart and try to checkout
      cy.window().then((win) => {
        win.localStorage.removeItem('cart');
      });
      cy.reload();
      cy.get('[data-cy="checkout-button"]').should('be.disabled');
    });

    it('should handle session timeout during checkout', () => {
      // Simulate session timeout
      cy.window().then((win) => {
        win.localStorage.removeItem('authToken');
      });
      cy.get('[data-cy="place-order"]').click();
      cy.url().should('include', '/login');
    });

    it('should handle payment processing errors', () => {
      cy.intercept('POST', '/api/payment', { statusCode: 402 }).as('paymentError');
      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1230');
      cy.get('[data-cy="payment-cvc"]').type('123');
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Payment failed').should('be.visible');
    });

    it('should handle network errors during checkout', () => {
      cy.intercept('POST', '/api/orders', { forceNetworkError: true }).as('networkError');
      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1230');
      cy.get('[data-cy="payment-cvc"]').type('123');
      cy.get('[data-cy="place-order"]').click();
      cy.contains('Network error').should('be.visible');
    });
  });

  describe('Guest Checkout', () => {
    it('should allow guest checkout', () => {
      // Logout first
      cy.window().then((win) => {
        win.localStorage.removeItem('authToken');
      });
      cy.reload();

      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="checkout-button"]').click();

      cy.get('[data-cy="guest-checkout"]').check();
      cy.get('[data-cy="shipping-firstName"]').type('Guest');
      cy.get('[data-cy="shipping-lastName"]').type('User');
      cy.get('[data-cy="shipping-address"]').type('123 Guest St');
      cy.get('[data-cy="shipping-city"]').type('Guest City');
      cy.get('[data-cy="shipping-postalCode"]').type('12345');
      cy.get('[data-cy="shipping-email"]').type('guest@example.com');

      cy.get('[data-cy="payment-cardNumber"]').type('4111111111111111');
      cy.get('[data-cy="payment-expiry"]').type('1230');
      cy.get('[data-cy="payment-cvc"]').type('123');
      cy.get('[data-cy="place-order"]').click();

      cy.url().should('include', '/order-confirmation');
    });
  });

  describe('Responsive Checkout', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      cy.get('[data-cy="shipping-form"]').should('be.visible');
      cy.get('[data-cy="payment-form"]').should('be.visible');
      cy.get('[data-cy="place-order"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="checkout-container"]').should('have.css', 'max-width');
    });

    it('should work on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('[data-cy="checkout-container"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      cy.get('[data-cy="shipping-firstName"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="payment-cardNumber"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="shipping-firstName"]').focus().type('John');
      cy.realPress('Tab');
      cy.focused().should('have.attr', 'data-cy', 'shipping-lastName');
    });

    it('should announce validation errors', () => {
      cy.get('[data-cy="place-order"]').click();
      cy.get('[data-cy="error-message"]').should('have.attr', 'role', 'alert');
    });
  });
});