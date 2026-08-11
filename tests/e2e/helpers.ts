import type { Page } from '@playwright/test';

/**
 * Wait for a named Astro island to hydrate.
 *
 * Islands are server-rendered first, so the markup exists before it is interactive.
 * Filling an input or clicking a checkbox before hydration silently does nothing —
 * the DOM updates but no handler is listening. Astro removes the `ssr` attribute
 * from <astro-island> once hydration completes, which is the signal we wait on.
 */
export async function waitForIsland(page: Page, component: string) {
  await page.waitForFunction(
    (name) => {
      const islands = [...document.querySelectorAll('astro-island')].filter((el) =>
        el.getAttribute('component-url')?.includes(name),
      );
      return islands.length > 0 && islands.every((el) => !el.hasAttribute('ssr'));
    },
    component,
  );
}
