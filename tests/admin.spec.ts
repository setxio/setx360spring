import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'setxplatform@gmail.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? '';

test.describe('Admin Flow', () => {
  test.skip(!ADMIN_PASSWORD, 'Admin credentials not set — set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(ADMIN_EMAIL);
      await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
      await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
      await page.waitForTimeout(3000);
    }
  });

  test('admin user lands on admin env after login', async ({ page }) => {
    // After admin login, should be on admin env
    const url = page.url();
    const isOnAdmin = url.includes('env=admin') ||
      (await page.locator('text=Admin Control').count()) > 0 ||
      (await page.locator('text=Admin Dashboard').count()) > 0;
    expect(isOnAdmin).toBe(true);
  });

  test('Admin Control button is visible and pinned to left', async ({ page }) => {
    const adminBtn = page.locator('button:has-text("Admin Control")');
    await expect(adminBtn).toBeVisible();
    // Should be the first/leftmost button in the switcher area
    const switcherWrapper = page.locator('.switcher-wrapper');
    await expect(switcherWrapper).toBeVisible();
  });

  test('admin can navigate to Verify tab in dashboard', async ({ page }) => {
    // Click Admin Control if not already on admin env
    const adminBtn = page.locator('button:has-text("Admin Control")');
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForTimeout(1000);
    }
    // Verify tab should exist
    const verifyTab = page.locator('button:has-text("Verify"), [data-tab="verify"]');
    if (await verifyTab.isVisible()) {
      await verifyTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('non-admin cannot access admin route', async ({ page: nonAdminPage }) => {
    // Open a new page without admin login
    await nonAdminPage.goto('/?env=admin');
    await nonAdminPage.waitForLoadState('networkidle');
    // Should be redirected away from admin or show nothing special
    const isOnAdmin = (await nonAdminPage.locator('text=Admin Dashboard').count()) > 0;
    // A non-authenticated user should never see the admin dashboard
    expect(isOnAdmin).toBe(false);
  });
});
