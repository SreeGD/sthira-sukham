import { describe, it, expect } from 'vitest';
import { scanContent } from '../../scripts/origin-scanner.ts';

describe('fetching positions are violations (Principle V, SC-012)', () => {
  const cases: Array<[string, string]> = [
    ['script src', '<script src="https://cdn.example.com/a.js"></script>'],
    ['image src', '<img src="https://images.example.com/x.png">'],
    ['stylesheet link', '<link rel="stylesheet" href="https://fonts.example.com/f.css">'],
    ['protocol-relative', '<script src="//cdn.example.com/a.js"></script>'],
    ['css @import', '@import url("https://fonts.example.com/f.css");'],
    ['css url()', 'body { background: url(https://img.example.com/bg.png); }'],
    ['fetch', 'fetch("https://api.example.com/data")'],
    ['XMLHttpRequest', 'xhr.open("GET", "https://api.example.com/x")'],
    ['WebSocket', 'new WebSocket("wss://live.example.com")'],
    ['importScripts', 'importScripts("https://cdn.example.com/w.js")'],
    ['preconnect', '<link rel="preconnect" href="https://fonts.example.com">'],
    ['srcset', '<img srcset="https://img.example.com/x-2x.png 2x">'],
  ];

  for (const [name, content] of cases) {
    it(`flags ${name}`, () => {
      expect(scanContent(content).length).toBeGreaterThan(0);
    });
  }

  it('reports the file, position, and origin', () => {
    const [v] = scanContent('<script src="https://cdn.example.com/a.js"></script>', 'index.html');
    expect(v?.file).toBe('index.html');
    expect(v?.position).toBe('src attribute');
    expect(v?.origin).toContain('cdn.example.com');
  });
});

describe('citation text is not a violation (Principle II)', () => {
  // The whole point of sourcing is that readers can follow citations. A URL the page
  // never fetches must not fail the isolation gate, or the two principles collide.
  const permitted = [
    'Rowe PJ (2000). <cite>Knee joint kinematics</cite>. doi:10.1016/S0966-6362(00)00060-6',
    '<li>https://www.nice.org.uk/guidance/ng226</li>',
    '<span>See https://www.orthoinfo.org/en/diseases--conditions/arthritis-of-the-knee/</span>',
    '<a href="https://doi.org/10.1002/14651858.CD004376.pub4">doi</a>',
  ];

  for (const content of permitted) {
    it(`allows: ${content.slice(0, 48)}…`, () => {
      expect(scanContent(content)).toEqual([]);
    });
  }

  it('allows a plain anchor to an external source but not a stylesheet link to one', () => {
    expect(scanContent('<a href="https://example.com/paper">Paper</a>')).toEqual([]);
    expect(scanContent('<link rel="stylesheet" href="https://example.com/a.css">').length).toBe(1);
  });
});

describe('local references are fine', () => {
  for (const content of [
    '<script src="/_astro/client.js"></script>',
    '<link rel="stylesheet" href="/_astro/index.css">',
    'url("/fonts/x.woff2")',
    '<img src="./diagram.svg">',
  ]) {
    it(`allows: ${content.slice(0, 40)}…`, () => {
      expect(scanContent(content)).toEqual([]);
    });
  }
});

describe('scanner state', () => {
  it('does not leak regex lastIndex between calls', () => {
    // Global regexes are reused across files; a stale lastIndex would silently skip
    // violations in every file after the first.
    const bad = '<script src="https://cdn.example.com/a.js"></script>';
    expect(scanContent(bad)).toHaveLength(scanContent(bad).length);
    expect(scanContent(bad).length).toBe(1);
    expect(scanContent(bad).length).toBe(1);
  });
});
