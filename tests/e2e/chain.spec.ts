import { test, expect } from '@playwright/test';

/*
 * The chain (feature 002, US3).
 *
 * The reference's central argument is that a stiff joint is often another joint's
 * problem. These tests assert that argument is traversable in BOTH directions and
 * generated from data — the thing that distinguishes this feature from more content.
 */

/*
 * Read from the content rather than hardcoded. The first version listed the three
 * joints literally, and adding the foot broke four tests that were asserting the
 * old list rather than the actual invariant — which is "every influence link points
 * at a real joint page", not "at one of these three".
 */
import { readdirSync } from 'node:fs';
const JOINTS = readdirSync('src/content/joints')
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''))
  .sort();

const STRUCTURES = [
  'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius',
  'biceps-femoris', 'semitendinosus', 'semimembranosus', 'gastrocnemius', 'soleus',
  'popliteus', 'tensor-fasciae-latae', 'adductor-group', 'gluteus-maximus',
  'gluteus-medius', 'gluteus-minimus', 'iliopsoas', 'knee-capsule', 'retinaculum',
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
        expect(href).toMatch(new RegExp(`^/joints/(${JOINTS.join('|')})/$`));
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

test.describe('new structures are covered (feature 002, SC-105)', () => {
  const NEW = [
    'deep-hip-rotators', 'tibialis-anterior', 'tibialis-posterior', 'peroneals',
    'achilles-tendon', 'plantar-fascia',
  ];

  for (const id of NEW) {
    test(`${id} is either targeted by an exercise or says why not`, async ({ page }) => {
      await page.goto(`/muscles/${id}/`);
      await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
      await page.reload();
      const section = page.locator('#exercises');
      await expect(section).toBeVisible();
      const cards = section.locator('.grid > li');
      const count = await cards.count();
      if (count === 0) {
        // A structure with no exercise must explain itself — the Achilles and plantar
        // fascia do not lengthen under any self-applied stretch, and saying so is more
        // useful than inventing a movement aimed at tendon.
        // Length, not /\w{40,}/ — that would need 40 CONSECUTIVE word characters,
        // which no sentence has. Made this mistake once already on the plate alt text.
        const note = await section.innerText();
        expect(note.length).toBeGreaterThan(60);
        expect(note).toMatch(/\s/);
      } else {
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });
  }

  test('every goal names the joints it depends on (FR-118)', async ({ page }) => {
    for (const goal of ['stairs', 'seated-meditation', 'long-walk']) {
      await page.goto(`/start/${goal}/`);
      await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Which joints this depends on' })).toBeVisible();
      expect(await page.locator('a[href^="/joints/"]').count()).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('extensibility (SC-114)', () => {
  test('the action map is generated per joint, not hardcoded for the knee', async ({ page }) => {
    // If this ever regresses to one shared map, every joint page silently asserts
    // relationships its content never claimed.
    const counts: Record<string, number> = {};
    for (const joint of ['knee', 'hip', 'ankle']) {
      await page.goto(`/joints/${joint}/`);
      counts[joint] = await page.locator('.action-map .map-zone').count();
    }
    expect(counts.knee).toBeGreaterThan(counts.hip!);
    expect(counts.hip).toBeGreaterThan(counts.ankle!);
    expect(counts.ankle).toBeGreaterThanOrEqual(3);
  });

  test('each joint map names only regions that influence that joint', async ({ page }) => {
    await page.goto('/joints/ankle/');
    // allInnerTexts() returns '' for SVG <text> — textContent is what reads it.
    const groups = await page.locator('.action-map .map-group').allTextContents();
    expect(groups).toContain('Calf');
    expect(groups).toContain('Shin');
    // Quadriceps do not act on the ankle and must not appear on its map.
    expect(groups).not.toContain('Quadriceps');
  });
});
