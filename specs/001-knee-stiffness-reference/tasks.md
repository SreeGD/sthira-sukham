---

description: "Task list for Knee Stiffness Educational Reference"
---

# Tasks: Knee Stiffness Educational Reference

**Input**: Design documents from `/specs/001-knee-stiffness-reference/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **Included and mandatory.** The constitution's "Development Workflow & Quality Gates"
section requires content validation, accessibility, network-isolation, and behaviour gates to pass
before any merge. Test tasks here are not optional extras — they are the gates.

**Organization**: Grouped by user story. One constitutional override to strict priority order is
called out in Phase 5.

## Status — 2026-08-11

**110 of 111 tasks complete.** `pnpm verify` passes end to end: 67 pages built, content policy
clean, zero external origins, 32 unit tests, 260 e2e tests (including axe in both themes at two
viewports).

Two things are deliberately short of the spec target and stated plainly rather than marked done:

- **Exercise library is 24, not the 40–60 the spec assumed** (T072–T075). All four modalities are
  present and balanced (clinical 8, yoga 6, Pilates 5, tai chi 5 — none above 33%), every required
  muscle is covered, and every mechanism is built and tested. Expanding is content work: each new
  record needs citations actually checked against the source, which is the rate limit.
- **T110 (manual quickstart procedures) is open.** The automatable parts run in CI; the parts
  needing a human — greyscale inspection, a screen reader, the OS reduced-motion setting — cannot
  be self-certified. `quickstart.md` lists them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths in every description

## Path Conventions

Single project, no backend (Principle V). `src/`, `scripts/`, `tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Initialize pnpm project and Astro 5 with static output in `astro.config.mjs` and `package.json`
- [X] T002 Add and configure `@astrojs/preact` integration in `astro.config.mjs`
- [X] T003 [P] Configure TypeScript strict mode in `tsconfig.json`
- [X] T004 [P] Configure Prettier with `prettier-plugin-astro` in `.prettierrc`
- [X] T005 [P] Configure ESLint with Astro and a11y plugins in `eslint.config.js`
- [X] T006 [P] Configure Vitest for unit tests in `vitest.config.ts`
- [X] T007 [P] Configure Playwright with `@axe-core/playwright` in `playwright.config.ts`
- [X] T008 [P] Create directory skeleton `src/{content,lib,components,islands,layouts,pages,styles}`, `scripts/`, `tests/{unit,e2e}`
- [X] T009 [P] Create `.gitignore` covering `dist/`, `node_modules/`, `.astro/`, and `.claude/` per the Spec Kit agent-folder security note
- [X] T010 Wire pnpm scripts `dev`, `build`, `preview`, `validate`, `test`, `test:e2e`, `check:isolation`, and composite `verify` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The validation gate, the design token layer, and the base layout. Content cannot be
authored before the schemas exist, or it gets written against nothing.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Content schemas — the validation gate

- [X] T011 Define the `sources` collection in `src/content.config.ts` loading `src/content/data/sources/*.yaml` (split by domain so parallel content tasks never contend on one file), requiring `id`, `title`, `authorOrBody`, `year`, `tier`, and at least one of `url`/`doi`
- [X] T012 [P] Define the `evidenceLabels` collection schema in `src/content.config.ts` requiring `id`, `label`, `definition`, `rank`, and `shapeToken`
- [X] T013 [P] Define the `redFlags` collection schema in `src/content.config.ts` requiring `id`, `sign`, `description`, and non-empty `sources`
- [X] T014 Define the `muscles` collection schema in `src/content.config.ts` per `contracts/content-schemas.md`, with `reference()` to sources
- [X] T015 Define the `exercises` collection schema in `src/content.config.ts` with `contraindications`, `stopIf`, `evidenceLabel`, `targets`, and `sources` all required and non-empty
- [X] T016 [P] Define the `routines` collection schema in `src/content.config.ts` with ordered `steps` referencing exercises
- [X] T017 [P] Define the `stiffnessSources` collection schema in `src/content.config.ts`
- [X] T018 [P] Define the `stiffnessPatterns` collection schema in `src/content.config.ts` — deliberately **no** `symptoms` field (Principle I structural guard)
- [X] T019 Add conditional `superRefine` rules in `src/content.config.ts`: tradition attribution for non-clinical modalities, `presentsAsKneeStiffness` for hip/ankle muscles, full stiffness triad for contractile structures, non-empty `regressions ∪ progressions` with no self-reference, and `modifications` for yoga/Pilates
- [X] T020 [P] Write schema-rejection unit tests in `tests/unit/schemas.test.ts` asserting the build rejects: empty `sources`, empty `stopIf`, empty `contraindications`, unknown `evidenceLabel`, missing `traditionalName` on a yoga record, and a hip muscle missing `presentsAsKneeStiffness`

