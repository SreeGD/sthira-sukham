import { describe, it, expect } from 'vitest';
import { checkContent, type Collections } from '../../scripts/content-policy.ts';
import { REQUIRED_MUSCLE_GROUPS, REQUIRED_RED_FLAGS } from '../../scripts/content-policy.ts';
import type { Record_ } from '../../scripts/content-loader.ts';

const rec = (id: string, data: Record<string, unknown>): Record_ => ({
  id,
  file: `fixture/${id}.md`,
  data,
  body: '',
});

const ALL_MUSCLE_IDS = Object.values(REQUIRED_MUSCLE_GROUPS).flat();

/** A minimal content set that passes every rule, to mutate per-test. */
function valid(): Collections {
  const sources = [rec('src-1', { id: 'src-1' })];
  const evidenceLabels = [rec('well-studied', { id: 'well-studied' })];
  const muscles = ALL_MUSCLE_IDS.map((id) =>
    rec(id, { sources: ['src-1'], noExercisesNote: 'covered elsewhere' }),
  );
  const exercises = ['clinical-rom', 'yoga', 'pilates', 'taichi-qigong'].map((modality, i) =>
    rec(`ex-${i}`, {
      modality,
      targets: ['rectus-femoris'],
      sources: ['src-1'],
      contraindications: ['x'],
      stopIf: ['y'],
      evidenceLabel: 'well-studied',
      progressions: [],
      regressions: [],
    }),
  );
  return {
    muscles,
    exercises,
    routines: [1, 2, 3].map((n) => rec(`r-${n}`, { steps: [{ exercise: 'ex-0' }], sources: [] })),
    stiffnessSources: [1, 2, 3, 4, 5, 6].map((n) => rec(`ss-${n}`, { sources: ['src-1'] })),
    stiffnessPatterns: [1, 2, 3, 4].map((n) => rec(`sp-${n}`, { sources: ['src-1'] })),
    sources,
    evidenceLabels,
    redFlags: REQUIRED_RED_FLAGS.map((id) => rec(id, { id, sources: ['src-1'] })),
  };
}

const problems = (c: Collections) => checkContent(c).problems;

describe('the fixture baseline', () => {
  it('passes cleanly, so every failure below is caused by its own mutation', () => {
    expect(problems(valid())).toEqual([]);
  });
});

describe('referential integrity (FR-036, SC-004)', () => {
  // This is the class of bug Astro's reference() does NOT catch — a dangling
  // reference builds with exit 0. These tests are the actual enforcement.
  it('catches an exercise targeting a nonexistent muscle', () => {
    const c = valid();
    c.exercises[0]!.data.targets = ['no-such-muscle'];
    expect(problems(c).join()).toMatch(/targets -> "no-such-muscle" does not exist/);
  });

  it('catches a record citing a nonexistent source', () => {
    const c = valid();
    c.muscles[0]!.data.sources = ['ghost-source'];
    expect(problems(c).join()).toMatch(/sources -> "ghost-source" does not exist/);
  });

  it('catches a routine step pointing at a nonexistent exercise', () => {
    const c = valid();
    c.routines[0]!.data.steps = [{ exercise: 'not-real' }];
    expect(problems(c).join()).toMatch(/exercise "not-real" does not exist/);
  });

  it('catches an unknown evidence label (FR-037)', () => {
    const c = valid();
    c.exercises[0]!.data.evidenceLabel = 'made-up';
    expect(problems(c).join()).toMatch(/not in the evidence vocabulary/);
  });

  it('resolves references given as objects as well as bare ids', () => {
    const c = valid();
    c.exercises[0]!.data.targets = [{ collection: 'muscles', id: 'rectus-femoris' }];
    expect(problems(c)).toEqual([]);
  });
});

describe('progression ladder', () => {
  it('catches self-reference', () => {
    const c = valid();
    c.exercises[0]!.data.progressions = ['ex-0'];
    expect(problems(c).join()).toMatch(/references itself/);
  });

  it('catches a two-node cycle', () => {
    const c = valid();
    c.exercises[0]!.data.progressions = ['ex-1'];
    c.exercises[1]!.data.progressions = ['ex-0'];
    expect(problems(c).join()).toMatch(/Progression cycle/);
  });
});

