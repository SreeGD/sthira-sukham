# Feature Specification: Knee Stiffness Educational Reference

**Feature Branch**: `001-knee-stiffness-reference`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "FixKnee — an interactive, locally-run web app that serves as a general educational reference for stiff knee pain: knee joint mechanics, the muscles involved, common stiffness patterns, and an exercise library drawn from clinical range-of-motion work, yoga, Pilates, and tai chi/qigong. Cross-linked muscle and exercise pages, filterable library, curated routines, red-flag safety guidance, search. Static, local, no backend, no accounts, no tracking. Out of scope: symptom checkers, personalized programs, diagnosis, progress tracking, accounts, video hosting, community features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand why my knee feels stiff (Priority: P1)

Someone whose knee feels tight and restricted — getting out of a car, on stairs, after sitting at a desk — opens the app wanting to understand what "stiff" physically means. They read about the tibiofemoral and patellofemoral joints, learn that stiffness can come from several different sources (the capsule, swelling, muscle guarding, scar tissue, arthritic change, or simply disuse shortening), and see what typical and functional ranges of motion look like in degrees. They come away with a working mental model and the vocabulary to describe what they feel.

**Why this priority**: This is the "understand" half of the request and stands alone as a complete deliverable. Without a mental model, the exercise library is a list of movements with no organizing logic. It is also the only story that carries no exercise-safety risk, so it can ship first.

**Independent Test**: Launch the app with only the Understanding section populated. A reader can navigate the joint-mechanics and stiffness-patterns content end to end, and can state in their own words at least three distinct physical causes of knee stiffness and what normal vs. functional range of motion means.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on the home screen, **When** they open the Understanding section, **Then** they see knee joint mechanics content covering both the tibiofemoral and patellofemoral joints, with each anatomical claim showing an attached source.
2. **Given** a reader in the Understanding section, **When** they view the stiffness-sources content, **Then** all six sources (capsular restriction, effusion, muscle guarding, adhesion/scar, arthritic change, disuse shortening) are each described in plain language alongside the clinical term.
3. **Given** a reader viewing range-of-motion content, **When** they read the functional thresholds, **Then** they see degree ranges tied to concrete activities (walking on level ground, stairs, sitting in a car, squatting).
4. **Given** a reader viewing any stiffness pattern (osteoarthritic, patellofemoral, post-injury/post-surgical, sedentary/disuse), **When** they read it, **Then** the content describes the pattern generally and does not instruct the reader to determine which one applies to them.

---

### User Story 2 - Learn which muscles are involved and how (Priority: P1)

The same reader wants to know which muscles actually govern knee stiffness. They browse a muscle catalogue organised by region, open the quadriceps, and read what it does at the knee, how it contributes to stiffness when it is tight, weak, or inhibited, and which structures it works with. They discover the hip and ankle entries and learn that a stiff-feeling knee is frequently a hip or ankle mobility limitation.

**Why this priority**: Equal-priority with Story 1 — together they are the "understand the muscles" deliverable the user asked for. Browsing anatomy is self-contained and testable with zero exercise content present.

**Independent Test**: With only the Understanding and Muscles sections populated, a reader can browse every catalogued muscle and non-muscular restrictor, and for any one of them state its role in knee motion and how it contributes to stiffness.

**Acceptance Scenarios**:

1. **Given** the Muscles section, **When** a reader browses it, **Then** every muscle and structure named in the coverage list below is present, each with its role in knee motion, its tight/weak/inhibited stiffness contribution, and at least one source.
2. **Given** a muscle entry, **When** a reader reads it, **Then** the standard anatomical term and a plain-language gloss are both shown, with neither replacing the other.
3. **Given** the muscle catalogue, **When** a reader looks for non-muscular restrictors, **Then** the joint capsule, retinaculum, and iliotibial band are present and clearly identified as non-contractile structures rather than muscles.
4. **Given** a reader on any hip or ankle muscle entry, **When** they read it, **Then** the entry explains how that muscle's restriction can present as knee stiffness.

---

### User Story 3 - Find movements that address a specific muscle or goal (Priority: P2)

A reader who now understands that their calf and hip flexors may be involved opens the Exercise library and narrows it: mobility goal, targets gastrocnemius, no equipment, beginner difficulty. They get a short list spanning clinical range-of-motion work, a yoga asana, and a tai chi weight-shift. Each result shows its modality and how well-evidenced it is at a glance. They open one and get step-by-step instructions, general dosage guidance, regressions and progressions, contraindications, and explicit criteria for when to stop.

**Why this priority**: This is the "exercises to address" half. It depends on the muscle catalogue existing for its targeting to mean anything, so it follows Stories 1 and 2 — but it is the payload the reader came for.

