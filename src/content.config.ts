import { defineCollection, z, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIAGRAM_ZONES } from './lib/diagram-zones.ts';
import { START_POSITIONS } from './lib/positions.ts';

/**
 * The validation gate (Constitution Principles II, III, IV).
 *
 * WHAT ASTRO ENFORCES: schema shape. A record missing a required field fails
 * `astro build` with exit 1. Verified empirically — see specs/.../research.md D10.
 *
 * WHAT ASTRO DOES NOT ENFORCE: reference existence. `reference()` validates that a
 * value is a well-formed id, NOT that the target exists; resolution is lazy, so a
 * dangling reference builds cleanly. Referential integrity (FR-036 / SC-004) is
 * therefore enforced by `scripts/validate-content.ts`, which is a required gate in
 * `pnpm verify`. Do not assume `reference()` covers it.
 */

// ---------------------------------------------------------------------------
// Shared vocabularies. Closed sets — Principle IV depends on these not drifting open.
// ---------------------------------------------------------------------------

export const MODALITIES = ['clinical-rom', 'yoga', 'pilates', 'taichi-qigong'] as const;
export const GOALS = ['mobility', 'strength', 'motor-control'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const REGIONS = ['knee', 'hip', 'ankle'] as const;
export const SOURCE_TIERS = [
  'clinical-body',
  'peer-reviewed',
  'anatomy-text',
  'practice-literature',
] as const;
export const EQUIPMENT = [
  'none',
  'wall',
  'chair',
  'towel',
  'cushion',
  'strap',
  'resistance-band',
  'stationary-bike',
  'reformer',
] as const;

/** Modalities that carry a living tradition and therefore owe attribution (Principle IV). */
export const TRADITIONAL_MODALITIES = ['yoga', 'pilates', 'taichi-qigong'] as const;
/** Modalities whose movements commonly demand range a stiff knee may lack (FR-025). */
export const MODIFICATION_REQUIRED_MODALITIES = ['yoga', 'pilates'] as const;

// ---------------------------------------------------------------------------
// sources — split across per-domain YAML files so parallel content authoring never
// contends on one file. Merged here into a single logical collection.
// ---------------------------------------------------------------------------

const SOURCES_DIR = './src/content/data/sources';

const sourceSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1),
    authorOrBody: z.string().min(1),
    year: z.number().int(),
    url: z.string().url().optional(),
    doi: z.string().optional(),
    // Reference texts have neither a DOI nor a stable URL; an ISBN is the locator
    // that actually finds them in a library or a shop.
    isbn: z.string().optional(),
    edition: z.string().optional(),
    tier: z.enum(SOURCE_TIERS),
  })
  // FR-033: a citation nobody can locate is not a citation.
  .refine((s) => Boolean(s.url ?? s.doi ?? s.isbn), {
    message: 'Source must carry a url, doi, or isbn so a reader can locate it (FR-033).',
    path: ['url'],
  });

const sources = defineCollection({
  loader: {
    name: 'sources-multifile',
    load: async ({ store, parseData, logger }) => {
      store.clear();
      const files = readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.yaml')).sort();
      const seen = new Map<string, string>();
      for (const fileName of files) {
        const raw = readFileSync(join(SOURCES_DIR, fileName), 'utf-8');
        const entries = (parseYaml(raw) ?? []) as Array<Record<string, unknown>>;
        for (const entry of entries) {
          const id = String(entry.id);
          const previous = seen.get(id);
          if (previous) {
            // Global uniqueness across the split files, per data-model.md.
            throw new Error(
              `Duplicate source id "${id}" in ${fileName} — already defined in ${previous}.`,
            );
          }
          seen.set(id, fileName);
          const data = await parseData({ id, data: entry });
          store.set({ id, data });
        }
      }
      logger.info(`Loaded ${seen.size} sources from ${files.length} file(s)`);
    },
  },
  schema: sourceSchema,
});

// ---------------------------------------------------------------------------
// evidenceLabels — the closed vocabulary behind Principle IV (FR-037)
// ---------------------------------------------------------------------------

const evidenceLabels = defineCollection({
  loader: file('./src/content/data/evidence-labels.yaml'),
  schema: z.object({
    id: z.string(),
    label: z.string().min(1),
    definition: z.string().min(1),
    rank: z.number().int(),
    // SC-011: evidence strength must survive greyscale. A label without a non-colour
    // carrier cannot exist.
    shapeToken: z.string().min(1),
  }),
});

