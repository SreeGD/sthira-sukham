# Phase 0 Research: Knee Stiffness Educational Reference

**Date**: 2026-08-11 | **Feature**: `001-knee-stiffness-reference`

The constitution constrains this stack unusually tightly. Three principles do most of the
selecting: content must be schema-validated data separate from presentation (III), the build must
fail on invalid or unsourced content (II/III), and the running app must make no network requests
at all (V). Most of the research below is about finding a stack where those are *native
properties* rather than things we bolt on and hope stay true.

---

## D1. Framework

**Decision**: Astro 5, static output (`output: 'static'`), with the Content Layer API.

**Rationale**: Astro is the only mainstream option where the constitution's hardest requirements
are built-in rather than additive:

- **Content collections with Zod schemas** are the native content model. `src/content.config.ts`
  defines a schema per collection; invalid frontmatter **fails the build**. That is FR-038 and
  SC-003 for free, enforced by the framework rather than by a lint step someone can skip.
- **`reference()`** validates cross-collection references at build time. An exercise pointing at a
  nonexistent muscle ID stops the build. That is FR-036 and SC-004, natively.
- **Zero JS by default.** Pages ship as HTML; JavaScript arrives only where an island is
  explicitly declared. Principle V's "no runtime network calls" is far easier to *keep* true when
  three components ship JS and the other twenty ship none.
- Static output means no server, no database, no auth — Principle V structurally.

**Alternatives considered**:

| Option | Why rejected |
|---|---|
| Next.js static export | Ships a React runtime and hydration payload on every route for an app that is ~90% static prose. Content validation would be hand-rolled. |
| Vite + React SPA | Client-side routing makes the deep-link red-flag gate (FR-001) harder, hurts no-JS resilience, and requires building the entire content pipeline and validation gate from scratch. |
| Eleventy | Excellent static generator, but no typed content validation or reference integrity. We would rebuild in userland exactly what Astro gives natively — the highest-risk part of the constitution. |
| Plain HTML/CSS, hand-authored | Directly violates Principle III: content would live in markup. |

---

## D2. Content format & storage

**Decision**: Markdown with YAML frontmatter for prose-bearing entities (muscles, exercises,
routines, stiffness sources, stiffness patterns), loaded via `glob()`. Pure-data entities (sources,
evidence labels, red flags) as YAML files loaded via `file()`.

**Rationale**: Muscles and exercises are ~80% structured fields and ~20% prose. Frontmatter holds
the structured fields where the schema can validate them; the body holds the narrative that would
be miserable as a quoted YAML string. Sources and the evidence vocabulary have no prose at all and
belong in single flat files so the whole citation list is reviewable in one view — which is the
point of Principle II.

One file per muscle and per exercise means a content reviewer with anatomy knowledge and no React
knowledge can review a diff. That is the actual goal of Principle III, and it is worth optimizing
the file layout around.

**Alternatives considered**: All-JSON (unreadable prose, no reviewable diffs); a headless CMS
(introduces a backend — violates Principle V); MDX (allows components inside content, which would
let presentation leak back into content — rejected specifically to protect Principle III).

---

## D3. Interactivity

**Decision**: Preact via `@astrojs/preact`, used for exactly three islands — the exercise-library
filter, search, and the theme toggle. Everything else is static HTML.

**Rationale**: The filter UI is genuinely stateful (five simultaneous filter dimensions, live
result count) and hand-rolled DOM manipulation for it would be a bug farm. Preact is ~4KB versus
React's ~45KB, and Astro's island model means those bytes load on the exercise-library route only.

The filter and search *logic* lives in `src/lib/` as pure functions with no Preact import, so it is
unit-testable without a DOM and the island stays a thin rendering shell.

**Alternatives considered**: Vanilla TS (fine for the theme toggle, painful for five-dimension
filtering); React (10× the payload for no benefit at this scale); Svelte (comparable, but Preact's
React-compatible API is more widely known to future contributors).

---

## D4. Search

**Decision**: Build-time-generated JSON index embedded directly in the search island's bundle,
matched client-side with normalized substring and prefix matching over name, common name,
abbreviations, and traditional name.

**Rationale**: The corpus is ~19 muscles and ~50 exercises — roughly 70 records, a few KB of index.
Any real search library is enormously overpowered.

Critically, **Pagefind was rejected despite being the natural Astro choice**: it fetches index
chunks at runtime. Those are same-origin requests, so they are arguably compliant, but they make
SC-012 ("identical behaviour with the network disabled") something we must reason about rather than
something that is trivially true, and they break entirely under `file://`. An embedded index makes
the network-isolation guarantee unarguable. At 70 records that costs us nothing.

Matching must be diacritic- and case-insensitive so `supta padangusthasana` is reachable however
the reader types it, and must cover abbreviations so `VMO` resolves (FR-030).

---

## D5. Red-flag gate without a flash (FR-001, SC-001)

**Decision**: The gate is server-rendered into every exercise-bearing page. A small blocking inline
script in `<head>` reads the acknowledgement flag from `localStorage` and stamps a `data-ack`
attribute on `<html>` before first paint. CSS keyed on that attribute decides whether the gate or
the exercise content is visible.

**Rationale**: This is the theme-flash-prevention pattern applied to a safety requirement. It is
the only approach that satisfies FR-001 on a *direct deep link* — a bookmarked or shared exercise
URL — without a visible flash of exercise content before the gate appears.

