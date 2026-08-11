/**
 * Search matching (FR-030).
 *
 * The index is embedded in the page at build time and matched here in memory — no
 * runtime fetch. Pagefind was rejected for exactly this reason (research.md D4):
 * with ~70 records, an embedded index costs a few KB and makes Principle V's offline
 * guarantee unarguable rather than something to reason about.
 */

export type SearchKind = 'muscle' | 'exercise';

export interface SearchRecord {
  id: string;
  kind: SearchKind;
  /** Every name this record can be found by: anatomical, common, abbreviation, traditional. */
  names: string[];
  /** Shown as the result title. */
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchResult extends SearchRecord {
  matchedName: string;
  score: number;
}

/**
 * Fold case, strip diacritics, collapse whitespace. Without this,
 * "supta padangusthasana" fails to find "Supta Pādāṅguṣṭhāsana" — which is the
 * realistic way a reader types it.
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Score one name against a query. Higher is better; 0 means no match.
 * Exact > prefix > word-boundary prefix > substring. Ranking matters because "VMO"
 * should surface the muscle itself above every exercise that mentions it.
 */
export function scoreName(name: string, query: string): number {
  const n = normalize(name);
  const q = normalize(query);
  if (!q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 75;
  if (n.split(' ').some((word) => word.startsWith(q))) return 50;
  if (n.includes(q)) return 25;
  return 0;
}

export function search(records: SearchRecord[], query: string, limit = 20): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];

  const results: SearchResult[] = [];
  for (const record of records) {
    let best = 0;
    let bestName = '';
    for (const name of record.names) {
      const score = scoreName(name, query);
      if (score > best) {
        best = score;
        bestName = name;
      }
    }
    if (best > 0) results.push({ ...record, matchedName: bestName, score: best });
  }

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
