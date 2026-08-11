/**
 * Minimal static server for e2e runs.
 *
 * Serves dist/ and nothing else, in the foreground, with no dependencies. Using this
 * rather than `astro preview` for two reasons: preview daemonises in Astro 7 (which
 * fights Playwright's webServer lifecycle), and serving the built directory directly
 * makes it unambiguous that the tests exercise the artifact we actually ship.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4321);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/**
 * Astro emits both shapes: `about/index.html` for pages (format: 'directory') and
 * bare `404.html` for the error page. Try each rather than assuming one.
 */
async function resolve(pathname: string): Promise<string | null> {
  // Contain traversal: normalise, then confirm the result is still inside DIST.
  const base = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!base.startsWith(DIST)) return null;

  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

createServer(async (req, res) => {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  const file = await resolve(pathname);

  if (file) {
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
    return;
  }

  // Serve the real 404 page with a real 404 status.
  const notFound = await resolve('/404');
  res.writeHead(404, {
    'content-type': notFound ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
  });
  res.end(notFound ? await readFile(notFound) : 'Not found');
}).listen(PORT, () => console.log(`Serving dist/ on http://localhost:${PORT}`));
