import { describe, it, expect } from 'vitest';
import { normalize, scoreName, search, type SearchRecord } from '../../src/lib/search.ts';
import { buildSearchIndex } from '../../src/lib/search-index.ts';

const INDEX: SearchRecord[] = [
  {
    id: 'vastus-medialis',
    kind: 'muscle',
    names: ['Vastus medialis', 'The inner quad', 'VMO', 'VM'],
    title: 'Vastus medialis',
    url: '/muscles/vastus-medialis/',
  },
  {
    id: 'supta-padangusthasana',
    kind: 'exercise',
    names: ['Reclining hand-to-big-toe pose', 'Supta Padangusthasana'],
    title: 'Reclining hand-to-big-toe pose',
    url: '/exercises/supta-padangusthasana/',
  },
  {
    id: 'heel-slide',
    kind: 'exercise',
    names: ['Heel slide'],
    title: 'Heel slide',
    url: '/exercises/heel-slide/',
  },
];

describe('normalize', () => {
  it('strips diacritics so transliterations match however they are typed', () => {
    expect(normalize('Supta Pādāṅguṣṭhāsana')).toBe('supta padangusthasana');
  });
  it('folds case and collapses punctuation', () => {
    expect(normalize('Hand-To-Big-Toe')).toBe('hand to big toe');
  });
});

describe('scoreName', () => {
  it('ranks exact above prefix above word-boundary above substring', () => {
    expect(scoreName('VMO', 'vmo')).toBeGreaterThan(scoreName('VMO extra', 'vmo'));
    expect(scoreName('Heel slide', 'heel')).toBeGreaterThan(scoreName('Heel slide', 'slide'));
    expect(scoreName('Heel slide', 'slide')).toBeGreaterThan(scoreName('Heel slide', 'eel'));
  });
  it('returns 0 for no match and for an empty query', () => {
    expect(scoreName('Heel slide', 'bicycle')).toBe(0);
    expect(scoreName('Heel slide', '')).toBe(0);
  });
});

describe('search', () => {
  it('finds a muscle by abbreviation (FR-030)', () => {
    const [first] = search(INDEX, 'VMO');
    expect(first?.id).toBe('vastus-medialis');
    expect(first?.matchedName).toBe('VMO');
  });

  it('finds a muscle by common name', () => {
    expect(search(INDEX, 'inner quad')[0]?.id).toBe('vastus-medialis');
  });

  it('finds an exercise by traditional name', () => {
    expect(search(INDEX, 'supta padangusthasana')[0]?.id).toBe('supta-padangusthasana');
  });

  it('finds an exercise by English name', () => {
    expect(search(INDEX, 'reclining')[0]?.id).toBe('supta-padangusthasana');
  });

  it('is case and diacritic insensitive', () => {
    expect(search(INDEX, 'SUPTA PĀDĀṄGUṢṬHĀSANA')[0]?.id).toBe('supta-padangusthasana');
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(search(INDEX, '')).toEqual([]);
    expect(search(INDEX, 'zzzz')).toEqual([]);
  });

  it('respects the limit', () => {
    expect(search(INDEX, 'e', 2)).toHaveLength(2);
  });
});

describe('buildSearchIndex', () => {
  it('indexes every name a reader might reach for', () => {
    const index = buildSearchIndex(
      [
        {
          id: 'vmo',
          data: {
            anatomicalName: 'Vastus medialis',
            commonName: 'inner quad',
            abbreviations: ['VMO'],
            group: 'Quadriceps',
          },
        },
      ],
      [
        {
          id: 'virasana',
          data: { name: 'Hero pose', traditionalName: 'Virasana', modality: 'yoga' },
        },
      ],
    );
    expect(index).toHaveLength(2);
    expect(index[0]?.names).toEqual(['Vastus medialis', 'inner quad', 'VMO']);
    expect(index[1]?.names).toEqual(['Hero pose', 'Virasana']);
    expect(index[1]?.url).toBe('/exercises/virasana/');
  });
});
