# Implementation Plan: Knee Stiffness Educational Reference

**Branch**: `001-knee-stiffness-reference` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-knee-stiffness-reference/spec.md`

## Summary

FixKnee is a statically built, locally run educational reference on stiff knee pain: joint
mechanics and the six physical sources of stiffness, a catalogue of ~19 muscles and non-contractile
restrictors, and a filterable library of ~40–60 exercises drawn from clinical range-of-motion work,
yoga, Pilates, and tai chi/qigong — cross-linked so a reader moves freely between "which muscle"
and "what to do about it".

The technical approach is chosen almost entirely by the constitution. **Astro 5 with content
collections** makes the two hardest requirements native rather than additive: Zod schemas fail the
build on invalid or unsourced content (Principle II/III), and `reference()` fails the build on any
unresolved cross-reference (FR-036). Static output with three Preact islands makes "no runtime
network calls" (Principle V) a structural property rather than a discipline. The red-flag gate uses
a blocking inline script stamping `<html>` before first paint, so it holds on direct deep links
without a content flash — and, critically, **fails safe** when JavaScript is unavailable.

## Technical Context

**Language/Version**: TypeScript 5.x on Node 22.22.3

**Primary Dependencies**: Astro 5 (static output, Content Layer API) · `@astrojs/preact` + Preact
(three islands only) · Zod (via Astro content collections) · Vitest · Playwright ·
`@axe-core/playwright`

**Storage**: Filesystem content collections — Markdown + YAML frontmatter for prose-bearing
entities, YAML data files for sources, evidence labels, and red flags. No database. Client state
limited to two `localStorage` keys (red-flag acknowledgement, theme preference).

**Testing**: Vitest for pure logic (filtering, search matching, content policy assertions);
Playwright for end-to-end (deep-link gate, filter matrix, keyboard traversal); `@axe-core/playwright`
for accessibility in both themes; two custom Node scripts for content policy and build-output
network isolation.

**Target Platform**: Modern evergreen browsers, 360px viewport width and up. Static file output —
servable from any static host or run locally with `pnpm preview`.

**Project Type**: Static content-driven web application. Single project, no backend.

**Performance Goals**: Static HTML on every route; JS shipped only on `/exercises/` and `/search/`.
Reader-facing targets rather than throughput numbers: no layout shift on load, no flash of gated
content, navigation feels instant on a mid-range phone. Bundle budget for the library route is the
Preact runtime plus the embedded search index (revisit if the index exceeds a few tens of KB).

**Constraints**: Zero runtime network requests, zero telemetry, zero third-party origins
(Principle V, hard-verified against `dist/`). WCAG 2.1 AA. No colour-only meaning. Reduced-motion
respected. Build must fail — with no override path — on unsourced content, missing exercise safety
fields, or unresolved references.

**Scale/Scope**: ~19 muscles, ~40–60 exercises, ≥3 routines, 6 stiffness sources, 4 patterns, ≥8
red-flag items. ~16 routes. Single language (English). ~70 content records total.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this design satisfies it | Verified by |
|---|---|---|
| **I. Educational, Never Prescriptive** (NON-NEGOTIABLE) | Gate server-rendered on every exercise-bearing route, revealed by a pre-paint attribute stamp; fails safe without JS. FR-003 framing has no dismissal mechanism in the markup. Schema requires `contraindications` + `stopIf` on every exercise with no override. `StiffnessPattern` deliberately has **no** `symptoms` field, so there is nothing a symptom checker could consume. | e2e deep-link matrix (SC-001, SC-002); build failure on missing safety fields; no-JS manual check in quickstart |
| **II. Every Claim Is Sourced** | `sources: ref[]` required and non-empty on every claim-bearing collection; `Source` requires `url` or `doi`; sources rendered in the UI, not just held in data. | Build fails on empty `sources`; policy script flags orphans (SC-003) |
| **III. Content Is Data, Not Markup** | All content in `src/content/`; pages render from collections; `reference()` enforces referential integrity; MDX deliberately rejected so components cannot leak into content. | SC-015 procedure: add a muscle + exercise with zero changes outside `src/content/` |
| **IV. Modality Honesty** | `traditionalName` + `tradition` required for all non-clinical modalities; `evidenceLabel` a closed reference set with reader-facing definitions and a required non-colour `shapeToken`; `Source.tier` makes practice-literature citations machine-visible so a traditional citation behind a mechanistic claim is reviewable. | Build fails on missing attribution; greyscale check (SC-011); content review |
| **V. Local-First, Zero Backend** | Static output, no server, no auth. Search index embedded rather than fetched — Pagefind rejected specifically to keep offline behaviour unarguable. All assets bundled. | `check:isolation` over `dist/` + offline navigation (SC-012); storage inspection (SC-013) |
| **VI. Usable Mid-Exercise** | CSS custom-property token layer with both `prefers-color-scheme` and explicit-toggle theme paths; landmarks and heading order; filter result count in a polite live region; reduced-motion suppression. | axe in both themes (SC-010); keyboard-only traversal (SC-009); 360px check (SC-014) |

**Initial gate: PASS.** No violations, nothing to justify.

**Post-Phase-1 re-check: PASS.** Design introduced no new dependencies beyond those listed and no
principle tension. Two design decisions strengthened compliance beyond the minimum, both recorded
in `research.md`:

- **D4** rejected Pagefind — the conventional choice — because runtime index fetches would make
  Principle V something we reason about instead of something trivially true.
- **D5** chose gate-visible-by-default with JS revealing content, rather than the more common
  inverse, so degradation fails safe under Principle I.

One item is deliberately deferred rather than left ambiguous: the exact `evidenceLabel` vocabulary
(3–4 terms) is fixed during the first content task, once real literature has been surveyed. The
schema treats it as a closed reference set from the outset, so it cannot drift open.

## Project Structure

### Documentation (this feature)

```text
specs/001-knee-stiffness-reference/
├── plan.md                        # This file
├── spec.md                        # Feature specification
├── research.md                    # Phase 0 — 9 decisions with rejected alternatives
├── data-model.md                  # Phase 1 — 8 entities, validation rules
├── quickstart.md                  # Phase 1 — run + validation procedures
├── contracts/
│   ├── content-schemas.md         # Content authoring contract
│   └── routes.md                  # Route, gate, filter, and build-output contract
├── checklists/
│   └── requirements.md            # Spec quality checklist (passing)
└── tasks.md                       # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── content.config.ts              # Zod schemas — THE validation gate (Principle II/III)
├── content/
│   ├── muscles/                   # ~19 .md — one per muscle/restrictor
│   ├── exercises/                 # ~40–60 .md — one per movement
│   ├── routines/                  # ≥3 .md
│   ├── stiffness-sources/         # 6 .md
│   ├── stiffness-patterns/        # 4 .md
│   └── data/
│       ├── sources.yaml           # All citations, tiered
│       ├── evidence-labels.yaml   # Closed vocabulary + reader-facing definitions
│       └── red-flags.yaml         # ≥8 signs
├── lib/                           # Pure, framework-free, unit-testable
│   ├── filters.ts                 # Five-dimension filtering + facet counts
│   ├── search.ts                  # Normalization + matching
│   ├── search-index.ts            # Build-time index construction
│   └── cross-links.ts             # Muscle→exercises inversion
├── components/                    # Static Astro components
│   ├── RedFlagGate.astro          # Server-rendered, CSS-revealed
│   ├── ClinicianFraming.astro     # FR-003 — no dismissal mechanism
│   ├── EvidenceBadge.astro        # Text + shape + colour (never colour alone)
│   ├── ExerciseCard.astro
│   ├── SourceList.astro
│   └── CrossLinks.astro
├── islands/                       # Preact — the only JS shipped
│   ├── ExerciseFilters.tsx        # Renders src/lib/filters.ts
│   ├── Search.tsx                 # Renders src/lib/search.ts
│   └── ThemeToggle.tsx
├── layouts/
│   ├── BaseLayout.astro           # Landmarks, skip link, pre-paint theme+ack script
│   └── GatedLayout.astro          # BaseLayout + gate + framing
├── pages/                         # Routes per contracts/routes.md
│   ├── index.astro
│   ├── safety.astro
│   ├── search.astro
│   ├── understanding/
│   ├── muscles/
│   ├── exercises/
│   └── routines/
└── styles/
    ├── tokens.css                 # Light/dark custom properties — AA contrast auditable here
    └── global.css

