import { withBase } from '../lib/paths.ts';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { search, type SearchRecord } from '../lib/search.ts';

/* The index arrives as a prop, serialised into the page at build time. No fetch. */

interface Props {
  index: SearchRecord[];
}

export default function Search({ index }: Props) {
  const [query, setQuery] = useState('');

  // Support /search/?q=… so a search can be linked to.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  const results = useMemo(() => search(index, query), [index, query]);
  const searched = query.trim().length > 0;

  return (
    <div>
      <form class="search-form" role="search" onSubmit={(e) => e.preventDefault()}>
        <label class="visually-hidden" htmlFor="search-input">
          Search muscles and exercises
        </label>
        <input
          id="search-input"
          class="search-input"
          type="search"
          autocomplete="off"
          placeholder="Try VMO, hamstring, or supta padangusthasana"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
      </form>

      <p aria-live="polite" class="filters-results__count">
        {searched
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
          : `${index.length} muscles and exercises to search`}
      </p>

      {searched && results.length === 0 && (
        <div class="callout">
          <h3>Nothing matched “{query}”</h3>
          <p>
            Try a shorter word, or browse instead — the <a href={withBase('/muscles/')}>muscle catalogue</a>{' '}
            and the <a href={withBase('/exercises/')}>exercise library</a> both list everything.
          </p>
        </div>
      )}

      <ul class="search-results">
        {results.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <a class="card" href={r.url}>
              <strong>{r.title}</strong>
              <p class="tag-row">
                <span class="tag">{r.kind === 'muscle' ? 'Muscle' : 'Exercise'}</span>
                {r.subtitle && <span class="tag">{r.subtitle}</span>}
              </p>
              {/* Say WHY this matched when it was not the title — "VMO" finding
                  "Vastus medialis" is confusing without this. */}
              {r.matchedName !== r.title && (
                <p class="card__traditional">matched “{r.matchedName}”</p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
