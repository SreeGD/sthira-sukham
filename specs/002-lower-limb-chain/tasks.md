---

description: "Task list for the lower-limb chain expansion"
---

# Tasks: Lower-Limb Chain — Hip and Ankle

**Input**: Design documents from `/specs/002-lower-limb-chain/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **Included and mandatory** — the constitution's Quality Gates require them, and the
existing 404 e2e / 91 unit tests are this feature's regression suite (SC-111).

**Organization**: Grouped by user story. One constitutional override to priority order is called
out in Phase 6, matching the rule feature 001 followed.

## Status — 2026-08-12

**55 of 58 complete.** `pnpm verify` green: 164 pages, 480 e2e, 103 unit, content policy,
isolation and lint all passing, plus `pnpm smoke:dev` across 163 dev routes.

Three remain, all additive rather than blocking:

- **T229** — the muscle action map still renders the knee's regions on every joint page rather
  than that joint's. The joint pages list their structures correctly in text; only the diagram
  is not yet per-joint.
- **T251** — no anatomy plates for the six new structures (19 of 25 illustrated). Wikimedia rate
  limiting made the last batch slow; the provenance machinery is in place and unchanged.
- **T253, T255, T257** — the responsive/extensibility/manual passes from Phase 7.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US5
- Exact file paths in every description

## The one rule that governs this whole feature

**Migration is all-or-nothing.** `jointInfluences` is required, so a half-migrated content set
fails the build. Do not add a fallback that reads the old field, and do not relax a test to make
a migration step pass — research D7 exists because that is the cheapest way to damage the knee
content invisibly.

---

## Phase 1: Model foundation (Blocking)

**Purpose**: The schema and the migration. Nothing can be authored until this holds.

**⚠️ CRITICAL**: No content work can begin until this phase is complete.

- [X] T201 Define the `joints` collection in `src/content.config.ts` requiring `name`, `plainDescription`, `romThresholds` (≥2, each with activity and degrees), and non-empty `sources`
- [X] T202 Author the three joint records in `src/content/joints/` (knee, hip, ankle) with mechanics bodies and sourced ROM thresholds
- [X] T203 Replace `presentsAsKneeStiffness` with required `jointInfluences[]` in the `muscles` schema in `src/content.config.ts`, each entry requiring `joint`, `action` (`direct`/`indirect`) and non-empty `presentsAs`
- [X] T204 Migrate all 19 records in `src/content/muscles/` to `jointInfluences`, converting the 8 existing knee statements and authoring influences for the 11 that had none
- [X] T205 [P] Add a required `joint` reference to the `stiffnessSources` and `stiffnessPatterns` schemas in `src/content.config.ts`
- [X] T206 [P] Add a required `joints` array to the `redFlags` schema in `src/content.config.ts`
- [X] T207 [P] Add a required `dependsOnJoints` array to the `functionalGoals` schema in `src/content.config.ts`
- [X] T208 Tag existing records with their joint: 6 files in `src/content/stiffness-sources/`, 4 in `src/content/stiffness-patterns/`, 8 entries in `src/content/data/red-flags.yaml`, 9 files in `src/content/functional-goals/`
- [X] T209 Implement the structure↔joint inversion in `src/lib/chain.ts`, mirroring `cross-links.ts` so the joint→structures edge is derived rather than stored twice
- [X] T210 [P] Write unit tests for the inversion in `tests/unit/chain.test.ts`, covering direct/indirect separation and a joint with no structures
- [X] T211 Add the three chain checks to `scripts/content-policy.ts`: every structure influences ≥1 joint, every joint is influenced by ≥1 structure, every joint has ≥1 stiffness source and ≥1 pattern
- [X] T212 [P] Extend `tests/unit/content-policy.test.ts` with fixtures for each new failure mode, including a structure with an empty `jointInfluences` and a joint with no sources
- [X] T213 [P] Add schema-rejection cases to `tests/unit/schemas.test.ts`: a muscle with no `jointInfluences`, an influence missing `presentsAs`, and a stiffness source with no `joint`
- [X] T214 Confirm `grep -r "presentsAsKneeStiffness" src/` returns nothing, so the relationship is recorded in exactly one place
- [X] T215 Run `pnpm verify` and fix any genuine regression; where a knee-specific assertion is now factually wrong, update it and state the reason in the commit

**Checkpoint**: The model holds, the knee content still works, and the chain is validated.

---

## Phase 2: User Story 1 — Arrive with a stiff hip (Priority: P1)

**Goal**: The hip explained on the same terms the knee already enjoys.

**Independent Test**: With hip content present and ankle absent, a reader navigates hip mechanics,
sources and patterns end to end, and can state what a hip capsular restriction is and how much hip
flexion sitting needs — with no knee framing anywhere.

- [X] T216 [P] [US1] Author the six hip stiffness sources in `src/content/stiffness-sources/`, each described for the hip rather than restated from the knee
- [X] T217 [P] [US1] Author the hip stiffness patterns in `src/content/stiffness-patterns/`, joint-specific with no forced knee analogues
- [X] T218 [P] [US1] Add hip citations to `src/content/data/sources/clinical.yaml` and `sources/anatomy.yaml`, including sourced functional ROM thresholds
- [X] T219 [US1] Reframe navigation and section copy in `src/layouts/BaseLayout.astro`, `src/pages/index.astro` and `src/pages/understanding/index.astro` so no heading implies a knee-only reference (FR-107)
- [X] T220 [P] [US1] E2E test in `tests/e2e/joints.spec.ts` asserting all six hip sources render with sources, and hip ROM thresholds are tied to named activities
- [X] T221 [P] [US1] E2E test in `tests/e2e/joints.spec.ts` asserting no navigation label or section heading contains knee-only framing

**Checkpoint**: The hip is a first-class joint.

---

## Phase 3: User Story 2 — Arrive with a stiff ankle (Priority: P1)

**Goal**: The same for the ankle, including its two joints and the dorsiflexion story.

**Independent Test**: A reader navigates ankle mechanics, sources and patterns, and can explain
why a calf stretch differs with a straight versus bent knee.

- [X] T222 [P] [US2] Author the six ankle stiffness sources in `src/content/stiffness-sources/`
- [X] T223 [P] [US2] Author ankle stiffness patterns in `src/content/stiffness-patterns/`, including at least one with no knee analogue such as post-sprain restriction or anterior impingement (FR-106)
- [X] T224 [P] [US2] Add ankle citations to `src/content/data/sources/clinical.yaml`, including sourced functional ROM thresholds
- [X] T225 [US2] Ensure the ankle mechanics body in `src/content/joints/ankle.md` covers talocrural and subtalar joints, names dorsiflexion as functionally critical, and explains the bent- versus straight-knee difference with the responsible structure named
- [X] T226 [P] [US2] E2E test in `tests/e2e/joints.spec.ts` asserting the ankle has a pattern with no knee equivalent, and that the dorsiflexion explanation is present

**Checkpoint**: All three joints are first-class.

---

## Phase 4: User Story 3 — Follow a restriction along the chain (Priority: P1)

**Goal**: The relationship traversable in both directions, generated from data.

**Independent Test**: From any structure reach every joint it influences; from any joint reach
every structure influencing it; no dead links either way.

- [X] T227 [US3] Create the joint page at `src/pages/joints/[id].astro` rendering mechanics, ROM thresholds, that joint's stiffness sources and patterns, and its influencing structures split into direct and indirect
- [X] T228 [US3] Replace the single knee statement in `src/pages/muscles/[id].astro` with the full `jointInfluences` list, marking indirect influences as acting through another joint
- [X] T229 [US3] Generalise `src/components/diagrams/MuscleActionMap.astro` to render for a given joint, so each joint page gets its own map rather than the knee's
- [X] T230 [P] [US3] E2E test in `tests/e2e/chain.spec.ts` walking structure → joint → structure for every catalogued structure, asserting no 404 in either direction (SC-103, SC-110)
- [X] T231 [P] [US3] E2E test in `tests/e2e/chain.spec.ts` asserting a structure crossing two joints states both separately, and that an indirect influence is visibly distinguished from a direct one
- [X] T232 [P] [US3] E2E test asserting every joint's mechanics is reachable from the home page in 2 interactions or fewer (SC-109)

**Checkpoint**: The chain is the feature, and it works. Shippable without new exercises.

---

## Phase 5: User Story 5 — Joint-specific warning signs (Priority: P1) 🔒 GATE

**Goal**: Red flags for hip and ankle, each identifiable by joint.

> **⚠️ CONSTITUTIONAL SEQUENCING**: This phase must complete before Phase 6. Exercise content for
> a joint must not ship before that joint's warning signs — the same rule feature 001 followed,
> for the same reason.

- [X] T233 [P] [US5] Author hip-specific red-flag signs in `src/content/data/red-flags.yaml` with sources
- [X] T234 [P] [US5] Author ankle-specific red-flag signs in `src/content/data/red-flags.yaml` with sources, including inability to weight-bear after an inversion injury
- [X] T235 [US5] Show the joints each sign concerns in `src/pages/safety.astro` and `src/components/RedFlagGate.astro`, without lengthening the gate to the point where it stops being read
- [X] T236 [P] [US5] E2E test in `tests/e2e/red-flag-gate.spec.ts` asserting hip and ankle signs are present and joint-identifiable
- [X] T237 [P] [US5] Extend `tests/e2e/red-flag-gate.spec.ts` to cover deep links to routes added by this feature, including the JS-disabled fail-safe case

**Checkpoint**: The gate covers all three joints. Exercise content may now ship.

---

## Phase 6: User Story 4 — Movements for hip and ankle (Priority: P2)

**Goal**: The six new structures catalogued and covered by exercises.

**Depends on**: Phase 5 — constitutionally blocking.

- [X] T238 [P] [US4] Author the deep hip rotator records including piriformis in `src/content/muscles/`, with hip direct and knee indirect influences
- [X] T239 [P] [US4] Author tibialis anterior and tibialis posterior in `src/content/muscles/`
- [X] T240 [P] [US4] Author the peroneal group in `src/content/muscles/`
- [X] T241 [P] [US4] Author the Achilles tendon and plantar fascia in `src/content/muscles/` as non-contractile structures
- [X] T242 [P] [US4] Add anatomy citations for the new structures to `src/content/data/sources/anatomy.yaml`
- [X] T243 [P] [US4] Assign `diagramZone` values for the new structures, extending the zone vocabulary in `src/lib/diagram-zones.ts` if the existing ten cannot place them
- [X] T244 [P] [US4] Author clinical range-of-motion exercises for the new structures in `src/content/exercises/`
- [X] T245 [P] [US4] Author yoga exercises for hip rotation and ankle mobility in `src/content/exercises/`
- [X] T246 [P] [US4] Author Pilates exercises for the new structures in `src/content/exercises/`
- [X] T247 [P] [US4] Author tai chi exercises for ankle and hip control in `src/content/exercises/`
- [X] T248 [US4] Rebalance so all four modalities stay represented and none exceeds 60% of the expanded library, verified by `pnpm validate` (SC-107)
- [X] T249 [US4] Add `dependsOnJoints` values to all 9 records in `src/content/functional-goals/` and surface them on `src/pages/start/[id].astro`
- [X] T250 [P] [US4] E2E test in `tests/e2e/chain.spec.ts` asserting every new structure is targeted by at least one exercise and every new exercise carries its safety fields
- [ ] T251 [P] [US4] Add public-domain anatomy plates for the new structures following the provenance pattern in `src/components/AnatomyPlate.astro`, or record why none was found

**Checkpoint**: All user stories complete.

---

## Phase 7: Polish & Cross-Cutting

- [X] T252 [P] Extend the axe sweep in `tests/e2e/accessibility.spec.ts` to every new route, both themes
- [ ] T253 [P] Extend `tests/e2e/responsive-privacy.spec.ts` to assert no new route scrolls horizontally at 360px (SC-112)
- [X] T254 Run `pnpm check:isolation` against a real build and resolve any external origin (SC-113)
- [ ] T255 Verify SC-114 by adding a structure for the hip and an exercise for it with zero changes outside `src/content/`
- [X] T256 [P] Update `README.md` and `CLAUDE.md` for the three-joint model and the chain
- [ ] T257 Execute every manual procedure in `quickstart.md`, including the both-directions walk and the JS-disabled gate check
- [X] T258 Run `pnpm verify` plus `pnpm smoke:dev` and confirm all gates pass

---

## Dependencies & Execution Order

- **Phase 1** blocks everything. The migration must be complete and green before content is authored
- **Phase 2 (US1)** and **Phase 3 (US2)** are independent of each other
- **Phase 4 (US3)** depends on 2 and 3 for joints to have content worth linking
- **Phase 5 (US5)** depends on Phase 1 only, but **must precede Phase 6**
- **Phase 6 (US4)** depends on Phase 5 constitutionally and on Phase 1 technically
- **Phase 7** depends on all shipped stories

```text
Phase 5 (red flags) ──must complete before──> Phase 6 (exercises)
```

### Parallel opportunities

- **Phase 1**: T205, T206, T207 (distinct schema blocks); T210, T212, T213
- **Phase 2**: T216, T217, T218 · T220, T221
- **Phase 3**: T222, T223, T224 · T226
- **Phase 4**: T230, T231, T232
- **Phase 5**: T233, T234 · T236, T237
- **Phase 6**: T238–T247 — **ten parallel authoring tasks**, the widest fan-out
- **Phase 7**: T252, T253, T256

---

## Implementation Strategy

### MVP scope: Phases 1–4

A three-joint reference with the chain traversable in both directions, using the existing 58
exercises. Genuinely useful and shippable: a reader with a stiff hip or ankle gets mechanics,
sources, patterns and the structures involved, plus every exercise that already targets those
structures.

### Incremental delivery

| Increment | Phases | Delivers |
|---|---|---|
| Model | 1 | Chain validated, knee content intact |
| Hip | 2 | Hip as a first-class joint |
| Ankle | 3 | All three joints |
| Chain | 4 | Traversable in both directions — the feature's point |
| Safety | 5 | Joint-specific warning signs; unlocks new exercises |
| Payload | 6 | 6 structures, ~17 exercises |
| Gates | 7 | Full verification |

### Effort reality

Phase 1 is the risky phase and the short one — a schema change plus 19 record migrations, with the
existing test suite as the safety net. Phases 2, 3 and 6 are the long ones, and they are content
authoring with checked citations, exactly as feature 001 was. The rate limit has not changed:
sourcing, not code.

---

## Notes

- `[P]` = different files, no dependencies on incomplete work
- **Do not relax a test to make a migration step pass.** Update it only when a framing change makes
  it factually wrong, and say so in the commit
- The knee content is the thing most at risk in this feature; `pnpm verify` after every phase
