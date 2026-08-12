# Phase 0 Research: Lower-Limb Chain

**Date**: 2026-08-12 | **Feature**: `002-lower-limb-chain`

No new technology is under consideration. The stack, gates and diagram machinery from feature
001 all carry over unchanged. What needs deciding is the **shape of the data model change**, and
one migration question that determines whether the existing 404 tests survive.

The measured starting point:

| | count | note |
|---|---|---|
| muscles | 19 | `region`: knee 11, hip 6, ankle 2 |
| records with `presentsAsKneeStiffness` | 8 | the entire chain relationship, one-way |
| stiffness sources | 6 | no joint reference |
| stiffness patterns | 4 | no joint reference |
| red flags | 8 | joint-agnostic |
| functional goals | 9 | joint-agnostic |
| exercises | 58 | unaffected — they target structures, not joints |

---

## D1. `region` is not what we need, and must not be reused

**Decision**: Keep `region` as-is (where a structure physically lives) and add a separate
`jointInfluences` array (which joints it acts on, and how).

**Rationale**: These are different facts and conflating them is the bug waiting to happen.
Gastrocnemius has `region: ankle` because that is where it acts primarily — but it crosses the
knee, and its knee effect is the reason it is catalogued here at all. Rectus femoris lives at the
knee and acts at the hip. A single field cannot answer both "where is it" and "what does it
change", and the leg locator diagram already depends on `region` meaning *location*.

**Alternatives considered**: Widening `region` to an array (breaks the locator, and still
conflates the two questions); deriving influence from anatomy (the data does not hold origins and
insertions, so this would be inference dressed as fact).

---

## D2. Replace `presentsAsKneeStiffness`, do not supplement it

**Decision**: Delete the field. Every structure gains `jointInfluences: [{ joint, action, presentsAs }]`,
with `action` being `direct` or `indirect`. Migration is all-or-nothing, enforced by making the new
field required.

**Rationale**: Keeping both would leave two places recording the same relationship, which is the
failure mode Principle III exists to prevent — and the old field can only ever say something about
the knee, so it would rot the moment a hip-to-ankle relationship needed recording.

Making the new field required is what forces a complete migration. A half-migrated content set
fails the build rather than silently rendering some structures without their chain (spec FR-125).

**Cost, stated plainly**: all 19 muscle records change, and every structure — not just the 8 that
had the old field — must now declare at least one influence. That is the point: a structure in a
knee/hip/ankle reference that influences none of them does not belong in it.

---

## D3. `indirect` is authored, never inferred

**Decision**: The `action` marker is written by the author with the mechanism stated in
`presentsAs`. Nothing derives it.

**Rationale**: Tensor fasciae latae influences the knee without crossing it, via the iliotibial
band. Gluteus medius influences the knee by controlling femoral rotation. Both are real and
neither is derivable from any field the content holds. Inferring "indirect" from "does not cross
this joint" would require attachment data the records do not have, and would produce a claim the
author never made — in a reference whose second principle is that every claim is sourced.

---

## D4. Sources recur per joint; patterns do not

**Decision**: The six stiffness sources are authored once per joint, described for that joint.
Patterns are authored per joint with no expectation of analogues.

**Rationale**: The sources are tissue-level mechanisms — a capsule can tighten anywhere, an
effusion can occupy any joint — so the same six recur, and a reader who has learnt the frame at
one joint can apply it at the next. That repetition is a feature.

Patterns are presentations, and they do not transfer. Patellofemoral pain has no ankle analogue;
post-sprain restriction and anterior ankle impingement have no knee analogue. Forcing a pattern
per joint would produce padding, and the spec guards against exactly that by requiring at least
one ankle pattern with no knee equivalent (FR-106).

**Consequence**: 18 source records (6 × 3 joints) where there are 6 today. Each is short, and
each says something joint-specific rather than restating the mechanism.

---

## D5. Joints are content, not an enum

**Decision**: A `joints` collection with three records, each carrying mechanics prose, functional
ROM thresholds and sources — not a hardcoded list in TypeScript.

**Rationale**: Every joint page carries sourced claims (thresholds, mechanics), and Principle II
requires those to live in reviewable content rather than in code. A `z.enum(['knee','hip','ankle'])`
would still be needed for *references*, but the joint's own content is content.

This also keeps SC-114 true: adding a joint would be a content operation, even though we are not
adding one.

---

## D6. Reuse every gate; add three

**Decision**: No new gate infrastructure. The existing content-policy script gains three checks:
every structure declares ≥1 influence; every joint is influenced by ≥1 structure; every joint has
mechanics, sources and patterns.

**Rationale**: The gates from 001 already cover sourcing, safety fields, referential integrity,
modality balance and isolation, and they apply to the new content unchanged. The three additions
are the ones expressing this feature's specific invariants (SC-101, SC-102).

Referential integrity for the new joint references rides on the existing `checkRefs` helper —
which matters, because Astro's `reference()` still does not validate existence (feature 001,
research D10), and every new reference type inherits that gap.

---

## D7. The existing knee tests are the regression suite

**Decision**: Do not modify any test from feature 001 except where a deliberate framing change
makes an assertion factually wrong. Every such edit is justified in the task that makes it.

**Rationale**: SC-111 is "all previously passing tests still pass", and the cheapest way to
violate it invisibly is to relax an assertion until it goes green. Framing changes (FR-107) will
legitimately break tests that assert knee-specific headings; those get updated with the reason
recorded, and nothing else is touched.

---

## Resolved unknowns

| Unknown | Resolution |
|---|---|
| How to express the chain | `jointInfluences[]` per structure, with direct/indirect and a per-joint statement |
| Whether to keep `region` | Yes — it means location, `jointInfluences` means effect |
| Migration strategy | All-or-nothing; new field required so partial migration fails the build |
| Source/pattern generalisation | Sources 6 per joint; patterns joint-specific, no forced analogues |
| Joint representation | Content collection, referenced by enum-validated id |
| New gates | Three, added to the existing policy script |
