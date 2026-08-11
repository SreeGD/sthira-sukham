<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: MAJOR-equivalent initial ratification. Template placeholders replaced with
                concrete, project-specific governance. No prior version existed.

Principles defined (6, expanded from the 5-slot template):
  - I.   Educational, Never Prescriptive (NON-NEGOTIABLE)
  - II.  Every Claim Is Sourced
  - III. Content Is Data, Not Markup
  - IV.  Modality Honesty
  - V.   Local-First, Zero Backend
  - VI.  Usable Mid-Exercise

Sections added:
  - Content Standards (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance

Templates requiring updates:
  ✅ .specify/memory/constitution.md (this file)
  ⚠ .specify/templates/plan-template.md — Constitution Check gate should reference
     Principles I–VI by name at /speckit-plan time (handled per-feature, no edit needed:
     template reads this file dynamically)
  ⚠ .specify/templates/spec-template.md — no edit required; safety/sourcing requirements
     are expressed per-feature as functional requirements
  ⚠ .specify/templates/tasks-template.md — no edit required; content-sourcing and a11y
     task types are emitted per-feature

Deferred TODOs: none
-->

# FixKnee Constitution

FixKnee is a locally-run, interactive educational reference on stiff knee pain: the joint
mechanics and muscles involved, and the range-of-motion, yoga, Pilates, and tai chi practices
that address them. It is a general reference — it does not personalize, diagnose, or track.

## Core Principles

### I. Educational, Never Prescriptive (NON-NEGOTIABLE)

The application MUST NOT diagnose a condition, assert a cause for any individual's symptoms,
or prescribe a treatment. Content MUST be framed as general education about how the knee works
and what practices are commonly used.

Concretely:

- Every page that presents exercises MUST surface persistent, non-dismissible framing that a
  clinician or physiotherapist is the correct source for personal diagnosis.
- Red-flag guidance (locking, giving way, inability to bear weight, hot/swollen joint, fever,
  sudden severe pain, night pain, pain after trauma) MUST be reachable in one interaction from
  anywhere in the app, and MUST be shown before any exercise content on first visit.
- Exercise entries MUST carry explicit contraindications and "stop if" criteria. An exercise
  without them MUST NOT ship.
- No feature may accept symptom input and return a narrowed set of causes or a recommended
  protocol. Filtering by movement goal (e.g. "improve flexion range") is permitted; filtering
  by symptom to imply a diagnosis is not.

Rationale: The failure mode for health content is not being unhelpful — it is being confidently
wrong about a specific person's body. Structural constraints beat disclaimers.

### II. Every Claim Is Sourced

Every anatomical statement, muscle-role attribution, and exercise indication MUST carry a
citation to a reputable source: peer-reviewed literature, a major clinical body (e.g. AAOS,
NHS, Cochrane), an anatomy reference text, or — for traditional practices — established
practice literature identified as such.

- A content record without at least one source MUST fail the content validation gate.
- Citations MUST include enough to locate the source unaided: title, author or issuing body,
  year, and a URL or DOI where one exists.
- Sources MUST be visible in the UI, not buried in the data files.

Rationale: Unsourced health content is indistinguishable from invention, including to its
author. Requiring the citation at authoring time is what keeps the claim honest.

### III. Content Is Data, Not Markup

Anatomy, muscles, exercises, and routines MUST live in structured, schema-validated data files
separate from presentation code. The UI renders from that data and MUST NOT hardcode content.

- A schema MUST exist for each content type, and all records MUST validate against it in CI.
- Adding a muscle or an exercise MUST require no component changes.
- Cross-references between records (exercise → muscles worked, muscle → related exercises)
  MUST be by stable ID, and referential integrity MUST be checked by the validation gate.

Rationale: Claims stay auditable, reviewable, and correctable only when they are enumerable.
Content buried in JSX cannot be diffed by a reviewer who knows anatomy but not React.

### IV. Modality Honesty

Movements drawn from yoga, Pilates, or tai chi MUST be presented under their real names and
attributed to their tradition, alongside plain-language mechanics describing what the body is
actually doing.

- Each exercise MUST carry an evidence label from a fixed, defined vocabulary distinguishing
  well-studied interventions from traditional or low-evidence practice.
- The evidence label MUST be visible wherever the exercise is presented, not only on a detail
  page.
- Traditional framing MUST NOT be restated as physiological mechanism. Describing a movement
  as "believed in its tradition to..." is permitted; asserting an unevidenced mechanism as fact
  is not.

Rationale: These traditions have genuinely useful movement, and they carry claims of varying
evidentiary weight. Flattening the difference in either direction misleads.

### V. Local-First, Zero Backend

The application MUST run entirely from a local static build with no backend service, no
database, no authentication, and no runtime network requests.

- No telemetry, analytics, or error reporting that leaves the machine.
- All assets (fonts, images, diagrams) MUST be bundled; no CDN or third-party origins at
  runtime.
- No user data is collected, stored, or transmitted — there is no tracking feature and none
  may be added without a constitutional amendment.

Rationale: Health interest is sensitive. The strongest privacy guarantee is an application
architecturally incapable of transmitting anything.

### VI. Usable Mid-Exercise

The interface MUST be usable by someone on a mat, mid-session, at arm's length.

- Fully responsive from 360px; exercise instructions legible on a phone without zooming.
- Complete keyboard navigability; visible focus indicators; correct semantic landmarks and
  heading order.
- Colour contrast MUST meet WCAG 2.1 AA; colour MUST NOT be the sole carrier of meaning
  (evidence labels and difficulty indicators especially).
- Light and dark themes MUST both be fully supported and legible.
- Any motion or animation MUST respect `prefers-reduced-motion`.

Rationale: A reference consulted while lying on the floor with a stiff knee has different
ergonomics than one read at a desk. Design for the actual moment of use.

## Content Standards

- **Schema-first**: a content type's schema is defined and reviewed before records are
  authored against it.
- **Anatomical vocabulary**: standard anatomical terminology (flexion, extension, and the
  named muscles) is used as the canonical term, with a plain-language gloss attached. Neither
  substitutes for the other.
- **Named source tiers**: the evidence vocabulary for Principle IV is defined once in the
  schema and reused; ad-hoc evidence strings are a validation failure.
- **No stock medical imagery of real people**; anatomical illustration MUST be either
  originally authored or carry a licence permitting redistribution, recorded in the record.
- **Scope discipline**: content covers stiff knee pain broadly — osteoarthritic, patellofemoral,
  post-injury, and sedentary/disuse patterns — without steering a reader toward one.

## Development Workflow & Quality Gates

The following gates MUST pass before any change merges:

1. **Content validation** — all records validate against their schema; all cross-references
   resolve; every record has ≥1 source; every exercise has contraindications and an evidence
   label. (Principles I, II, III, IV)
2. **Accessibility** — automated a11y checks pass with zero violations; keyboard traversal of
   primary flows verified. (Principle VI)
3. **Network isolation** — build output contains no external origins; verified by an automated
   check, not by inspection. (Principle V)
4. **Tests** — content-rendering and data-integrity logic is covered by tests. New content
   types ship with schema validation tests.

A change that cannot pass a gate MUST NOT be merged behind a `TODO`; either the content is
completed or the record is withheld from the build.

## Governance

This constitution supersedes other practices and conventions in this repository. Where a
convenience conflicts with a principle, the principle wins.

**Amendment procedure**: amendments MUST be made by editing this file, with the Sync Impact
Report at the top updated to record the change, the version incremented per the policy below,
and dependent templates re-checked for consistency in the same change.

**Versioning policy** (semantic):

- **MAJOR** — a principle is removed or redefined in a backward-incompatible way (e.g.
  permitting a backend, or allowing personalized recommendations).
- **MINOR** — a principle or governance section is added, or guidance is materially expanded.
- **PATCH** — clarification, wording, or non-semantic refinement.

**Compliance review**: every plan produced by `/speckit-plan` MUST include a Constitution Check
naming which principles the feature touches and how it satisfies them. Principle I violations
are blocking and MUST NOT be waived by the complexity-justification path available to other
principles.

**Version**: 1.0.0 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-08-11
