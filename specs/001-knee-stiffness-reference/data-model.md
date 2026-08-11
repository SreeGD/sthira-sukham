# Phase 1 Data Model: Knee Stiffness Educational Reference

**Date**: 2026-08-11 | **Feature**: `001-knee-stiffness-reference`

Eight entities across seven collections. Every entity that makes a claim references `Source`;
every exercise references `Muscle` and `EvidenceLabel`. All references are by stable string ID and
are validated at build time via Astro's `reference()` — an unresolved reference fails the build
(FR-036, SC-004).

## Entity relationship overview

```text
                        ┌──────────────┐
                        │    Source    │◄──────────── referenced by every
                        │  (data/yaml) │              claim-bearing entity
                        └──────────────┘
                               ▲
      ┌────────────────────────┼────────────────────────┐
      │                        │                        │
┌───────────┐  targets   ┌──────────┐   steps   ┌──────────────┐
│  Muscle   │◄───────────│ Exercise │◄──────────│   Routine    │
│           │───────────►│          │           │              │
└───────────┘  (derived) └──────────┘           └──────────────┘
      ▲                    │      │
      │ involves           │      │ regressions/progressions
      │                    │      └──► Exercise (self-reference)
┌──────────────────┐       │
│ StiffnessSource  │       ▼
│ StiffnessPattern │  ┌───────────────┐      ┌─────────────┐
└──────────────────┘  │ EvidenceLabel │      │ RedFlagItem │
                      │  (data/yaml)  │      │ (data/yaml) │
                      └───────────────┘      └─────────────┘
```

Note the `Muscle ◄─── Exercise` edge is **derived, not stored**. Exercises declare the muscles they
target; a muscle's exercise list is computed at build time by inverting that relation. Storing it
on both sides would create two places for the same fact to be wrong.

---

## 1. Muscle

**Collection**: `muscles` · Markdown + frontmatter, one file per structure · **~19 records**

Covers both contractile muscles and non-contractile restrictors (FR-012, FR-013). The
`isContractile` flag is what lets the joint capsule, retinaculum, and IT band live in the same
collection while still being clearly distinguished in the UI.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | Stable; file-derived. Never renamed once referenced. |
| `anatomicalName` | string | ✔ | Canonical term, e.g. "Vastus medialis obliquus" (FR-015) |
| `commonName` | string | ✔ | Plain-language, e.g. "inner thigh quad" |
| `abbreviations` | string[] | | e.g. `["VMO"]` — searchable (FR-030) |
| `region` | enum | ✔ | `knee` \| `hip` \| `ankle` |
| `group` | string | | e.g. "quadriceps", "hamstrings" — for catalogue grouping |
| `isContractile` | boolean | ✔ | `false` for capsule, retinaculum, IT band (FR-013) |
| `roleInKneeMotion` | string | ✔ | What it does at the knee (FR-014) |
| `stiffnessContribution` | object | ✔ | `{ whenTight, whenWeak, whenInhibited }` — all three required for contractile structures (FR-014) |
| `presentsAsKneeStiffness` | string | cond | **Required when `region` is `hip` or `ankle`** — how restriction there presents as knee stiffness (FR-016) |
| `plainLanguageGloss` | string | ✔ | Sits alongside, never replaces, the anatomical term (FR-015) |
| `sources` | ref[] → Source | ✔ | ≥1 (FR-033) |
| *body* | Markdown | ✔ | Narrative description |

**Validation**
- `sources` non-empty.
- `stiffnessContribution` requires all three sub-fields when `isContractile` is true; non-contractile
  structures supply `whenTight` only (the others are meaningless for a ligament or capsule).
- `presentsAsKneeStiffness` required for hip/ankle region — enforces FR-016 structurally rather
  than by authorial memory.
- Every record must be targeted by ≥1 exercise, or carry `noExercisesNote` explaining why not
  (SC-005). Checked by policy script, not schema — it is a cross-collection property.

---

## 2. Exercise

**Collection**: `exercises` · Markdown + frontmatter, one file per movement · **~40–60 records**