### Seed vocabularies

- [X] T021 Fix the evidence-label vocabulary (3–4 terms, strongest → weakest, each with a reader-facing definition and a non-colour `shapeToken`) in `src/content/data/evidence-labels.yaml` — this resolves the item deferred in `plan.md`
- [X] T022 [P] Seed initial citations in `src/content/data/sources/clinical.yaml`, `sources/anatomy.yaml`, and `sources/practice-literature.yaml` with correct `tier` values

### Design system and base layout

- [X] T023 [P] Define the light/dark custom-property token layer in `src/styles/tokens.css` on bare `:root`, `@media (prefers-color-scheme: dark)` guarded against explicit light, and `:root[data-theme="dark"]`, with all pairs meeting WCAG 2.1 AA contrast
- [X] T024 [P] Write base styles, typography scale legible at 360px, focus-visible rings, and `prefers-reduced-motion` suppression in `src/styles/global.css`
- [X] T025 Create `src/layouts/BaseLayout.astro` with `banner`/`navigation`/`main`/`contentinfo` landmarks, a first-in-tab-order skip link, and the pre-paint inline script stamping theme and ack state on `<html>`
- [X] T026 [P] Create the `ThemeToggle` island in `src/islands/ThemeToggle.tsx` persisting to `fixknee:theme`
- [X] T027 [P] Create `src/components/SourceList.astro` rendering citations visibly with tier indication (FR-034)

### Quality gate scripts

- [X] T028 Implement cross-collection policy checks in `scripts/validate-content.ts`: every record sourced, every FR-012/FR-013 muscle present, every muscle targeted or carrying `noExercisesNote`, all four modalities present with none exceeding 60%, all eight FR-004 red-flag signs present, six stiffness sources and four patterns present, no orphaned sources, no reference cycles
- [X] T029 [P] Implement the build-output scan in `scripts/check-no-external-origins.ts` failing on any external origin in a fetching position (`src`, `<link href>`, `@import`, `url()`, `fetch`, `XMLHttpRequest`) while permitting citation URLs rendered as reader-facing text
- [X] T030 [P] Write unit tests for the policy functions in `tests/unit/validate-content.test.ts` using fixture collections
- [X] T031 [P] Write unit tests for the origin scanner in `tests/unit/check-origins.test.ts` covering both the failing and permitted cases

**Checkpoint**: Schemas reject invalid content, tokens and layout exist, gates run. Content authoring can begin.

---

## Phase 3: User Story 1 - Understand why my knee feels stiff (Priority: P1) 🎯 MVP

**Goal**: A reader can build a working mental model of knee mechanics, the six physical sources of
stiffness, range-of-motion measurement, and the four general patterns.

**Independent Test**: With only this phase built, a reader navigates the Understanding section end
to end and can state three distinct physical causes of stiffness and what functional ROM means.

### Content for User Story 1

- [X] T032 [P] [US1] Author the six stiffness-source records (capsular restriction, effusion, muscle guarding, adhesion/scar, arthritic change, disuse shortening) as Markdown in `src/content/stiffness-sources/`, each with clinical term, plain-language gloss, and sources
- [X] T033 [P] [US1] Author the four stiffness-pattern records (osteoarthritic, patellofemoral, post-injury/post-surgical, sedentary/disuse) in `src/content/stiffness-patterns/`, written generally with no invitation to self-sort (FR-007)
- [X] T034 [P] [US1] Add citations supporting mechanics, ROM thresholds, sources, and patterns to `src/content/data/sources/clinical.yaml`

### Routes for User Story 1

