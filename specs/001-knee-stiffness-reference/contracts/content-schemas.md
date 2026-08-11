# Contract: Content Authoring Schemas

**Feature**: `001-knee-stiffness-reference` | **Date**: 2026-08-11

This is the contract between **content authors** and **the application**. It is the primary
external interface of this project: the app has no API, and content is the thing other people
supply. A record conforming to this contract renders correctly; a record violating it **fails the
build** rather than shipping.

Authoritative definition lives in `src/content.config.ts` as Zod schemas. This document is the
human-readable form — where the two disagree, the Zod schema wins and this document is the bug.

## Guarantees this contract makes

1. **No unsourced claim ships.** Every claim-bearing record requires ≥1 resolvable `Source`.
2. **No unsafe exercise ships.** An exercise without `contraindications`, `stopIf`, and
   `evidenceLabel` fails the build. There is no "publish anyway" path.
3. **No dead cross-reference ships.** Every `reference()` resolves at build time or the build fails.
4. **No open-vocabulary drift.** `modality`, `goal`, `difficulty`, `equipment`, `region`, and
   `tier` are closed enums; `evidenceLabel` is a closed reference set.
5. **Adding content requires no code change.** Dropping a conforming file into the collection
   directory is sufficient (FR-035, SC-015).

---

## Collections

| Collection | Loader | Location | Format |
|---|---|---|---|
| `muscles` | `glob()` | `src/content/muscles/*.md` | Markdown + frontmatter |
| `exercises` | `glob()` | `src/content/exercises/*.md` | Markdown + frontmatter |
| `routines` | `glob()` | `src/content/routines/*.md` | Markdown + frontmatter |
| `stiffnessSources` | `glob()` | `src/content/stiffness-sources/*.md` | Markdown + frontmatter |
| `stiffnessPatterns` | `glob()` | `src/content/stiffness-patterns/*.md` | Markdown + frontmatter |
| `sources` | `file()` | `src/content/data/sources.yaml` | YAML list |
| `evidenceLabels` | `file()` | `src/content/data/evidence-labels.yaml` | YAML list |
| `redFlags` | `file()` | `src/content/data/red-flags.yaml` | YAML list |

Record IDs derive from filename for `glob()` collections and from the `id` field for `file()`
collections. **IDs are permanent once referenced** — renaming a file breaks references and fails
the build, which is the intended behaviour.

---

## Authoring example: exercise (clinical modality)

```markdown
---
name: Heel slide
modality: clinical-rom
targets: [quadriceps-rectus-femoris, hamstrings-semitendinosus, knee-joint-capsule]
goal: [mobility]
instructions:
  - Lie on the back with both legs extended.
  - Slide the heel of the affected leg toward the buttock, keeping the heel in contact with the surface.
  - Slide to the point of firm stretch, not pain, and hold briefly.
  - Slide the heel back to the starting position under control.
dosage: Commonly described in the range of 10–20 repetitions, two to three times daily, with holds of 5–10 seconds.
difficulty: beginner
progressions: [heel-slide-with-strap]
contraindications:
  - Recent knee surgery where a surgeon has restricted range of motion
  - Acute locked knee
stopIf:
  - Sharp pain rather than a stretch sensation
  - The knee catches or locks during the slide
  - Swelling increases during or after the movement
equipment: [none]
evidenceLabel: well-studied
sources: [aaos-knee-rehab-2019, jospt-rom-progression-2020]
---

The heel slide moves the knee through flexion with the leg supported, so the quadriceps does not
have to control the limb against gravity...
```

## Authoring example: exercise (traditional modality)

Non-clinical modalities carry three additional obligations — `traditionalName`, `tradition`, and
(for yoga/Pilates demanding range) `modifications`.

