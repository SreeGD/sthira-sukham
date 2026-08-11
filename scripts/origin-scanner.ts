/**
 * Network isolation scanning (Constitution Principle V, FR-040, SC-012).
 *
 * Pure: takes file content, returns violations. The CLI shell in
 * check-no-external-origins.ts walks dist/ and reports.
 *
 * The distinction that matters: an external URL rendered as reader-facing citation
 * text is fine — a citation the reader can choose to follow is the whole point of
 * Principle II. An external URL in a FETCHING position is not, because the page
 * reaches for it on load. So this checks positions, not mere presence.
 */

export interface Violation {
  file: string;
  position: string;
  origin: string;
  excerpt: string;
}

/** Positions that cause the browser to reach out. */
export const FETCHING_PATTERNS: Array<{ position: string; re: RegExp }> = [
  { position: 'src attribute', re: /\ssrc\s*=\s*["'](https?:\/\/|\/\/)([^"']+)["']/gi },
  { position: '<link href>', re: /<link\b[^>]*\bhref\s*=\s*["'](https?:\/\/|\/\/)([^"']+)["']/gi },
  { position: 'srcset', re: /\ssrcset\s*=\s*["'][^"']*?(https?:\/\/|\/\/)([^"'\s,]+)/gi },
  { position: '@import', re: /@import\s+(?:url\()?["']?(https?:\/\/|\/\/)([^"')\s]+)/gi },
  { position: 'css url()', re: /url\(\s*["']?(https?:\/\/|\/\/)([^"')\s]+)/gi },
  { position: 'fetch()', re: /\bfetch\s*\(\s*["'`](https?:\/\/|\/\/)([^"'`]+)/gi },
  { position: 'XMLHttpRequest', re: /\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["'](https?:\/\/|\/\/)/gi },
  { position: 'WebSocket', re: /new\s+WebSocket\s*\(\s*["'`](wss?:\/\/)/gi },
  { position: 'importScripts', re: /importScripts\s*\(\s*["'`](https?:\/\/|\/\/)/gi },
  { position: 'preconnect/dns-prefetch', re: /rel\s*=\s*["'](?:preconnect|dns-prefetch)["']/gi },
];

export function scanContent(content: string, file = '<inline>'): Violation[] {
  const violations: Violation[] = [];
  for (const { position, re } of FETCHING_PATTERNS) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const start = Math.max(0, match.index - 40);
      violations.push({
        file,
        position,
        origin: `${match[1] ?? ''}${match[2] ?? ''}`.slice(0, 90),
        excerpt: content.slice(start, match.index + match[0].length + 20).replace(/\s+/g, ' '),
      });
    }
  }
  return violations;
}