**Independent Test**: With the muscle catalogue and exercise library populated, a reader can apply any combination of the five filters, get correct results, open any exercise, and follow it without consulting anything else. Every exercise shown carries contraindications, stop-criteria, and an evidence label.

**Acceptance Scenarios**:

1. **Given** the exercise library, **When** a reader applies filters for modality, target muscle, goal, difficulty, and equipment in any combination, **Then** only exercises matching all active filters are shown, and the count of results is stated.
2. **Given** a filter combination that matches nothing, **When** it is applied, **Then** the reader is told no exercises match and is offered a way to clear or relax the filters.
3. **Given** any exercise detail view, **When** a reader opens it, **Then** it shows name, modality, targeted muscles/structures, goal, numbered instructions, general dosage guidance, difficulty with at least one regression or progression, contraindications, explicit stop-criteria, equipment or props, evidence label, and sources.
4. **Given** an exercise drawn from yoga, Pilates, or tai chi/qigong, **When** a reader views it, **Then** its traditional name and tradition are shown alongside a plain-language description of the mechanics.
5. **Given** any exercise in either list or detail view, **When** a reader looks at it, **Then** its evidence label is visible without opening anything further, and is distinguishable without relying on colour alone.
6. **Given** a muscle entry, **When** a reader views it, **Then** it lists the exercises targeting that muscle and each links to the exercise; and from any exercise, the targeted muscles link back to their entries.

---

### User Story 4 - Know when to stop and see a clinician (Priority: P1)

Before a first-time visitor reaches any exercise content, they are shown red-flag guidance: the signs that mean stop and get assessed rather than stretch — locking, giving way, inability to bear weight, a hot or swollen joint, fever, sudden severe pain, night pain, pain following trauma. It is framed as the app being a general reference, not a substitute for a clinician's assessment. From then on it is one interaction away from anywhere in the app.

**Why this priority**: P1 and non-negotiable per Constitution Principle I. It gates Story 3 — the exercise library must not be reachable on a first visit without this being shown first. It is listed after Story 3 for narrative flow only; in build order it precedes any exercise content shipping.

**Independent Test**: On a fresh visit, attempt to reach exercise content by every available route; verify the red-flag guidance is presented before any exercise is shown in each case. From every section of the app, verify the guidance is reachable in a single interaction.

**Acceptance Scenarios**:

1. **Given** a first-time visitor who has not yet seen the red-flag guidance, **When** they navigate to any exercise or routine content by any route, **Then** the guidance is presented before that content is shown.
2. **Given** a reader who has acknowledged the guidance, **When** they browse exercises, **Then** they are not blocked again, but the guidance remains reachable in one interaction from every screen.
3. **Given** a reader anywhere in the app, **When** they look for safety guidance, **Then** a persistently visible affordance reaches the red-flag content in a single interaction.
4. **Given** any screen presenting exercises, **When** a reader views it, **Then** framing is visible stating that this is general education and that a clinician or physiotherapist is the right source for personal assessment, and that framing cannot be permanently dismissed.

---

### User Story 5 - Follow a curated routine (Priority: P3)

A reader who does not want to assemble their own sequence picks a ready-made one — a ten-minute morning mobility set, a desk-worker set, or a strength-focused set. It presents an ordered sequence of exercises with the rationale for the order, each step linking to its full exercise entry.

**Why this priority**: A convenience layer composed entirely of Story 3's content. Valuable but strictly additive; the app is complete without it.

**Independent Test**: With routines populated, a reader can open each routine, see its ordered steps, follow it start to finish on a phone, and reach any step's full exercise detail.

**Acceptance Scenarios**:

1. **Given** the Routines section, **When** a reader opens a routine, **Then** they see its purpose, approximate duration, equipment needed, and an ordered list of steps.
2. **Given** a routine step, **When** a reader selects it, **Then** they reach the full exercise entry including its contraindications and stop-criteria.
3. **Given** a routine, **When** it is displayed, **Then** it is presented as one general example among options and not as a program prescribed for the reader.

---

### User Story 6 - Find something by name (Priority: P3)

A reader who has heard the term "VMO" or "supta padangusthasana" types it into search and reaches the right entry directly, without navigating the hierarchy.

**Why this priority**: A shortcut through content reachable by browsing. Lowest priority because nothing is unreachable without it.

**Independent Test**: With content populated, search for muscles by anatomical name, by common name, and by abbreviation; search for exercises by English name and by traditional name. Verify each returns the correct entry.

**Acceptance Scenarios**:

