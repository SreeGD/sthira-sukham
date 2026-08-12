# Contract: Joint Model and Chain Relationships

**Feature**: `002-lower-limb-chain` | **Date**: 2026-08-12

Extends [feature 001's authoring contract](../../001-knee-stiffness-reference/contracts/content-schemas.md),
which remains in force. Only additions and changes are documented here.

## Guarantees added

1. **Every structure states its reach.** A structure declares at least one joint it influences,
   with the mechanism, or it fails validation.
2. **Every joint is reachable.** A joint with no structures, no stiffness sources or no patterns
   fails validation.
3. **Direction is recorded, not guessed.** `direct` versus `indirect` is authored with the
   mechanism stated; nothing infers it.
4. **Migration cannot be partial.** `jointInfluences` is required, so a record still carrying only
   the old knee-specific field does not build.

## Authoring example: a structure crossing two joints

```yaml
anatomicalName: Gastrocnemius
region: ankle          # where it lives — drives the locator diagram
jointInfluences:
  - joint: ankle
    action: direct
    presentsAs: >-
      Limits how far the shin can travel forward over the foot, which shows up
      as a blocked feeling at the front of the ankle when squatting.
  - joint: knee
    action: direct     # it crosses the knee too
    presentsAs: >-
      Resists full knee straightening when the foot is flexed upward, because
      the muscle originates above the knee on the thigh bone.
```

## Authoring example: influence without crossing

```yaml
anatomicalName: Gluteus medius
region: hip
jointInfluences:
  - joint: hip
    action: direct
    presentsAs: Weakness lets the pelvis drop on the unsupported side in single-leg stance.
  - joint: knee
    action: indirect   # does not cross the knee
    presentsAs: >-
      Controls whether the thigh bone rotates inward under load. When it does not,
      the groove the kneecap runs in rotates underneath it — the kneecap has not
      moved, but its track has.
```

The `indirect` marker is what lets the interface say "acts through the hip" rather than implying
the muscle attaches at the knee.

## Rules that fail the build

| Rule | Applies to | Requirement |
|---|---|---|
| Reach declared | structures | `jointInfluences.length >= 1` |
| Mechanism stated | structures | every influence has non-empty `presentsAs` |
| Direction stated | structures | every influence has `action` in {direct, indirect} |
| Old field gone | structures | `presentsAsKneeStiffness` no longer accepted |
| Joint stated | stiffness sources, patterns | `joint` resolves |
| Joints stated | red flags, goals | at least one, all resolving |
| Thresholds tied to activity | joints | `romThresholds.length >= 2` |

## Cross-collection rules (policy script)

| Rule | Source |
|---|---|
| Every joint has at least one stiffness source | SC-101 |
| Every joint has at least one pattern | SC-101 |
| Every joint has at least one structure influencing it | SC-102 |
| Every structure influences at least one joint | SC-102 |
| At least one ankle pattern has no knee analogue | FR-106 |
| All FR-113 structures present | SC-104 |

Referential integrity for every new reference type runs through the existing `checkRefs` helper,
because Astro's `reference()` validates id shape but not existence — see feature 001, research
D10. Every new reference inherits that gap.
