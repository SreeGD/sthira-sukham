/**
 * Content policy gate (Constitution: Development Workflow & Quality Gates).
 *
 * Two jobs, and the first is more important than it looks:
 *
 * 1. REFERENTIAL INTEGRITY (FR-036, SC-004). The plan assumed Astro's `reference()`
 *    enforced this at build time. It does not — verified empirically: a dangling
 *    reference builds with exit 0, because `reference()` validates id SHAPE and
 *    resolution is lazy. So this script is the only thing standing between the app
 *    and a rendered dead link. Do not remove it, and do not assume the build covers it.
 *
 * 2. Cross-collection policy no per-record schema can express — aggregate properties
 *    over the whole collection (SC-005, SC-006, FR-004, FR-009, FR-011, FR-026).
 */

import { loadAll, type Collections, type Record_ } from './content-loader.ts';
import { buildMuscleExerciseIndex } from '../src/lib/cross-links.ts';

const problems: string[] = [];
const notes: string[] = [];

function fail(message: string) {
  problems.push(message);
}

// --- Required content, by id ------------------------------------------------

const REQUIRED_RED_FLAGS = [
  'locking',
  'giving-way',
  'cannot-bear-weight',
  'hot-swollen-joint',
  'fever-with-joint-pain',
  'sudden-severe-pain',
  'night-pain',
  'pain-after-trauma',
];

const REQUIRED_MUSCLE_GROUPS: Record<string, string[]> = {
  quadriceps: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'vastus-intermedius'],
  hamstrings: ['biceps-femoris', 'semitendinosus', 'semimembranosus'],
  calf: ['gastrocnemius', 'soleus'],
  'deep-knee': ['popliteus'],
  hip: [
    'tensor-fasciae-latae',
    'adductor-group',
    'gluteus-maximus',
    'gluteus-medius',
    'gluteus-minimus',
    'iliopsoas',
  ],
  'non-contractile': ['joint-capsule', 'retinaculum', 'iliotibial-band'],
};

const MODALITIES = ['clinical-rom', 'yoga', 'pilates', 'taichi-qigong'];
const REQUIRED_STIFFNESS_SOURCE_COUNT = 6;
const REQUIRED_PATTERN_COUNT = 4;
const MAX_MODALITY_SHARE = 0.6;

// --- Helpers ----------------------------------------------------------------

const idsOf = (records: Record_[]) => new Set(records.map((r) => r.id));

function refs(record: Record_, field: string): string[] {
  const value = record.data[field];
  if (!Array.isArray(value)) return [];
  return value.map((v) =>
    typeof v === 'string' ? v : String((v as Record<string, unknown>)?.id ?? v),
  );
}

/** Check that every reference in `field` resolves. This is the FR-036 gate. */
function checkRefs(records: Record_[], field: string, target: Set<string>, targetName: string) {
  for (const record of records) {
    for (const ref of refs(record, field)) {
      if (!target.has(ref)) {
        fail(`${record.file}: ${field} -> "${ref}" does not exist in ${targetName}.`);
      }
    }
  }
}

// --- Checks -----------------------------------------------------------------

