import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // schemas.test.ts shells out to `astro sync` per case (~1.2s each) because the
    // guarantee under test is "the real build refuses this". Run files serially so
    // concurrent syncs do not fight over .astro/, and allow room for the exec cost.
    fileParallelism: false,
    testTimeout: 60_000,
  },
});