- [X] T035 [US1] Create the Understanding section index at `src/pages/understanding/index.astro`
- [X] T036 [US1] Create `src/pages/understanding/mechanics.astro` covering tibiofemoral and patellofemoral joints, flexion/extension degree measurement, and functional thresholds for level walking, stairs, car transfers, and squatting (FR-008, FR-010)
- [X] T037 [P] [US1] Create the stiffness-source index and detail routes at `src/pages/understanding/sources/index.astro` and `src/pages/understanding/sources/[id].astro`
- [X] T038 [P] [US1] Create the pattern index and detail routes at `src/pages/understanding/patterns/index.astro` and `src/pages/understanding/patterns/[id].astro`
- [X] T039 [US1] Create the home page with entry points to all four sections at `src/pages/index.astro` (FR-032)

### Tests for User Story 1

- [X] T040 [P] [US1] E2E test in `tests/e2e/understanding.spec.ts` asserting all six sources and four patterns render, each showing its sources
- [X] T041 [P] [US1] E2E test in `tests/e2e/understanding.spec.ts` asserting mechanics content states functional ROM thresholds tied to named activities

**Checkpoint**: Understanding section complete and independently useful — a sourced reference with zero exercise-safety surface.

---

## Phase 4: User Story 2 - Learn which muscles are involved (Priority: P1)

**Goal**: A browsable catalogue of ~19 muscles and non-contractile restrictors, each explaining its
role at the knee and how it contributes to stiffness, including the hip and ankle contribution.

**Independent Test**: A reader browses every catalogued structure and can state, for any one, its
role in knee motion and its stiffness contribution.

### Content for User Story 2

- [X] T042 [P] [US2] Author the four quadriceps records (rectus femoris, vastus lateralis, vastus medialis/VMO, vastus intermedius) in `src/content/muscles/`
- [X] T043 [P] [US2] Author the three hamstring records (biceps femoris, semitendinosus, semimembranosus) in `src/content/muscles/`
- [X] T044 [P] [US2] Author the calf records (gastrocnemius, soleus) in `src/content/muscles/` with `region: ankle` and required `presentsAsKneeStiffness` (FR-016)
- [X] T045 [P] [US2] Author the popliteus record in `src/content/muscles/`
- [X] T046 [P] [US2] Author the tensor fasciae latae record in `src/content/muscles/` with `region: hip` and `presentsAsKneeStiffness`
- [X] T047 [P] [US2] Author the adductor group record in `src/content/muscles/` with `region: hip` and `presentsAsKneeStiffness`
- [X] T048 [P] [US2] Author the three gluteal records (maximus, medius, minimus) in `src/content/muscles/` with `region: hip` and `presentsAsKneeStiffness`
- [X] T049 [P] [US2] Author the iliopsoas record in `src/content/muscles/` with `region: hip` and `presentsAsKneeStiffness`
- [X] T050 [P] [US2] Author the three non-contractile restrictor records (joint capsule, retinaculum, iliotibial band) in `src/content/muscles/` with `isContractile: false` (FR-013)
- [X] T051 [P] [US2] Add anatomy citations for all muscle records to `src/content/data/sources/anatomy.yaml`

### Implementation for User Story 2

- [X] T052 [US2] Implement the muscle → exercises inversion in `src/lib/cross-links.ts`, correctly returning an empty list until exercises exist
- [X] T053 [P] [US2] Write unit tests for the inversion in `tests/unit/cross-links.test.ts` including the empty-exercise-set case
- [X] T054 [US2] Create the muscle catalogue grouped by region at `src/pages/muscles/index.astro`, visually distinguishing contractile from non-contractile structures
- [X] T055 [US2] Create the muscle detail route at `src/pages/muscles/[id].astro` rendering role, the tight/weak/inhibited triad, plain-language gloss alongside the anatomical term, sources, and the (currently empty) exercise list

### Tests for User Story 2

- [X] T056 [P] [US2] E2E test in `tests/e2e/muscles.spec.ts` asserting every structure named in FR-012 and FR-013 renders with role, stiffness contribution, and ≥1 source
- [X] T057 [P] [US2] E2E test in `tests/e2e/muscles.spec.ts` asserting every hip and ankle structure explains how its restriction presents as knee stiffness

