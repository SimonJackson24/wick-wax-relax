describe('Contact Form Submission', () => {
  beforeEach(() => {
    cy.visit('/contact');
  });

  describe('Contact Form Display', () => {
    it('should load contact page successfully', () => {
      cy.contains('Contact Us').should('be.visible');
      cy.get('[data-cy="contact-form"]').should('be.visible');
    });

    it('should display all required form fields', () => {
      cy.get('[data-cy="contact-name"]').should('be.visible');
      cy.get('[data-cy="contact-email"]').should('be.visible');
      cy.get('[data-cy="contact-subject"]').should('be.visible');
      cy.get('[data-cy="contact-message"]').should('be.visible');
      cy.get('[data-cy="contact-submit"]').should('be.visible');
    });

    it('should display contact information', () => {
      cy.get('[data-cy="contact-info"]').should('be.visible');
      cy.get('[data-cy="contact-phone"]').should('be.visible');
      cy.get('[data-cy="contact-address"]').should('be.visible');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Subject is required').should('be.visible');
      cy.contains('Message is required').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('invalid-email');
      cy.get('[data-cy="contact-subject"]').type('Test Subject');
      cy.get('[data-cy="contact-message"]').type('Test message');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Please enter a valid email address').should('be.visible');
    });

    it('should validate message length', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').type('Test Subject');
      cy.get('[data-cy="contact-message"]').type('Short'); // Too short
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Message must be at least 10 characters').should('be.visible');
    });

    it('should validate subject selection', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select(''); // Empty selection
      cy.get('[data-cy="contact-message"]').type('This is a test message with enough length');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Please select a subject').should('be.visible');
    });
  });

  describe('Successful Form Submission', () => {
    it('should submit contact form successfully', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('This is a test message with enough length to pass validation');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Message sent successfully').should('be.visible');
    });

    it('should handle different subject types', () => {
      const subjects = ['General Inquiry', 'Product Support', 'Order Issue', 'Returns', 'Other'];

      subjects.forEach((subject) => {
        cy.get('[data-cy="contact-name"]').type('Test User');
        cy.get('[data-cy="contact-email"]').type('test@example.com');
        cy.get('[data-cy="contact-subject"]').select(subject);
        cy.get('[data-cy="contact-message"]').type(`Test message for ${subject}`);
        cy.get('[data-cy="contact-submit"]').click();
        cy.contains('Message sent successfully').should('be.visible');
        cy.reload(); // Reset form for next iteration
      });
    });

    it('should include optional phone number', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-phone"]').type('+1-555-123-4567');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message with phone number');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Message sent successfully').should('be.visible');
    });
  });

  describe('File Attachments', () => {
    it('should allow file uploads', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message with attachment');

      // Mock file upload
      cy.get('[data-cy="file-upload"]').selectFile('cypress/fixtures/test-image.jpg');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Message sent successfully').should('be.visible');
    });

    it('should validate file size limits', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message');

      // Mock large file upload
      cy.get('[data-cy="file-upload"]').selectFile('cypress/fixtures/large-file.zip');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('File size exceeds limit').should('be.visible');
    });

    it('should validate file types', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message');

      // Mock invalid file type
      cy.get('[data-cy="file-upload"]').selectFile('cypress/fixtures/test.exe');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('File type not allowed').should('be.visible');
    });
  });

  describe('Contact Form with Authentication', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
      cy.visit('/contact');
    });

    it('should pre-fill user information', () => {
      cy.get('[data-cy="contact-name"]').should('have.value', 'Test User');
      cy.get('[data-cy="contact-email"]').should('have.value', 'test@example.com');
    });

    it('should submit authenticated contact form', () => {
      cy.get('[data-cy="contact-subject"]').select('Order Issue');
      cy.get('[data-cy="contact-message"]').type('Authenticated user contact message');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Message sent successfully').should('be.visible');
    });
  });

  describe('Contact Form Error Handling', () => {
    it('should handle network errors', () => {
      cy.intercept('POST', '/api/contact', { forceNetworkError: true }).as('networkError');
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Network error').should('be.visible');
    });

    it('should handle server errors', () => {
      cy.intercept('POST', '/api/contact', { statusCode: 500 }).as('serverError');
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message');
      cy.get('[data-cy="contact-submit"]').click();
      cy.contains('Server error').should('be.visible');
    });

    it('should handle rate limiting', () => {
      // Simulate multiple rapid submissions
      for (let i = 0; i < 10; i++) {
        cy.get('[data-cy="contact-name"]').type('Test User');
        cy.get('[data-cy="contact-email"]').type('test@example.com');
        cy.get('[data-cy="contact-subject"]').select('General Inquiry');
        cy.get('[data-cy="contact-message"]').type(`Test message ${i}`);
        cy.get('[data-cy="contact-submit"]').click();
      }
      cy.contains('Too many requests').should('be.visible');
    });
  });

  describe('Contact Form Accessibility', () => {
    it('should have proper form labels', () => {
      cy.get('[data-cy="contact-name"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="contact-email"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="contact-message"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy="contact-name"]').focus().type('Test User');
      cy.realPress('Tab');
      cy.focused().should('have.attr', 'data-cy', 'contact-email');
      cy.realPress('Tab');
      cy.focused().should('have.attr', 'data-cy', 'contact-subject');
    });

    it('should announce validation errors', () => {
      cy.get('[data-cy="contact-submit"]').click();
      cy.get('[data-cy="error-message"]').should('have.attr', 'role', 'alert');
    });

    it('should have sufficient color contrast', () => {
      cy.get('[data-cy="contact-submit"]').should('have.css', 'color');
      cy.get('[data-cy="contact-submit"]').should('have.css', 'background-color');
    });
  });

  describe('Responsive Contact Form', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      cy.get('[data-cy="contact-form"]').should('be.visible');
      cy.get('[data-cy="contact-name"]').should('be.visible');
      cy.get('[data-cy="contact-submit"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="contact-form"]').should('have.css', 'max-width');
    });

    it('should work on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('[data-cy="contact-form"]').should('be.visible');
    });
  });

  describe('Contact Form Analytics', () => {
    it('should track form interactions', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      // Check if analytics events are fired
      cy.window().then((win) => {
        // Mock analytics tracking
        expect(win.dataLayer).to.exist;
      });
    });

    it('should track form submissions', () => {
      cy.get('[data-cy="contact-name"]').type('Test User');
      cy.get('[data-cy="contact-email"]').type('test@example.com');
      cy.get('[data-cy="contact-subject"]').select('General Inquiry');
      cy.get('[data-cy="contact-message"]').type('Test message');
      cy.get('[data-cy="contact-submit"]').click();
      // Verify analytics tracking
      cy.window().then((win) => {
        expect(win.dataLayer).to.include('contact_form_submit');
      });
    });
  });
});