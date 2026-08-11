/**
 * Network isolation gate (Constitution Principle V, FR-040, SC-012).
 *
 * Scans BUILT OUTPUT, not source. Scanning source would miss an origin introduced by a
 * dependency's bundled asset, which is the realistic way this regresses.
 *
 * The distinction that matters: an external URL rendered as reader-facing citation text
 * is fine — a citation the reader can choose to follow is the whole point of Principle II.
 * An external URL in a FETCHING position is not, because the page would reach for it on
 * load. So this checks positions, not mere presence.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const DIST = 'dist';

interface Violation {
  file: string;
  position: string;
  origin: string;
  excerpt: string;
}

const violations: Violation[] = [];

/** Positions that cause the browser to reach out. */
const FETCHING_PATTERNS: Array<{ position: string; re: RegExp }> = [
  { position: 'src attribute', re: /\ssrc\s*=\s*["'](https?:\/\/|\/\/)([^"']+)["']/gi },
  {
    position: '<link href>',
    re: /<link\b[^>]*\bhref\s*=\s*["'](https?:\/\/|\/\/)([^"']+)["']/gi,
  },
  { position: 'srcset', re: /\ssrcset\s*=\s*["'][^"']*?(https?:\/\/|\/\/)([^"'\s,]+)/gi },
  { position: '@import', re: /@import\s+(?:url\()?["']?(https?:\/\/|\/\/)([^"')\s]+)/gi },
  { position: 'css url()', re: /url\(\s*["']?(https?:\/\/|\/\/)([^"')\s]+)/gi },
  { position: 'fetch()', re: /\bfetch\s*\(\s*["'`](https?:\/\/|\/\/)([^"'`]+)/gi },
  { position: 'XMLHttpRequest', re: /\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["'](https?:\/\/|\/\/)/gi },
  { position: 'WebSocket', re: /new\s+WebSocket\s*\(\s*["'`](wss?:\/\/)/gi },
  { position: 'importScripts', re: /importScripts\s*\(\s*["'`](https?:\/\/|\/\/)/gi },
  { position: 'preconnect/dns-prefetch', re: /rel\s*=\s*["'](?:preconnect|dns-prefetch)["']/gi },
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function scan(file: string) {
  const content = readFileSync(file, 'utf-8');
  for (const { position, re } of FETCHING_PATTERNS) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const origin = `${match[1] ?? ''}${match[2] ?? ''}`.slice(0, 90);
      const start = Math.max(0, match.index - 40);
      violations.push({
        file: relative(DIST, file),
        position,
        origin,
        excerpt: content.slice(start, match.index + match[0].length + 20).replace(/\s+/g, ' '),
      });
    }
  }
}

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found. Run "pnpm build" first — this gate checks built output.`);
  process.exit(1);
}

const files = walk(DIST).filter((f) => ['.html', '.css', '.js', '.mjs'].includes(extname(f)));
for (const file of files) scan(file);

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
