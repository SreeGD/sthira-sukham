import { defineCollection, z, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIAGRAM_ZONES } from './lib/diagram-zones.ts';

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
      presentsAsKneeStiffness: z.string().optional(),
      plainLanguageGloss: z.string().min(1),
      noExercisesNote: z.string().optional(),
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
      // FR-016: the whole point of cataloguing hip and ankle structures is the
      // referred story. Omitting it makes the entry pointless, so it cannot be omitted.
      if ((m.region === 'hip' || m.region === 'ankle') && !m.presentsAsKneeStiffness) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['presentsAsKneeStiffness'],
          message:
            'Hip and ankle structures must explain how restriction there presents as knee stiffness (FR-016).',
        });
      }
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
      targets: z.array(reference('muscles')).min(1),
      goal: z.array(z.enum(GOALS)).min(1),
      instructions: z.array(z.string().min(1)).min(2),
      dosage: z.string().min(1),
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
    sources: z.array(reference('sources')).default([]),
  }),
});

// ---------------------------------------------------------------------------
// stiffnessSources — FR-009
// ---------------------------------------------------------------------------

const stiffnessSources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stiffness-sources' }),
  schema: z.object({
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
    name: z.string().min(1),
    order: z.number().int().default(100),
    typicallyInvolves: z.array(reference('muscles')).default([]),
    relatedSources: z.array(reference('stiffnessSources')).default([]),
    sources: z.array(reference('sources')).min(1),
  }),
});

export const collections = {
  sources,
  evidenceLabels,
  redFlags,
  muscles,
  exercises,
  routines,
  stiffnessSources,
  stiffnessPatterns,
};
