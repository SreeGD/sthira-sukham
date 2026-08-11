// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Principle V: static output, no adapter, no server. Nothing here may introduce
// a runtime origin — see scripts/check-no-external-origins.ts, which enforces it.
export default defineConfig({
  output: 'static',
  integrations: [preact()],
  build: {
    // Emit `/about/index.html` style paths so the site works from a file server
    // or a plain static host without rewrite rules.
    format: 'directory',
  },
  // No `site` is set: nothing in the build may depend on an absolute origin.
});
