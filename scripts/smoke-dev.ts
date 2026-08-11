/**
 * Dev-server smoke test.
 *
 * Exists because a real bug slipped past every other gate: a duplicated JSX attribute
 * that `astro build` tolerated but the dev compiler rejected, throwing a TypeError on
 * a page that built and tested clean. The e2e suite runs against `dist/`, so it could
 * not see it — and `pnpm dev` is what a person actually uses.
 *
 * Enumerates routes from the built output, requests each from a running dev server,
 * and fails on Astro's error overlay.
 *
 * Usage: pnpm build && pnpm dev & ; tsx scripts/smoke-dev.ts
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4321';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found. Run "pnpm build" first — routes are enumerated from it.`);
  process.exit(1);
}

const routes = walk(DIST)
  .filter((f) => f.endsWith('.html'))
  .map((f) => '/' + relative(DIST, f).replace(/index\.html$/, ''))
  .filter((r) => !r.endsWith('404.html'))
  .sort();

const failures: string[] = [];

for (const route of routes) {
  let body: string;
  try {
    const res = await fetch(BASE + route);
    body = await res.text();
    if (!res.ok) {
      failures.push(`${route} -> HTTP ${res.status}`);
      continue;
    }
  } catch (e) {
    failures.push(`${route} -> ${(e as Error).message}`);
    continue;
  }
  // Astro's dev error overlay.
  const m = /<title>Error<\/title>|An error occurred|__vite_ssr_|TypeError:|ReferenceError:/.exec(body);
  if (m) failures.push(`${route} -> dev error (${m[0].slice(0, 40)})`);
}

console.log(`Smoked ${routes.length} route(s) against ${BASE}`);
if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} route(s) failed in dev:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error('\nThe dev compiler is stricter than the build in places. Both must pass.\n');
  process.exit(1);
}
console.log('✓ All routes render in dev');