The safety-critical entity. Four of its fields (`contraindications`, `stopIf`, `evidenceLabel`,
`sources`) are the ones whose absence must fail the build (FR-006, FR-038).

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | Stable |
| `name` | string | ✔ | English/descriptive name |
| `traditionalName` | string | cond | **Required when `modality` ≠ `clinical-rom`** (FR-023) |
| `tradition` | string | cond | Required with `traditionalName` — e.g. "Hatha yoga", "Yang-style tai chi" |
| `modality` | enum | ✔ | `clinical-rom` \| `yoga` \| `pilates` \| `taichi-qigong` — exactly one (FR-018) |
| `targets` | ref[] → Muscle | ✔ | ≥1; build-validated (FR-020, FR-036) |
| `goal` | enum[] | ✔ | ≥1 of `mobility` \| `strength` \| `motor-control` |
| `instructions` | string[] | ✔ | Ordered steps, ≥2 (FR-020) |
| `dosage` | string | ✔ | General ranges only, never second-person instruction (Principle I) |
| `difficulty` | enum | ✔ | `beginner` \| `intermediate` \| `advanced` |
| `regressions` | ref[] → Exercise | cond | **≥1 across `regressions` + `progressions`** (FR-020) |
| `progressions` | ref[] → Exercise | cond | Self-referencing; must not reference self |
| `contraindications` | string[] | ✔ | **Non-empty** (FR-006) |
| `stopIf` | string[] | ✔ | **Non-empty** (FR-006) |
| `equipment` | enum[] | ✔ | From closed set; `[]` means none — filterable (FR-021) |
| `evidenceLabel` | ref → EvidenceLabel | ✔ | Closed vocabulary (FR-037) |
| `modifications` | string[] | cond | **Required for `yoga`/`pilates`** where the movement demands range a stiff knee may lack (FR-025) |
| `props` | string[] | | Prop options accompanying modifications |
| `sources` | ref[] → Source | ✔ | ≥1 (FR-033) |
| *body* | Markdown | ✔ | Plain-language mechanics — what the body is actually doing (FR-023) |

**Equipment closed set**: `none`, `wall`, `chair`, `towel`, `cushion`, `strap`, `resistance-band`,
`stationary-bike`, `reformer`. Only the last two fall outside household props, and both appear only
as optional variations (per spec Assumptions).

**Validation**
- All four safety fields present and non-empty → otherwise **build fails** (FR-038).
- `traditionalName` + `tradition` required for non-clinical modalities (FR-023).
- `regressions ∪ progressions` non-empty; no self-reference; no reference cycles.
- Modality distribution across the collection: none exceeds 60% (SC-006). Policy script.
- All four modalities present (SC-006). Policy script.