1. **Given** the search affordance, **When** a reader searches a muscle by anatomical name, common name, or recognised abbreviation, **Then** the matching muscle entry is returned.
2. **Given** the search affordance, **When** a reader searches an exercise by its English or traditional name, **Then** the matching exercise is returned.
3. **Given** a search returning nothing, **When** results are shown, **Then** the reader is told nothing matched and offered a route back to browsing.

---

### Edge Cases

- **Filter yields nothing**: the reader is told so explicitly and given a one-interaction way to clear filters, never left staring at an empty region with no explanation.
- **A muscle has no exercises targeting it**: the entry says so plainly rather than rendering an empty list — and this is surfaced as a content gap during validation.
- **An exercise references a muscle ID that does not exist**: caught by the content-integrity gate before the build completes; the build fails rather than shipping a dead link.
- **An exercise lacks contraindications, stop-criteria, an evidence label, or a source**: the build fails. Incomplete safety content is never rendered.
- **A reader arrives directly at a deep exercise link on a first visit** (bookmark or shared URL): red-flag guidance is presented before the exercise content, exactly as on the home route.
- **The reader has reduced-motion preferences set**: all transitions and animations are suppressed.
- **The reader's screen is 360px wide**: instructions remain legible without horizontal scrolling or zooming.
- **The reader is offline**: everything works, because nothing is fetched at runtime.
- **A yoga or tai chi movement has weak evidence**: it is still included, labelled honestly as traditional/low-evidence, and its traditional framing is never restated as physiological fact.
- **A reader tries to use the app as a symptom checker**: no affordance exists to input symptoms and receive a narrowed cause or protocol.

## Requirements *(mandatory)*

### Functional Requirements

#### Safety & framing (Constitution Principle I)

- **FR-001**: System MUST present red-flag guidance before any exercise or routine content is shown to a first-time visitor, regardless of entry route including direct deep links.
- **FR-002**: System MUST make red-flag guidance reachable in one interaction from every screen.
- **FR-003**: System MUST display non-dismissible framing on every screen presenting exercises, stating that the content is general education and that a clinician or physiotherapist is the correct source for personal assessment.
- **FR-004**: Red-flag guidance MUST enumerate at minimum: joint locking, giving way, inability to bear weight, a hot or swollen joint, fever, sudden severe pain, night pain, and pain following trauma.
- **FR-005**: System MUST NOT provide any affordance that accepts symptom input and returns a narrowed set of causes, a diagnosis, or a recommended protocol.
- **FR-006**: Every exercise MUST carry contraindications and explicit stop-criteria, and the system MUST NOT render an exercise lacking either.
- **FR-007**: Stiffness-pattern content MUST describe patterns generally and MUST NOT instruct or invite the reader to determine which applies to them.

#### Understanding content

- **FR-008**: System MUST present knee joint mechanics covering the tibiofemoral and patellofemoral joints.
- **FR-009**: System MUST describe stiffness sources covering capsular restriction, effusion, muscle guarding, adhesion/scar tissue, arthritic change, and disuse shortening, each with clinical term and plain-language gloss.
- **FR-010**: System MUST present range-of-motion measurement in flexion/extension degrees, with functional thresholds tied to concrete activities (level walking, stairs, sitting in a car, squatting).
- **FR-011**: System MUST present the four stiffness patterns: osteoarthritic, patellofemoral, post-injury/post-surgical, and sedentary/disuse.

#### Muscle catalogue

- **FR-012**: System MUST catalogue at minimum: rectus femoris, vastus lateralis, vastus medialis (including VMO), vastus intermedius, biceps femoris, semitendinosus, semimembranosus, gastrocnemius, soleus, popliteus, tensor fasciae latae, adductor group, gluteus maximus, gluteus medius, gluteus minimus, and iliopsoas.
- **FR-013**: System MUST catalogue non-contractile restrictors — joint capsule, retinaculum, and iliotibial band — clearly identified as non-muscular.
- **FR-014**: Each muscle entry MUST state its role in knee motion, and how it contributes to stiffness when tight, when weak, and when inhibited.
- **FR-015**: Each entry MUST show the standard anatomical term together with a plain-language gloss, neither substituting for the other.
- **FR-016**: Hip and ankle entries MUST explain how restriction at those joints can present as knee stiffness.
- **FR-017**: Each muscle entry MUST list the exercises targeting it, each linking to that exercise.

#### Exercise library

