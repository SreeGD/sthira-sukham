/**
 * Content policy rules (Constitution: Development Workflow & Quality Gates).
 *
 * Pure: takes collections, returns problems. The CLI shell in validate-content.ts
 * loads from disk and reports; everything decidable lives here so it can be tested
 * against fixtures without touching the filesystem — the same lib/shell split used
 * for the filter and search logic.
 *
 * Two jobs, and the first is more important than it looks:
 *
 * 1. REFERENTIAL INTEGRITY (FR-036, SC-004). The plan assumed Astro's `reference()`
 *    enforced this at build time. It does not — verified empirically: a dangling
 *    reference builds with exit 0, because `reference()` validates id SHAPE and
 *    resolution is lazy. So this is the only thing standing between the app and a
 *    rendered dead link. Do not remove it, and do not assume the build covers it.
 *
 * 2. Cross-collection policy no per-record schema can express — aggregate properties
 *    over the whole collection (SC-005, SC-006, FR-004, FR-009, FR-011, FR-026).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Record_ } from './content-loader.ts';

export interface Collections {
  joints?: Record_[];
  functionalGoals?: Record_[];
  muscles: Record_[];
  exercises: Record_[];
  routines: Record_[];
  stiffnessSources: Record_[];
  stiffnessPatterns: Record_[];
  sources: Record_[];
  evidenceLabels: Record_[];
  redFlags: Record_[];
}

export interface PolicyResult {
  problems: string[];
  notes: string[];
}

export const REQUIRED_RED_FLAGS = [
  'locking',
  'giving-way',
  'cannot-bear-weight',
  'hot-swollen-joint',
  'fever-with-joint-pain',
  'sudden-severe-pain',
  'night-pain',
  'pain-after-trauma',
  // Feature 002: joint-specific signs. Exercise content for a joint must not ship
  // before that joint's warning signs (FR-119).
  'hip-groin-pain-after-fall',
  'ankle-cannot-weight-bear-after-inversion',
];

export const REQUIRED_MUSCLE_GROUPS: Record<string, string[]> = {
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

export const MODALITIES = ['clinical-rom', 'yoga', 'pilates', 'taichi-qigong'];
export const MAX_MODALITY_SHARE = 0.6;
const REQUIRED_STIFFNESS_SOURCE_COUNT = 6;
const MIN_ROUTINES = 3;

const idsOf = (records: Record_[]) => new Set(records.map((r) => r.id));

/** Reference values may be bare ids or `{ collection, id }` objects depending on the writer. */
export function refs(record: Record_, field: string): string[] {
  const value = record.data[field];
  if (!Array.isArray(value)) return [];
  return value.map((v) =>
    typeof v === 'string' ? v : String((v as Record<string, unknown>)?.id ?? v),
  );
}

