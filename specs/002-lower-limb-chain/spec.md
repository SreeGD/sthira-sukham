# Feature Specification: Lower-Limb Chain — Hip and Ankle

**Feature Branch**: `002-lower-limb-chain`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Extend Sthira Sukham from a knee-only reference to one covering the knee, hip and ankle as a connected chain. Generalise the knee-shaped parts of the model (stiffness sources and patterns per joint, muscles stating how they present at each joint they influence, goals stating which joints they depend on). Add hip and ankle mechanics, sourced functional ROM thresholds, the structures not yet catalogued, exercises for them, and joint-specific red flags. Keep every constitutional principle and every existing test passing. The chain relationship must be validated data, not prose. Out of scope: spine, foot beyond plantar fascia and arch, upper body, joint-specific diagnosis."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Arrive with a stiff hip and get the same treatment (Priority: P1)

Someone whose hip is stiff — not their knee — opens the reference. They find hip mechanics explained on the same terms the knee already enjoys: what the joint actually is, the physically distinct reasons it stiffens, and how much movement everyday activities need from it. Nothing about the experience tells them they are a second-class reader whose joint was added later.

**Why this priority**: This is the feature. The reference currently treats hip and ankle structures only as contributors to knee problems; a reader whose complaint *is* the hip finds their muscles catalogued but their joint unexplained. Until this works, the expansion has not happened.

**Independent Test**: With hip content present and ankle content absent, a reader can navigate hip mechanics, hip stiffness sources, and hip patterns end to end, and can state what a hip capsular restriction is and how much hip flexion sitting requires — without the word "knee" appearing as the framing of any of it.

**Acceptance Scenarios**:

1. **Given** a reader on the Understanding section, **When** they choose the hip, **Then** they find joint mechanics covering the ball-and-socket structure and its available range, with every anatomical claim sourced.
2. **Given** a reader viewing hip stiffness sources, **When** they read them, **Then** each source is presented in the same six-way frame the knee uses, described for the hip specifically rather than restated from the knee.
3. **Given** a reader viewing hip range-of-motion content, **When** they read the functional thresholds, **Then** degree ranges are tied to concrete activities and carry a citation.
4. **Given** any page in the reference, **When** a reader reads its framing and navigation, **Then** no heading or section label implies the reference is about the knee alone.

---

### User Story 2 - Arrive with a stiff ankle and get the same treatment (Priority: P1)

The same for the ankle: its own mechanics, its own sources of stiffness, its own patterns — including ones with no knee analogue, such as restriction after a sprain and impingement at the front of the joint. The reader learns why dorsiflexion is the direction that matters functionally, and why it differs with the knee bent versus straight.

**Why this priority**: Equal-priority with Story 1 and independently shippable. The ankle is the more commonly neglected of the two and the one whose restriction most often surfaces elsewhere.

**Independent Test**: With ankle content present, a reader can navigate ankle mechanics, sources and patterns end to end, and can explain why a calf stretch feels different with a straight versus bent knee.

**Acceptance Scenarios**:

1. **Given** a reader viewing ankle mechanics, **When** they read it, **Then** both the talocrural and subtalar joints are described, and dorsiflexion is identified as the functionally critical direction with the reason given.
2. **Given** a reader viewing ankle mechanics, **When** they read about dorsiflexion, **Then** the bent-knee and straight-knee difference is explained and attributed to the structure responsible.
3. **Given** a reader viewing ankle stiffness patterns, **When** they read them, **Then** patterns specific to the ankle are present rather than knee patterns relabelled.

---

### User Story 3 - Follow a restriction along the chain (Priority: P1)

A reader on the ankle page sees, as a first-class part of the page rather than a passing remark, which joints above are affected by ankle restriction and how. From a hip structure they can move to what it does at the knee. The relationship is navigable in every direction, and every such link is generated from data rather than written by hand.

**Why this priority**: This is what distinguishes the feature from "more content". The reference's central argument is that a stiff joint is often another joint's problem; making that argument traversable in both directions is the point, and it is what the existing one-way `presentsAsKneeStiffness` field cannot express.

**Independent Test**: From any catalogued structure, a reader can reach every joint that structure influences, and from any joint reach every structure that influences it, with no dead links in either direction.

**Acceptance Scenarios**:

1. **Given** a structure that crosses more than one joint, **When** a reader views it, **Then** it states separately, for each joint it influences, how restriction in it presents there.
2. **Given** a joint page, **When** a reader views it, **Then** it lists the structures that influence that joint, distinguishing those acting on it directly from those acting through a neighbouring joint.
3. **Given** any structure-to-joint relationship shown in the interface, **When** the reader follows it, **Then** it resolves to an existing page.
4. **Given** the chain relationships, **When** the content set is validated, **Then** every structure declares at least one joint it influences, and every joint has at least one structure influencing it.

