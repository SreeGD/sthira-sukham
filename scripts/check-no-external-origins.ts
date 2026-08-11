/**
 * CLI shell for the network isolation gate.
 *
 * Scans BUILT OUTPUT, not source. Scanning source would miss an origin introduced by
 * a dependency's bundled asset, which is the realistic way this regresses.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { scanContent, type Violation } from './origin-scanner.ts';

const DIST = 'dist';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found. Run "pnpm build" first — this gate checks built output.`);
  process.exit(1);
}

const files = walk(DIST).filter((f) => ['.html', '.css', '.js', '.mjs'].includes(extname(f)));
const violations: Violation[] = files.flatMap((file) =>
  scanContent(readFileSync(file, 'utf-8'), relative(DIST, file)),
);

console.log(`Scanned ${files.length} built file(s) in ${DIST}/`);

if (violations.length > 0) {
  console.error(`\n✗ ${violations.length} external origin(s) in fetching positions:\n`);
  for (const v of violations) {
    console.error(`  • ${v.file} [${v.position}] -> ${v.origin}`);
    console.error(`      ...${v.excerpt}...`);
  }
  console.error('\nPrinciple V: the built app must make no network requests at runtime.');
  console.error('Bundle the asset locally, or render the URL as text rather than fetching it.\n');
  process.exit(1);
}

console.log('✓ No external origins in fetching positions');