**Checkpoint**: US1 + US2 together are a shippable MVP — a complete, sourced anatomy reference with no exercise content.

---

## Phase 5: User Story 4 - Know when to stop and see a clinician (Priority: P1) 🔒 GATE

**Goal**: Red-flag guidance authored, reachable in one interaction from everywhere, and a gate
mechanism that holds on deep links and fails safe without JavaScript.

> **⚠️ CONSTITUTIONAL SEQUENCING**: This phase is ordered before User Story 3 despite US3's higher
> spec priority. Principle I forbids exercise content shipping without the gate. **No task in
> Phase 6 may merge before this phase is complete.**

**Independent Test**: `/safety/` renders all red flags with sources; the safety affordance reaches
it in one interaction from every existing screen; the gate mechanism holds on a test fixture route
with JS enabled, and shows the gate with JS disabled.

### Content for User Story 4

- [X] T058 [P] [US4] Author all eight red-flag signs (locking, giving way, inability to bear weight, hot/swollen joint, fever, sudden severe pain, night pain, pain after trauma) in `src/content/data/red-flags.yaml` with plain-language descriptions and sources (FR-004)
- [X] T059 [P] [US4] Add clinical citations for red-flag signs to `src/content/data/sources/clinical.yaml`

### Implementation for User Story 4

- [X] T060 [US4] Create `src/components/RedFlagGate.astro` as a server-rendered Astro component (not an island) rendering all red flags plus the acknowledgement action
- [X] T061 [US4] Create `src/components/ClinicianFraming.astro` stating this is general education and a clinician is the right source for personal assessment, with **no dismissal mechanism in the markup** (FR-003)
- [X] T062 [US4] Extend the pre-paint script in `src/layouts/BaseLayout.astro` to stamp `data-ack` on `<html>` from `fixknee:red-flags-ack` before first paint
- [X] T063 [US4] Create `src/layouts/GatedLayout.astro` composing BaseLayout, RedFlagGate, and ClinicianFraming, with CSS keyed on `html[data-ack]` such that **the gate is visible by default and content is revealed by the attribute** (fail-safe — see `research.md` D5)
- [X] T064 [US4] Add a persistent safety affordance reaching `/safety/` in one interaction to `src/layouts/BaseLayout.astro` (FR-002)
- [X] T065 [US4] Create the full red-flag guidance route at `src/pages/safety.astro`

### Tests for User Story 4

- [X] T066 [P] [US4] E2E test in `tests/e2e/red-flag-gate.spec.ts` asserting that with storage cleared, a gated fixture route shows the gate and no content, with no flash of gated content during load
- [X] T067 [P] [US4] E2E test in `tests/e2e/red-flag-gate.spec.ts` asserting that **with JavaScript disabled the gate still shows** — the fail-safe check
- [X] T068 [P] [US4] E2E test in `tests/e2e/red-flag-gate.spec.ts` asserting that after acknowledgement the reader is not gated again, and that `/safety/` is reachable in one interaction from every route (SC-002)
- [X] T069 [P] [US4] E2E test in `tests/e2e/red-flag-gate.spec.ts` asserting the FR-003 framing renders on gated routes with no dismissal control present in the DOM

**Checkpoint**: The gate holds and fails safe. Exercise content is now permitted to ship.

---

## Phase 6: User Story 3 - Find movements that address a muscle or goal (Priority: P2)

**Goal**: A filterable library of 40–60 exercises across four modalities, cross-linked with the
muscle catalogue, every record carrying contraindications, stop-criteria, and an evidence label.

**Independent Test**: Any combination of the five filters returns correct results with a stated
count; every exercise opens to full detail; muscle ↔ exercise links resolve in both directions.

**Depends on**: Phase 5 (gate) — constitutionally blocking.

### Filter logic for User Story 3

- [X] T070 [P] [US3] Implement five-dimension filtering (modality, muscle, goal, difficulty, equipment) with OR-within-dimension and AND-across-dimensions, plus facet counts, in `src/lib/filters.ts` — pure, no Preact import
- [X] T071 [P] [US3] Write the filter matrix unit tests in `tests/unit/filters.test.ts` covering every dimension, multi-dimension combinations, and the no-match case (SC-008)