// ---------------------------------------------------------------------------
// redFlags — FR-004
// ---------------------------------------------------------------------------

const redFlags = defineCollection({
  loader: file('./src/content/data/red-flags.yaml'),
  schema: z.object({
    id: z.string(),
    sign: z.string().min(1),
    description: z.string().min(1),
    // Loaders do not promise authored order, so ordering is explicit. The sequence
    // is deliberate: the signs that most clearly mean "stop now" come first.
    order: z.number().int().default(100),
    /** Which joints this sign concerns (FR-120). */
    joints: z.array(reference('joints')).min(1),
    sources: z.array(reference('sources')).min(1),
  }),
});

// ---------------------------------------------------------------------------
// muscles — FR-012 to FR-017
// ---------------------------------------------------------------------------

const muscles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/muscles' }),
  schema: z
    .object({
      anatomicalName: z.string().min(1),
      commonName: z.string().min(1),
      abbreviations: z.array(z.string()).default([]),
      region: z.enum(REGIONS),
      group: z.string().optional(),
      isContractile: z.boolean(),
      diagramZone: z.enum(DIAGRAM_ZONES),
      order: z.number().int().default(100),
      roleInKneeMotion: z.string().min(1),
      stiffnessContribution: z.object({
        whenTight: z.string().min(1),
        whenWeak: z.string().optional(),
        whenInhibited: z.string().optional(),
      }),
      /*
       * What this structure influences, and how. Replaces presentsAsKneeStiffness,
       * which was one-way by construction — it could not say what gastrocnemius does
       * at the ankle AND at the knee.
       *
       * Required, so a half-migrated record fails the build rather than rendering
       * without its chain (FR-125). `action` is authored, never inferred: gluteus
       * medius influences the knee without crossing it, and deriving that would need
       * attachment data these records do not hold (research D3).
       */
      jointInfluences: z
        .array(
          z.object({
            joint: reference('joints'),
            action: z.enum(['direct', 'indirect']),
            presentsAs: z.string().min(1),
          }),
        )
        .min(1),
      plainLanguageGloss: z.string().min(1),
      noExercisesNote: z.string().optional(),
      /*
       * Historical anatomical plate, bundled locally.
       *
       * Constitution Content Standards: illustration must be originally authored or
       * carry a licence permitting redistribution, RECORDED IN THE RECORD. So every
       * provenance field is required — an image whose licence lives only in a commit
       * message or someone's memory is indistinguishable from one taken without
       * permission. `credit` and `licence` are rendered to the reader, not just stored.
       */
      illustration: z
        .object({
          file: z.string().min(1),
          alt: z.string().min(1),
          caption: z.string().min(1),
          credit: z.string().min(1),
          year: z.number().int(),
          licence: z.string().min(1),
          sourceUrl: z.string().url(),
        })
        .optional(),
      sources: z.array(reference('sources')).min(1),
    })
    .superRefine((m, ctx) => {
      // FR-014: for a muscle, all three states are meaningful and all three are owed.
      // For a capsule or a band, "weak" and "inhibited" are category errors.
      if (m.isContractile) {
        if (!m.stiffnessContribution.whenWeak) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['stiffnessContribution', 'whenWeak'],
            message: 'Contractile structures must describe the whenWeak state (FR-014).',
          });
        }
        if (!m.stiffnessContribution.whenInhibited) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['stiffnessContribution', 'whenInhibited'],
            message: 'Contractile structures must describe the whenInhibited state (FR-014).',
          });
        }
      }
      /*
       * The old FR-016 rule required presentsAsKneeStiffness on hip and ankle
       * structures. It is superseded: jointInfluences is required on EVERY structure,
       * which is strictly stronger — it obliges a knee structure to state its reach
       * too, and it can express influence at more than one joint (feature 002, FR-108).
       */
    }),
});

// ---------------------------------------------------------------------------
// exercises — FR-018 to FR-025. The safety-critical collection.
// ---------------------------------------------------------------------------

