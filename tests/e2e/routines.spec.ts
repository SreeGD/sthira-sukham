import { test, expect } from '@playwright/test';

test.describe('goal-linked sessions', () => {
  const GOALS = [
    'stairs', 'kneel-floor', 'car-transfer', 'desk-stiffness', 'straighten-fully',
    'walk-further', 'dandavat', 'seated-meditation', 'long-walk',
  ];

  for (const goal of GOALS) {
    test(`${goal} offers a session and links both ways`, async ({ page }) => {
      await page.goto(`/start/${goal}/`);
      await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
      await page.reload();

      const cta = page.locator('.routine-cta');
      await expect(cta).toBeVisible();
      await cta.click();
      await expect(page).toHaveURL(/\/routines\/goal-.+\//);

      // Roughly half an hour, and a weekly rhythm — "30 minutes weekly" is a schedule
      // as well as a sequence, and they are different facts.
      await expect(page.getByText(/about 30 minutes/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Fitting it into a week' })).toBeVisible();

      // …and back to the goal it belongs to.
      await page.getByRole('link', { name: /^Goal:/ }).click();
      await expect(page).toHaveURL(new RegExp(`/start/${goal}/$`));
    });
  }

  test('step notes add up to roughly the stated duration', async ({ page }) => {
    await page.goto('/routines/goal-stairs/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();
    const notes = await page.locator('.steps > li p').allInnerTexts();
    const total = notes.reduce((sum, n) => sum + (parseInt(n.match(/(\d+) minutes?/)?.[1] ?? '0', 10)), 0);
    expect(total).toBeGreaterThanOrEqual(25);
    expect(total).toBeLessThanOrEqual(35);
  });
});

test.describe('one-page sheet', () => {
  test('carries every movement inline, with nothing to click', async ({ page }) => {
    await page.goto('/routines/goal-desk-stiffness/sheet/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();

    const steps = page.locator('.sheet-step');
    const count = await steps.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Every movement must be performable from this page alone: its short steps, the
    // key point, and — non-negotiably — its stop-criteria.
    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      expect(await step.locator('.sheet-step__steps > li').count()).toBeGreaterThanOrEqual(2);
      await expect(step.locator('.sheet-step__key')).toContainText('Key:');
      await expect(step.locator('.sheet-step__stop')).toContainText('Stop if:');
      expect(await step.locator('.sheet-step__stop li').count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('the sheet lists the same movements as the routine, in the same order', async ({ page }) => {
    await page.goto('/routines/goal-stairs/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();
    const onRoutine = await page.locator('.steps > li > a strong').allInnerTexts();

    await page.goto('/routines/goal-stairs/sheet/');
    const onSheet = (await page.locator('.sheet-step h2').allInnerTexts()).map((t) =>
      t.split('·')[0]!.trim(),
    );
    expect(onSheet).toEqual(onRoutine);
  });

  test('every routine offers a sheet', async ({ page }) => {
    await page.goto('/routines/morning-mobility/');
    await page.evaluate(() => localStorage.setItem('sthira:red-flags-ack', '1'));
    await page.reload();
    const cta = page.getByRole('link', { name: /one-page sheet/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/routines\/morning-mobility\/sheet\/$/);
  });
});
