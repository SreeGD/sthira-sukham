import { describe, it, expect } from 'vitest';
import {
  applyFilters,
  facetCounts,
  filtersFromSearchParams,
  filtersToSearchParams,
  isEmptyFilterState,
  matchesFilters,
  toggleFilter,
  EMPTY_FILTERS,
  type FilterableExercise,
  type FilterState,
} from '../../src/lib/filters.ts';

const E = (over: Partial<FilterableExercise> & { id: string }): FilterableExercise => ({
  name: over.id,
  modality: 'clinical-rom',
  targets: ['quad'],
  goal: ['mobility'],
  difficulty: 'beginner',
  equipment: ['none'],
  ...over,
});

const LIB: FilterableExercise[] = [
  E({ id: 'heel-slide' }),
  E({ id: 'supta', modality: 'yoga', targets: ['hamstring'], equipment: ['strap'] }),
  E({ id: 'virasana', modality: 'yoga', difficulty: 'advanced', equipment: ['cushion'] }),
  E({ id: 'bridge', modality: 'pilates', goal: ['strength'], targets: ['glute'] }),
  E({
    id: 'shifting',
    modality: 'taichi-qigong',
    goal: ['motor-control', 'strength'],
    targets: ['glute', 'soleus'],
    difficulty: 'intermediate',
  }),
];

const state = (over: Partial<FilterState> = {}): FilterState => ({ ...EMPTY_FILTERS, ...over });

describe('matchesFilters', () => {
  it('an unused dimension constrains nothing', () => {
    expect(applyFilters(LIB, EMPTY_FILTERS)).toHaveLength(LIB.length);
  });

  it('ORs within a dimension', () => {
    const r = applyFilters(LIB, state({ modality: ['yoga', 'pilates'] }));
    expect(r.map((e) => e.id).sort()).toEqual(['bridge', 'supta', 'virasana']);
  });

  it('ANDs across dimensions', () => {
    const r = applyFilters(LIB, state({ modality: ['yoga'], difficulty: ['advanced'] }));
    expect(r.map((e) => e.id)).toEqual(['virasana']);
  });

  it('matches array-valued dimensions on any element', () => {
    // 'shifting' has goal ['motor-control','strength'] — either should find it.
    expect(applyFilters(LIB, state({ goal: ['motor-control'] })).map((e) => e.id)).toEqual([
      'shifting',
    ]);
    expect(applyFilters(LIB, state({ goal: ['strength'] })).map((e) => e.id).sort()).toEqual([
      'bridge',
      'shifting',
    ]);
  });

  it('filters by target muscle', () => {
    expect(applyFilters(LIB, state({ muscle: ['glute'] })).map((e) => e.id).sort()).toEqual([
      'bridge',
      'shifting',
    ]);
  });

  it('filters by equipment', () => {
    expect(applyFilters(LIB, state({ equipment: ['strap'] })).map((e) => e.id)).toEqual(['supta']);
  });

  it('returns nothing for an impossible combination', () => {
    // The no-match case the empty state exists for (SC-008).
    expect(applyFilters(LIB, state({ modality: ['yoga'], goal: ['strength'] }))).toEqual([]);
  });

  it('checks every dimension, not just the first', () => {
    const all = state({
      modality: ['taichi-qigong'],
      goal: ['strength'],
      difficulty: ['intermediate'],
      equipment: ['none'],
      muscle: ['soleus'],
    });
    expect(matchesFilters(LIB[4]!, all)).toBe(true);
    expect(matchesFilters(LIB[0]!, all)).toBe(false);
  });
});

describe('facetCounts', () => {
  it('counts a dimension against the OTHER active filters, not its own', () => {
    // Own dimension excluded, so both yoga options still show their true counts.
    const counts = facetCounts(LIB, state({ modality: ['yoga'] }), 'modality');
    expect(counts.yoga).toBe(2);
    expect(counts.pilates).toBe(1);
  });

  it('narrows when a different dimension is active', () => {
    const counts = facetCounts(LIB, state({ difficulty: ['advanced'] }), 'modality');
    expect(counts.yoga).toBe(1);
    expect(counts['clinical-rom']).toBeUndefined();
  });
});

describe('toggleFilter', () => {
  it('adds then removes, without mutating', () => {
    const a = state();
    const b = toggleFilter(a, 'modality', 'yoga');
    expect(b.modality).toEqual(['yoga']);
    expect(a.modality).toEqual([]);
    expect(toggleFilter(b, 'modality', 'yoga').modality).toEqual([]);
  });
});

describe('query string round-trip', () => {
  it('survives a round trip', () => {
    const original = state({ modality: ['yoga'], goal: ['mobility'], muscle: ['glute'] });
    const back = filtersFromSearchParams(filtersToSearchParams(original));
    expect(back).toEqual(original);
  });

  it('ignores unknown values rather than erroring', () => {
    // A stale shared link should degrade to a broader result set, never break.
    const params = new URLSearchParams('modality=yoga&modality=breakdancing');
    const known = { modality: new Set(['yoga', 'pilates']) };
    expect(filtersFromSearchParams(params, known).modality).toEqual(['yoga']);
  });

  it('deduplicates repeated values', () => {
    const params = new URLSearchParams('goal=mobility&goal=mobility');
    expect(filtersFromSearchParams(params).goal).toEqual(['mobility']);
  });

  it('reports the empty state', () => {
    expect(isEmptyFilterState(EMPTY_FILTERS)).toBe(true);
    expect(isEmptyFilterState(state({ goal: ['mobility'] }))).toBe(false);
  });
});