---

### User Story 4 - Find movements for a hip or ankle goal (Priority: P2)

A reader filters the exercise library for ankle mobility, or picks a goal that depends mostly on hip range, and gets movements that address it — including ones added specifically for the newly catalogued structures. Every one carries the same safety fields, sourcing and evidence labelling the existing library requires.

**Why this priority**: Depends on Stories 1–3 for the structures and joints to exist. It is the payload, but the frame has to be right first.

**Independent Test**: Filtering by any newly catalogued structure returns exercises that genuinely target it, and each opens to a complete entry meeting every existing content requirement.

**Acceptance Scenarios**:

1. **Given** the exercise library, **When** a reader filters by a newly catalogued structure, **Then** at least one exercise is returned and each targets that structure.
2. **Given** any newly added exercise, **When** a reader opens it, **Then** it carries contraindications, stop-criteria, an evidence label and sources, exactly as existing entries do.
3. **Given** the goal guide, **When** a reader views any goal, **Then** it states which joints that activity depends on.
4. **Given** the expanded library, **When** the content set is validated, **Then** every catalogued structure is targeted by at least one exercise or carries an explicit note explaining why not.

---

### User Story 5 - Know the joint-specific warning signs (Priority: P1)

The red-flag guidance covers signs specific to the hip and the ankle where they differ from the knee's — and the reader can tell which joint a given sign concerns.

**Why this priority**: P1 and non-negotiable under Principle I. Exercise content for a new joint must not ship before the warning signs for that joint. It gates Story 4.

**Independent Test**: The safety content includes hip- and ankle-specific signs, each identifiable by joint, and the gate still fires on every entry route.

**Acceptance Scenarios**:

1. **Given** the safety content, **When** a reader views it, **Then** signs specific to the hip and to the ankle are present alongside the general and knee-specific ones.
2. **Given** any red-flag sign, **When** a reader views it, **Then** the joint or joints it concerns are identifiable.
3. **Given** a first-time visitor, **When** they reach any exercise content by any route, **Then** the gate fires exactly as it does today, with no regression.

---

### Edge Cases

- **A structure crosses two joints and presents differently at each** (gastrocnemius, rectus femoris, the hamstrings): each joint gets its own statement rather than one averaged description.
- **A structure influences a joint it does not cross** (tensor fasciae latae reaching the knee via the iliotibial band): the relationship is recorded as indirect and labelled as such.
- **A stiffness source has no meaningful form at a joint**: it is omitted for that joint rather than padded with filler.
- **An existing knee record must gain per-joint statements**: migration is complete or the build fails; no record is left half-converted.
- **A reader arrives at a joint page with no exercises yet catalogued for it**: the page says so explicitly rather than rendering an empty list.
- **The existing 398 tests**: all continue to pass, or a failure is a genuine regression to be fixed rather than a test to be relaxed.

## Requirements *(mandatory)*

### Functional Requirements

#### Joints as first-class subjects

- **FR-101**: System MUST treat knee, hip and ankle as first-class joints, each with its own mechanics content, stiffness sources and stiffness patterns.
- **FR-102**: System MUST present hip mechanics covering the ball-and-socket structure and its available range of motion.
- **FR-103**: System MUST present ankle mechanics covering the talocrural and subtalar joints, identify dorsiflexion as the functionally critical direction, and explain why bent-knee and straight-knee dorsiflexion differ.
- **FR-104**: System MUST present functional range-of-motion thresholds for hip and ankle tied to concrete everyday activities, each carrying a citation.
- **FR-105**: Stiffness sources and patterns MUST belong to a joint, and each joint MUST have its own set described for that joint specifically.
- **FR-106**: Ankle patterns MUST include at least one with no knee analogue.
- **FR-107**: Framing, navigation and section labels MUST NOT imply the reference covers the knee alone.

#### The chain

- **FR-108**: Each catalogued structure MUST declare every joint it influences, and for each, how restriction in it presents at that joint.
- **FR-109**: Each structure-joint relationship MUST record whether the structure acts on that joint directly or through a neighbouring joint.
- **FR-110**: Each joint MUST list the structures influencing it, distinguishing direct from indirect.
- **FR-111**: Every structure-joint relationship shown in the interface MUST resolve to an existing page.
- **FR-112**: Validation MUST fail when a structure declares no joint, or a joint has no structure.

#### New structures and movements

