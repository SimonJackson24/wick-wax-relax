// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/account/login');
    cy.get('[data-cy="email"]').type(email);
    cy.get('[data-cy="password"]').type(password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

// Custom command to register
Cypress.Commands.add('register', (userData) => {
  cy.visit('/account/signup');
  cy.get('[data-cy="firstName"]').type(userData.firstName);
  cy.get('[data-cy="lastName"]').type(userData.lastName);
  cy.get('[data-cy="email"]').type(userData.email);
  cy.get('[data-cy="password"]').type(userData.password);
  cy.get('[data-cy="confirmPassword"]').type(userData.confirmPassword);
  cy.get('[data-cy="register-button"]').click();
});

// Custom command to add product to cart
Cypress.Commands.add('addToCart', (productId, quantity = 1) => {
  cy.visit(`/product/${productId}`);
  cy.get('[data-cy="quantity"]').clear().type(quantity.toString());
  cy.get('[data-cy="add-to-cart"]').click();
  cy.get('[data-cy="cart-count"]').should('contain', quantity);
});

// Custom command to checkout
Cypress.Commands.add('checkout', (paymentData) => {
  cy.get('[data-cy="checkout-button"]').click();
  cy.url().should('include', '/checkout');

  // Fill shipping information
  cy.get('[data-cy="shipping-firstName"]').type(paymentData.firstName);
  cy.get('[data-cy="shipping-lastName"]').type(paymentData.lastName);
  cy.get('[data-cy="shipping-address"]').type(paymentData.address);
  cy.get('[data-cy="shipping-city"]').type(paymentData.city);
  cy.get('[data-cy="shipping-postalCode"]').type(paymentData.postalCode);

  // Fill payment information
  cy.get('[data-cy="payment-cardNumber"]').type(paymentData.cardNumber);
  cy.get('[data-cy="payment-expiry"]').type(paymentData.expiry);
  cy.get('[data-cy="payment-cvc"]').type(paymentData.cvc);

  cy.get('[data-cy="place-order"]').click();
});

// Custom command to wait for API calls
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, url).as('apiCall');
  cy.wait('@apiCall');
});

// Custom command to check PWA installation
Cypress.Commands.add('checkPWA', () => {
  cy.window().then((win) => {
    // Check if service worker is registered
    expect(win.navigator.serviceWorker).to.exist;

    // Check if manifest is available
    cy.request('/manifest.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('short_name');
    });
  });
});

// Custom command to test offline functionality
Cypress.Commands.add('testOffline', () => {
  cy.log('Testing offline functionality');

  // Go offline
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine', false);
    win.dispatchEvent(new Event('offline'));
  });

  // Test that app still works
  cy.get('body').should('be.visible');

  // Go back online
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine', true);
    win.dispatchEvent(new Event('online'));
  });
});

// Custom command to test push notifications
Cypress.Commands.add('testPushNotifications', () => {
  cy.window().then((win) => {
    // Mock notification permission
    cy.stub(win.Notification, 'requestPermission').resolves('granted');

    // Mock service worker registration
    cy.stub(win.navigator.serviceWorker, 'register').resolves({
      pushManager: {
        subscribe: cy.stub().resolves({ endpoint: 'mock-endpoint' })
      }
    });
  });
});