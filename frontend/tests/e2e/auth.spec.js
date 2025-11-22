const { test, expect } = require('@playwright/test');

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage and cookies before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Login/);

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/Sign Up/);

    // Check for signup form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');

    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should navigate to signup from login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click signup link
    await page.click('text=Don\'t have an account? Sign up');

    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('should navigate to login from signup page', async ({ page }) => {
    await page.goto('/auth/signup');

    // Click login link
    await page.click('text=Already have an account? Login');

    // Should navigate to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should handle successful registration', async ({ page }) => {
    await page.goto('/auth/signup');

    // Generate unique email for test
    const testEmail = `test${Date.now()}@example.com`;

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page or show success message
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    // First register a test user
    await page.goto('/auth/signup');
    const testEmail = `login${Date.now()}@example.com`;

    await page.fill('input[name="firstName"]', 'Login');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForURL('/');

    // Now test login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should handle password reset request', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=If an account with that email exists')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('/');

    // Click logout (assuming there's a logout button in header/navigation)
    await page.click('button[title="Logout"]');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should persist login state across page reloads', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle rate limiting', async ({ page }) => {
    await page.goto('/auth/login');

    // Attempt multiple rapid logins
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForSelector('text=Invalid credentials');
    }

    // Should eventually show rate limit error
    await expect(page.locator('text=Too many')).toBeVisible();
  });
});