# Contract: Routes & UI Surface

**Feature**: `001-knee-stiffness-reference` | **Date**: 2026-08-11

The URL surface is a real contract here because of FR-001: **every route that presents exercise
content is a potential first-visit entry point** via bookmark or shared link, and each must gate on
red-flag guidance. This document enumerates the surface and marks which routes gate.

## Route table

| Route | Content | Gated | Requirements |
|---|---|---|---|
| `/` | Home; entry to four sections; red-flag entry point | — | FR-032 |
| `/safety/` | Red-flag guidance, full list with sources | — | FR-002, FR-004 |
| `/understanding/` | Section index — mechanics, sources of stiffness, patterns | — | FR-008 |
| `/understanding/mechanics/` | Tibiofemoral & patellofemoral joints, ROM measurement, functional thresholds | — | FR-008, FR-010 |
| `/understanding/sources/` | The six physical sources of stiffness | — | FR-009 |
| `/understanding/sources/[id]/` | One stiffness source | — | FR-009 |
| `/understanding/patterns/` | The four general patterns | — | FR-011 |
| `/understanding/patterns/[id]/` | One pattern | — | FR-007, FR-011 |
| `/muscles/` | Muscle catalogue, grouped by region | — | FR-012, FR-013 |
| `/muscles/[id]/` | One muscle + exercises targeting it | **▲ partial** | FR-014–017 |
| `/exercises/` | Filterable library | **▲ yes** | FR-021, FR-022 |
| `/exercises/[id]/` | One exercise, full detail | **▲ yes** | FR-020, FR-023–025 |
| `/routines/` | Routine index | **▲ yes** | FR-026 |
| `/routines/[id]/` | One routine, ordered steps | **▲ yes** | FR-027–029 |
| `/search/` | Search across muscles and exercises | — | FR-030, FR-031 |
| `/404` | Not found, route back to browsing | — | FR-031 |

**▲ partial** on `/muscles/[id]/`: the muscle's own educational content is never gated — it makes
no exercise recommendation. Only its *exercise list* section is, since that section is exercise
content reached without passing through `/exercises/`. This is the subtle case FR-001 is easy to
fail on.

## Gate behaviour contract

For every gated route:

1. Server-rendered HTML contains **both** the gate and the content. Nothing is fetched.
2. A blocking inline script in `<head>` reads `sthira:red-flags-ack` and stamps
   `data-ack="1"` on `<html>` before first paint.
3. CSS keyed on `html[data-ack]` reveals content; its absence reveals the gate. **No flash of
   exercise content in either direction.**
4. Acknowledging sets the flag and reveals content without navigation (FR-002 — not blocked again).
5. **With JS disabled, the attribute is never stamped and the gate shows.** Fails safe.
6. The gate is bypassed on subsequent visits but `/safety/` remains one interaction away from every
   route via a persistent affordance (FR-002).

Separately, and independent of the gate: FR-003 framing ("general education, see a clinician")
renders unconditionally on every gated route with **no dismissal mechanism in the markup at all**.

## Filter state contract

`/exercises/` filter state is reflected in the query string so a filtered view is linkable and
back-button navigable:

```
/exercises/?modality=yoga&muscle=calf-gastrocnemius&goal=mobility&difficulty=beginner&equipment=none
```

- Each parameter is repeatable for OR-within-dimension; dimensions AND together.
- Unknown parameter values are ignored, not errored — a stale link degrades to a broader result set
  rather than a broken page.
- The result count is always stated (FR-021).
- Zero results renders an explicit empty state with a one-interaction clear-filters action
  (FR-031).
- With JS disabled, `/exercises/` renders the **complete unfiltered library** — degraded but fully
  usable, since the content is server-rendered and only the filtering is interactive.

## Cross-link contract

Bidirectional navigation required by FR-017 and FR-024:

- `/muscles/[id]/` → links to every exercise whose `targets` includes this muscle
- `/exercises/[id]/` → links to every muscle in its `targets`
- `/exercises/[id]/` → links to its regressions and progressions
- `/routines/[id]/` → each step links to `/exercises/[id]/`
- `/understanding/patterns/[id]/` → links to involved muscles and related stiffness sources

Every one of these is generated from validated references, so a rendered link cannot 404 (FR-036).

## Accessibility contract (applies to every route)

- One `<h1>`; heading levels descend without skipping.
- Landmarks: `banner`, `navigation`, `main`, `contentinfo`.
- Every interactive element keyboard-reachable with a visible focus ring; filter controls operable
  by keyboard alone (SC-009).
- Skip-to-content link first in tab order.
- Filter result updates announced via a polite live region — a sighted user sees the count change,
  and a screen-reader user must too.
- No horizontal page scroll at 360px (SC-014).
- Evidence labels and difficulty carry text and shape alongside colour (SC-011).
- `prefers-reduced-motion` suppresses all transitions (FR-046).

## Build-output contract

Verified by `scripts/check-no-external-origins.ts` against `dist/` (SC-012):

- Zero `http://`, `https://`, or protocol-relative `//` references in emitted HTML, CSS, or JS,
  **except** inside rendered citation text where a source URL is displayed to the reader as
  information. Those are rendered as visible text or as links the reader may choose to follow —
  they are never fetched by the page. The check distinguishes the two by requiring that no external
  origin appears in a fetching position: `src`, `href` on `<link>`, `@import`, `url()`, or any
  string passed to `fetch`/`XMLHttpRequest`.
- Zero font, script, or style references to third-party origins.
- Loading `dist/` with the network disabled produces byte-identical rendering.
