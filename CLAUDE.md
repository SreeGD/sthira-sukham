# Sthira Sukham

A statically built, locally run educational reference on stiff knee pain: joint mechanics, the
muscles involved, and an exercise library drawn from clinical range-of-motion work, yoga, Pilates,
and tai chi/qigong.

## Read these first

- **`.specify/memory/constitution.md`** — six principles that govern this project. Principle I
  (educational, never prescriptive) is non-negotiable and cannot be waived.
- `specs/001-knee-stiffness-reference/plan.md` — stack, structure, sequencing
- `specs/001-knee-stiffness-reference/contracts/content-schemas.md` — content authoring contract
- `specs/001-knee-stiffness-reference/contracts/routes.md` — routes, gate, filter, build-output

## Stack

TypeScript on Node 22 · Astro 5 (static, Content Layer API) · Preact for three islands only ·
Zod via Astro content collections · Vitest · Playwright + `@axe-core/playwright` · pnpm

## Commands

```bash
pnpm dev · pnpm build · pnpm preview
pnpm validate         # cross-collection content policy
pnpm test             # Vitest unit
pnpm test:e2e         # Playwright + axe
pnpm check:isolation  # assert dist/ has no external origins
pnpm verify           # all of the above — this is the gate
```

## The joint model (feature 002)

Knee, hip and ankle are first-class joints in `src/content/joints/`. Each structure declares
`jointInfluences[]` — the joint, whether it acts `direct` or `indirect`, and how restriction
presents *there*.

- **`region` and `jointInfluences` are different facts.** `region` is where a structure lives and
  drives the leg locator diagram; `jointInfluences` is what it changes. Gastrocnemius lives at the
  ankle and crosses the knee. Do not merge them.
- **`indirect` is authored, never inferred.** Gluteus medius influences the knee without crossing
  it. Deriving that would need attachment data these records do not hold.
- **`presentsAsKneeStiffness` is gone.** If you find yourself re-adding a knee-specific field,
  the answer is another entry in `jointInfluences`.
- The joint→structures edge is derived in `src/lib/chain.ts`, never stored — same rule as
  `cross-links.ts`.

## Things that will bite you

- **The build failing on content is correct behaviour**, not a bug to work around. Unsourced
  content, an exercise missing `contraindications`/`stopIf`/`evidenceLabel`, or an unresolved
  reference must fail. There is deliberately no override flag — do not add one.
- **The red-flag gate fails safe.** The gate is server-rendered and *visible by default*; JS
  reveals the content by stamping `<html>` pre-paint. If you find yourself inverting this so the
  gate is hidden by default and JS shows it, stop — that fails open and violates Principle I.
- **`/muscles/[id]/` gates partially.** The muscle's own content is never gated; only its exercise
  list is. Easy to miss.
- **No `symptoms` field on `StiffnessPattern`.** Its absence is a structural guard against the app
  becoming a symptom checker, not an oversight. Don't add one.
- **Filter/search logic lives in `src/lib/`, framework-free.** Islands are thin rendering shells.
  Keep the logic out of the components so it stays unit-testable without a DOM.
- **Adding content must never require touching code outside `src/content/`.** That property is
  SC-015 and is the practical test of Principle III.
- **Pagefind was rejected deliberately** (runtime index fetches). Search uses an embedded
  build-time index. Don't "improve" this without reading research.md D4.
- **Colour is never the sole carrier of meaning** — evidence labels and difficulty pair colour with
  text and a shape token.

## Diagrams

Inline SVG in `src/components/diagrams/`. `LegLocator` draws all 19 muscle pages from
one asset, keyed by the record's `diagramZone`. Zone vocabulary lives in
`src/lib/diagram-zones.ts` — imported by both the schema and the component, because a
zone that is authorable but undrawable is the failure mode.

- **Explanatory text belongs in the HTML caption, not inside the SVG.** SVG text clips
  silently past the viewBox and does not reflow. There is a test comparing every text
  node's bbox to its viewBox; it exists because the first draft clipped its 0° label.
- Lateral is the LEFT of the front figure and the RIGHT of the back figure. Viewed from
  behind, the sides swap — getting it wrong puts the glutes and IT band on opposite
  sides of the same leg.
- Astro components cannot `export` values; shared vocabularies go in `src/lib/`.
- **`pnpm verify` runs against `dist/`, so dev-only failures are invisible to it.** A
  duplicated JSX attribute once built and tested clean while throwing in `pnpm dev`. After
  changing components, start the dev server and run `pnpm smoke:dev`.

## Workflow

Spec Kit. `/speckit-tasks` → `/speckit-implement`. Constitution check is part of every plan.
