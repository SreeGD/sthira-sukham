/**
 * Every internal link in dist/ must carry the configured base path.
 *
 * Why this is a gate and not a code review: under a base path a missed link does not
 * throw, does not warn and does not fail the build. It renders, looks correct, and
 * 404s only when a reader clicks it. There were ~75 hand-authored link sites when the
 * base path was introduced; nothing but a check over the built output can prove they
 * were all converted, and nothing but a check keeps the next one from regressing.
 *
 * Runs against dist/, like check:isolation, because dist/ is what gets deployed.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const BASE = (process.env.PUBLIC_BASE_PATH ?? '/sthira-sukham').replace(/\/+$/, '');

/** Paths a static host serves from the domain root regardless of the site's base. */
const ROOT_ALLOWED = new Set(['/']);

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = htmlFiles(DIST);
const failures: string[] = [];

// href/src values that begin with a single slash: root-relative, therefore base-sensitive.
// `//example.com` is protocol-relative and external, so the second character must not be a slash.
const ATTR = /(?:href|src)="(\/(?!\/)[^"]*)"/g;

for (const file of files) {
  const html = readFileSync(file, 'utf-8');
  for (const [, url] of html.matchAll(ATTR)) {
    if (ROOT_ALLOWED.has(url)) continue;
    if (url === BASE || url.startsWith(`${BASE}/`)) continue;
    failures.push(`${file}: ${url}`);
  }
}

// The search index is consumed by an island at runtime, so its URLs are never parsed as
// attributes above and would otherwise escape the check entirely.
for (const file of files) {
  const html = readFileSync(file, 'utf-8');
  for (const [, url] of html.matchAll(/"url":"(\/[^"]*)"/g)) {
    if (url === BASE || url.startsWith(`${BASE}/`)) continue;
    failures.push(`${file}: search index url ${url}`);
  }
}

console.log(`Scanned ${files.length} built file(s) in ${DIST}/ against base "${BASE}"`);

if (failures.length > 0) {
  const shown = failures.slice(0, 25);
  console.error(`\n✗ ${failures.length} internal link(s) missing the base path:\n`);
  for (const f of shown) console.error(`  • ${f}`);
  if (failures.length > shown.length) {
    console.error(`  … and ${failures.length - shown.length} more`);
  }
  console.error(`\nUse withBase() from src/lib/paths.ts for internal links.`);
  process.exit(1);
}

console.log('✓ Every internal link carries the base path');
