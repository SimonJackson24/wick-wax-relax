describe('User Authentication Flows', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
      win.localStorage.removeItem('user');
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      cy.visit('/account/login');
    });

    it('should load login page successfully', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-cy="email"]').should('be.visible');
      cy.get('[data-cy="password"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
    });

    it('should login with valid credentials', () => {
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      cy.url().should('not.include', '/login');
      cy.get('[data-cy="user-menu"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('[data-cy="email"]').type('invalid@example.com');
      cy.get('[data-cy="password"]').type('wrongpassword');
      cy.get('[data-cy="login-button"]').click();
      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('[data-cy="email"]').type('invalid-email');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      cy.contains('Please enter a valid email').should('be.visible');
    });

    it('should require password', () => {
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="login-button"]').click();
      cy.contains('Password is required').should('be.visible');
    });

    it('should handle case insensitive email', () => {
      cy.get('[data-cy="email"]').type('TEST@EXAMPLE.COM');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      cy.url().should('not.include', '/login');
    });

    it('should remember login state across sessions', () => {
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="remember-me"]').check();
      cy.get('[data-cy="login-button"]').click();
      cy.reload();
      cy.get('[data-cy="user-menu"]').should('be.visible');
    });
  });

  describe('Registration Functionality', () => {
    beforeEach(() => {
      cy.visit('/account/signup');
    });

    it('should load registration page successfully', () => {
      cy.contains('Sign Up').should('be.visible');
      cy.get('[data-cy="firstName"]').should('be.visible');
      cy.get('[data-cy="lastName"]').should('be.visible');
      cy.get('[data-cy="email"]').should('be.visible');
      cy.get('[data-cy="password"]').should('be.visible');
      cy.get('[data-cy="confirmPassword"]').should('be.visible');
    });

    it('should register new user successfully', () => {
      const timestamp = Date.now();
      cy.get('[data-cy="firstName"]').type('Test');
      cy.get('[data-cy="lastName"]').type('User');
      cy.get('[data-cy="email"]').type(`testuser${timestamp}@example.com`);
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="confirmPassword"]').type('password123');
      cy.get('[data-cy="register-button"]').click();
      cy.contains('Registration successful').should('be.visible');
    });

    it('should validate password strength', () => {
      cy.get('[data-cy="firstName"]').type('Test');
      cy.get('[data-cy="lastName"]').type('User');
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="password"]').type('123'); // Too short
      cy.get('[data-cy="confirmPassword"]').type('123');
      cy.get('[data-cy="register-button"]').click();
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should validate password confirmation', () => {
      cy.get('[data-cy="firstName"]').type('Test');
      cy.get('[data-cy="lastName"]').type('User');
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="confirmPassword"]').type('differentpassword');
      cy.get('[data-cy="register-button"]').click();
      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should prevent duplicate email registration', () => {
      cy.get('[data-cy="firstName"]').type('Test');
      cy.get('[data-cy="lastName"]').type('User');
      cy.get('[data-cy="email"]').type('existing@example.com');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="confirmPassword"]').type('password123');
      cy.get('[data-cy="register-button"]').click();
      cy.contains('Email already exists').should('be.visible');
    });

    it('should require all fields', () => {
      cy.get('[data-cy="register-button"]').click();
      cy.contains('First name is required').should('be.visible');
      cy.contains('Last name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', () => {
      cy.visit('/account/forgot-password');
      cy.get('[data-cy="email"]').type('test@example.com');
      cy.get('[data-cy="reset-button"]').click();
      cy.contains('Password reset email sent').should('be.visible');
    });

    it('should handle invalid email for password reset', () => {
      cy.visit('/account/forgot-password');
      cy.get('[data-cy="email"]').type('nonexistent@example.com');
      cy.get('[data-cy="reset-button"]').click();
      cy.contains('Email not found').should('be.visible');
    });

    it('should reset password with valid token', () => {
      const resetToken = 'valid-reset-token';
      cy.visit(`/account/reset-password?token=${resetToken}`);
      cy.get('[data-cy="password"]').type('newpassword123');
      cy.get('[data-cy="confirmPassword"]').type('newpassword123');
      cy.get('[data-cy="reset-button"]').click();
      cy.contains('Password reset successfully').should('be.visible');
    });

    it('should handle expired reset token', () => {
      const expiredToken = 'expired-token';
      cy.visit(`/account/reset-password?token=${expiredToken}`);
      cy.contains('Reset link has expired').should('be.visible');
    });
  });

  describe('User Profile Management', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'password123');
      cy.visit('/account/profile');
    });

    it('should load profile page', () => {
      cy.contains('Profile').should('be.visible');
      cy.get('[data-cy="profile-form"]').should('be.visible');
    });

    it('should update profile information', () => {
      cy.get('[data-cy="firstName"]').clear().type('Updated');
      cy.get('[data-cy="lastName"]').clear().type('Name');
      cy.get('[data-cy="save-profile"]').click();
      cy.contains('Profile updated successfully').should('be.visible');
    });

    it('should change password', () => {
      cy.get('[data-cy="current-password"]').type('password123');
      cy.get('[data-cy="new-password"]').type('newpassword123');
      cy.get('[data-cy="confirm-new-password"]').type('newpassword123');
      cy.get('[data-cy="change-password"]').click();
      cy.contains('Password changed successfully').should('be.visible');
    });

    it('should validate current password', () => {
      cy.get('[data-cy="current-password"]').type('wrongpassword');
      cy.get('[data-cy="new-password"]').type('newpassword123');
      cy.get('[data-cy="confirm-new-password"]').type('newpassword123');
      cy.get('[data-cy="change-password"]').click();
      cy.contains('Current password is incorrect').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should handle session timeout', () => {
      cy.login('test@example.com', 'password123');
      // Simulate session timeout
      cy.window().then((win) => {
        win.localStorage.removeItem('authToken');
      });
      cy.reload();
      cy.url().should('include', '/login');
    });

    it('should logout successfully', () => {
      cy.login('test@example.com', 'password123');
      cy.get('[data-cy="logout-button"]').click();
      cy.url().should('include', '/login');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });

    it('should handle multiple login attempts', () => {
      cy.visit('/account/login');
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy="email"]').type('test@example.com');
        cy.get('[data-cy="password"]').type('wrongpassword');
        cy.get('[data-cy="login-button"]').click();
      }
      cy.contains('Too many failed attempts').should('be.visible');
    });
  });

  describe('Social Authentication', () => {
    it('should login with Google', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="google-login"]').click();
      // Mock successful OAuth response
      cy.intercept('GET', '/auth/google/callback*', { statusCode: 200 }).as('googleAuth');
      cy.wait('@googleAuth');
      cy.url().should('not.include', '/login');
    });

    it('should handle Google auth failure', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="google-login"]').click();
      cy.intercept('GET', '/auth/google/callback*', { statusCode: 401 }).as('googleAuthFail');
      cy.wait('@googleAuthFail');
      cy.contains('Authentication failed').should('be.visible');
    });

    it('should login with Facebook', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="facebook-login"]').click();
      cy.intercept('GET', '/auth/facebook/callback*', { statusCode: 200 }).as('facebookAuth');
      cy.wait('@facebookAuth');
      cy.url().should('not.include', '/login');
    });
  });

  describe('Responsive Authentication', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      cy.visit('/account/login');
      cy.get('[data-cy="email"]').should('be.visible');
      cy.get('[data-cy="password"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/account/login');
      cy.get('[data-cy="login-form"]').should('have.css', 'max-width');
    });

    it('should work on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/account/login');
      cy.get('[data-cy="login-form"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="email"]').should('have.attr', 'aria-label');
      cy.get('[data-cy="password"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="email"]').focus().type('test@example.com');
      cy.realPress('Tab');
      cy.focused().should('have.attr', 'data-cy', 'password');
    });

    it('should announce validation errors', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="login-button"]').click();
      cy.get('[data-cy="error-message"]').should('have.attr', 'role', 'alert');
    });
  });

  describe('Security Features', () => {
    it('should prevent XSS in input fields', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="email"]').type('<script>alert("xss")</script>');
      cy.get('[data-cy="password"]').type('password123');
      cy.get('[data-cy="login-button"]').click();
      // Should sanitize input and not execute script
      cy.on('window:alert', () => {
        throw new Error('XSS vulnerability detected');
      });
    });

    it('should handle SQL injection attempts', () => {
      cy.visit('/account/login');
      cy.get('[data-cy="email"]').type("' OR '1'='1");
      cy.get('[data-cy="password"]').type("' OR '1'='1");
      cy.get('[data-cy="login-button"]').click();
      cy.contains('Invalid email or password').should('be.visible');
    });
  });
});