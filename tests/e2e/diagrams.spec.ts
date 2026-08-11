import { test, expect } from '@playwright/test';
import { waitForIsland } from './helpers.ts';

/*
 * Diagrams (Principle VI).
 *
 * The load-bearing property is that no diagram is the SOLE carrier of anything: each
 * has a text equivalent, so a reader using a screen reader, a greyscale display, or a
 * failed image path loses nothing. These tests assert that equivalence exists.
 */

const ALL_MUSCLES = [
  'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius',
  'biceps-femoris', 'semitendinosus', 'semimembranosus', 'gastrocnemius', 'soleus',
  'popliteus', 'tensor-fasciae-latae', 'adductor-group', 'gluteus-maximus',
  'gluteus-medius', 'gluteus-minimus', 'iliopsoas', 'joint-capsule', 'retinaculum',
  'iliotibial-band',
];

test.describe('leg locator', () => {
  for (const id of ALL_MUSCLES) {
    test(`${id} has a locator with an accessible name and a text caption`, async ({ page }) => {
      await page.goto(`/muscles/${id}/`);
      const svg = page.getByRole('img').first();
      await expect(svg).toBeVisible();
      // The accessible name names the structure...
      await expect(svg).toHaveAccessibleName(/Where .+ sits/);
      // ...and the location is stated in words, not conveyed by the highlight alone.
      await expect(page.locator('.leg-badge')).toHaveText(/\w/);
    });
  }

  test('highlights exactly one zone', async ({ page }) => {
    await page.goto('/muscles/gluteus-medius/');
    expect(await page.locator('.leg-zone.is-active').count()).toBe(1);
  });

  test('different muscles highlight different zones', async ({ page }) => {
    await page.goto('/muscles/gluteus-maximus/');
    const buttock = await page.locator('.leg-badge').innerText();
    await page.goto('/muscles/gastrocnemius/');
    const calf = await page.locator('.leg-badge').innerText();
    expect(buttock).not.toBe(calf);
    expect(buttock.toLowerCase()).toContain('buttock');
    expect(calf.toLowerCase()).toContain('calf');
  });
});

test.describe('mechanics diagrams', () => {
  test('both render with accessible descriptions', async ({ page }) => {
    await page.goto('/understanding/mechanics/');
    const figures = page.locator('figure.diagram');
    await expect(figures).toHaveCount(2);
    for (const name of [/two joints of the knee/i, /flexion range/i]) {
      await expect(page.getByRole('img', { name })).toBeVisible();
    }
  });

  test('the joints diagram explains its markers in text', async ({ page }) => {
    await page.goto('/understanding/mechanics/');
    const key = page.locator('.kj-key');
    await expect(key).toContainText('Tibiofemoral joint');
    await expect(key).toContainText('Patellofemoral joint');
  });

  test('the range arc states its bands in text, not colour alone', async ({ page }) => {
    await page.goto('/understanding/mechanics/');
    const key = page.locator('.rom-key');
    await expect(key).toContainText('0–90°');
    await expect(key).toContainText('90–120°');
    await expect(key).toContainText('120–135°');
    await expect(key).toContainText('Stairs, chairs');
  });

  test('no SVG text is clipped outside its viewBox', async ({ page }) => {
    // The failure mode that bit the first draft: an out-of-range coordinate clips
    // silently rather than erroring, so the label simply vanishes.
    await page.goto('/understanding/mechanics/');
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('svg')].flatMap((svg) => {
        const vb = svg.viewBox.baseVal;
        return [...svg.querySelectorAll('text')]
          .map((t) => {
            const b = (t as SVGGraphicsElement).getBBox();
            const out =
              b.x < vb.x - 1 ||
              b.y < vb.y - 1 ||
              b.x + b.width > vb.x + vb.width + 1 ||
              b.y + b.height > vb.y + vb.height + 1;
            return out ? `${t.textContent?.trim()} @ ${Math.round(b.x)},${Math.round(b.y)}` : null;
          })
          .filter(Boolean);
      }),
    );
    expect(overflow).toEqual([]);
  });
});

test.describe('exercise position figures', () => {
  const ONE_PER_POSITION = {
    supine: 'heel-slide',
    prone: 'prone-hang',
    'side-lying': 'pilates-clam',
    seated: 'patellar-mobilisation',
    kneeling: 'balasana',
    quadruped: 'adho-mukha-svanasana',
    standing: 'utkatasana',
    'standing-supported': 'step-down',
  } as const;

  for (const [position, id] of Object.entries(ONE_PER_POSITION)) {
    test(`${id} shows the ${position} figure with a text label`, async ({ page }) => {
      await page.goto(`/exercises/${id}/`);
      await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
      await page.reload();
      const fig = page.locator('figure.position').first();
      await expect(fig).toBeVisible();
      // The label is what carries the meaning; the drawing supports it.
      await expect(fig.locator('figcaption')).toHaveText(/\w/);
      await expect(fig.getByRole('img')).toHaveAccessibleName(/Starting position:/);
    });
  }

  test('every exercise has a position figure', async ({ page }) => {
    await page.goto('/exercises/');
    await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
    await page.reload();
    const cards = page.locator('.nojs-only .grid > li');
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(40);
    expect(await page.locator('.nojs-only .position').count()).toBe(total);
  });

  test('the filtered island renders the same figure as the static fallback', async ({ page }) => {
    await page.goto('/exercises/');
    await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
    await page.reload();
    await waitForIsland(page, 'ExerciseFilters');
    // Both views draw from src/lib/positions.ts; if they diverge this catches it.
    await expect(page.locator('.js-only .position').first()).toBeVisible();
    const islandLabels = await page.locator('.js-only .position__label').allInnerTexts();
    const staticLabels = await page.locator('.nojs-only .position figcaption').allInnerTexts();
    expect(islandLabels.sort()).toEqual(staticLabels.sort());
  });
});
