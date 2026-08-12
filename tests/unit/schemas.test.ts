import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The schema gate (Constitution Principles I–IV, FR-038, SC-003).
 *
 * These run the real Astro content pipeline against deliberately broken fixtures,
 * because the guarantee being tested is specifically "the build refuses this". A
 * mock of the schema would test our understanding of Zod, not the thing that
 * actually gates a merge.
 *
 * `astro sync` is used rather than `astro build`: it runs the same content loading
 * and validation (verified — it exits 1 on a schema violation) in about a tenth of
 * the time.
 *
 * NOTE: these write temporary files into src/content/ and remove them in afterEach.
 */

const EXERCISES = 'src/content/exercises';
const MUSCLES = 'src/content/muscles';
const written: string[] = [];

function write(dir: string, name: string, frontmatter: string) {
  const path = join(dir, `${name}.md`);
  writeFileSync(path, `---\n${frontmatter}\n---\n\nTemporary test fixture.\n`);
  written.push(path);
}

/** Returns Astro's stderr when validation fails, or null when it passed. */
function syncError(): string | null {
  try {
    execFileSync('pnpm', ['astro', 'sync'], { encoding: 'utf-8', stdio: 'pipe' });
    return null;
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

afterEach(() => {
  for (const path of written.splice(0)) rmSync(path, { force: true });
});

const VALID_EXERCISE = `name: Probe
modality: clinical-rom
startPosition: supine
laterality: bilateral
targets: [rectus-femoris]
goal: [mobility]
quickSteps:
  - Step one.
  - Step two.
keyPoint: Not a real exercise.
feelItIn: Nowhere.
commonMistake: Doing it.
instructions:
  - label: Step one
    detail: Do the first thing.
  - label: Step two
    detail: Do the second thing.
dosage:
  reps: 10 repetitions
  sets: 1 set
  frequency: Once daily
difficulty: beginner
progressions: [heel-slide]
contraindications: [Not a real exercise]
stopIf: [Always]
equipment: [none]
evidenceLabel: mechanistic-rationale
sources: [neumann-kinesiology-2016]`;

describe('the fixture baseline', () => {
  it('a complete record passes, so every failure below is caused by its own omission', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE);
    expect(syncError()).toBeNull();
  });
});

describe('exercise safety fields (FR-006, Principle I — non-negotiable)', () => {
  it('rejects empty contraindications', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('contraindications: [Not a real exercise]', 'contraindications: []'));
    expect(syncError()).toMatch(/contraindications/);
  });

  it('rejects empty stopIf', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('stopIf: [Always]', 'stopIf: []'));
    expect(syncError()).toMatch(/stopIf/);
  });

  it('rejects a missing stopIf entirely', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('stopIf: [Always]\n', ''));
    expect(syncError()).toMatch(/stopIf/);
  });
});

describe('sourcing (FR-033, Principle II)', () => {
  it('rejects an exercise with no sources', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('sources: [neumann-kinesiology-2016]', 'sources: []'));
    expect(syncError()).toMatch(/sources/);
  });

  it('rejects a muscle with no sources', () => {
    write(
      MUSCLES,
      '__probe',
      `anatomicalName: Probe muscle
commonName: probe
region: knee
isContractile: true
diagramZone: thigh-front
roleInKneeMotion: none
stiffnessContribution:
  whenTight: none
  whenWeak: none
  whenInhibited: none
plainLanguageGloss: probe
jointInfluences:
  - joint: knee
    action: direct
    presentsAs: probe influence
sources: []`,
    );
    expect(syncError()).toMatch(/sources/);
  });
});

describe('tradition attribution (FR-023, Principle IV)', () => {
  it('rejects a yoga record without a traditional name', () => {
    write(
      EXERCISES,
      '__probe',
      VALID_EXERCISE.replace('modality: clinical-rom', 'modality: yoga').concat(
        '\nmodifications: [Keep the knee bent]',
      ),
    );
    const err = syncError();
    expect(err).toMatch(/traditionalName/);
    expect(err).toMatch(/FR-023/);
  });

  it('rejects a tai chi record without tradition attribution', () => {
    write(
      EXERCISES,
      '__probe',
      VALID_EXERCISE.replace('modality: clinical-rom', 'modality: taichi-qigong').concat(
        '\ntraditionalName: Probe form',
      ),
    );
    expect(syncError()).toMatch(/tradition/);
  });
});

describe('modification guidance (FR-025)', () => {
  it('rejects a Pilates record with no modifications for a restricted knee', () => {
    write(
      EXERCISES,
      '__probe',
      VALID_EXERCISE.replace('modality: clinical-rom', 'modality: pilates').concat(
        '\ntraditionalName: Probe\ntradition: Pilates',
      ),
    );
    expect(syncError()).toMatch(/modifications/);
  });
});

describe('muscle completeness (FR-014, FR-016)', () => {
  it('rejects a structure that declares no joint influence (FR-108)', () => {
    // Supersedes the old FR-016 rule, which only obliged hip and ankle structures to
    // explain themselves at the knee. Every structure must now state its reach.
    write(
      MUSCLES,
      '__probe',
      `anatomicalName: Probe hip muscle
commonName: probe
region: hip
isContractile: true
diagramZone: hip-front
roleInKneeMotion: none
stiffnessContribution:
  whenTight: none
  whenWeak: none
  whenInhibited: none
plainLanguageGloss: probe
jointInfluences: []
sources: [neumann-kinesiology-2016]`,
    );
    expect(syncError()).toMatch(/jointInfluences/);
  });

  it('rejects an influence that does not say how it presents', () => {
    write(
      MUSCLES,
      '__probe',
      `anatomicalName: Probe muscle
commonName: probe
region: knee
isContractile: true
diagramZone: thigh-front
roleInKneeMotion: none
stiffnessContribution:
  whenTight: none
  whenWeak: none
  whenInhibited: none
plainLanguageGloss: probe
jointInfluences:
  - joint: knee
    action: direct
    presentsAs: ''
sources: [neumann-kinesiology-2016]`,
    );
    expect(syncError()).toMatch(/presentsAs/);
  });

  it('rejects a contractile muscle missing part of the tight/weak/inhibited triad', () => {
    write(
      MUSCLES,
      '__probe',
      `anatomicalName: Probe muscle
commonName: probe
region: knee
isContractile: true
diagramZone: thigh-front
roleInKneeMotion: none
stiffnessContribution:
  whenTight: none
plainLanguageGloss: probe
jointInfluences:
  - joint: knee
    action: direct
    presentsAs: probe influence
sources: [neumann-kinesiology-2016]`,
    );
    expect(syncError()).toMatch(/whenWeak|whenInhibited/);
  });
});

describe('progression ladder (FR-020)', () => {
  it('rejects an exercise with neither a regression nor a progression', () => {
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('progressions: [heel-slide]', 'progressions: []'));
    expect(syncError()).toMatch(/regression or progression/);
  });
});

describe('what the schema does NOT catch', () => {
  it('a dangling reference passes the schema — which is why the policy gate exists', () => {
    // Documents the D10 finding as an executable fact. `reference()` validates id
    // shape, not existence, so this builds clean; scripts/content-policy.ts is what
    // catches it (see content-policy.test.ts). If a future Astro upgrade starts
    // rejecting this, THIS TEST FAILING is the good news — tighten the docs then.
    write(EXERCISES, '__probe', VALID_EXERCISE.replace('targets: [rectus-femoris]', 'targets: [no-such-muscle]'));
    expect(syncError()).toBeNull();
  });
});
