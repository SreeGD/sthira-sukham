# Quickstart & Validation Guide: Lower-Limb Chain

**Feature**: `002-lower-limb-chain` | **Date**: 2026-08-12

Commands are unchanged from feature 001 — see [that quickstart](../001-knee-stiffness-reference/quickstart.md).
`pnpm verify` remains the gate. What follows is what this feature specifically adds.

## Proving the migration is complete

```bash
# Restore the old field on any muscle and remove its jointInfluences, then:
pnpm build
```

**Expected**: build fails. `jointInfluences` is required, so a record left half-migrated cannot
ship (FR-125). There must be no fallback that reads the old field.

```bash
grep -r "presentsAsKneeStiffness" src/
```

**Expected**: no matches outside the feature-001 spec documents. A surviving reference means two
places record the same relationship.

## Proving the chain holds

```bash
pnpm validate
```

**Expected**: passes, and reports per-joint counts — structures influencing each joint, sources
and patterns per joint.

Then break it deliberately:

1. Remove every `jointInfluences` entry from one structure → **expected**: validation fails naming
   that structure (SC-102).
2. Delete every stiffness source for the ankle → **expected**: validation fails naming the ankle
   (SC-101).

## Proving nothing regressed

```bash
pnpm verify
```

**Expected**: every test that passed before this feature still passes (SC-111). Where a framing
change legitimately breaks a knee-specific assertion, the task that changed it says so — a test
edited without a stated reason is the thing to look for in review.

## Manual checks this feature adds

1. **Both directions.** From `/muscles/gastrocnemius/`, reach the ankle and the knee. From each
   joint page, reach back to gastrocnemius. No dead ends either way.
2. **Indirect is visibly different.** On `/muscles/gluteus-medius/`, the knee influence is marked
   as acting through another joint, not presented as a direct attachment.
3. **No knee framing.** Read the home page, the navigation and every section heading. Nothing
   should imply the reference is knee-only (FR-107).
4. **The gate still fires.** Clear storage, deep-link to an exercise added by this feature, with
   JavaScript disabled. The red-flag gate must show.
