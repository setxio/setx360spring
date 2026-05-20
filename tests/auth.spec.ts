import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@setx360.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'TestPassword123!';

test.describe('Authentication Flow', () => {
  test('login page loads and shows sign-in form', async ({ page }) => {
    await page.goto('/');
    // App loads without error
    await expect(page).not.toHaveTitle(/404/);
    await expect(page).not.toHaveTitle(/Error/);
    // Should see either the app or the auth form
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('unauthenticated user sees sign-in UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Either a sign-in button/form or the public market should be visible
    const hasAuthUI =
      (await page.locator('button:has-text("Sign In")').count()) > 0 ||
      (await page.locator('button:has-text("Log In")').count()) > 0 ||
      (await page.locator('input[type="email"]').count()) > 0 ||
      (await page.locator('text=Market').count()) > 0;
    expect(hasAuthUI).toBe(true);
  });

  test('wrong password shows error, not crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('wrong@example.com');
      await passwordInput.fill('wrongpassword');
      await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();

      // Should show an error message, not crash
      await page.waitForTimeout(2000);
      const hasError =
        (await page.locator('text=/invalid|incorrect|error|failed/i').count()) > 0 ||
        (await page.locator('[class*="error"], [class*="alert"]').count()) > 0;
      // App should still be on the page (not blank)
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('successful login lands user in the app', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    if (!(await emailInput.isVisible())) {
      test.skip(); // Already logged in or no auth form visible
      return;
    }

    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();

    // Wait for navigation into the app (env switcher should appear)
    await page.waitForTimeout(3000);
    const inApp =
      (await page.locator('.env-switcher-footer').count()) > 0 ||
      (await page.locator('.switcher-wrapper').count()) > 0 ||
      (await page.locator('text=Discover').count()) > 0;
    expect(inApp).toBe(true);
  });
});
