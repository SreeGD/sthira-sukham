# Implementation Plan: Lower-Limb Chain — Hip and Ankle

**Branch**: `002-lower-limb-chain` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-lower-limb-chain/spec.md`

## Summary

Extend the reference from one joint to three, treating knee, hip and ankle as a connected chain.

The measured finding that shapes this plan: **this is a data-model change, not a new application.**
Every route, gate, diagram and component from feature 001 carries over. What is knee-shaped is a
single field — `presentsAsKneeStiffness`, present on 8 of 19 structures — plus the absence of any
joint reference on stiffness sources, patterns, red flags and goals. Replacing that one field with
`jointInfluences[]` is what turns a one-way argument ("your knee problem is a hip problem") into a
traversable, validated relationship in both directions.

New content follows: hip and ankle mechanics, 12 more stiffness sources, joint-specific patterns,
6 more structures, exercises for them, and joint-specific red flags. No new technology.

## Technical Context

**Language/Version**: unchanged — TypeScript on Node 22

**Primary Dependencies**: unchanged — Astro 7.2 static, Preact islands, Vitest, Playwright,
`@axe-core/playwright`

**Storage**: unchanged — filesystem content collections. One new collection (`joints`), four
existing collections gain a joint reference, one field replaced on `muscles`.

**Testing**: unchanged. The existing 404 e2e and 91 unit tests become the regression suite for
SC-111 (research D7).

**Target Platform**: unchanged

**Project Type**: unchanged — static content-driven site, single project, no backend

**Performance Goals**: unchanged. Content roughly doubles; nothing about the build or the routes
is sensitive to that at this scale.

**Constraints**: unchanged, and this is the point — every constitutional constraint applies to the
new material identically. No new gate infrastructure; three checks added to the existing policy
script.

**Scale/Scope**: 3 joints, 25 structures (from 19), 18 stiffness sources (from 6), ~9 patterns
(from 4), ~12 red flags (from 8), ~75 exercises (from 58). Roughly 30 routes added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this design satisfies it | Verified by |
|---|---|---|
| **I. Educational, Never Prescriptive** (NON-NEGOTIABLE) | Gate, framing and the no-symptom-input rule are untouched and now apply to new routes too. Red flags gain a `joints` field so a reader can tell which joint a sign concerns — more specific, not more prescriptive. `StiffnessPattern` still has no `symptoms` field, and the new joint reference gives it no path to acquire one. | Existing gate tests extended to new exercise routes; FR-122 asserted unchanged |
| **II. Every Claim Is Sourced** | Joint records require `sources`; every new structure, source, pattern and exercise inherits the existing requirement. Hip and ankle ROM thresholds need citations exactly as the knee's did. | Build fails on empty `sources`; policy gate |
| **III. Content Is Data, Not Markup** | Joints are a content collection, not an enum, precisely so their sourced claims stay reviewable (research D5). The chain itself becomes data — `jointInfluences[]` with an authored direction — rather than prose that mentions it. | SC-114: adding a structure for any joint touches only `src/content/` |
| **IV. Modality Honesty** | Unchanged. New exercises carry the same required attribution and evidence labelling; the modality ceiling still applies across the expanded library (SC-107). | Build fails on missing attribution; policy gate |
| **V. Local-First, Zero Backend** | Unchanged. No new assets fetched; new anatomy plates, if any, follow the bundled-and-attributed pattern already established. | `check:isolation` over `dist/` |
| **VI. Usable Mid-Exercise** | New routes inherit the layouts, tokens and diagram components. The leg locator keeps working because `region` is deliberately left alone (research D1). | axe in both themes on new routes; 360px check |

**Initial gate: PASS.** No violations.

**Post-Phase-1 re-check: PASS.** The design adds no dependency and no principle tension. Two
decisions strengthen compliance beyond the minimum:

- **D2** deletes the old field rather than supplementing it, so the same relationship cannot be
  recorded in two places — the failure Principle III exists to prevent. Required-ness makes a
  partial migration fail the build.
- **D3** forbids inferring `indirect` from anatomy the records do not hold, because a derived
  relationship would be a claim no author made, in a project whose second principle is that every
  claim is sourced.

One risk is named rather than designed away: **the regression suite is the only thing standing
between this migration and silent damage to the knee content.** Research D7 forbids relaxing an
assertion to make it pass; framing changes that legitimately break knee-specific tests are updated
with the reason stated in the task that does it.

## Project Structure

### Documentation (this feature)

```text
specs/002-lower-limb-chain/
├── plan.md                     # This file
├── spec.md                     # 25 requirements, 14 success criteria
├── research.md                 # 7 decisions, with the measured starting point
├── data-model.md               # 1 new entity, 1 replaced field, 4 gaining references
├── quickstart.md               # What this feature adds to the 001 validation guide
├── contracts/
│   └── joint-model.md          # Chain authoring contract
├── checklists/
│   └── requirements.md         # Passing
└── tasks.md                    # Created by /speckit-tasks
```

### Source Code — changes only

```text
src/
├── content.config.ts           # + joints collection; muscles field replaced; 4 joint refs
├── content/
│   ├── joints/                 # NEW — 3 records
│   ├── muscles/                # 19 migrated + 6 added
│   ├── stiffness-sources/      # 6 → 18 (per joint)
│   ├── stiffness-patterns/     # 4 → ~9 (joint-specific)
│   ├── exercises/              # + ~17 for the new structures
│   ├── functional-goals/       # + dependsOnJoints
│   └── data/red-flags.yaml     # + joints field, + joint-specific signs
├── lib/
│   └── chain.ts                # NEW — invert structure→joint into joint→structures
├── components/diagrams/
│   └── MuscleActionMap.astro   # generalised: renders for a given joint
├── pages/
│   ├── joints/[id].astro       # NEW — joint mechanics, sources, patterns, structures
│   ├── understanding/          # reframed around three joints
│   └── muscles/[id].astro      # renders jointInfluences instead of one knee statement
└── scripts/content-policy.ts   # + 3 chain checks
```

**Structure Decision**: No new top-level structure. The `joints/` route directory and `chain.ts`
are the only additions; everything else is a modification to something that already exists. That
is the strongest evidence that feature 001's content-as-data design was right — a second joint
costs content and one derived index, not an architecture.

`chain.ts` mirrors `cross-links.ts`: it inverts the structure→joint relation so a joint page can
list its structures without that fact being stored twice (data-model, and feature 001's rule that
derived edges are never duplicated).

## Implementation Sequencing

| Order | Scope | Stories | Rationale |
|---|---|---|---|
| 1 | Joints collection, schema changes, migrate 19 structures, policy gates | — | Nothing else can be authored until the model holds. Migration is all-or-nothing |
| 2 | Hip mechanics, sources, patterns; reframe navigation | US1 | First joint through the new model proves it |
| 3 | Ankle mechanics, sources, patterns | US2 | Second joint costs only content if step 2 was right |
| 4 | Joint pages, chain rendering both directions | US3 | The feature's actual point |
| 5 | **Hip and ankle red flags** | US5 | **Must land before step 6** — Principle I, same rule as feature 001 |
| 6 | 6 new structures + exercises for them | US4 | The payload |

Steps 1–4 are shippable: a three-joint reference with the existing exercise library. Step 5 gates
step 6 exactly as feature 001's red-flag work gated its exercise content.

## Complexity Tracking

No constitutional violations. No new dependencies. The one structural addition (`chain.ts`) exists
to avoid storing a derived relationship twice, which is a constitutional requirement rather than
added complexity.