```markdown
---
name: Reclining hand-to-big-toe pose
traditionalName: Supta Padangusthasana
tradition: Hatha yoga
modality: yoga
targets: [hamstrings-biceps-femoris, hamstrings-semimembranosus, calf-gastrocnemius]
goal: [mobility]
instructions:
  - Lie on the back with both legs extended.
  - Loop a strap around the arch of one foot and raise that leg, keeping the knee softly bent.
  - Straighten the raised leg only as far as the hamstring allows without the pelvis rolling back.
  - Hold, breathing steadily, then lower under control.
dosage: Commonly held for 30–60 seconds per side in practice literature.
difficulty: beginner
progressions: [supta-padangusthasana-side-variation]
contraindications:
  - Acute hamstring strain
  - Sciatic symptoms reproduced by the position
stopIf:
  - Nerve-type symptoms — tingling, numbness, or shooting pain down the leg
  - Low back pain replaces the hamstring stretch sensation
equipment: [strap]
modifications:
  - Keep the raised knee bent throughout; a straight leg is not the goal of the movement.
  - Keep the lower leg bent with the foot flat if the low back lifts off the floor.
props:
  - A belt or towel substitutes for a yoga strap.
evidenceLabel: moderate-evidence
sources: [iyengar-light-on-yoga-1966, jospt-hamstring-flexibility-2018]
---

Mechanically this is a supine hamstring stretch with the pelvis stabilised by the floor...
```

Note the citation pattern: `iyengar-light-on-yoga-1966` carries `tier: practice-literature` and
supports *what the tradition holds and how the pose is performed*; the JOSPT reference carries
`tier: peer-reviewed` and supports the *mechanical* claim. Principle IV lives in that split.

---

## Field-level rules that fail the build

| Rule | Applies to | Requirement |
|---|---|---|
| Non-empty sources | all claim-bearing | `sources.length ≥ 1` |
| Safety completeness | `exercises` | `contraindications.length ≥ 1` **and** `stopIf.length ≥ 1` |
| Evidence vocabulary | `exercises` | `evidenceLabel` resolves to an `evidenceLabels` record |
| Tradition attribution | `exercises` | `modality ≠ clinical-rom` → `traditionalName` **and** `tradition` required |
| Modification guidance | `exercises` | `modality ∈ {yoga, pilates}` → `modifications.length ≥ 1` |
| Progression path | `exercises` | `regressions.length + progressions.length ≥ 1`; no self-reference |
| Targeting | `exercises` | `targets.length ≥ 1`, all resolving to `muscles` |
| Instructions | `exercises` | `instructions.length ≥ 2` |
| Proximal attribution | `muscles` | `region ∈ {hip, ankle}` → `presentsAsKneeStiffness` required |
| Stiffness triad | `muscles` | `isContractile` → all of `whenTight`/`whenWeak`/`whenInhibited` |
| Citation locatability | `sources` | at least one of `url`, `doi` |
| Non-colour encoding | `evidenceLabels` | `shapeToken` required |
| Step resolution | `routines` | `steps.length ≥ 1`, all exercise references resolve |

## Cross-collection rules (policy script, not Zod)

These are aggregate properties no per-record schema can express. `scripts/validate-content.ts`
asserts them and exits non-zero on failure.

| Rule | Source |
|---|---|
| Every muscle in FR-012/FR-013 is present | SC-005 |
| Every muscle is targeted by ≥1 exercise, or carries `noExercisesNote` | SC-005 |
| All four modalities present; none exceeds 60% of the library | SC-006 |
| All eight FR-004 red-flag signs present by ID | FR-004 |
| All six stiffness sources and four patterns present | FR-009, FR-011 |
| No orphaned sources (every `sources.yaml` entry is referenced) | hygiene |
| No reference cycles in regressions/progressions | data integrity |
| ≥3 routines including morning-mobility, desk-worker, strength | FR-026 |

## Versioning

Adding an optional field is backward-compatible. Adding a required field, removing a field, or
narrowing an enum breaks existing content and requires updating every affected record in the same
change — the build enforces this, since partial migration fails validation.

Changing the `evidenceLabels` vocabulary is a deliberate act with reader-facing consequences and
requires updating the definitions shown in the UI alongside it.