Its failure mode is the correct one: **with JavaScript disabled or broken, the attribute is never
stamped, and the gate shows.** Safety content is what survives degradation. An approach that
hid the gate by default and revealed it with JS would fail open, which is unacceptable under
Principle I.

The persistent framing of FR-003 is separate and simpler: it is always in the DOM with no
dismissal mechanism at all, so there is nothing to gate.

**Alternatives considered**: Client-side redirect to an interstitial (flashes content, breaks
deep links, fails open without JS); a build-time interstitial route wrapping every exercise
(forces the acknowledged reader through a gate on every navigation — rejected by FR-002's "not
blocked again").

---

## D6. Styling & theming

**Decision**: Hand-written CSS with a custom-property token layer. No CSS framework. Tokens defined
on bare `:root` for light, redefined under both `@media (prefers-color-scheme: dark)` (guarded
against an explicit light choice) and `:root[data-theme="dark"]`, so system preference and explicit
toggle both work in both directions.

**Rationale**: The design surface is small and the accessibility bar is specific (WCAG 2.1 AA
contrast, no colour-only meaning, reduced-motion support). Hand-written tokens make contrast ratios
auditable at a glance in one file; a utility framework scatters the same decisions across markup
and makes AA verification a per-element exercise. No framework also means no purge step and no
config surface between us and the output.

Evidence labels and difficulty indicators — the two places colour would naturally carry meaning —
must pair colour with **text and shape** (Principle VI, FR-022).

---

## D7. Testing & the quality gates

**Decision**: A four-gate model, all runnable in one command.

| Gate | Tool | Enforces |
|---|---|---|
| Content validity | Astro build (Zod + `reference()`) | FR-036, FR-038 · SC-003, SC-004 |
| Content policy | `scripts/validate-content.ts` (Vitest-run) | FR-006, SC-005, SC-006, and every-record-has-a-source |
| Behaviour | Vitest (unit) + Playwright (e2e) | Filter matrix SC-008, deep-link gate SC-001, keyboard SC-009 |
| Accessibility | `@axe-core/playwright`, both themes | SC-010, SC-011 |
| Network isolation | `scripts/check-no-external-origins.ts` over `dist/` | FR-040, SC-012 |

**Rationale**: Astro's Zod schemas catch *shape* violations but cannot express cross-record policy
— "no modality exceeds 60% of the library" (SC-006) or "every catalogued muscle has a targeting
exercise or an explicit note" (SC-005) are aggregate properties over the whole collection. Those
need a separate pass that loads all content and asserts across it.

The network-isolation check must run against **built output**, not source. Scanning source misses
origins introduced by a dependency's bundled asset. The check greps `dist/` for `http://`,
`https://`, and protocol-relative `//` in HTML, CSS, and JS, and fails on any hit.

Axe must run against both themes, because contrast violations are theme-specific and testing only
the default would miss half of them (SC-011).

**Alternatives considered**: Cypress (Playwright's multi-browser and a11y integration is stronger);
manual accessibility review only (not repeatable, and SC-010 asks for zero automated violations —
noting that automated checks are necessary, not sufficient, and keyboard traversal is verified
explicitly in e2e for that reason).

---

## D8. Content sourcing workflow

**Decision**: Sources are authored as a single reviewable YAML collection with a `tier` field
(`clinical-body`, `peer-reviewed`, `anatomy-text`, `practice-literature`). Every content record
references sources by ID. The evidence-label vocabulary is a separate fixed YAML collection whose
IDs are the only permitted values, with reader-facing definitions attached.

**Rationale**: Principle II's real risk is not a missing citation field — it is a citation field
filled with something unlocatable. Centralizing sources means the entire evidentiary basis of the
app is one file a reviewer can read top to bottom, and it makes source reuse across records the
default rather than a copy-paste.

Tiering matters for Principle IV: practice literature is a legitimate source for *what a tradition
holds*, and not a source for *a physiological mechanism*. Keeping the tier on the source makes that
distinction checkable rather than a matter of authorial discipline.

**Open item carried into implementation**: the specific evidence-label vocabulary (expected 3–4
terms spanning well-studied → traditional) is fixed during the first content task, not now, since
it should be set against the actual literature encountered. The schema treats it as a closed
reference set from day one, so adding a term is a deliberate act.

---

## D9. Scale & performance posture

~70 content records, ~15 routes, single language, no images required for correctness. Nothing here
stresses a static site generator. Performance goals are therefore stated as reader-facing outcomes
(instant navigation, no layout shift, legible at 360px) rather than throughput numbers, and no
performance work is planned beyond what static output gives by default.

The one real performance consideration is **bundle discipline**: the exercise-library route is the
only one shipping meaningful JS, and its budget is the Preact runtime plus the embedded search
index. If the index grows past a few tens of KB as content expands, revisit D4 — but not before.

---

## Resolved unknowns

All Technical Context items are resolved; no `NEEDS CLARIFICATION` markers remain.

| Unknown | Resolution |
|---|---|
| Language / framework | TypeScript 5.x on Node 22, Astro 5 static |
| Content storage | Markdown + YAML frontmatter (`glob()`); YAML data files (`file()`) |
| Interactivity | Preact, 3 islands |
| Search | Embedded build-time JSON index, client-side matching |
| Styling | Hand-written CSS custom-property tokens |
| Testing | Vitest, Playwright, `@axe-core/playwright`, two custom check scripts |
| Package manager | pnpm 10 (present on the machine) |
| Target | Modern evergreen browsers, 360px and up, static file hosting or local `preview` |
