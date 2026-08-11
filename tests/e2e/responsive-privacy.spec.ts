import { test, expect } from '@playwright/test';
import { waitForIsland } from './helpers.ts';

const ROUTES = [
  '/', '/safety/', '/understanding/', '/understanding/mechanics/',
  '/muscles/', '/muscles/iliopsoas/', '/exercises/', '/exercises/virasana/',
  '/routines/', '/routines/desk-worker/', '/search/',
];

test.describe('360px viewport (SC-014)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const route of ROUTES) {
    test(`${route} has no horizontal page scroll`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
      await page.reload();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }

  test('exercise instructions are legible without zooming', async ({ page }) => {
    await page.goto('/exercises/heel-slide/');
    await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
    await page.reload();
    const size = await page
      .locator('.steps li')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
});

test.describe('privacy (SC-013, FR-041)', () => {
  test('writes only the two permitted keys, and nothing else', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    for (const route of ROUTES) await page.goto(route);
    await page.goto('/exercises/');
    await page.getByRole('button', { name: /show the movement content/i }).click();
    await waitForIsland(page, 'ThemeToggle');
    await page.getByRole('button', { name: /^theme:/i }).click();
    await page.goto('/search/');
    await page.getByRole('searchbox').fill('hamstring');

    const local = await page.evaluate(() => Object.keys(localStorage).sort());
    const session = await page.evaluate(() => Object.keys(sessionStorage));
    const cookies = await page.context().cookies();

    expect(local).toEqual(['fixknee:red-flags-ack', 'fixknee:theme']);
    expect(session).toEqual([]);
    expect(cookies).toEqual([]);
  });

  test('makes no requests to any external host (SC-012)', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.hostname !== 'localhost' && url.protocol !== 'data:') external.push(r.url());
    });
    for (const route of ROUTES) await page.goto(route);
    expect(external).toEqual([]);
  });
});