describe('safety fields (FR-006, Principle I)', () => {
  for (const field of ['contraindications', 'stopIf'] as const) {
    it(`rejects an empty ${field}`, () => {
      const c = valid();
      c.exercises[0]!.data[field] = [];
      expect(problems(c).join()).toMatch(new RegExp(`"${field}" is required`));
    });

    it(`rejects a missing ${field}`, () => {
      const c = valid();
      delete c.exercises[0]!.data[field];
      expect(problems(c).join()).toMatch(new RegExp(`"${field}" is required`));
    });
  }

  it('rejects a missing evidence label', () => {
    const c = valid();
    delete c.exercises[0]!.data.evidenceLabel;
    expect(problems(c).join()).toMatch(/evidenceLabel is required/);
  });
});

describe('sourcing (FR-033, SC-003)', () => {
  it('rejects an unsourced record in every claim-bearing collection', () => {
    for (const key of ['muscles', 'exercises', 'stiffnessSources', 'stiffnessPatterns', 'redFlags'] as const) {
      const c = valid();
      c[key][0]!.data.sources = [];
      expect(problems(c).join(), key).toMatch(/has no sources/);
    }
  });
});

describe('required coverage', () => {
  it('rejects a missing required muscle (FR-012/13)', () => {
    const c = valid();
    c.muscles = c.muscles.filter((m) => m.id !== 'popliteus');
    expect(problems(c).join()).toMatch(/Missing required .* muscle record: "popliteus"/);
  });

  it('rejects a missing red-flag sign (FR-004)', () => {
    const c = valid();
    c.redFlags = c.redFlags.filter((f) => f.id !== 'night-pain');
    expect(problems(c).join()).toMatch(/Missing required red-flag sign: "night-pain"/);
  });

  it('rejects wrong fixed counts (FR-009, FR-011, FR-026)', () => {
    const c = valid();
    c.stiffnessSources.pop();
    c.stiffnessPatterns.pop();
    c.routines.pop();
    const p = problems(c).join();
    expect(p).toMatch(/Expected 6 stiffness sources/);
    expect(p).toMatch(/Expected 4 stiffness patterns/);
    expect(p).toMatch(/at least 3 routines/);
  });

  it('requires a muscle to be targeted or carry an explicit note (SC-005)', () => {
    const c = valid();
    delete c.muscles.find((m) => m.id === 'soleus')!.data.noExercisesNote;
    expect(problems(c).join()).toMatch(/no exercise targets this structure/);

    // …and is satisfied once something targets it.
    c.exercises[0]!.data.targets = ['rectus-femoris', 'soleus'];
    expect(problems(c).join()).not.toMatch(/no exercise targets this structure/);
  });
});

describe('modality balance (SC-006)', () => {
  it('rejects a missing modality', () => {
    const c = valid();
    c.exercises = c.exercises.filter((e) => e.data.modality !== 'taichi-qigong');
    expect(problems(c).join()).toMatch(/Modality "taichi-qigong" has no exercises/);
  });

  it('rejects one modality dominating past 60%', () => {
    const c = valid();
    // 7 of 10 clinical => 70%.
    for (let i = 0; i < 6; i++) {
      c.exercises.push(
        rec(`extra-${i}`, {
          modality: 'clinical-rom',
          targets: ['rectus-femoris'],
          sources: ['src-1'],
          contraindications: ['x'],
          stopIf: ['y'],
          evidenceLabel: 'well-studied',
        }),
      );
    }
    expect(problems(c).join()).toMatch(/is 70% of the library; the ceiling is 60%/);
  });

  it('reports the mix as a note even when passing', () => {
    expect(checkContent(valid()).notes.join()).toMatch(/Modality mix:/);
  });
});

describe('source hygiene', () => {
  it('rejects duplicate source ids', () => {
    const c = valid();
    c.sources.push(rec('src-1', { id: 'src-1' }));
    expect(problems(c).join()).toMatch(/Duplicate source id "src-1"/);
  });

  it('notes orphaned sources without failing the build', () => {
    const c = valid();
    c.sources.push(rec('unused', { id: 'unused' }));
    const { problems: p, notes } = checkContent(c);
    expect(p).toEqual([]);
    expect(notes.join()).toMatch(/Unreferenced sources.*unused/);
  });
});