### Content for User Story 3

- [X] T072 [P] [US3] Author the clinical range-of-motion exercises (heel slides, prone hangs, wall slides, patellar mobilizations, stationary-bike range work, quadriceps/hamstring/calf stretches, terminal knee extension) in `src/content/exercises/`
- [X] T073 [P] [US3] Author the yoga exercises (supta padangusthasana, virasana, anjaneyasana, malasana, adho mukha svanasana, setu bandha sarvangasana) in `src/content/exercises/` with traditional names, tradition attribution, and required `modifications` and `props` for restricted knees (FR-023, FR-025)
- [X] T074 [P] [US3] Author the Pilates exercises (footwork patterns, leg slides, bridging, side-lying series, standing leg pump) in `src/content/exercises/` with tradition attribution and modifications, treating reformer work as an optional variation only
- [X] T075 [P] [US3] Author the tai chi/qigong exercises (weight-shifting, knee-over-toe tracking, slow loaded flexion-extension, adapted stances) in `src/content/exercises/` with tradition attribution
- [X] T076 [P] [US3] Add practice-literature and peer-reviewed citations for all exercise records to `src/content/data/sources/practice-literature.yaml` and `sources/clinical.yaml`, keeping mechanistic claims on peer-reviewed sources and traditional claims on practice literature (Principle IV)
- [X] T077 [US3] Balance the library so all four modalities are represented and none exceeds 60% of records, verified by `pnpm validate` (SC-006)

### Implementation for User Story 3

- [X] T078 [P] [US3] Create `src/components/EvidenceBadge.astro` rendering evidence strength with text and `shapeToken` alongside colour, never colour alone (FR-022, SC-011)
- [X] T079 [P] [US3] Create `src/components/ExerciseCard.astro` for list views, showing modality, difficulty, equipment, and the evidence badge
- [X] T080 [P] [US3] Create `src/components/CrossLinks.astro` for bidirectional muscle ↔ exercise navigation
- [X] T081 [US3] Create the `ExerciseFilters` island in `src/islands/ExerciseFilters.tsx` as a thin shell over `src/lib/filters.ts`, syncing state to the query string and announcing the result count in a polite live region
- [X] T082 [US3] Create the library route at `src/pages/exercises/index.astro` using GatedLayout, server-rendering the complete library so it degrades to an unfiltered list without JS, with an explicit empty state and one-interaction clear action (FR-031)
- [X] T083 [US3] Create the exercise detail route at `src/pages/exercises/[id].astro` using GatedLayout, rendering instructions, dosage, difficulty, regressions/progressions, contraindications, stop-criteria, equipment, evidence label, modifications, mechanics body, and sources
- [X] T084 [US3] Add the targeting-exercise list to `src/pages/muscles/[id].astro`, gating **only that section** while leaving the muscle's own educational content ungated (FR-017 with the `contracts/routes.md` partial-gate rule)

### Tests for User Story 3

- [X] T085 [P] [US3] E2E test in `tests/e2e/exercise-filters.spec.ts` covering the filter matrix, stated result count, empty state with clear action, and query-string round-trip through a fresh page load
- [X] T086 [P] [US3] E2E test in `tests/e2e/exercise-filters.spec.ts` asserting `/exercises/` renders the complete library with JavaScript disabled
- [X] T087 [P] [US3] E2E test in `tests/e2e/exercises.spec.ts` asserting every exercise detail page renders all required fields including contraindications and stop-criteria
- [X] T088 [P] [US3] E2E test in `tests/e2e/exercises.spec.ts` asserting muscle ↔ exercise cross-links resolve in both directions with no 404s
- [X] T089 [P] [US3] Extend `tests/e2e/red-flag-gate.spec.ts` to cover real deep links to `/exercises/[id]/` and the partial gate on `/muscles/[id]/` (SC-001)

**Checkpoint**: The core deliverable is complete — understand, browse, filter, and act, with safety enforced.

---

## Phase 7: User Story 5 - Follow a curated routine (Priority: P3)

**Goal**: Three curated general sequences composed from the exercise library.

