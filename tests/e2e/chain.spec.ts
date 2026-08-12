import { test, expect } from '@playwright/test';

/*
 * The chain (feature 002, US3).
 *
 * The reference's central argument is that a stiff joint is often another joint's
 * problem. These tests assert that argument is traversable in BOTH directions and
 * generated from data — the thing that distinguishes this feature from more content.
 */

const JOINTS = ['knee', 'hip', 'ankle'];

const STRUCTURES = [
  'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius',
  'biceps-femoris', 'semitendinosus', 'semimembranosus', 'gastrocnemius', 'soleus',
  'popliteus', 'tensor-fasciae-latae', 'adductor-group', 'gluteus-maximus',
  'gluteus-medius', 'gluteus-minimus', 'iliopsoas', 'joint-capsule', 'retinaculum',
  'iliotibial-band',
];

test.describe('structure → joint', () => {
  for (const id of STRUCTURES) {
    test(`${id} links to every joint it influences, with no dead links`, async ({ page }) => {
      await page.goto(`/muscles/${id}/`);
      const links = page.locator('.influence a');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        expect(href).toMatch(/^\/joints\/(knee|hip|ankle)\/$/);
        const res = await page.request.get(href!);
        expect(res.status(), `${id} -> ${href}`).toBe(200);
      }
    });
  }
});

test.describe('joint → structure', () => {
  for (const joint of JOINTS) {
    test(`${joint} lists its structures and every link resolves`, async ({ page }) => {
      await page.goto(`/joints/${joint}/`);
      const links = page.locator('.grid a[href^="/muscles/"]');
      const count = await links.count();
      expect(count, `${joint} has no structures`).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < count; i++) {
        const res = await page.request.get((await links.nth(i).getAttribute('href'))!);
        expect(res.status()).toBe(200);
      }
    });
  }
});

test.describe('direction is visible', () => {
  test('a structure crossing two joints says something different about each', async ({ page }) => {
    // Gastrocnemius crosses both. One averaged description would lose the point.
    await page.goto('/muscles/gastrocnemius/');
    const texts = await page.locator('.influence p:last-child').allInnerTexts();
    expect(texts.length).toBeGreaterThanOrEqual(2);
    expect(new Set(texts).size).toBe(texts.length);
  });

  test('indirect influence is distinguished from direct', async ({ page }) => {
    // Gluteus medius affects the knee without crossing it. Presenting that identically
    // to a direct attachment would imply a connection that is not there.
    await page.goto('/muscles/gluteus-medius/');
    await expect(page.locator('.influence--indirect')).toHaveCount(1);
    await expect(page.locator('.influence--indirect')).toContainText(/through another joint/i);
    await expect(page.locator('.influence--direct').first()).toContainText(/directly/i);
  });

  test('a joint separates what acts on it directly from what acts through elsewhere', async ({ page }) => {
    await page.goto('/joints/knee/');
    await expect(page.getByRole('heading', { name: 'Acting on it directly' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acting through another joint' })).toBeVisible();
  });
});

test.describe('reachability', () => {
  for (const joint of JOINTS) {
    test(`${joint} mechanics is 2 interactions from home (SC-109)`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Understanding', exact: true }).first().click();
      await page.locator(`a[href="/joints/${joint}/"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/joints/${joint}/$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  test('every joint states functional thresholds tied to named activities', async ({ page }) => {
    for (const joint of JOINTS) {
      await page.goto(`/joints/${joint}/`);
      const dl = page.locator('.definition-list');
      await expect(dl).toBeVisible();
      expect(await dl.locator('dt').count(), joint).toBeGreaterThanOrEqual(2);
    }
  });
});
