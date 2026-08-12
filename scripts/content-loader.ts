/**
 * Reads content collections straight from source files.
 *
 * Deliberately independent of Astro: the policy gate must be able to say "this
 * content set is invalid" without a successful build, and it must not inherit
 * whatever Astro decided to tolerate. Frontmatter parsing here is intentionally
 * minimal — it delegates the YAML to the same parser Astro uses.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface Record_ {
  id: string;
  file: string;
  data: Record<string, unknown>;
  body: string;
}

const CONTENT = 'src/content';

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { frontmatter: '', body: raw };
  return { frontmatter: match[1] ?? '', body: match[2] ?? '' };
}

/** Markdown collection: one record per file, id derived from filename. */
export function loadMarkdownCollection(dir: string): Record_[] {
  const path = join(CONTENT, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((f) => extname(f) === '.md')
    .sort()
    .map((f) => {
      const raw = readFileSync(join(path, f), 'utf-8');
      const { frontmatter, body } = splitFrontmatter(raw);
      return {
        id: basename(f, '.md'),
        file: join(path, f),
        data: (parseYaml(frontmatter) ?? {}) as Record<string, unknown>,
        body: body.trim(),
      };
    });
}

/** Flat YAML list, one file. */
export function loadYamlCollection(relativePath: string): Record_[] {
  const path = join(CONTENT, relativePath);
  if (!existsSync(path)) return [];
  const entries = (parseYaml(readFileSync(path, 'utf-8')) ?? []) as Array<Record<string, unknown>>;
  return entries.map((data) => ({
    id: String(data.id),
    file: path,
    data,
    body: '',
  }));
}

/** Sources, merged across the per-domain files. */
export function loadSources(): Record_[] {
  const dir = join(CONTENT, 'data/sources');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => extname(f) === '.yaml')
    .sort()
    .flatMap((f) => loadYamlCollection(join('data/sources', f)));
}

export function loadAll() {
  return {
    functionalGoals: loadMarkdownCollection('functional-goals'),
    muscles: loadMarkdownCollection('muscles'),
    exercises: loadMarkdownCollection('exercises'),
    routines: loadMarkdownCollection('routines'),
    stiffnessSources: loadMarkdownCollection('stiffness-sources'),
    stiffnessPatterns: loadMarkdownCollection('stiffness-patterns'),
    sources: loadSources(),
    evidenceLabels: loadYamlCollection('data/evidence-labels.yaml'),
    redFlags: loadYamlCollection('data/red-flags.yaml'),
  };
}

export type Collections = ReturnType<typeof loadAll>;