**Independent Test**: Each routine opens, shows purpose, duration, equipment, and ordered steps, and every step reaches its full exercise entry.

- [X] T090 [P] [US5] Author the ten-minute morning mobility routine in `src/content/routines/`
- [X] T091 [P] [US5] Author the desk-worker routine in `src/content/routines/`
- [X] T092 [P] [US5] Author the strength-focused routine in `src/content/routines/`
- [X] T093 [US5] Create the routine index at `src/pages/routines/index.astro` using GatedLayout
- [X] T094 [US5] Create the routine detail route at `src/pages/routines/[id].astro` using GatedLayout, rendering purpose, duration, equipment, ordered steps linking to exercises, and order rationale
- [X] T095 [P] [US5] E2E test in `tests/e2e/routines.spec.ts` asserting all three routines render with ordered steps that link to resolvable exercises, and that framing presents them as general examples (FR-029)

**Checkpoint**: Routines complete.

---

## Phase 8: User Story 6 - Find something by name (Priority: P3)

**Goal**: Search across muscles and exercises by anatomical name, common name, abbreviation, and traditional name.

**Independent Test**: Searching `VMO` and `supta padangusthasana` each reach the correct entry.

- [X] T096 [P] [US6] Implement build-time search index construction over muscles and exercises in `src/lib/search-index.ts`, emitting `{ id, kind, names[], url }`
- [X] T097 [P] [US6] Implement diacritic- and case-insensitive substring and prefix matching in `src/lib/search.ts` — pure, no Preact import
- [X] T098 [P] [US6] Write unit tests in `tests/unit/search.test.ts` covering anatomical name, common name, abbreviation (`VMO`), traditional name, diacritics, and the no-match case
- [X] T099 [US6] Create the `Search` island in `src/islands/Search.tsx` consuming the embedded index — **no runtime fetch** (research.md D4)
- [X] T100 [US6] Create the search route at `src/pages/search.astro` with an explicit no-results state offering a route back to browsing (FR-031)
- [X] T101 [P] [US6] E2E test in `tests/e2e/search.spec.ts` covering muscle-by-abbreviation, exercise-by-traditional-name, and the no-results state

**Checkpoint**: All user stories complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: The remaining constitutional gates, which span every story

- [X] T102 [P] Write the axe accessibility sweep across every route in both light and dark themes in `tests/e2e/accessibility.spec.ts` (SC-010, SC-011)
- [X] T103 [P] Write keyboard-only traversal tests for all four primary journeys in `tests/e2e/keyboard.spec.ts` (SC-009)
- [X] T104 [P] Write a 360px viewport test asserting no horizontal page scroll on any route in `tests/e2e/responsive.spec.ts` (SC-014)
- [X] T105 [P] Write a storage-inspection test in `tests/e2e/privacy.spec.ts` asserting only `fixknee:red-flags-ack` and `fixknee:theme` are ever written (SC-013)
- [X] T106 Create the 404 route with a path back to browsing at `src/pages/404.astro`
- [X] T107 Run `pnpm check:isolation` against a real build and resolve any external origin found (SC-012, FR-040)
- [X] T108 Verify the SC-015 extensibility property by adding one muscle and one exercise and confirming they surface everywhere with zero changes outside `src/content/`
- [X] T109 [P] Write `README.md` covering what the project is, how to run it, and how to author content, linking to `contracts/content-schemas.md`
- [ ] T110 Execute every manual procedure in `quickstart.md`, including the JS-disabled gate check, offline navigation, greyscale colour check, and reduced-motion check
- [X] T111 Run `pnpm verify` end to end and confirm all gates pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)** and **US2 (Phase 4)**: Depend on Foundational only; independent of each other
- **US4 (Phase 5)**: Depends on Foundational; benefits from US1/US2 existing so the one-interaction reachability claim can be tested against real routes
- **US3 (Phase 6)**: Depends on US2 (targeting needs the catalogue) **and constitutionally on US4**
- **US5 (Phase 7)**: Depends on US3 — pure composition over the exercise library
- **US6 (Phase 8)**: Depends on US2 and US3 for its corpus
- **Polish (Phase 9)**: Depends on all shipped stories

### The one hard sequencing rule

