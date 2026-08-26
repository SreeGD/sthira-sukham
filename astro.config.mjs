// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Principle V: static output, no adapter, no server. Nothing here may introduce
// a runtime origin — see scripts/check-no-external-origins.ts, which enforces it.
/*
 * GitHub Pages serves a project site from `/<repo>/`, not from the domain root, so that
 * build needs a base path. It is opt-in via the environment rather than always-on: with
 * it always set, every route in the test suite and the dev smoke script would have to be
 * rewritten, and they would then be exercising paths that differ from the ones a local
 * `pnpm preview` serves. Off by default keeps local and CI identical; the deploy sets it.
 *
 * `scripts/check-no-raw-links.ts` runs on every build and asserts no internal link
 * bypasses withBase(), so a link cannot regress in the default build and then 404 only
 * once deployed.
 */
const base = process.env.PUBLIC_BASE_PATH || undefined;

export default defineConfig({
  output: 'static',
  integrations: [preact()],
  ...(base ? { base } : {}),
  build: {
    // Emit `/about/index.html` style paths so the site works from a file server
    // or a plain static host without rewrite rules.
    format: 'directory',
  },
  // No `site` is set: nothing in the build may depend on an absolute origin.
});
