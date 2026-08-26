/**
 * No internal link may bypass withBase().
 *
 * The companion to check-base-paths.ts, and the one that runs every time. That script
 * inspects dist/ under a real base path, which only the deploy build produces; this one
 * works on source, so a link added in the default build cannot pass locally and then
 * 404 once deployed to GitHub Pages.
 *
 * Checked as source text rather than as a dist/ diff because the failure is invisible in
 * the default build by construction — with no base configured, a raw `/muscles/x/` and a
 * `withBase('/muscles/x/')` emit byte-identical HTML.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/pages', 'src/components', 'src/layouts', 'src/islands', 'src/lib'];
const EXTS = ['.astro', '.tsx', '.ts'];

/** paths.ts defines withBase and necessarily handles raw paths. */
const EXEMPT = new Set(['src/lib/paths.ts']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const PATTERNS: Array<[RegExp, string]> = [
  // href="/x/" and src="/x/" — a literal root-relative attribute
  [/\b(?:href|src)="\/(?!\/)/g, 'literal href/src="/…"'],
  // href={`/x/${id}/`} — a template literal not wrapped in withBase
  [/\b(?:href|src)=\{`\/(?!\/)/g, 'template href/src={`/…`}'],
  // { href: '/x/' } — the nav array form
  [/\bhref: '\/(?!\/)/g, "object literal href: '/…'"],
  // url: `/x/` — the search index form
  [/\burl: `\/(?!\/)/g, 'search index url: `/…`'],
];

const failures: string[] = [];
const files = ROOTS.flatMap(walk);

for (const file of files) {
  if (EXEMPT.has(file)) continue;
  const src = readFileSync(file, 'utf-8');
  const lines = src.split('\n');
  for (const [pattern, description] of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i]!)) {
        failures.push(`${file}:${i + 1}: ${description} — ${lines[i]!.trim().slice(0, 90)}`);
      }
    }
  }
}

console.log(`Scanned ${files.length} source file(s) for internal links`);

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} internal link(s) not wrapped in withBase():\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    `\nUnder a base path these render fine and 404 when clicked. ` +
      `Import withBase from src/lib/paths.ts.`,
  );
  process.exit(1);
}

console.log('✓ Every internal link goes through withBase()');
