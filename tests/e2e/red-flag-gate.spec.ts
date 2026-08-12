import { test, expect, type Page } from '@playwright/test';

/*
 * The red-flag gate (Constitution Principle I, FR-001, SC-001).
 *
 * The cases that matter are the ones that bypass the home page: a bookmarked or
 * shared exercise URL is the realistic way a first-time reader lands directly on
 * exercise content.
 */

const GATED_ROUTES = [
  '/exercises/',
  '/exercises/heel-slide/',
  '/exercises/supta-padangusthasana/',
  '/routines/',
  '/routines/morning-mobility/',
];

async function firstVisit(page: Page, url: string) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test.describe('first visit', () => {
  for (const route of GATED_ROUTES) {
    test(`gates ${route} on a direct deep link`, async ({ page }) => {
      await firstVisit(page, route);
      await expect(page.getByTestId('red-flag-gate')).toBeVisible();
      await expect(page.getByTestId('gated-content')).toBeHidden();
    });
  }

  test('the gate lists every red-flag sign (FR-004)', async ({ page }) => {
    await firstVisit(page, '/exercises/');
    const gate = page.getByTestId('red-flag-gate');
    for (const sign of [
      'locks or catches',
      'gives way',
      'cannot put weight',
      'hot, red, and swollen',
      'Fever',
      'Sudden severe pain',
      'wakes you at night',
      'following a fall',
    ]) {
      await expect(gate).toContainText(sign, { ignoreCase: true });
    }
  });

  test('gates only the exercise list on a muscle page, not the muscle content', async ({ page }) => {
    // contracts/routes.md partial-gate rule — the easy one to get wrong.
    await firstVisit(page, '/muscles/rectus-femoris/');
    await expect(page.getByRole('heading', { name: 'Rectus femoris', level: 1 })).toBeVisible();
    await expect(page.getByText('What it does at the knee')).toBeVisible();
    await expect(page.getByTestId('muscle-exercise-list')).toBeHidden();
    await expect(page.getByTestId('red-flag-gate')).toBeVisible();
  });
});

test.describe('fail-safe', () => {
  test.use({ javaScriptEnabled: false });

  for (const route of ['/exercises/', '/exercises/heel-slide/', '/routines/morning-mobility/']) {
    test(`shows the gate with JavaScript disabled: ${route}`, async ({ page }) => {
      // THE most important test in this suite. With no JS the reveal script never
      // runs, so the gate must remain. An implementation that inverts the logic —
      // hiding the gate by default and showing it with JS — passes every other test
      // here and fails this one, while being a Principle I violation in production.
      await page.goto(route);
      await expect(page.getByTestId('red-flag-gate')).toBeVisible();
      await expect(page.getByTestId('gated-content')).toBeHidden();
    });
  }
});

test.describe('after acknowledging', () => {
  test('reveals content without navigating, and does not gate again', async ({ page }) => {
    await firstVisit(page, '/exercises/heel-slide/');
    await page.getByRole('button', { name: /show the movement content/i }).click();

    await expect(page.getByTestId('gated-content')).toBeVisible();
    await expect(page.getByTestId('red-flag-gate')).toBeHidden();
    expect(page.url()).toContain('/exercises/heel-slide/');

    await page.goto('/routines/morning-mobility/');
    await expect(page.getByTestId('gated-content')).toBeVisible();
    await expect(page.getByTestId('red-flag-gate')).toBeHidden();
  });

  test('persists only the acknowledgement and theme keys (SC-013)', async ({ page }) => {
    await firstVisit(page, '/exercises/');
    await page.getByRole('button', { name: /show the movement content/i }).click();
    const keys = await page.evaluate(() => Object.keys(localStorage).sort());
    expect(keys).toEqual(['sthira:red-flags-ack']);
  });
});

test.describe('safety reachability (FR-002, SC-002)', () => {
  const EVERY_SECTION = [
    '/',
    '/understanding/',
    '/understanding/mechanics/',
    '/understanding/sources/capsular-restriction/',
    '/understanding/patterns/osteoarthritic/',
    '/muscles/',
    '/muscles/gluteus-medius/',
    '/exercises/',
    '/exercises/heel-slide/',
    '/routines/',
    '/search/',
    '/safety/',
  ];

  for (const route of EVERY_SECTION) {
    test(`reaches /safety/ in one interaction from ${route}`, async ({ page }) => {
      await page.goto(route);
      const link = page.getByRole('link', { name: /when to see a clinician/i }).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/safety\/$/);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('When to stop');
    });
  }
});

test.describe('clinician framing (FR-003)', () => {
  test('renders on gated routes with no dismissal control in the DOM', async ({ page }) => {
    await page.goto('/exercises/heel-slide/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();

    const framing = page.getByRole('complementary', { name: /about this information/i });
    await expect(framing).toBeVisible();
    await expect(framing).toContainText('not advice for your knee');
    // No dismissal path can exist, because nothing exists to click.
    expect(await framing.locator('button').count()).toBe(0);
    expect(await framing.locator('[aria-label*="close" i]').count()).toBe(0);
  });
});
