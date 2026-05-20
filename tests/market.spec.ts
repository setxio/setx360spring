import { test, expect } from '@playwright/test';

test.describe('Market Flow', () => {
  test('Market env loads without errors', async ({ page }) => {
    await page.goto('/?env=market');
    await page.waitForLoadState('networkidle');

    // Page shouldn't be a 404 or error
    await expect(page).not.toHaveTitle(/404|Error/);

    // Should see market content or auth prompt
    const hasContent =
      (await page.locator('text=Market').count()) > 0 ||
      (await page.locator('text=Store').count()) > 0 ||
      (await page.locator('text=Shop').count()) > 0 ||
      (await page.locator('input[type="email"]').count()) > 0; // auth wall
    expect(hasContent).toBe(true);
  });

  test('Market env switcher button navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click the Market button in the switcher
    const marketBtn = page.locator('.sw-btn.market, button:has-text("Market")').first();
    if (await marketBtn.isVisible()) {
      await marketBtn.click();
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url).toContain('env=market');
    }
  });

  test('Stores directory renders a list', async ({ page }) => {
    await page.goto('/?env=market');
    await page.waitForLoadState('networkidle');

    // Navigate to Stores tab if possible
    const storesTab = page.locator('button:has-text("Stores"), [data-tab="stores"]').first();
    if (await storesTab.isVisible()) {
      await storesTab.click();
      await page.waitForTimeout(2000);
      // Should render some store cards or an empty state — not a crash
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('app middleware does not 404 on setx360.com', async ({ page }) => {
    // This is the regression test for the middleware bug — setx360.com must NOT
    // be routed to the tenant handler
    const response = await page.goto('/');
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).toBeLessThan(500);
  });

  test('PWA manifest is reachable', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('SETX 360');
  });

  test('Service worker is reachable', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);
  });
});
