import { test, expect } from '@playwright/test';

test.describe('goal-linked sessions', () => {
  const GOALS = [
    'stairs', 'kneel-floor', 'car-transfer', 'desk-stiffness', 'straighten-fully',
    'walk-further', 'dandavat', 'seated-meditation', 'long-walk',
  ];

  for (const goal of GOALS) {
    test(`${goal} offers a session and links both ways`, async ({ page }) => {
      await page.goto(`/start/${goal}/`);
      await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
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
    await page.evaluate(() => localStorage.setItem('fixknee:red-flags-ack', '1'));
    await page.reload();
    const notes = await page.locator('.steps > li p').allInnerTexts();
    const total = notes.reduce((sum, n) => sum + (parseInt(n.match(/(\d+) minutes?/)?.[1] ?? '0', 10)), 0);
    expect(total).toBeGreaterThanOrEqual(25);
    expect(total).toBeLessThanOrEqual(35);
  });
});