- **FR-018**: System MUST tag every exercise with exactly one modality from: clinical range-of-motion, yoga, Pilates, tai chi/qigong.
- **FR-019**: System MUST include exercises from all four modalities, with the seed content covering at minimum the movements named in the Assumptions section.
- **FR-020**: Each exercise MUST record: name; traditional name and tradition where applicable; modality; targeted muscles and structures by identifier; goal (mobility, strength, or motor control); numbered step-by-step instructions; general dosage guidance; difficulty; at least one regression or progression; contraindications; stop-criteria; equipment/props; evidence label; and sources.
- **FR-021**: System MUST let readers filter the library by modality, target muscle, goal, difficulty, and equipment, in any combination, and MUST state the result count.
- **FR-022**: System MUST show each exercise's evidence label in both list and detail views, distinguishable without relying on colour alone.
- **FR-023**: Exercises from yoga, Pilates, and tai chi/qigong MUST show their traditional name and tradition alongside plain-language mechanics, and MUST NOT restate traditional framing as physiological mechanism.
- **FR-024**: Each exercise MUST link to the entries for the muscles it targets.
- **FR-025**: Yoga and Pilates entries MUST include modifications and prop options for restricted knee range where the movement demands range many stiff knees lack.

#### Routines

- **FR-026**: System MUST provide at least three curated routines: a short morning mobility set, a desk-worker set, and a strength-focused set.
- **FR-027**: Each routine MUST state its purpose, approximate duration, and equipment needed, and present its exercises in a deliberate order with the rationale for that order.
- **FR-028**: Each routine step MUST link to the full exercise entry.
- **FR-029**: Routines MUST be presented as general examples, never as a program prescribed for the reader.

#### Search & navigation

- **FR-030**: System MUST provide search across muscles and exercises, matching muscles by anatomical name, common name, and recognised abbreviation, and exercises by English and traditional name.
- **FR-031**: System MUST tell the reader explicitly when a search or filter returns nothing, and offer a route back to browsing.
- **FR-032**: System MUST provide the four top-level sections — Understanding, Muscles, Exercises, Routines — reachable from every screen.

#### Content integrity (Constitution Principles II, III, IV)

- **FR-033**: Every anatomical claim, muscle-role attribution, and exercise indication MUST carry at least one source, locatable unaided (title, author or issuing body, year, and URL or DOI where one exists).
- **FR-034**: Sources MUST be visible in the interface, not held only in the underlying data.
- **FR-035**: All content MUST be stored as structured, schema-validated records separate from presentation, such that adding a muscle or exercise requires no change to presentation logic.
- **FR-036**: Cross-references between records MUST use stable identifiers, and the system MUST verify every reference resolves before a build is considered valid.
- **FR-037**: Evidence labels MUST come from a single fixed vocabulary distinguishing well-studied interventions from traditional or low-evidence practice; values outside it MUST fail validation.
- **FR-038**: Validation MUST fail the build when any record lacks a required field, any reference is unresolved, or any exercise lacks contraindications, stop-criteria, or an evidence label.

#### Delivery & access (Constitution Principles V, VI)

- **FR-039**: System MUST run entirely from a local static build with no backend service, database, or authentication.
- **FR-040**: System MUST make no network requests at runtime; all assets MUST be bundled, with no third-party origins.
- **FR-041**: System MUST NOT collect, store, or transmit any information about the reader, and MUST include no telemetry, analytics, or error reporting that leaves the machine.
- **FR-042**: System MUST be fully usable from 360px width upward, with exercise instructions legible on a phone without zooming.
- **FR-043**: System MUST be fully keyboard navigable with visible focus indicators, correct semantic landmarks, and correct heading order.
- **FR-044**: System MUST meet WCAG 2.1 AA contrast, and MUST NOT use colour as the sole carrier of meaning.
- **FR-045**: System MUST support light and dark themes, both fully legible.
- **FR-046**: System MUST suppress motion and animation when the reader has expressed a reduced-motion preference.

### Key Entities

