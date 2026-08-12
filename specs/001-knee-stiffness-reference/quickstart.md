# Quickstart & Validation Guide

**Feature**: `001-knee-stiffness-reference` | **Date**: 2026-08-11

How to run Sthira Sukham and how to prove it satisfies the spec. Every success criterion below is either
automated or has an explicit manual procedure — none is left to "looks right".

## Prerequisites

- Node 22+ (present: v22.22.3)
- pnpm 10+ (present: 10.27.0)

No other services, credentials, or network access are needed — at build time or at run time.

## Commands

```bash
pnpm install

pnpm dev              # dev server, http://localhost:4321
pnpm build            # static build → dist/  (fails on invalid content)
pnpm preview          # serve dist/ locally

pnpm validate         # content policy checks (cross-collection rules)
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright, includes axe accessibility pass
pnpm check:isolation  # assert dist/ has no external origins

pnpm verify           # build + validate + test + test:e2e + check:isolation
```

`pnpm verify` is the gate. If it passes, the constitution's four quality gates pass.

## Validating the content gates

These are the ones worth proving deliberately, because they are what make this project trustworthy
rather than merely functional.

### Unsourced content fails the build (SC-003)

```bash
# Remove the sources array from any exercise, then:
pnpm build
```

**Expected**: build fails with a Zod validation error naming the file and the `sources` field.
Restore the field and confirm the build passes.

### Missing safety fields fail the build (FR-006, SC-003)

```bash
# Empty the stopIf array on any exercise, then:
pnpm build
```

**Expected**: build fails. There must be no configuration or flag that permits this to pass — the
absence of an override is the point.

### Broken cross-references fail the build (FR-036, SC-004)

```bash
# Change any exercise's targets to include a muscle ID that does not exist, then:
pnpm build
```

**Expected**: build fails naming the unresolved reference.

### Aggregate content rules (SC-005, SC-006)

```bash
pnpm validate
```

**Expected**: passes, reporting per-modality counts and confirming no modality exceeds 60%, every
catalogued muscle has a targeting exercise or an explicit note, all eight red-flag signs are
present, and no source is orphaned.

## Validating the red-flag gate (SC-001, SC-002)

Automated in `tests/e2e/red-flag-gate.spec.ts`, covering every entry route. To verify by hand:

1. Clear site data (`localStorage`) to simulate a first visit.
2. Navigate **directly** to `/exercises/heel-slide/` — the deep-link case.
   **Expected**: red-flag guidance is shown; the exercise is not visible; no flash of exercise
   content at any point during load.
3. Repeat for `/routines/morning-mobility/`, `/exercises/`, and `/muscles/quadriceps-rectus-femoris/`
   (the last must gate its exercise-list section only — the muscle's own content stays visible).
4. Acknowledge, then navigate freely. **Expected**: not gated again; a safety affordance is visible
   on every screen and reaches `/safety/` in one interaction.
5. Disable JavaScript entirely, clear storage, reload `/exercises/heel-slide/`.
   **Expected**: **the gate shows.** This is the fail-safe check and the most important manual step
   in this document — an implementation that reveals exercise content here has inverted the
   gate's logic and violates Principle I.

## Validating filters (SC-008)

Automated as a matrix in `tests/e2e/exercise-filters.spec.ts`. Manual spot-checks:

1. Apply one filter per dimension in turn; confirm results match and the count is stated.
2. Combine `modality=yoga` + `equipment=none`; confirm every result satisfies both.
3. Force a no-match combination.
   **Expected**: explicit empty state and a one-interaction clear action — never a bare empty list.
4. Copy the filtered URL into a new tab. **Expected**: identical filtered view.
5. Disable JavaScript and load `/exercises/`.
   **Expected**: the complete library renders unfiltered. Degraded, not broken.

## Validating accessibility (SC-009, SC-010, SC-011, SC-014)

```bash
pnpm test:e2e   # includes axe against every route, in both themes
```

**Expected**: zero violations. Automated checks are necessary but not sufficient, so also:

1. **Keyboard only** — unplug the mouse. Complete each primary journey: browse to a muscle, filter
   and open an exercise, follow a routine, run a search. Every one must be completable, with focus
   visible at every step.
2. **Screen reader** — apply a filter and confirm the result count change is announced.
3. **360px** — set the viewport to 360px wide. Confirm no horizontal page scroll on any route and
   that exercise instructions are readable without zooming.
4. **Colour** — view the exercise library in greyscale. Evidence labels and difficulty must remain
   distinguishable, since colour is not permitted as the sole carrier.
5. **Reduced motion** — enable the OS setting and confirm transitions are suppressed.

## Validating network isolation (SC-012, FR-040, FR-041)

```bash
pnpm build && pnpm check:isolation
```

**Expected**: passes with zero external origins in fetching positions.

Then the empirical check, which is the one that actually matters:

1. `pnpm preview`
2. Open DevTools → Network, disable network / go offline.
3. Navigate every section.
   **Expected**: identical behaviour, zero failed requests, zero requests to any external host.
4. Check Application → Storage. **Expected**: exactly two keys, `sthira:red-flags-ack` and
   `sthira:theme`, and nothing else (SC-013).

## Validating content extensibility (SC-015)

The proof of Principle III:

1. Add a new muscle: create one Markdown file in `src/content/muscles/`.
2. Add a new exercise targeting it: one Markdown file in `src/content/exercises/`.
3. `pnpm build && pnpm validate`

**Expected**: both appear in the catalogue, the library, search, and each other's cross-links —
with **zero changes to any file outside `src/content/`**. If presentation code had to change, the
content/presentation separation has leaked and the constitution's Principle III is violated.

## Reference

- Feature spec: [`spec.md`](./spec.md)
- Implementation plan: [`plan.md`](./plan.md)
- Content model: [`data-model.md`](./data-model.md)
- Authoring contract: [`contracts/content-schemas.md`](./contracts/content-schemas.md)
- Route & UI contract: [`contracts/routes.md`](./contracts/routes.md)
- Constitution: [`../../.specify/memory/constitution.md`](../../.specify/memory/constitution.md)
