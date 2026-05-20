# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: market.spec.ts >> Market Flow >> Market env loads without errors
- Location: tests\market.spec.ts:4:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e12]:
      - heading "SETX 360" [level=1] [ref=e14] [cursor=pointer]:
        - text: SETX
        - generic [ref=e15]: "360"
      - img "Logo" [ref=e18] [cursor=pointer]
      - button [ref=e20] [cursor=pointer]:
        - img [ref=e21]
    - main [ref=e27]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - heading "Join SETX 360" [level=3] [ref=e31]
          - paragraph [ref=e32]: Select your account type to get started
        - generic [ref=e33]:
          - button "Resident Local resident of your community" [ref=e34] [cursor=pointer]:
            - img [ref=e36]
            - generic [ref=e39]:
              - generic [ref=e40]: Resident
              - generic [ref=e41]: Local resident of your community
          - button "Business Local business owner" [ref=e42] [cursor=pointer]:
            - img [ref=e44]
            - generic [ref=e47]:
              - generic [ref=e48]: Business
              - generic [ref=e49]: Local business owner
          - button "Chamber of Commerce Member of local Chamber" [ref=e50] [cursor=pointer]:
            - img [ref=e52]
            - generic [ref=e56]:
              - generic [ref=e57]: Chamber of Commerce
              - generic [ref=e58]: Member of local Chamber
          - button "City Official Local government representative" [ref=e59] [cursor=pointer]:
            - img [ref=e61]
            - generic [ref=e63]:
              - generic [ref=e64]: City Official
              - generic [ref=e65]: Local government representative
          - button "Artist Creative and local talent" [ref=e66] [cursor=pointer]:
            - img [ref=e68]
            - generic [ref=e74]:
              - generic [ref=e75]: Artist
              - generic [ref=e76]: Creative and local talent
          - button "Venue Local spot, event space, or venue" [ref=e77] [cursor=pointer]:
            - img [ref=e79]
            - generic [ref=e83]:
              - generic [ref=e84]: Venue
              - generic [ref=e85]: Local spot, event space, or venue
          - button "Media Official news and reporting" [ref=e86] [cursor=pointer]:
            - img [ref=e88]
            - generic [ref=e91]:
              - generic [ref=e92]: Media
              - generic [ref=e93]: Official news and reporting
          - button "Non Profit Community service & outreach" [ref=e94] [cursor=pointer]:
            - img [ref=e96]
            - generic [ref=e98]:
              - generic [ref=e99]: Non Profit
              - generic [ref=e100]: Community service & outreach
          - button "Church Faith and ministry" [ref=e101] [cursor=pointer]:
            - img [ref=e103]
            - generic [ref=e107]:
              - generic [ref=e108]: Church
              - generic [ref=e109]: Faith and ministry
          - button "Guest Visiting or new to the area" [ref=e110] [cursor=pointer]:
            - img [ref=e112]
            - generic [ref=e115]:
              - generic [ref=e116]: Guest
              - generic [ref=e117]: Visiting or new to the area
        - button "Already have an account? Sign In" [ref=e119] [cursor=pointer]:
          - text: Already have an account?
          - generic [ref=e120]: Sign In
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Market Flow', () => {
  4  |   test('Market env loads without errors', async ({ page }) => {
  5  |     await page.goto('/?env=market');
  6  |     await page.waitForLoadState('networkidle');
  7  | 
  8  |     // Page shouldn't be a 404 or error
  9  |     await expect(page).not.toHaveTitle(/404|Error/);
  10 | 
  11 |     // Should see market content or auth prompt
  12 |     const hasContent =
  13 |       (await page.locator('text=Market').count()) > 0 ||
  14 |       (await page.locator('text=Store').count()) > 0 ||
  15 |       (await page.locator('text=Shop').count()) > 0 ||
  16 |       (await page.locator('input[type="email"]').count()) > 0; // auth wall
> 17 |     expect(hasContent).toBe(true);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  18 |   });
  19 | 
  20 |   test('Market env switcher button navigates correctly', async ({ page }) => {
  21 |     await page.goto('/');
  22 |     await page.waitForLoadState('networkidle');
  23 | 
  24 |     // Find and click the Market button in the switcher
  25 |     const marketBtn = page.locator('.sw-btn.market, button:has-text("Market")').first();
  26 |     if (await marketBtn.isVisible()) {
  27 |       await marketBtn.click();
  28 |       await page.waitForTimeout(1500);
  29 |       const url = page.url();
  30 |       expect(url).toContain('env=market');
  31 |     }
  32 |   });
  33 | 
  34 |   test('Stores directory renders a list', async ({ page }) => {
  35 |     await page.goto('/?env=market');
  36 |     await page.waitForLoadState('networkidle');
  37 | 
  38 |     // Navigate to Stores tab if possible
  39 |     const storesTab = page.locator('button:has-text("Stores"), [data-tab="stores"]').first();
  40 |     if (await storesTab.isVisible()) {
  41 |       await storesTab.click();
  42 |       await page.waitForTimeout(2000);
  43 |       // Should render some store cards or an empty state — not a crash
  44 |       await expect(page.locator('body')).not.toBeEmpty();
  45 |     }
  46 |   });
  47 | 
  48 |   test('app middleware does not 404 on setx360.com', async ({ page }) => {
  49 |     // This is the regression test for the middleware bug — setx360.com must NOT
  50 |     // be routed to the tenant handler
  51 |     const response = await page.goto('/');
  52 |     expect(response?.status()).not.toBe(404);
  53 |     expect(response?.status()).toBeLessThan(500);
  54 |   });
  55 | 
  56 |   test('PWA manifest is reachable', async ({ page }) => {
  57 |     const response = await page.goto('/manifest.json');
  58 |     expect(response?.status()).toBe(200);
  59 |     const body = await response?.text();
  60 |     expect(body).toContain('SETX 360');
  61 |   });
  62 | 
  63 |   test('Service worker is reachable', async ({ page }) => {
  64 |     const response = await page.goto('/sw.js');
  65 |     expect(response?.status()).toBe(200);
  66 |   });
  67 | });
  68 | 
```