- **Muscle/Structure**: a contractile muscle or non-contractile restrictor. Stable identifier, anatomical name, common name, abbreviations, region (knee/hip/ankle), whether contractile, role in knee motion, stiffness contribution when tight/weak/inhibited, plain-language gloss, sources. Referenced by exercises.
- **Exercise**: a single movement. Stable identifier, name, traditional name and tradition, modality, targeted structure identifiers, goal, ordered instructions, dosage guidance, difficulty, regressions and progressions (referencing other exercises), contraindications, stop-criteria, equipment, evidence label, sources.
- **Routine**: an ordered, curated sequence. Identifier, title, purpose, approximate duration, equipment, ordered steps referencing exercise identifiers, rationale for the ordering.
- **Stiffness Source**: one physical cause of restriction. Identifier, clinical term, plain-language gloss, description, related structures, sources.
- **Stiffness Pattern**: one commonly described general presentation. Identifier, name, general description, typically involved structures, sources.
- **Source**: a citation. Identifier, title, author or issuing body, year, URL or DOI, source tier. Referenced by every other content entity.
- **Evidence Label**: a fixed vocabulary term expressing how well-evidenced an exercise is, with a definition shown to the reader.
- **Red-Flag Item**: one sign warranting clinical assessment. Identifier, sign, plain-language description, sources.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor encounters red-flag guidance before any exercise content on 100% of entry routes tested, including direct deep links to an exercise and to a routine.
- **SC-002**: Red-flag guidance is reachable in one interaction from 100% of screens.
- **SC-003**: 100% of content records carry at least one source, and 100% of exercises carry contraindications, stop-criteria, and an evidence label — verified automatically, with the build failing otherwise.
- **SC-004**: 100% of cross-references between records resolve to an existing record — verified automatically, with the build failing otherwise.
- **SC-005**: Every muscle and structure named in FR-012 and FR-013 is present, and every one lists at least one exercise targeting it, or explicitly states that none is catalogued.
- **SC-006**: All four modalities are represented in the library, and no single modality accounts for more than 60% of exercises.
- **SC-007**: A reader can go from opening the app to a full exercise entry targeting a chosen muscle in 3 interactions or fewer.
- **SC-008**: Applying any combination of the five filters returns only matching exercises, verified across a test matrix covering every filter dimension and at least one no-match case.
- **SC-009**: All primary journeys — browse a muscle, filter and open an exercise, follow a routine, search — are completable using only the keyboard.
- **SC-010**: Automated accessibility checking reports zero violations across all screens, in both light and dark themes.
- **SC-011**: All text meets WCAG 2.1 AA contrast in both themes, and no state or category is conveyed by colour alone.
- **SC-012**: The built output contains zero references to external origins, and running the app with the network disabled produces identical behaviour — verified automatically.
- **SC-013**: No reader information is written to storage of any kind, aside from the single flag recording that red-flag guidance has been acknowledged and the reader's theme preference.
- **SC-014**: Every screen is usable at 360px width with no horizontal page scrolling, and exercise instructions are readable at arm's length without zooming.
- **SC-015**: Adding a new muscle or exercise requires editing content data only, demonstrated by adding one of each with no change to presentation logic.

## Assumptions

- **Reader**: an adult non-clinician with a stiff knee, reading in English, with no anatomy background. Content assumes no prior knowledge and introduces anatomical vocabulary as it goes.
- **Not personalized**: per the answered scoping question, this is a general reference. No feature adapts content to an individual, and none may be added without amending the constitution.
- **No tracking**: per the answered scoping question, no session logging, adherence, or progress features. The only persisted state is the red-flag acknowledgement flag and the theme preference — both device-local, neither describing the reader.
- **Seed content scope**: an initial library sufficient to demonstrate every modality and cover the catalogued muscles, expected in the range of 40–60 exercises. Specifically: clinical range-of-motion (heel slides, prone hangs, wall slides, patellar mobilizations, stationary-bike range work, quadriceps/hamstring/calf stretching, terminal knee extension); yoga (supta padangusthasana, virasana, anjaneyasana, malasana, adho mukha svanasana, setu bandha sarvangasana); Pilates (footwork patterns, leg slides, bridging, side-lying series, standing leg pump); tai chi/qigong (weight-shifting, knee-over-toe tracking drills, slow loaded flexion-extension, adapted stances). The library is extensible by adding records.
- **Equipment**: exercises assume at most household props — a wall, a chair, a towel, a cushion, a strap or belt, a resistance band. Reformer-based Pilates is described as an optional variation only; no exercise requires gym equipment. A stationary bike is treated as optional equipment for the one entry using it.
- **Illustration**: anatomical illustration is either originally authored for this project or carries a redistribution-permitting licence recorded in the record. No stock medical photography of real people. Text content must stand alone without illustration, since illustration may be added incrementally.
- **Dosage language**: dosage is expressed in general terms (e.g. typical repetition and hold ranges as commonly described in the literature) and never as an instruction to the individual reader.
- **Evidence vocabulary**: a small fixed set distinguishing well-studied from traditional/low-evidence practice, defined once during design and shown to the reader with its definitions.
- **Sources**: cited from clinical bodies, peer-reviewed literature, anatomy reference texts, and — for traditional practices — established practice literature identified as such. Sources are gathered during content authoring; the schema and validation gate exist independently of which specific sources are chosen.
- **Offline by construction**: because nothing is fetched at runtime, offline operation needs no separate mechanism.
- **Single language**: English only. No internationalization.
