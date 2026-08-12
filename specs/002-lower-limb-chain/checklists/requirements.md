# Specification Quality Checklist: Lower-Limb Chain — Hip and Ankle

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes

Requirement and criterion numbering starts at 101 to avoid collision with feature 001,
whose FR-001–046 and SC-001–015 remain in force. This feature adds to that spec rather
than replacing it.

**Issues found and corrected before finalising:**

1. *"Make the hip and ankle first-class" was not testable.* Replaced with FR-101 and FR-105
   (each joint owns its mechanics, sources and patterns) plus SC-101, which fails validation
   when a joint is missing any of the three.
2. *The chain relationship was initially described as a rendering concern.* It is a data
   concern: FR-108 to FR-112 make each structure declare its joint influences with a
   direct/indirect marker, and SC-102 fails the build on an unlinked structure or joint. This
   is what the user meant by "data, not prose that happens to mention it".
3. *"No regression" was unmeasurable.* SC-111 states it against the concrete prior state.
4. *Nothing forced patterns to be genuinely joint-specific.* FR-106 requires at least one
   ankle pattern with no knee analogue, which prevents relabelling knee content.

**Constitution alignment**: Principle I is preserved by FR-119–122 (joint-specific red flags,
gate unchanged, no symptom input). Principles II–VI are carried forward explicitly by FR-114,
FR-116, FR-124 and SC-112–114 rather than left implicit — new content is held to the same
gates as existing content.

**Status**: All items pass. Ready for `/speckit-plan`.