scripts/
├── validate-content.ts            # Cross-collection policy (SC-005, SC-006, FR-004)
└── check-no-external-origins.ts   # dist/ scan (SC-012)

tests/
├── unit/                          # filters, search, cross-links, index construction
└── e2e/
    ├── red-flag-gate.spec.ts      # Every entry route incl. deep links (SC-001)
    ├── exercise-filters.spec.ts   # Filter matrix + empty state (SC-008)
    ├── keyboard.spec.ts           # Primary journeys, keyboard only (SC-009)
    └── accessibility.spec.ts      # axe, both themes (SC-010, SC-011)
```

**Structure Decision**: Single project, no backend — required by Principle V, which forecloses the
frontend/backend split entirely. The layout's organizing principle is the **hard separation between
`src/content/` and everything else**, which is what makes Principle III checkable: SC-015 is
satisfiable precisely because adding content touches only that directory.

The `src/lib/` ↔ `src/islands/` split matters for the same reason at the code level. Filter and
search *logic* is pure and framework-free, so it is unit-testable without a DOM and the Preact
islands stay thin rendering shells. If filtering logic migrated into the island components, the
tests would need a browser and the logic would become harder to verify against SC-008's matrix.

`RedFlagGate.astro` is an Astro component, not an island, deliberately: it must exist in
server-rendered HTML for the gate to hold on a first paint, so it cannot be a hydrated component.

## Implementation Sequencing

Derived from the spec's user-story priorities, with one constitutional override.

| Order | Scope | Stories | Rationale |
|---|---|---|---|
| 1 | Scaffold, schemas, token layer, base layout, CI gates | — | The validation gate must exist before content, or content gets authored against nothing |
| 2 | Understanding + Muscles content and routes | US1, US2 | Ships as a complete, useful reference with zero exercise-safety surface |
| 3 | **Red-flag gate, safety route, framing** | US4 | **Must land before any exercise content ships** — Principle I. Listed after US1/US2 only because it has nothing to gate until step 4 |
| 4 | Exercise library, filters, cross-links | US3 | The payload; depends on the muscle catalogue for targeting to mean anything |
| 5 | Routines | US5 | Pure composition over step 4 |
| 6 | Search | US6 | Shortcut through already-reachable content |

Steps 1–2 form a shippable MVP: a sourced, browsable anatomy reference with no exercise content and
therefore no exercise-safety risk. Step 3 is the gate that unlocks step 4 — **exercise content must
not merge before it**.

## Complexity Tracking

No constitutional violations. No entries required.

The stack is three runtime dependencies (Astro, Preact, and Astro's bundled Zod), and the two
custom scripts exist to enforce constitutional requirements that no off-the-shelf tool covers —
cross-collection content policy and build-output network isolation.
