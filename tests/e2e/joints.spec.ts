import { test, expect } from '@playwright/test';

/*
 * Joints as first-class subjects (feature 002, US1 and US2).
 *
 * These are the T220/T221/T226 assertions. They were marked done before the file
 * existed — caught when a later append created it without imports.
 */

test.describe('hip as a first-class joint (US1)', () => {
  test('has all six stiffness sources, described for the hip', async ({ page }) => {
    await page.goto('/joints/hip/');
    for (const term of [
      'Capsular restriction',
      'Joint effusion',
      'Muscle guarding',
      'Adhesion and scar',
      'Arthritic change',
      'Disuse shortening',
    ]) {
      await expect(page.getByRole('heading', { name: term, exact: false }).first()).toBeVisible();
    }
  });

  test('states functional thresholds tied to named activities, with sources', async ({ page }) => {
    await page.goto('/joints/hip/');
    const dl = page.locator('.definition-list');
    expect(await dl.locator('dt').count()).toBeGreaterThanOrEqual(2);
    await expect(dl).toContainText(/chair|stair|walking|squat/i);
    await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  });

  test('has patterns of its own rather than knee patterns relabelled', async ({ page }) => {
    await page.goto('/joints/hip/');
    const patterns = await page.locator('a[href^="/understanding/patterns/"]').allTextContents();
    expect(patterns.join(' ')).toMatch(/lateral hip|osteoarthritic/i);
    expect(patterns.join(' ')).not.toMatch(/patellofemoral/i);
  });
});

test.describe('no knee-only framing (FR-107)', () => {
  test('navigation and section headings do not imply a knee-only reference', async ({ page }) => {
    for (const route of ['/', '/understanding/', '/muscles/', '/exercises/']) {
      await page.goto(route);
      const nav = await page.getByRole('navigation', { name: 'Main' }).innerText();
      expect(nav.toLowerCase(), route).not.toContain('knee');
    }
  });

  test('the home page presents the reference as covering more than one joint', async ({ page }) => {
    await page.goto('/understanding/');
    await expect(page.getByRole('heading', { name: 'The three joints' })).toBeVisible();
    for (const joint of ['knee', 'hip', 'ankle']) {
      await expect(page.locator(`a[href="/joints/${joint}/"]`).first()).toBeVisible();
    }
  });
});

test.describe('ankle as a first-class joint (US2)', () => {
  test('has a pattern with no knee analogue (FR-106)', async ({ page }) => {
    await page.goto('/joints/ankle/');
    const patterns = (await page.locator('a[href^="/understanding/patterns/"]').allTextContents())
      .join(' ')
      .toLowerCase();
    expect(patterns).toMatch(/post-sprain|impingement/);
  });

  test('explains why bent-knee and straight-knee dorsiflexion differ', async ({ page }) => {
    await page.goto('/joints/ankle/');
    const main = page.getByRole('main');
    await expect(main).toContainText(/dorsiflexion/i);
    await expect(main).toContainText(/gastrocnemius/i);
    await expect(main).toContainText(/soleus/i);
    // The mechanism, not just the fact: gastrocnemius originates above the knee.
    await expect(main).toContainText(/above the knee/i);
  });

  test('names both the talocrural and subtalar joints', async ({ page }) => {
    await page.goto('/joints/ankle/');
    const main = page.getByRole('main');
    await expect(main).toContainText(/talocrural/i);
    await expect(main).toContainText(/subtalar/i);
  });
});


test.describe('stiffness source behaviour map', () => {
  test('places every source of a joint into a behaviour quadrant', async ({ page }) => {
    for (const joint of ['knee', 'hip', 'ankle']) {
      await page.goto(`/joints/${joint}/`);
      const map = page.locator('.source-map');
      await expect(map).toBeVisible();
      expect(await map.locator('.source-cell').count(), joint).toBe(4);
      // All six mechanisms recur at every joint, so all six must be placed.
      expect(await map.locator('.source-cell li').count(), joint).toBe(6);
    }
  });

  test('every placed source links to its own page', async ({ page }) => {
    await page.goto('/joints/hip/');
    const links = page.locator('.source-map .source-cell a');
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      const res = await page.request.get((await links.nth(i).getAttribute('href'))!);
      expect(res.status()).toBe(200);
    }
  });

  test('stays a description, not a diagnostic test (Principle I)', async ({ page }) => {
    await page.goto('/joints/knee/');
    const map = page.locator('.source-map');
    // It sorts mechanisms by behaviour; it must never take input about a reader.
    expect(await map.locator('input, select, textarea, button').count()).toBe(0);
    await expect(map).toContainText(/not a test/i);
    await expect(map).toContainText(/more than one can be true/i);
  });
});
