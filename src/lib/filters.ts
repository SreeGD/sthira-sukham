/**
 * Exercise library filtering (FR-021).
 *
 * Pure and framework-free on purpose: this is the logic SC-008's matrix tests, and
 * keeping it out of the Preact island means those tests need no DOM. The island is a
 * rendering shell over these functions.
 *
 * Semantics: OR within a dimension, AND across dimensions. Selecting yoga + Pilates
 * means "either tradition"; adding beginner means "either tradition, and beginner".
 */

export type FilterDimension = 'modality' | 'muscle' | 'goal' | 'difficulty' | 'equipment';

export interface FilterableExercise {
  id: string;
  name: string;
  modality: string;
  targets: string[];
  goal: string[];
  difficulty: string;
  equipment: string[];
}

export type FilterState = Record<FilterDimension, string[]>;

export const EMPTY_FILTERS: FilterState = {
  modality: [],
  muscle: [],
  goal: [],
  difficulty: [],
  equipment: [],
};

const DIMENSIONS: FilterDimension[] = ['modality', 'muscle', 'goal', 'difficulty', 'equipment'];

/** Values an exercise offers along a dimension. Scalars normalise to single-item arrays. */
function valuesFor(exercise: FilterableExercise, dimension: FilterDimension): string[] {
  switch (dimension) {
    case 'modality':
      return [exercise.modality];
    case 'muscle':
      return exercise.targets;
    case 'goal':
      return exercise.goal;
    case 'difficulty':
      return [exercise.difficulty];
    case 'equipment':
      return exercise.equipment;
  }
}

export function matchesFilters(exercise: FilterableExercise, filters: FilterState): boolean {
  return DIMENSIONS.every((dimension) => {
    const selected = filters[dimension];
    if (selected.length === 0) return true; // An unused dimension constrains nothing.
    const available = valuesFor(exercise, dimension);
    return selected.some((value) => available.includes(value));
  });
}

export function applyFilters(
  exercises: FilterableExercise[],
  filters: FilterState,
): FilterableExercise[] {
  return exercises.filter((exercise) => matchesFilters(exercise, filters));
}

export function isEmptyFilterState(filters: FilterState): boolean {
  return DIMENSIONS.every((dimension) => filters[dimension].length === 0);
}

/**
 * Counts per value for one dimension, computed against the results of every OTHER
 * active dimension. This is what lets the UI avoid offering a combination that
 * cannot match — the count a reader sees next to "yoga" is the count they will get
 * if they click it, given what is already selected.
 */
export function facetCounts(
  exercises: FilterableExercise[],
  filters: FilterState,
  dimension: FilterDimension,
): Record<string, number> {
  const others: FilterState = { ...filters, [dimension]: [] };
  const pool = applyFilters(exercises, others);
  const counts: Record<string, number> = {};
  for (const exercise of pool) {
    for (const value of valuesFor(exercise, dimension)) {
      counts[value] = (counts[value] ?? 0) + 1;
    }
  }
  return counts;
}

/** Toggle one value in one dimension, returning a new state. */
export function toggleFilter(
  filters: FilterState,
  dimension: FilterDimension,
  value: string,
): FilterState {
  const current = filters[dimension];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value].sort();
  return { ...filters, [dimension]: next };
}

// --- Query-string round-trip (contracts/routes.md) --------------------------
//
// Filter state lives in the URL so a filtered view is linkable and the back button
// works. Unknown values are IGNORED rather than errored: a stale shared link should
// degrade to a broader result set, never to a broken page.

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  for (const dimension of DIMENSIONS) {
    for (const value of filters[dimension]) params.append(dimension, value);
  }
  return params;
}

export function filtersFromSearchParams(
  params: URLSearchParams,
  known?: Partial<Record<FilterDimension, ReadonlySet<string>>>,
): FilterState {
  const result: FilterState = {
    modality: [],
    muscle: [],
    goal: [],
    difficulty: [],
    equipment: [],
  };
  for (const dimension of DIMENSIONS) {
    const allowed = known?.[dimension];
    const values = params.getAll(dimension).filter((v) => (allowed ? allowed.has(v) : true));
    result[dimension] = [...new Set(values)].sort();
  }
  return result;
}