- **FR-113**: System MUST catalogue at minimum: the deep hip rotators including piriformis, tibialis anterior, tibialis posterior, the peroneal group, the Achilles tendon, and the plantar fascia.
- **FR-114**: Every newly catalogued structure MUST carry the same required fields as existing ones, including sources.
- **FR-115**: System MUST provide exercises targeting the newly catalogued structures, drawn from the same four modalities.
- **FR-116**: Every newly added exercise MUST carry contraindications, stop-criteria, an evidence label and sources.
- **FR-117**: Every catalogued structure MUST be targeted by at least one exercise or carry an explicit note explaining why not.
- **FR-118**: Functional goals MUST state which joints the activity depends on.

#### Safety

- **FR-119**: Red-flag guidance MUST include signs specific to the hip and to the ankle where they differ from the knee's.
- **FR-120**: Every red-flag sign MUST identify the joint or joints it concerns.
- **FR-121**: The red-flag gate MUST continue to fire on every exercise-bearing route, including routes added by this feature.
- **FR-122**: System MUST continue to provide no affordance accepting symptom input and returning causes or a protocol.

#### Preservation

- **FR-123**: All existing knee content MUST remain reachable and correct.
- **FR-124**: Every constitutional principle MUST apply unchanged to new material — sourcing, content-as-data, modality honesty, local-only operation, and accessibility.
- **FR-125**: Migration of existing records to per-joint statements MUST be complete; a partially migrated record MUST fail validation.

### Key Entities

- **Joint**: knee, hip or ankle. Identifier, name, plain-language description, mechanics narrative, functional ROM thresholds with citations, sources. Referenced by stiffness sources, patterns, structure relationships and goals.
- **Structure** (extends the existing muscle record): gains a set of joint influences, each recording the joint, whether the action is direct or indirect, and how restriction there presents. Replaces the single knee-specific statement.
- **Stiffness Source**: gains a joint reference. The same six physical categories recur per joint, described for that joint.
- **Stiffness Pattern**: gains a joint reference. Patterns are joint-specific and do not recur across joints.
- **Red-Flag Item**: gains the joint or joints it concerns.
- **Functional Goal**: gains the joints the activity depends on.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: All three joints have mechanics, stiffness sources and patterns, verified automatically; a joint missing any of the three fails validation.
- **SC-102**: Every structure declares at least one joint influence, and every joint is influenced by at least one structure — verified automatically, build failing otherwise.
- **SC-103**: 100% of structure-joint relationships shown resolve to an existing page, verified across the full content set.
- **SC-104**: Every structure named in FR-113 is present and carries at least one source.
- **SC-105**: Every catalogued structure is targeted by at least one exercise or carries an explicit note — including all newly added ones.
- **SC-106**: Every newly added exercise carries contraindications, stop-criteria, an evidence label and sources; a record missing any fails the build.
- **SC-107**: All four modalities remain represented and no single modality exceeds 60% of the library after expansion.
- **SC-108**: Red-flag signs exist for hip and ankle, each identifying its joint, and the gate fires on 100% of exercise-bearing entry routes including new ones.
- **SC-109**: A reader can reach any joint's mechanics from the home page in 2 interactions or fewer.
- **SC-110**: From any structure, every joint it influences is reachable in one interaction, and the reverse.
- **SC-111**: All tests passing before this feature continue to pass afterwards.
- **SC-112**: Accessibility checks report zero violations across all new routes in both themes, and no new route scrolls horizontally at 360px.
- **SC-113**: The built output continues to contain zero external origins in fetching positions.
- **SC-114**: Adding a structure or exercise for any joint requires editing content data only.

## Assumptions

- **Three joints only**: knee, hip, ankle. The spine, the foot beyond the plantar fascia and arch, and the upper body remain out of scope, as stated.
- **Sources generalise, patterns do not**: the six physical sources of stiffness recur at each joint because they are tissue-level mechanisms; patterns are joint-specific presentations and are authored per joint without forcing analogues.
- **Indirect influence is recorded, not inferred**: where a structure affects a joint it does not cross, the relationship is authored explicitly with its mechanism, rather than derived from anatomy the data does not hold.
- **Existing knee patterns stay as they are**, gaining only a joint reference. No knee content is rewritten except where the per-joint migration requires it.
- **Content volume**: hip and ankle together are expected to need roughly the same order of structures as the knee already has, and enough exercises to keep every structure covered — with the modality balance ceiling unchanged.
- **Sourcing standard is unchanged**: every new claim needs a citation that has been checked, and the build refuses records without one. This remains the rate limit on the work.
- **Single reader model**: still a general educational reference, still not personalised, still no tracking.
