import { test, expect, type Page } from '@playwright/test';
import { waitForIsland } from './helpers.ts';

async function ack(page: Page, url: string) {
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
  await page.goto(url);
}

test.describe('understanding (US1)', () => {
  test('presents all six sources of stiffness for the knee', async ({ page }) => {
    // Feature 002 made sources per-joint, so the index lists 18 across three joints.
    // The knee's six are asserted on the knee joint page.
    await page.goto('/joints/knee/');
    for (const term of [
      'Capsular restriction',
      'Joint effusion',
      'Muscle guarding',
      'Adhesion and scar',
      'Arthritic change',
      'Disuse shortening',
    ]) {
      await expect(page.getByRole('heading', { name: term })).toBeVisible();
    }
  });

  test('presents all four knee patterns', async ({ page }) => {
    // Same framing change: patterns are per-joint now.
    await page.goto('/joints/knee/');
    for (const name of ['Osteoarthritic', 'Patellofemoral', 'Post-injury', 'Sedentary']) {
      await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
    }
  });

  test('states functional ROM thresholds tied to named activities (FR-010)', async ({ page }) => {
    await page.goto('/understanding/mechanics/');
    const main = page.getByRole('main');
    await expect(main).toContainText('90');
    await expect(main).toContainText('Stairs');
    await expect(main).toContainText('bath');
    await expect(main).toContainText('110');
  });

  test('every stiffness source shows its sources (FR-034)', async ({ page }) => {
    await page.goto('/understanding/sources/capsular-restriction/');
    await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  });
});

