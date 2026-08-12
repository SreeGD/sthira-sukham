import { test, expect } from '@playwright/test';
import { waitForIsland } from './helpers.ts';

/* SC-009: every primary journey completable with the keyboard alone. */

test('skip link is first in tab order and reaches main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveText(/skip to content/i);
  await focused.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('journey: browse to a muscle using only the keyboard', async ({ page }) => {
  await page.goto('/muscles/');
  const link = page.getByRole('link', { name: /Gluteus medius/i }).first();
  await link.focus();
  await expect(link).toBeFocused();
  await link.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Gluteus medius');
});

test('journey: acknowledge the gate with the keyboard', async ({ page }) => {
  await page.goto('/exercises/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const button = page.getByRole('button', { name: /show the movement content/i });
  await button.focus();
  await expect(button).toBeFocused();
  await button.press('Enter');
  await expect(page.getByTestId('gated-content')).toBeVisible();
});

test('journey: operate every filter dimension with the keyboard', async ({ page }) => {
  await page.goto('/exercises/');
  await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
  await page.reload();
  await waitForIsland(page, 'ExerciseFilters');

  const box = page.getByRole('checkbox', { name: /Yoga/i }).first();
  await box.focus();
  await expect(box).toBeFocused();
  await page.keyboard.press('Space');
  await expect(box).toBeChecked();
  await expect.poll(() => page.url()).toContain('modality=yoga');

  const clear = page.getByRole('button', { name: /clear all/i }).first();
  await clear.focus();
  await page.keyboard.press('Enter');
  await expect(box).not.toBeChecked();
});

test('journey: search with the keyboard', async ({ page }) => {
  await page.goto('/search/');
  await waitForIsland(page, 'Search');
  const input = page.getByRole('searchbox');
  await input.focus();
  await expect(input).toBeFocused();
  await page.keyboard.type('VMO');
  await expect(page.locator('.search-results li').first()).toContainText('Vastus medialis');
});

test('journey: follow a routine to an exercise with the keyboard', async ({ page }) => {
  await page.goto('/routines/morning-mobility/');
  await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
  await page.reload();
  const step = page.locator('.steps > li').first().getByRole('link').first();
  await step.focus();
  await step.press('Enter');
  await expect(page).toHaveURL(/\/exercises\/.+\//);
});

test('focus is visible on interactive elements', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Muscles' }).first();
  await link.focus();
  const outline = await link.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(parseFloat(outline)).toBeGreaterThan(0);
});