const exercises = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/exercises' }),
  schema: z
    .object({
      name: z.string().min(1),
      traditionalName: z.string().optional(),
      tradition: z.string().optional(),
      modality: z.enum(MODALITIES),
      // Closed vocabulary so the position diagram can render every exercise (FR-020).
      startPosition: z.enum(START_POSITIONS),
      /*
       * Whether the movement is done one side at a time. Explicit rather than inferred
       * from the prose, because the audit that prompted this found six unilateral
       * exercises that never told the reader to change sides — a defect no amount of
       * careful writing prevents, but a gate does. See scripts/content-policy.ts.
       */
      laterality: z.enum(['unilateral', 'bilateral']),
      targets: z.array(reference('muscles')).min(1),
      goal: z.array(z.enum(GOALS)).min(1),
      /*
       * Two levels, deliberately. `quickSteps` is what a reader follows while actually
       * doing the movement — short imperatives, readable at arm's length on a phone.
       * `instructions` carries the detail they read once beforehand. A single level
       * cannot serve both: detailed enough to be correct is too long to follow on a mat.
       */
      quickSteps: z.array(z.string().min(1).max(80)).min(2).max(5),
      /*
       * Labelled steps rather than a bare list. The label names what the step is FOR
       * ("Find your limit"), which is what makes a numbered instruction scannable when
       * you are part-way through it and looking back to check where you were.
       */
      instructions: z
        .array(z.object({ label: z.string().min(1), detail: z.string().min(1) }))
        .min(2),
      /** The single thing that decides whether the movement does anything. */
      keyPoint: z.string().min(1),
      /** Where it should be felt — the answer to "am I doing this right?". */
      feelItIn: z.string().min(1),
      /** The characteristic fault. Every exercise has one; naming it prevents it. */
      commonMistake: z.string().min(1),
      /*
       * Structured rather than prose. "10 reps, 1-3 sets, 2-3 times a day" is four
       * separate facts, and a reader checking one of them should not have to parse a
       * sentence to find it. `note` carries anything that does not fit the grid.
       */
      dosage: z.object({
        reps: z.string().min(1),
        sets: z.string().min(1),
        frequency: z.string().min(1),
        hold: z.string().optional(),
        note: z.string().optional(),
      }),
      difficulty: z.enum(DIFFICULTIES),
      regressions: z.array(reference('exercises')).default([]),
      progressions: z.array(reference('exercises')).default([]),
      // FR-006 / Principle I: these two are why an exercise is allowed to exist.
      contraindications: z.array(z.string().min(1)).min(1),
      stopIf: z.array(z.string().min(1)).min(1),
      equipment: z.array(z.enum(EQUIPMENT)).min(1),
      evidenceLabel: reference('evidenceLabels'),
      modifications: z.array(z.string().min(1)).default([]),
      props: z.array(z.string().min(1)).default([]),
      sources: z.array(reference('sources')).min(1),
    })
    .superRefine((e, ctx) => {
      const isTraditional = (TRADITIONAL_MODALITIES as readonly string[]).includes(e.modality);
      // FR-023: a movement borrowed from a tradition is named and attributed, or not used.
      if (isTraditional) {
        if (!e.traditionalName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['traditionalName'],
            message: `Modality "${e.modality}" requires traditionalName (FR-023, Principle IV).`,
          });
        }
        if (!e.tradition) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tradition'],
            message: `Modality "${e.modality}" requires tradition attribution (FR-023, Principle IV).`,
          });
        }
      }
      // FR-025: yoga and Pilates routinely assume range a stiff knee lacks. Shipping
      // one of those without a modification is shipping an exercise most readers cannot do.
      if (
        (MODIFICATION_REQUIRED_MODALITIES as readonly string[]).includes(e.modality) &&
        e.modifications.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modifications'],
          message: `Modality "${e.modality}" requires at least one modification for restricted knee range (FR-025).`,
        });
      }
      // FR-020: every exercise sits somewhere on a ladder; a rung with no neighbours
      // gives the reader nowhere to go when it is too hard or too easy.
      if (e.regressions.length + e.progressions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['progressions'],
          message: 'Each exercise needs at least one regression or progression (FR-020).',
        });
      }
    }),
});

// ---------------------------------------------------------------------------
// joints — knee, hip, ankle as first-class subjects (FR-101)
//
// A collection rather than a z.enum because every joint carries sourced claims:
// mechanics prose and functional range thresholds. Principle II requires those to
// live in reviewable content, not in TypeScript. References to joints are still
// validated, via reference('joints').
// ---------------------------------------------------------------------------