export function checkContent(c: Collections): PolicyResult {
  const problems: string[] = [];
  const notes: string[] = [];
  const fail = (m: string) => problems.push(m);

  const muscleIds = idsOf(c.muscles);
  const exerciseIds = idsOf(c.exercises);
  const sourceIds = idsOf(c.sources);
  const evidenceIds = idsOf(c.evidenceLabels);
  const stiffnessSourceIds = idsOf(c.stiffnessSources);

  const checkRefs = (records: Record_[], field: string, target: Set<string>, name: string) => {
    for (const record of records) {
      for (const ref of refs(record, field)) {
        if (!target.has(ref)) {
          fail(`${record.file}: ${field} -> "${ref}" does not exist in ${name}.`);
        }
      }
    }
  };

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
  checkRefs(c.functionalGoals ?? [], 'sources', sourceIds, 'sources');
  checkRefs(c.functionalGoals ?? [], 'targets', muscleIds, 'muscles');

  // Routine -> goal links, and the inverse: a goal offering no session is a dead end
  // for a reader who came in via "where do I start".
  {
    const goalIds = idsOf(c.functionalGoals ?? []);
    const linked = new Set<string>();
    for (const routine of c.routines) {
      const g = routine.data.goal;
      if (!g) continue;
      const id = typeof g === 'string' ? g : String((g as Record<string, unknown>)?.id ?? g);
      if (!goalIds.has(id)) fail(`${routine.file}: goal -> "${id}" does not exist.`);
      else linked.add(id);
    }
    for (const goal of c.functionalGoals ?? []) {
      if (!linked.has(goal.id)) fail(`${goal.file}: no routine is linked to this goal.`);
    }
  }

  for (const exercise of c.exercises) {
    const label = exercise.data.evidenceLabel;
    const id = typeof label === 'string' ? label : (label as Record<string, unknown>)?.id;
    if (id !== undefined && !evidenceIds.has(String(id))) {
      fail(`${exercise.file}: evidenceLabel "${String(id)}" is not in the evidence vocabulary.`);
    }
  }

  for (const routine of c.routines) {
    const steps = Array.isArray(routine.data.steps) ? routine.data.steps : [];
    steps.forEach((step, i) => {
      const ref = (step as Record<string, unknown>)?.exercise;
      const id = typeof ref === 'string' ? ref : String((ref as Record<string, unknown>)?.id ?? ref);
      if (!exerciseIds.has(id)) fail(`${routine.file}: step ${i + 1} -> exercise "${id}" does not exist.`);
    });
  }

  // 2. Self-reference and cycles in the progression ladder.
  for (const exercise of c.exercises) {
    const related = [...refs(exercise, 'regressions'), ...refs(exercise, 'progressions')];
    if (related.includes(exercise.id)) {
      fail(`${exercise.file}: references itself as a regression or progression.`);
    }
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
    ['joints', c.joints ?? []],
  ];
  for (const [name, records] of claimBearing) {
    for (const record of records) {
      if (refs(record, 'sources').length === 0) {
        fail(`${record.file}: ${name} record "${record.id}" has no sources (FR-033).`);
      }
    }
  }

  // 4. Exercise safety fields (FR-006). The schema enforces these too; duplicated here
  //    so the policy gate alone is sufficient to declare a content set unsafe.
  for (const exercise of c.exercises) {
    for (const field of ['contraindications', 'stopIf'] as const) {
      const value = exercise.data[field];
      if (!Array.isArray(value) || value.length === 0) {
        fail(`${exercise.file}: "${field}" is required and must not be empty (FR-006).`);
      }
    }
    if (!exercise.data.evidenceLabel) fail(`${exercise.file}: evidenceLabel is required (FR-037).`);
  }

  // 4b. Clarity of instruction. A unilateral movement whose steps never mention the
  //     other side leaves a reader doing one leg and stopping — found six times in an
  //     audit, which is what prompted the explicit `laterality` field.
  for (const exercise of c.exercises) {
    if (exercise.data.laterality !== 'unilateral') continue;
    const steps = Array.isArray(exercise.data.instructions)
      ? (exercise.data.instructions as Array<Record<string, unknown>>)
          .map((s) => String(s.detail ?? ''))
          .join(' ')
      : '';
    const quick = Array.isArray(exercise.data.quickSteps)
      ? (exercise.data.quickSteps as string[]).join(' ')
      : '';
    const SWITCHES =
      /swap|other (side|leg|foot|arm|knee|hip)|change (sides|legs)|each side|per side/i;
    if (!SWITCHES.test(steps + ' ' + quick)) {
      fail(
        `${exercise.file}: is unilateral but its steps never say to change sides — a reader will do one side and stop.`,
      );
    }
    /*
     * Step one must say which side to begin on. "Step one foot forward" leaves a reader
     * with one stiff knee genuinely unsure whether to work that side or both — found in
     * ten exercises during a clarity audit.
     */
    const firstStep = Array.isArray(exercise.data.instructions)
      ? String((exercise.data.instructions as Array<Record<string, unknown>>)[0]?.detail ?? '')
      : '';
    if (
      /\bone (leg|foot|knee|side|arm)\b/i.test(firstStep) &&
      !/(stiff|affected|working|painful|either|whichever|stronger)/i.test(firstStep)
    ) {
      fail(
        `${exercise.file}: step one says "one leg/foot" without saying which side to start on.`,
      );
    }

    const dose = exercise.data.dosage as Record<string, unknown> | undefined;
    if (dose && !/per side|each side|both sides/i.test(String(dose.reps ?? ''))) {
      fail(`${exercise.file}: is unilateral but its repetition count does not say "per side".`);
    }
  }

  // 5. Required muscle coverage (FR-012, FR-013).
  for (const [group, required] of Object.entries(REQUIRED_MUSCLE_GROUPS)) {
    for (const id of required) {
      if (!muscleIds.has(id)) fail(`Missing required ${group} muscle record: "${id}" (FR-012/13).`);
    }
  }

  // 6. Every muscle reachable through an exercise, or says why not (SC-005).
  const targeted = new Set(c.exercises.flatMap((e) => refs(e, 'targets')));
  for (const muscle of c.muscles) {
    if (!targeted.has(muscle.id) && !muscle.data.noExercisesNote) {
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
  /*
   * Feature 001 fixed these at 6 and 4 because there was one joint. Now they are
   * per-joint: the six physical mechanisms recur at every joint (they are tissue-level,
   * so they must), while patterns are joint-specific and are only required to exist.
   */
  {
    const jointOfRec = (r: Record_) => {
      const j = r.data.joint;
      return typeof j === 'string' ? j : String((j as Record<string, unknown>)?.id ?? j);
    };
    for (const joint of c.joints ?? []) {
      const n = c.stiffnessSources.filter((s) => jointOfRec(s) === joint.id).length;
      if (n !== REQUIRED_STIFFNESS_SOURCE_COUNT) {
        fail(
          `${joint.file}: expected ${REQUIRED_STIFFNESS_SOURCE_COUNT} stiffness sources for this joint, found ${n} (FR-009).`,
        );
      }
      if (c.stiffnessPatterns.filter((s) => jointOfRec(s) === joint.id).length < 1) {
        fail(`${joint.file}: expected at least one stiffness pattern for this joint (FR-011).`);
      }
    }
  }
  if (c.routines.length < MIN_ROUTINES) {
    fail(`Expected at least ${MIN_ROUTINES} routines, found ${c.routines.length} (FR-026).`);
  }

  // 9b. The chain (feature 002: SC-101, SC-102).
  //
  //     Astro's reference() validates id shape but not existence, so every one of these
  //     new reference types needs checking here — same gap that made this script
  //     necessary in the first place.
  {
    const joints = c.joints ?? [];
    const jointIds = idsOf(joints);

    const influencesOf = (record: Record_) => {
      const v = record.data.jointInfluences;
      return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
    };

    for (const muscle of c.muscles) {
      const inf = influencesOf(muscle);
      if (inf.length === 0) {
        fail(`${muscle.file}: declares no jointInfluences — every structure must state what it influences (FR-108).`);
      }
      for (const i of inf) {
        const jid = typeof i.joint === 'string' ? i.joint : String((i.joint as Record<string, unknown>)?.id ?? i.joint);
        if (!jointIds.has(jid)) fail(`${muscle.file}: jointInfluences -> "${jid}" is not a joint.`);
        if (i.action !== 'direct' && i.action !== 'indirect') {
          fail(`${muscle.file}: jointInfluences action must be direct or indirect, got "${String(i.action)}".`);
        }
        if (!i.presentsAs) fail(`${muscle.file}: a jointInfluence does not say how it presents.`);
      }
    }

    checkRefs(joints, 'sources', sourceIds, 'sources');
    checkRefs(c.functionalGoals ?? [], 'dependsOnJoints', jointIds, 'joints');
    checkRefs(c.redFlags, 'joints', jointIds, 'joints');
    for (const rec of [...c.stiffnessSources, ...c.stiffnessPatterns]) {
      const j = rec.data.joint;
      const jid = typeof j === 'string' ? j : String((j as Record<string, unknown>)?.id ?? j);
      if (j !== undefined && !jointIds.has(jid)) fail(`${rec.file}: joint -> "${jid}" does not exist.`);
    }

    // Every joint must be reachable and furnished, or it is a dead page.
    const influenced = new Set(
      c.muscles.flatMap((m) =>
        influencesOf(m).map((i) =>
          typeof i.joint === 'string' ? i.joint : String((i.joint as Record<string, unknown>)?.id ?? i.joint),
        ),
      ),
    );
    const jointOf = (r: Record_) => {
      const j = r.data.joint;
      return typeof j === 'string' ? j : String((j as Record<string, unknown>)?.id ?? j);
    };
    for (const joint of joints) {
      if (!influenced.has(joint.id)) fail(`${joint.file}: no structure influences this joint (SC-102).`);
      if (!c.stiffnessSources.some((s) => jointOf(s) === joint.id)) {
        fail(`${joint.file}: no stiffness sources for this joint (SC-101).`);
      }
      if (!c.stiffnessPatterns.some((s) => jointOf(s) === joint.id)) {
        fail(`${joint.file}: no stiffness patterns for this joint (SC-101).`);
      }
    }

    if (joints.length > 0) {
      const per = joints
        .map((j) => `${j.id}=${[...influenced].filter((x) => x === j.id).length ? c.muscles.filter((m) => influencesOf(m).some((i) => (typeof i.joint === 'string' ? i.joint : String((i.joint as Record<string, unknown>)?.id)) === j.id)).length : 0}`)
        .join(', ');
      notes.push(`Structures influencing each joint: ${per}`);
    }
  }

  // 10. Illustration provenance (Constitution Content Standards).
  //     An image whose licence is not recorded beside it is indistinguishable from one
  //     taken without permission, so the licence, credit and source URL are all required
  //     — and the file must actually exist, or the page renders a broken image with a
  //     perfectly correct attribution under it.
  for (const muscle of c.muscles) {
    const ill = muscle.data.illustration as Record<string, unknown> | undefined;
    if (!ill) continue;
    for (const field of ['file', 'alt', 'caption', 'credit', 'year', 'licence', 'sourceUrl']) {
      if (!ill[field]) fail(`${muscle.file}: illustration is missing "${field}".`);
    }
    if (ill.file && !existsSync(join('public/anatomy', String(ill.file)))) {
      fail(`${muscle.file}: illustration file "public/anatomy/${String(ill.file)}" does not exist.`);
    }
    /*
     * These plates are scans of line drawings, where WebP is roughly a sixth the size
     * of PNG with no visible loss at the size they are displayed. The whole set was 8MB
     * as PNG and is 1.8MB as WebP; one plate added back as PNG undoes a chunk of that
     * quietly. Convert with: cwebp -q 90 in.png -o out.webp
     */
    if (typeof ill.file === 'string' && /\.(png|jpe?g)$/i.test(ill.file)) {
      fail(
        `${muscle.file}: illustration "${ill.file}" should be WebP — convert with \`cwebp -q 90\`. PNG plates are ~6x larger for no visible gain.`,
      );
    }
  }
  {
    const withPlate = c.muscles.filter((m) => m.data.illustration).length;
    notes.push(`Anatomical plates: ${withPlate} of ${c.muscles.length} muscles illustrated`);
  }

  // 11. Source hygiene.
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

  return { problems, notes };
}
