# Phase 1 Data Model: Lower-Limb Chain

**Date**: 2026-08-12 | **Feature**: `002-lower-limb-chain`

One new entity, one replaced field, and four entities gaining a joint reference. Everything else
from feature 001 is unchanged.

## What changes

```text
                        ┌─────────┐
                   ┌───►│  Joint  │◄────┬──────────────┐
                   │    └─────────┘     │              │
                   │         ▲          │              │
        jointInfluences[]    │       joint          joint
                   │         │          │              │
            ┌──────────┐     │   ┌──────────────┐  ┌──────────┐
            │ Structure│     │   │StiffnessSource│ │ RedFlag  │
            └──────────┘     │   │StiffnessPattern│└──────────┘
                   │         │   └──────────────┘
              targets        └──── dependsOnJoints[] ──── FunctionalGoal
                   │
            ┌──────────┐
            │ Exercise │   (unchanged — targets structures, not joints)
            └──────────┘
```

## 1. Joint — NEW

**Collection**: `joints` · Markdown + frontmatter · **3 records** (knee, hip, ankle)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | slug | ✔ | `knee` \| `hip` \| `ankle` — the reference vocabulary |
| `name` | string | ✔ | "The knee" |
| `plainDescription` | string | ✔ | One line a non-clinician understands |
| `order` | number | | Proximal to distal |
| `romThresholds` | object[] | ✔ | `{ activity, degrees, note }` — ≥2, each tied to a concrete activity (FR-104) |
| `sources` | ref[] → Source | ✔ | ≥1 |
| *body* | Markdown | ✔ | Mechanics narrative (FR-102, FR-103) |

**Validation**: every joint must have ≥1 stiffness source, ≥1 pattern, and ≥1 structure
influencing it (SC-101, SC-102). Checked by the policy script — cross-collection, so no schema
can express it.

## 2. Structure — REPLACED FIELD

`presentsAsKneeStiffness: string?` is **deleted**. In its place:

| Field | Type | Req | Notes |
|---|---|---|---|
| `jointInfluences` | object[] | ✔ | ≥1. Each `{ joint, action, presentsAs }` |
| ↳ `joint` | ref → Joint | ✔ | |
| ↳ `action` | enum | ✔ | `direct` (crosses the joint) \| `indirect` (acts through another structure or joint) |
| ↳ `presentsAs` | string | ✔ | How restriction here presents **at that joint** |

`region` is untouched and still means *where the structure lives* — the leg locator depends on it
(research D1).

**Migration**: all 19 records. The 8 with the old field convert their text into a knee influence;
the other 11 gain influences they never had to state. Required-ness is what forces completeness
(FR-125).

## 3. StiffnessSource — GAINS A JOINT

| Field | Type | Req | Notes |
|---|---|---|---|
| `joint` | ref → Joint | ✔ | New |

6 records become 18 — the same six mechanisms authored per joint, each described for that joint
rather than restated (research D4).

## 4. StiffnessPattern — GAINS A JOINT

| Field | Type | Req | Notes |
|---|---|---|---|
| `joint` | ref → Joint | ✔ | New |

Existing 4 become knee patterns. Hip and ankle get their own; no analogues are forced, and at
least one ankle pattern must have no knee equivalent (FR-106).

## 5. RedFlagItem — GAINS JOINTS

| Field | Type | Req | Notes |
|---|---|---|---|
| `joints` | ref[] → Joint | ✔ | ≥1. Which joints the sign concerns (FR-120) |

Existing 8 are largely general and reference all three; hip- and ankle-specific signs are added
(FR-119).

## 6. FunctionalGoal — GAINS JOINTS

| Field | Type | Req | Notes |
|---|---|---|---|
| `dependsOnJoints` | ref[] → Joint | ✔ | ≥1 (FR-118) |

## New structures to catalogue (FR-113)

| Structure | region | Influences |
|---|---|---|
| Deep hip rotators (incl. piriformis) | hip | hip direct; knee indirect (femoral rotation) |
| Tibialis anterior | ankle | ankle direct |
| Tibialis posterior | ankle | ankle direct; knee indirect (arch → tibial rotation) |
| Peroneal group | ankle | ankle direct |
| Achilles tendon | ankle | ankle direct (non-contractile) |
| Plantar fascia | ankle | ankle direct (non-contractile) |

Taking the catalogue from 19 to 25.

## Unchanged

Exercise, Routine, Source, EvidenceLabel and every diagram component are untouched. Exercises
target structures; structures now carry the joint relationship, so the chain reaches exercises
without exercises knowing about joints.
