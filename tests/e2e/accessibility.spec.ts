import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/*
 * SC-010 / SC-011. Runs in BOTH themes because contrast violations are
 * theme-specific — testing only the default would miss half of them.
 *
 * Automated checks are necessary, not sufficient; keyboard.spec.ts covers what axe
 * structurally cannot.
 */

const ROUTES = [
  '/',
  '/safety/',
  '/understanding/',
  '/understanding/mechanics/',
  '/understanding/sources/',
  '/understanding/sources/effusion/',
  '/understanding/patterns/',
  '/understanding/patterns/patellofemoral/',
  '/muscles/',
  '/muscles/gluteus-medius/',
  '/exercises/',
  '/exercises/heel-slide/',
  '/routines/',
  '/routines/morning-mobility/',
  '/search/',
  '/404',
];

async function scan(page: Page, url: string, theme: 'light' | 'dark') {
  await page.goto(url);
  await page.evaluate(
    ([t]) => {
      localStorage.setItem('fixknee:red-flags-ack', '1');
      localStorage.setItem('fixknee:theme', t as string);
    },
    [theme],
  );
  await page.goto(url);
  await expect(page.locator('body')).toBeVisible();
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe — ${theme} theme`, () => {
    for (const route of ROUTES) {
      test(`${route} has no violations`, async ({ page }) => {
        const results = await scan(page, route, theme);
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test.describe('gate state accessibility', () => {
  test('the un-acknowledged gate is itself accessible', async ({ page }) => {
    await page.goto('/exercises/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('structure', () => {
  test('every route has exactly one h1 and the expected landmarks', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      expect(await page.locator('h1').count(), `${route} h1 count`).toBe(1);
      await expect(page.getByRole('banner'), route).toBeVisible();
      await expect(page.getByRole('main'), route).toBeVisible();
      await expect(page.getByRole('contentinfo'), route).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Main' }), route).toBeVisible();
    }
  });
});
