import { test, expect, type Page } from '@playwright/test';
import { waitForIsland } from './helpers.ts';

async function openLibrary(page: Page, query = '') {
  await page.goto('/exercises/');
  await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
  await page.goto(`/exercises/${query}`);
  await expect(page.getByTestId('gated-content')).toBeVisible();
  await waitForIsland(page, 'ExerciseFilters');
}

const results = (page: Page) => page.locator('.filters-results .grid > li');

test.describe('filtering (SC-008)', () => {
  test('states a result count', async ({ page }) => {
    await openLibrary(page);
    await expect(page.locator('.js-only .filters-results__count')).toContainText(/\d+ exercises/);
  });

  test('filters by each dimension in turn', async ({ page }) => {
    await openLibrary(page);
    for (const label of ['Yoga', 'Mobility', 'Beginner']) {
      await page.getByRole('checkbox', { name: new RegExp(label, 'i') }).first().check();
      await expect(results(page).first()).toBeVisible();
      await page.getByRole('button', { name: /clear all/i }).first().click();
    }
  });

  test('ANDs across dimensions', async ({ page }) => {
    await openLibrary(page);
    await page.getByRole('checkbox', { name: /Yoga/i }).first().check();
    const yogaCount = await results(page).count();
    await page.getByRole('checkbox', { name: /Advanced/i }).first().check();
    const bothCount = await results(page).count();
    expect(bothCount).toBeLessThan(yogaCount);
    expect(bothCount).toBeGreaterThan(0);
  });

  test('shows an explicit empty state with a clear action, not a bare empty list', async ({ page }) => {
    // Reaching a no-match combination via the URL, since the UI disables zero-count
    // options to prevent getting here by clicking. Both values must be ones the content
    // actually uses — unknown values are ignored by design, so they would NOT be empty.
    await openLibrary(page, '?modality=taichi-qigong&equipment=strap');
    const callout = page.locator('.callout', { hasText: 'No exercises match' });
    await expect(callout).toBeVisible();
    await expect(callout.getByRole('button', { name: /clear all filters/i })).toBeVisible();
  });

  test('round-trips filter state through the URL', async ({ page }) => {
    await openLibrary(page);
    await page.getByRole('checkbox', { name: /Tai chi/i }).first().check();
    await expect.poll(() => page.url()).toContain('modality=taichi-qigong');
    const before = await results(page).count();

    await page.reload();
    await expect(page.getByRole('checkbox', { name: /Tai chi/i }).first()).toBeChecked();
    expect(await results(page).count()).toBe(before);
  });

  test('ignores unknown filter values rather than breaking', async ({ page }) => {
    await openLibrary(page, '?modality=breakdancing');
    await expect(results(page).first()).toBeVisible();
  });

  test('announces the result count to assistive technology', async ({ page }) => {
    await openLibrary(page);
    await expect(page.locator('[aria-live="polite"]').first()).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('renders the complete library, degraded but usable', async ({ page }) => {
    await page.goto('/exercises/');
    // Gated, correctly — but the fallback list is in the DOM and complete.
    const cards = page.locator('.nojs-only .grid > li');
    expect(await cards.count()).toBeGreaterThanOrEqual(20);
  });
});
