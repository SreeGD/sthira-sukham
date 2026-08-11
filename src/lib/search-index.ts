import type { SearchRecord } from './search.ts';

/**
 * Build the search index at build time (FR-030).
 *
 * The result is serialised into the search page's HTML and matched in memory. No
 * runtime fetch — see research.md D4 for why an embedded index beats Pagefind here.
 */

interface MuscleLike {
  id: string;
  data: {
    anatomicalName: string;
    commonName: string;
    abbreviations: string[];
    group?: string;
  };
}

interface ExerciseLike {
  id: string;
  data: {
    name: string;
    traditionalName?: string;
    tradition?: string;
    modality: string;
  };
}

const MODALITY_LABEL: Record<string, string> = {
  'clinical-rom': 'Range of motion',
  yoga: 'Yoga',
  pilates: 'Pilates',
  'taichi-qigong': 'Tai chi / qigong',
};

export function buildSearchIndex(
  muscles: MuscleLike[],
  exercises: ExerciseLike[],
): SearchRecord[] {
  const records: SearchRecord[] = [];

  for (const m of muscles) {
    records.push({
      id: m.id,
      kind: 'muscle',
      // Every way a reader might reach for it: "vastus medialis", "inner quad", "VMO".
      names: [m.data.anatomicalName, m.data.commonName, ...m.data.abbreviations],
      title: m.data.anatomicalName,
      subtitle: m.data.group,
      url: `/muscles/${m.id}/`,
    });
  }

  for (const e of exercises) {
    const names = [e.data.name];
    if (e.data.traditionalName) names.push(e.data.traditionalName);
    records.push({
      id: e.id,
      kind: 'exercise',
      names,
      title: e.data.name,
      subtitle: MODALITY_LABEL[e.data.modality] ?? e.data.modality,
      url: `/exercises/${e.id}/`,
    });
  }

  return records;
}