function run(c: Collections) {
  const muscleIds = idsOf(c.muscles);
  const exerciseIds = idsOf(c.exercises);
  const sourceIds = idsOf(c.sources);
  const evidenceIds = idsOf(c.evidenceLabels);
  const stiffnessSourceIds = idsOf(c.stiffnessSources);

  // 1. Referential integrity — the thing Astro does not do for us.
  checkRefs(c.muscles, 'sources', sourceIds, 'sources');
  checkRefs(c.exercises, 'sources', sourceIds, 'sources');
  checkRefs(c.exercises, 'targets', muscleIds, 'muscles');
  checkRefs(c.exercises, 'regressions', exerciseIds, 'exercises');
  checkRefs(c.exercises, 'progressions', exerciseIds, 'exercises');
  checkRefs(c.routines, 'sources', sourceIds, 'sources');
  checkRefs(c.stiffnessSources, 'sources', sourceIds, 'sources');
  checkRefs(c.stiffnessSources, 'relatedStructures', muscleIds, 'muscles');
  checkRefs(c.stiffnessPatterns, 'sources', sourceIds, 'sources');
  checkRefs(c.stiffnessPatterns, 'typicallyInvolves', muscleIds, 'muscles');
  checkRefs(c.stiffnessPatterns, 'relatedSources', stiffnessSourceIds, 'stiffnessSources');
  checkRefs(c.redFlags, 'sources', sourceIds, 'sources');

  for (const exercise of c.exercises) {
    const label = exercise.data.evidenceLabel;
    if (typeof label === 'string' && !evidenceIds.has(label)) {
      fail(`${exercise.file}: evidenceLabel "${label}" is not in the evidence vocabulary.`);
    }
  }

  for (const routine of c.routines) {
    const steps = Array.isArray(routine.data.steps) ? routine.data.steps : [];
    steps.forEach((step, i) => {
      const ref = (step as Record<string, unknown>)?.exercise;
      const id = typeof ref === 'string' ? ref : String((ref as Record<string, unknown>)?.id ?? ref);
      if (!exerciseIds.has(id)) {
        fail(`${routine.file}: step ${i + 1} -> exercise "${id}" does not exist.`);
      }
    });
  }

  // 2. Self-reference and cycles in the progression ladder.
  for (const exercise of c.exercises) {
    const related = [...refs(exercise, 'regressions'), ...refs(exercise, 'progressions')];
    if (related.includes(exercise.id)) {
      fail(`${exercise.file}: references itself as a regression or progression.`);
    }
  }
  for (const exercise of c.exercises) {
    for (const progressionId of refs(exercise, 'progressions')) {
      const progression = c.exercises.find((e) => e.id === progressionId);
      if (progression && refs(progression, 'progressions').includes(exercise.id)) {
        fail(
          `Progression cycle: "${exercise.id}" and "${progressionId}" each list the other as a progression.`,
        );
      }
    }
  }

  // 3. Every claim-bearing record carries a source (FR-033, SC-003).
  const claimBearing: Array<[string, Record_[]]> = [
    ['muscles', c.muscles],
    ['exercises', c.exercises],
    ['stiffness-sources', c.stiffnessSources],
    ['stiffness-patterns', c.stiffnessPatterns],
    ['red-flags', c.redFlags],
  ];
  for (const [name, records] of claimBearing) {
    for (const record of records) {
      if (refs(record, 'sources').length === 0) {
        fail(`${record.file}: ${name} record "${record.id}" has no sources (FR-033).`);
      }
    }
  }

  // 4. Exercise safety fields (FR-006). The schema enforces these too; duplicated
  //    here so the policy gate alone is sufficient to declare a content set unsafe.
  for (const exercise of c.exercises) {
    for (const field of ['contraindications', 'stopIf'] as const) {
      const value = exercise.data[field];
      if (!Array.isArray(value) || value.length === 0) {
        fail(`${exercise.file}: "${field}" is required and must not be empty (FR-006).`);
      }
    }
    if (!exercise.data.evidenceLabel) {
      fail(`${exercise.file}: evidenceLabel is required (FR-037).`);
    }
  }

  // 5. Required muscle coverage (FR-012, FR-013).
  for (const [group, required] of Object.entries(REQUIRED_MUSCLE_GROUPS)) {
    for (const id of required) {
      if (!muscleIds.has(id)) fail(`Missing required ${group} muscle record: "${id}" (FR-012/13).`);
    }
  }

  // 6. Every muscle is reachable through an exercise, or says why not (SC-005).
  const index = buildMuscleExerciseIndex(
    c.exercises.map((e) => ({ id: e.id, targets: refs(e, 'targets') })),
  );
  for (const muscle of c.muscles) {
    if (index.has(muscle.id)) continue;
    if (!muscle.data.noExercisesNote) {
      fail(
        `${muscle.file}: no exercise targets this structure and it carries no noExercisesNote (SC-005).`,
      );
    }
  }

  // 7. Modality balance (SC-006). Guards against the library quietly becoming a
  //    stretching list with a token asana attached.
  if (c.exercises.length > 0) {
    const counts = new Map<string, number>();
    for (const exercise of c.exercises) {
      const modality = String(exercise.data.modality);
      counts.set(modality, (counts.get(modality) ?? 0) + 1);
    }
    for (const modality of MODALITIES) {
      if (!counts.has(modality)) fail(`Modality "${modality}" has no exercises (SC-006).`);
    }
    for (const [modality, count] of counts) {
      const share = count / c.exercises.length;
      if (share > MAX_MODALITY_SHARE) {
        fail(
          `Modality "${modality}" is ${(share * 100).toFixed(0)}% of the library; the ceiling is ${MAX_MODALITY_SHARE * 100}% (SC-006).`,
        );
      }
    }
    notes.push(
      `Modality mix: ${[...counts.entries()].map(([m, n]) => `${m}=${n}`).join(', ')} of ${c.exercises.length}`,
    );
  }

  // 8. Red flags (FR-004).
  const redFlagIds = idsOf(c.redFlags);
  for (const id of REQUIRED_RED_FLAGS) {
    if (!redFlagIds.has(id)) fail(`Missing required red-flag sign: "${id}" (FR-004).`);
  }

  // 9. Fixed-count collections (FR-009, FR-011, FR-026).
  if (c.stiffnessSources.length !== REQUIRED_STIFFNESS_SOURCE_COUNT) {
    fail(
      `Expected ${REQUIRED_STIFFNESS_SOURCE_COUNT} stiffness sources, found ${c.stiffnessSources.length} (FR-009).`,
    );
  }
  if (c.stiffnessPatterns.length !== REQUIRED_PATTERN_COUNT) {
    fail(
      `Expected ${REQUIRED_PATTERN_COUNT} stiffness patterns, found ${c.stiffnessPatterns.length} (FR-011).`,
    );
  }
  if (c.routines.length < 3) {
    fail(`Expected at least 3 routines, found ${c.routines.length} (FR-026).`);
  }

  // 10. Source hygiene: duplicate ids would make references ambiguous; orphans mean
  //     a citation nobody reads, which usually means a claim lost its evidence.
  const seen = new Set<string>();
  for (const source of c.sources) {
    if (seen.has(source.id)) fail(`Duplicate source id "${source.id}" (${source.file}).`);
    seen.add(source.id);
  }
  const referenced = new Set<string>();
  for (const [, records] of claimBearing) {
    for (const record of records) for (const ref of refs(record, 'sources')) referenced.add(ref);
  }
  for (const routine of c.routines) for (const ref of refs(routine, 'sources')) referenced.add(ref);
  const orphans = c.sources.filter((s) => !referenced.has(s.id)).map((s) => s.id);
  if (orphans.length > 0) notes.push(`Unreferenced sources (not fatal): ${orphans.join(', ')}`);
}

// --- Report -----------------------------------------------------------------

const collections = loadAll();
run(collections);

const counts = Object.entries(collections)
  .map(([name, records]) => `${name}=${records.length}`)
  .join('  ');
console.log(`Content: ${counts}`);
for (const note of notes) console.log(`  note: ${note}`);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} content policy violation(s):\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('✓ Content policy checks passed');