test.describe('muscles (US2)', () => {
  const REQUIRED = [
    'rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius',
    'biceps-femoris', 'semitendinosus', 'semimembranosus',
    'gastrocnemius', 'soleus', 'popliteus',
    'tensor-fasciae-latae', 'adductor-group',
    'gluteus-maximus', 'gluteus-medius', 'gluteus-minimus', 'iliopsoas',
    'knee-capsule', 'retinaculum', 'iliotibial-band',
  ];

  for (const id of REQUIRED) {
    test(`${id} renders with role, stiffness contribution, and sources`, async ({ page }) => {
      await page.goto(`/muscles/${id}/`);
      await expect(page.getByRole('heading', { name: 'What it does at the knee' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'How it contributes to stiffness' })).toBeVisible();
      await expect(page.getByText('When it is tight')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
    });
  }

  const PROXIMAL = ['gastrocnemius', 'soleus', 'tensor-fasciae-latae', 'adductor-group',
    'gluteus-maximus', 'gluteus-medius', 'gluteus-minimus', 'iliopsoas'];

  for (const id of PROXIMAL) {
    test(`${id} states what it does at each joint it influences (FR-108)`, async ({ page }) => {
      // Supersedes FR-016. The old rule obliged hip and ankle structures to explain
      // themselves at the knee; every structure now states its full reach, and a
      // structure crossing two joints says something different about each.
      await page.goto(`/muscles/${id}/`);
      await expect(
        page.getByRole('heading', { name: 'What it does to each joint' }),
      ).toBeVisible();
      const influences = page.locator('.influence');
      expect(await influences.count()).toBeGreaterThanOrEqual(1);
      await expect(influences.first().locator('a')).toBeVisible();
    });
  }

  test('marks non-contractile structures as not muscles (FR-013)', async ({ page }) => {
    await page.goto('/muscles/iliotibial-band/');
    await expect(page.getByText('not a muscle', { exact: false }).first()).toBeVisible();
  });
});

test.describe('exercises (US3)', () => {
  test('detail pages carry every required field', async ({ page }) => {
    await ack(page, '/exercises/supta-padangusthasana/');
    const main = page.getByRole('main');
    await expect(page.locator('.glance')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How to perform it correctly' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recommended routine' })).toBeVisible();
    await expect(page.locator('.routine')).toContainText('Repetitions');
    await expect(page.locator('.routine')).toContainText('Frequency');
    await expect(page.getByRole('heading', { name: 'Do not do this if' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stop if' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What this targets' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
    await expect(main.locator('.evidence').first()).toBeVisible();
  });

  test('traditional movements show name, tradition, and modifications (FR-023, FR-025)', async ({ page }) => {
    await ack(page, '/exercises/virasana/');
    const main = page.getByRole('main');
    await expect(main).toContainText('Virasana');
    await expect(main).toContainText('Hatha yoga');
    await expect(
      page.getByRole('heading', { name: 'Modifications for a restricted knee' }),
    ).toBeVisible();
  });

  test('evidence labels are visible in both list and detail views (FR-022)', async ({ page }) => {
    await ack(page, '/exercises/');
    await expect(page.locator('.evidence').first()).toBeVisible();
    await ack(page, '/exercises/heel-slide/');
    await expect(page.locator('.evidence').first()).toBeVisible();
  });

  test('cross-links resolve in both directions (FR-017, FR-024)', async ({ page }) => {
    await ack(page, '/muscles/gluteus-medius/');
    // .grid scopes past the clinician framing, which also lives inside the gated region.
    const toExercise = page.getByTestId('muscle-exercise-list').locator('.grid a').first();
    await toExercise.click();
    await expect(page).toHaveURL(/\/exercises\/.+\//);

    const backToMuscle = page.getByTestId('exercise-targets').getByRole('link').first();
    await backToMuscle.click();
    await expect(page).toHaveURL(/\/muscles\/.+\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('routines (US5)', () => {
  for (const id of ['morning-mobility', 'desk-worker', 'strength-focused']) {
    test(`${id} shows steps, duration, and order rationale`, async ({ page }) => {
      await ack(page, `/routines/${id}/`);
      await expect(page.getByRole('heading', { name: 'The sequence' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Why this order' })).toBeVisible();
      await expect(page.getByText(/about \d+ minutes/)).toBeVisible();
      const steps = page.locator('.steps > li');
      expect(await steps.count()).toBeGreaterThanOrEqual(3);
      await steps.first().getByRole('link').first().click();
      await expect(page).toHaveURL(/\/exercises\/.+\//);
    });
  }
});

test.describe('search (US6)', () => {
  test('finds a muscle by abbreviation', async ({ page }) => {
    await page.goto('/search/');
    await waitForIsland(page, 'Search');
    await page.getByRole('searchbox').fill('VMO');
    await expect(page.locator('.search-results li').first()).toContainText('Vastus medialis');
  });

  test('finds an exercise by traditional name', async ({ page }) => {
    await page.goto('/search/');
    await waitForIsland(page, 'Search');
    await page.getByRole('searchbox').fill('supta padangusthasana');
    await expect(page.locator('.search-results li').first()).toContainText('Reclining');
  });

  test('explains an empty result and offers a way back', async ({ page }) => {
    await page.goto('/search/');
    await waitForIsland(page, 'Search');
    await page.getByRole('searchbox').fill('zzzzz');
    const callout = page.locator('.callout', { hasText: 'Nothing matched' });
    await expect(callout).toBeVisible();
    await expect(callout.getByRole('link', { name: /muscle catalogue/i })).toBeVisible();
  });
});

test.describe('instruction format', () => {
  test('every step carries a label naming what it is for', async ({ page }) => {
    await page.goto('/exercises/heel-slide/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();
    const steps = page.locator('.steps--labelled > li');
    expect(await steps.count()).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < (await steps.count()); i++) {
      // A bare list of sentences is hard to resume part-way through; the label is
      // what makes a step findable again.
      await expect(steps.nth(i).locator('strong')).toHaveText(/\w+.*:/);
    }
  });

  test('routine figures are separate fields, not a prose sentence', async ({ page }) => {
    await page.goto('/exercises/step-down/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();
    const routine = page.locator('.routine');
    for (const label of ['Repetitions', 'Sets', 'Frequency']) {
      await expect(routine.getByText(label, { exact: true })).toBeVisible();
    }
  });
});
