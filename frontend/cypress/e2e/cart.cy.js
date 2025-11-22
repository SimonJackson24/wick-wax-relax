describe('Shopping Cart Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    // Clear cart before each test
    cy.window().then((win) => {
      win.localStorage.removeItem('cart');
    });
  });

  describe('Adding Items to Cart', () => {
    it('should add product to cart from product page', () => {
      cy.visit('/product/1');
      cy.get('[data-cy="quantity"]').clear().type('2');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.get('[data-cy="cart-count"]').should('contain', '2');
    });

    it('should add product to cart from products list', () => {
      cy.visit('/products');
      cy.get('[data-cy="product-card"]').first().within(() => {
        cy.get('[data-cy="add-to-cart"]').click();
      });
      cy.get('[data-cy="cart-count"]').should('contain', '1');
    });

    it('should handle quantity limits', () => {
      cy.visit('/product/1');
      cy.get('[data-cy="quantity"]').clear().type('100');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.contains('Maximum quantity exceeded').should('be.visible');
    });

    it('should handle out of stock items', () => {
      cy.visit('/product/out-of-stock');
      cy.get('[data-cy="add-to-cart"]').should('be.disabled');
      cy.contains('Out of stock').should('be.visible');
    });
  });

  describe('Cart Display and Navigation', () => {
    beforeEach(() => {
      // Add an item to cart
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
    });

    it('should display cart icon with correct count', () => {
      cy.get('[data-cy="cart-icon"]').should('be.visible');
      cy.get('[data-cy="cart-count"]').should('contain', '1');
    });

    it('should open cart sidebar when clicked', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-sidebar"]').should('be.visible');
    });

    it('should display cart items correctly', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-item"]').should('have.length', 1);
      cy.get('[data-cy="cart-item"]').within(() => {
        cy.get('[data-cy="item-name"]').should('be.visible');
        cy.get('[data-cy="item-price"]').should('be.visible');
        cy.get('[data-cy="item-quantity"]').should('contain', '1');
      });
    });
  });

  describe('Cart Item Management', () => {
    beforeEach(() => {
      // Add multiple items to cart
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.visit('/product/2');
      cy.get('[data-cy="add-to-cart"]').click();
    });

    it('should update item quantity in cart', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-item"]').first().within(() => {
        cy.get('[data-cy="quantity-increase"]').click();
        cy.get('[data-cy="item-quantity"]').should('contain', '2');
      });
    });

    it('should remove item from cart', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-item"]').first().within(() => {
        cy.get('[data-cy="remove-item"]').click();
      });
      cy.get('[data-cy="cart-item"]').should('have.length', 1);
    });

    it('should clear entire cart', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="clear-cart"]').click();
      cy.get('[data-cy="cart-item"]').should('have.length', 0);
      cy.get('[data-cy="cart-count"]').should('contain', '0');
    });

    it('should calculate cart total correctly', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-total"]').should('be.visible');
      // Verify total calculation logic
      cy.get('[data-cy="cart-item"]').then(($items) => {
        let expectedTotal = 0;
        $items.each((index, item) => {
          const price = parseFloat(Cypress.$(item).find('[data-cy="item-price"]').text().replace('$', ''));
          const quantity = parseInt(Cypress.$(item).find('[data-cy="item-quantity"]').text());
          expectedTotal += price * quantity;
        });
        cy.get('[data-cy="cart-total"]').should('contain', `$${expectedTotal.toFixed(2)}`);
      });
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart across page reloads', () => {
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.reload();
      cy.get('[data-cy="cart-count"]').should('contain', '1');
    });

    it('should persist cart across browser sessions', () => {
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.reload();
      cy.get('[data-cy="cart-count"]').should('contain', '1');
    });
  });

  describe('Cart Validation', () => {
    it('should prevent checkout with empty cart', () => {
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="checkout-button"]').should('be.disabled');
    });

    it('should show minimum order value message', () => {
      cy.visit('/product/cheap-item');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.get('[data-cy="cart-icon"]').click();
      cy.contains('Minimum order value is $10').should('be.visible');
    });

    it('should handle maximum cart items limit', () => {
      // Add many items to reach limit
      for (let i = 1; i <= 50; i++) {
        cy.visit(`/product/${i}`);
        cy.get('[data-cy="add-to-cart"]').click();
      }
      cy.contains('Cart is full').should('be.visible');
    });
  });

  describe('Responsive Cart Behavior', () => {
    beforeEach(() => {
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
    });

    it('should work correctly on mobile', () => {
      cy.viewport('iphone-6');
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-sidebar"]').should('be.visible');
      cy.get('[data-cy="cart-sidebar"]').should('have.css', 'position', 'fixed');
    });

    it('should work correctly on tablet', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-sidebar"]').should('be.visible');
    });

    it('should work correctly on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('[data-cy="cart-icon"]').click();
      cy.get('[data-cy="cart-sidebar"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy="cart-icon"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="add-to-cart"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="cart-icon"]').focus().type('{enter}');
      cy.get('[data-cy="cart-sidebar"]').should('be.visible');
    });

    it('should announce cart updates to screen readers', () => {
      cy.get('[data-cy="add-to-cart"]').click();
      cy.get('[data-cy="cart-count"]').should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Error Handling', () => {
    it('should handle cart API errors gracefully', () => {
      cy.intercept('POST', '/api/cart', { statusCode: 500 }).as('cartError');
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.contains('Failed to add item to cart').should('be.visible');
    });

    it('should handle network failures', () => {
      cy.intercept('POST', '/api/cart', { forceNetworkError: true }).as('networkError');
      cy.visit('/product/1');
      cy.get('[data-cy="add-to-cart"]').click();
      cy.contains('Network error').should('be.visible');
    });
  });
});