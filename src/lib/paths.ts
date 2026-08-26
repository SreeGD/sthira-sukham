/**
 * Internal links, base-path aware.
 *
 * GitHub Pages serves a project site from a subdirectory (`/sthira-sukham/`), not from
 * the domain root. A link written `/muscles/soleus/` therefore resolves to
 * `sreegd.github.io/muscles/soleus/` — off the site entirely — and 404s.
 *
 * Astro rewrites the asset paths it emits itself when `base` is set. It does not, and
 * cannot, rewrite hrefs authored by hand. Every internal link in this codebase goes
 * through here, and `scripts/check-base-paths.ts` fails the build if one does not.
 *
 * `import.meta.env.BASE_URL` is inlined by Vite at build time, so this costs nothing at
 * runtime and works identically in .astro templates and in the Preact islands.
 */

/** `/sthira-sukham` in production, `` in dev — never with a trailing slash. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path: string): string {
  // Only root-relative internal paths are rewritten. Anchors, external URLs and
  // already-prefixed paths pass through untouched so this stays safe to apply twice.
  if (!path.startsWith('/')) return path;
  if (BASE && (path === BASE || path.startsWith(`${BASE}/`))) return path;
  return `${BASE}${path}`;
}