**Principle IV constraint, enforced at review not by schema**: the Markdown body describes
mechanics. Where the record conveys a traditional claim, it must be attributed ("in its tradition,
held to…") and must not appear as asserted physiology. Reviewable because body prose is diffable;
the `tier` on the cited source makes a practice-literature citation behind a mechanistic claim
visible.

---

## 3. Routine

**Collection**: `routines` · Markdown + frontmatter · **≥3 records** (FR-026)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | |
| `title` | string | ✔ | e.g. "Ten-minute morning mobility" |
| `purpose` | string | ✔ | (FR-027) |
| `approxDurationMinutes` | number | ✔ | (FR-027) |
| `equipment` | enum[] | ✔ | Union of steps' equipment; validated as consistent |
| `steps` | object[] | ✔ | Ordered; each `{ exercise: ref → Exercise, note?: string }` (FR-028) |
| `orderRationale` | string | ✔ | Why this order (FR-027) |
| `sources` | ref[] → Source | | Optional — a routine is a curation, not a claim |
| *body* | Markdown | ✔ | Framing as one general example (FR-029) |

**Validation**: `steps` non-empty, every referenced exercise resolves, declared `equipment` is a
superset of what the steps actually require.

---

## 4. StiffnessSource

**Collection**: `stiffness-sources` · Markdown + frontmatter · **6 records, fixed** (FR-009)

Capsular restriction, effusion, muscle guarding, adhesion/scar, arthritic change, disuse shortening.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | |
| `clinicalTerm` | string | ✔ | (FR-009) |
| `plainLanguageGloss` | string | ✔ | (FR-009) |
| `relatedStructures` | ref[] → Muscle | | Structures typically involved |
| `sources` | ref[] → Source | ✔ | ≥1 |
| *body* | Markdown | ✔ | Description |

---

## 5. StiffnessPattern

**Collection**: `stiffness-patterns` · Markdown + frontmatter · **4 records, fixed** (FR-011)

Osteoarthritic, patellofemoral, post-injury/post-surgical, sedentary/disuse.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | |
| `name` | string | ✔ | |
| `typicallyInvolves` | ref[] → Muscle | | |
| `relatedSources` | ref[] → StiffnessSource | | Which physical sources tend to underlie it |
| `sources` | ref[] → Source | ✔ | ≥1 |
| *body* | Markdown | ✔ | **General description only.** Must not invite the reader to self-sort (FR-007). |

**Principle I constraint**: no field on this entity may be structured for matching against reader
input. Deliberately there is no `symptoms` array — such a field is exactly what a symptom checker
would consume, and its absence is a structural guard, not an oversight.

---

## 6. Source

**Collection**: `sources` · YAML files under `src/content/data/sources/`, one per domain
(`clinical.yaml`, `anatomy.yaml`, `practice-literature.yaml`) · **flat list, merged at load**

> Split by domain rather than held in one file so that parallel content-authoring work never
> contends on a single file. A single `sources.yaml` would serialize every authoring task behind
> one write. IDs remain globally unique across all files; the policy script enforces this.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✔ | e.g. `aaos-knee-oa-2021` |
| `title` | string | ✔ | (FR-033) |
| `authorOrBody` | string | ✔ | Author or issuing body (FR-033) |
| `year` | number | ✔ | (FR-033) |
| `url` | url | cond | Required unless `doi` present (FR-033) |
| `doi` | string | cond | |
| `tier` | enum | ✔ | `clinical-body` \| `peer-reviewed` \| `anatomy-text` \| `practice-literature` |

**Validation**: at least one of `url`/`doi`. `tier` drives how the citation is presented and makes
Principle IV's practice-literature distinction machine-visible.

---

## 7. EvidenceLabel

**Collection**: `evidence-labels` · single YAML file · **3–4 records, closed vocabulary** (FR-037)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✔ | The only permitted `Exercise.evidenceLabel` values |
| `label` | string | ✔ | Reader-facing, e.g. "Well studied" |
| `definition` | string | ✔ | Shown to the reader (FR-037) |
| `rank` | number | ✔ | Ordering, strongest → weakest |
| `shapeToken` | string | ✔ | Non-colour visual carrier — icon/pattern identifier (FR-022, SC-011) |

`shapeToken` exists specifically so that evidence strength is never conveyed by colour alone. It is
a required field so that adding a label without a non-colour representation is impossible.

---

## 8. RedFlagItem

**Collection**: `red-flags` · single YAML file · **≥8 records** (FR-004)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✔ | |
| `sign` | string | ✔ | e.g. "Joint locking" |
| `description` | string | ✔ | Plain-language |
| `sources` | ref[] → Source | ✔ | ≥1 |

**Validation**: must cover all eight signs named in FR-004 — locking, giving way, inability to bear
weight, hot/swollen joint, fever, sudden severe pain, night pain, pain after trauma. The policy
script asserts each required `id` is present, so a deletion breaks the build.

---

## Client-side state

Two values only, both device-local, neither describing the reader (SC-013, FR-041):

| Key | Values | Purpose |
|---|---|---|
| `fixknee:red-flags-ack` | `"1"` \| absent | Acknowledgement flag (FR-001, FR-002) |
| `fixknee:theme` | `"light"` \| `"dark"` \| absent | Theme preference (FR-045) |

Absent is the safe default in both cases: no ack → gate shows; no theme → follow system.

## Derived build-time artifacts

Computed during build, not authored:

- **Muscle → exercises inverted index** — powers FR-017's per-muscle exercise list.
- **Search index** — `{ id, kind, names[], url }` per muscle and exercise, embedded in the search
  island (D4).
- **Filter facets** — distinct values per filter dimension with counts, so the library UI never
  offers a filter combination that cannot match (edge case: empty result).