const joints = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/joints' }),
  schema: z.object({
    name: z.string().min(1),
    plainDescription: z.string().min(1),
    order: z.number().int().default(100),
    /** Degrees an everyday activity needs. Two minimum, each tied to a named activity. */
    romThresholds: z
      .array(
        z.object({
          activity: z.string().min(1),
          degrees: z.string().min(1),
          note: z.string().optional(),
        }),
      )
      .min(2),
    sources: z.array(reference('sources')).min(1),
  }),
});

// ---------------------------------------------------------------------------
// functionalGoals — "what do you want to be able to do again?"
//
// Principle I boundary, stated here because it is the whole reason this collection
// is shaped the way it is. These records describe ACTIVITIES and what they require
// of a knee. They deliberately carry no symptom field, no cause field, and nothing
// that could be matched against a description of a reader's pain.
//
// Goal -> movement requirement -> relevant exercises is a filter.
// Symptom -> likely cause -> protocol is a diagnosis, and is forbidden (FR-005).
// The difference is not cosmetic: getting a filter wrong wastes someone's time,
// getting a diagnosis wrong sends an injured knee into the wrong exercise.
// ---------------------------------------------------------------------------

const functionalGoals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/functional-goals' }),
  schema: z.object({
    /** The activity, phrased as the reader would say it. */
    title: z.string().min(1),
    shortLabel: z.string().min(1),
    order: z.number().int().default(100),
    /** What this activity asks of a knee. */
    needs: z.string().min(1),
    /** Degrees of flexion the activity requires, where research gives a figure. */
    romNote: z.string().optional(),
    targets: z.array(reference('muscles')).min(1),
    /** Which joints this activity depends on (FR-118). */
    dependsOnJoints: z.array(reference('joints')).min(1),
    emphasis: z.array(z.enum(GOALS)).min(1),
    sources: z.array(reference('sources')).min(1),
  }),
});

// ---------------------------------------------------------------------------
// routines — FR-026 to FR-029
// ---------------------------------------------------------------------------

const routines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/routines' }),
  schema: z.object({
    title: z.string().min(1),
    purpose: z.string().min(1),
    approxDurationMinutes: z.number().int().positive(),
    equipment: z.array(z.enum(EQUIPMENT)).min(1),
    order: z.number().int().default(100),
    steps: z
      .array(
        z.object({
          exercise: reference('exercises'),
          note: z.string().optional(),
        }),
      )
      .min(1),
    orderRationale: z.string().min(1),
    /** Set when this routine belongs to a functional goal, so each links to the other. */
    goal: reference('functionalGoals').optional(),
    /**
     * How to spread the session across a week. Present because "30 minutes weekly" is a
     * schedule, and a schedule is a different fact from a sequence.
     */
    weeklyPlan: z.string().optional(),
    sources: z.array(reference('sources')).default([]),
  }),
});

// ---------------------------------------------------------------------------
// stiffnessSources — FR-009
// ---------------------------------------------------------------------------

const stiffnessSources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stiffness-sources' }),
  schema: z.object({
    joint: reference('joints'),
    clinicalTerm: z.string().min(1),
    plainLanguageGloss: z.string().min(1),
    order: z.number().int().default(100),
    relatedStructures: z.array(reference('muscles')).default([]),
    sources: z.array(reference('sources')).min(1),
  }),
});

// ---------------------------------------------------------------------------
// stiffnessPatterns — FR-011
//
// Deliberately has NO `symptoms` field. A structured symptom list is exactly what a
// symptom checker consumes, and Principle I forbids that feature. Its absence is a
// structural guard, not an oversight. Do not add one.
// ---------------------------------------------------------------------------

const stiffnessPatterns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stiffness-patterns' }),
  schema: z.object({
    joint: reference('joints'),
    name: z.string().min(1),
    order: z.number().int().default(100),
    typicallyInvolves: z.array(reference('muscles')).default([]),
    relatedSources: z.array(reference('stiffnessSources')).default([]),
    sources: z.array(reference('sources')).min(1),
  }),
});

export const collections = {
  sources,
  joints,
  functionalGoals,
  evidenceLabels,
  redFlags,
  muscles,
  exercises,
  routines,
  stiffnessSources,
  stiffnessPatterns,
};