```text
Phase 5 (US4 — gate) ──must complete before──> Phase 6 (US3 — exercises)
```

This inverts spec priority (US3 is P2, US4 is P1) and is non-negotiable under Principle I. Exercise
content merging without the gate is a constitutional violation, not a scheduling preference.

### Parallel Opportunities

- **Phase 1**: T003–T009 all parallel
- **Phase 2**: T012, T013, T016, T017, T018 (distinct schema blocks) parallel; T020, T022, T023, T024, T026, T027, T029, T030, T031 parallel
- **Phase 3**: T032, T033, T034 parallel; T037, T038 parallel; T040, T041 parallel
- **Phase 4**: T042–T051 — **ten fully parallel content-authoring tasks**, the widest fan-out in the project
- **Phase 5**: T058, T059 parallel; T066–T069 parallel
- **Phase 6**: T072–T076 parallel (four modalities + citations); T078, T079, T080 parallel; T085–T089 parallel
- **Phase 7**: T090, T091, T092 parallel
- **Phase 8**: T096, T097, T098 parallel
- **Phase 9**: T102, T103, T104, T105, T109 parallel

Splitting sources into `src/content/data/sources/*.yaml` by domain (T011) is what makes the Phase 4
and Phase 6 content fan-outs genuinely parallel — a single `sources.yaml` would serialize every
authoring task behind one file.

### Within Each User Story

- Schemas before content (a record authored against no schema is unvalidated)
- Content before routes (routes render from content)
- Pure logic in `src/lib/` before the islands that render it
- Unit tests alongside the logic; e2e after the routes exist

---

## Parallel Example: User Story 2

```bash
# Ten muscle-authoring tasks, all independent files:
Task: "Author the four quadriceps records in src/content/muscles/"
Task: "Author the three hamstring records in src/content/muscles/"
Task: "Author the calf records in src/content/muscles/"
Task: "Author the popliteus record in src/content/muscles/"
Task: "Author the tensor fasciae latae record in src/content/muscles/"
Task: "Author the adductor group record in src/content/muscles/"
Task: "Author the three gluteal records in src/content/muscles/"
Task: "Author the iliopsoas record in src/content/muscles/"
Task: "Author the three non-contractile restrictor records in src/content/muscles/"
Task: "Add anatomy citations to src/content/data/sources/anatomy.yaml"
```

## Parallel Example: User Story 3 content

```bash
Task: "Author the clinical range-of-motion exercises in src/content/exercises/"
Task: "Author the yoga exercises in src/content/exercises/"
Task: "Author the Pilates exercises in src/content/exercises/"
Task: "Author the tai chi/qigong exercises in src/content/exercises/"
```

---

## Implementation Strategy

### MVP scope: Phases 1–4 (US1 + US2)

A complete, sourced, browsable reference on knee mechanics and the muscles involved — genuinely
useful on its own, and carrying **zero exercise-safety surface**, so it can ship before the gate
exists. This is why the spec prioritized both understanding stories at P1.

1. Phase 1: Setup
2. Phase 2: Foundational — the validation gate must exist first
3. Phase 3: US1 Understanding
4. Phase 4: US2 Muscles
5. **STOP and VALIDATE**: `pnpm verify`, then browse the reference end to end

### Incremental delivery

| Increment | Phases | Delivers |
|---|---|---|
| MVP | 1–4 | Sourced anatomy and mechanics reference |
| Safety | 5 | Red-flag guidance + the gate that unlocks exercise content |
| Core | 6 | The filterable exercise library — the payload |
| Convenience | 7–8 | Routines and search |
| Gates | 9 | Full accessibility, privacy, and isolation verification |

### Effort reality

Phases 4 and 6 are ~70% of the total effort, and almost all of it is **content authoring with real
citations**, not code. The build gate means an unsourced record cannot ship, so sourcing is on the
critical path rather than a follow-up. Plan accordingly: the app shell is a few days; the content is
the project.

---

## Notes

- `[P]` = different files, no dependencies on incomplete work
- Commit after each task or logical group
- **The build failing on content is correct behaviour.** Do not add an override flag to get past it
- Every checkpoint is a valid stopping point for independent validation
