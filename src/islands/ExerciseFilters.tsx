import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  GROUND,
  POSITION_FIGURES,
  POSITION_LABEL,
  type StartPosition,
} from '../lib/positions.ts';
import {
  applyFilters,
  facetCounts,
  filtersFromSearchParams,
  filtersToSearchParams,
  isEmptyFilterState,
  toggleFilter,
  type FilterableExercise,
  type FilterDimension,
  type FilterState,
  EMPTY_FILTERS,
} from '../lib/filters.ts';

/*
 * A thin rendering shell over src/lib/filters.ts (FR-021).
 *
 * All the logic lives in lib/ so SC-008's matrix is testable without a DOM. If you
 * find yourself writing filtering rules in this file, they belong next door.
 */

interface DimensionConfig {
  key: FilterDimension;
  legend: string;
  options: { value: string; label: string }[];
}

/** Display fields carried alongside the filterable ones so the island needs no content API. */
export interface DisplayExercise extends FilterableExercise {
  traditionalName?: string;
  startPosition: StartPosition;
  modalityLabel: string;
  evidenceLabelText: string;
  evidenceGlyph: string;
  equipmentText: string;
}

/* Renders the same figure as PositionFigure.astro, from the same geometry. */
function PositionBadge({ position }: { position: StartPosition }) {
  const fig = POSITION_FIGURES[position];
  const label = POSITION_LABEL[position];
  return (
    <span class="position position--inline">
      <svg viewBox="0 0 120 88" role="img" aria-label={`Starting position: ${label.toLowerCase()}`} class="position__svg">
        <line x1="8" y1={GROUND} x2="112" y2={GROUND} class="pos-ground" />
        {position === 'standing-supported' && (
          <line x1="20" y1="12" x2="20" y2={GROUND} class="pos-support" />
        )}
        {fig.limbs.map((d) => (
          <path key={d} d={d} class="pos-limb" fill="none" />
        ))}
        <path d={fig.body} class="pos-body" fill="none" />
        <circle cx={fig.head[0]} cy={fig.head[1]} r="7" class="pos-head" />
      </svg>
      <span class="position__label">{label}</span>
    </span>
  );
}

interface Props {
  exercises: DisplayExercise[];
  dimensions: DimensionConfig[];
}

export default function ExerciseFilters({ exercises, dimensions }: Props) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const known = useMemo(() => {
    const map: Partial<Record<FilterDimension, Set<string>>> = {};
    for (const d of dimensions) map[d.key] = new Set(d.options.map((o) => o.value));
    return map;
  }, [dimensions]);

  // Hydrate from the URL so a shared or bookmarked filtered view restores.
  useEffect(() => {
    setFilters(filtersFromSearchParams(new URLSearchParams(window.location.search), known));
  }, [known]);

  // Mirror state back to the URL. replaceState rather than pushState: a filter toggle
  // is a refinement, not a navigation, and every checkbox creating a history entry
  // makes the back button useless.
  useEffect(() => {
    const params = filtersToSearchParams(filters);
    const query = params.toString();
    window.history.replaceState(
      {},
      '',
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [filters]);

  const results = useMemo(() => applyFilters(exercises, filters), [exercises, filters]);
  const empty = isEmptyFilterState(filters);

  return (
    <div class="filters-layout">
      <form
        class="filters"
        aria-label="Filter exercises"
        onSubmit={(e) => e.preventDefault()}
      >
        <div class="filters__head">
          <h2>Filter</h2>
          <button
            type="button"
            class="button button--secondary"
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={empty}
          >
            Clear all
          </button>
        </div>

        {dimensions.map((d) => {
          const counts = facetCounts(exercises, filters, d.key);
          return (
            <fieldset key={d.key}>
              <legend>{d.legend}</legend>
              {d.options.map((o) => {
                const count = counts[o.value] ?? 0;
                const checked = filters[d.key].includes(o.value);
                // Zero-count options are disabled rather than hidden: options
                // vanishing as you filter is disorienting, and a disabled row still
                // tells you the option exists.
                return (
                  <label key={o.value} class={count === 0 && !checked ? 'is-empty' : ''}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={count === 0 && !checked}
                      onChange={() => setFilters((f) => toggleFilter(f, d.key, o.value))}
                    />
                    <span>{o.label}</span>
                    <span class="filters__count">{count}</span>
                  </label>
                );
              })}
            </fieldset>
          );
        })}
      </form>

      <div class="filters-results">
        {/* SC-009: a sighted reader sees the count change; this makes sure a
            screen-reader user hears it. */}
        <p aria-live="polite" class="filters-results__count">
          <strong>{results.length}</strong> {results.length === 1 ? 'exercise' : 'exercises'}
          {!empty && ' match your filters'}
        </p>

        {results.length === 0 ? (
          <div class="callout">
            <h3>No exercises match those filters</h3>
            <p>
              That combination has nothing in it. Try removing one of your choices, or clear
              them and start again.
            </p>
            <button type="button" class="button" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all filters
            </button>
          </div>
        ) : (
          <ul class="grid">
            {results.map((e) => (
              <li key={e.id}>
                <a class="card stack" href={`/exercises/${e.id}/`}>
                  <h3>{e.name}</h3>
                  {e.traditionalName && <p class="card__traditional">{e.traditionalName}</p>}
                  <p class="tag-row">
                    <span class="tag">{e.modalityLabel}</span>
                    <span class="tag">{e.difficulty}</span>
                    <span class="tag">{e.equipmentText}</span>
                  </p>
                  <span class="card__meta">
                    <PositionBadge position={e.startPosition} />
                    <span class="evidence">
                      <span class="evidence__glyph" aria-hidden="true">
                        {e.evidenceGlyph}
                      </span>
                      <span>Evidence: {e.evidenceLabelText}</span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
