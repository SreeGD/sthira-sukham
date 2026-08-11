/**
 * Starting positions for exercises.
 *
 * A closed vocabulary so one drawing can serve every exercise: the figure comes from
 * the record's `startPosition`, so a new exercise gets its diagram for free. Same
 * approach as the muscle locator's zones.
 *
 * These are also genuinely useful as data rather than only as pictures — "which of
 * these can I do lying down" is a real question when a knee is sore, and the answer
 * currently hides inside step one of the instructions.
 */
export const START_POSITIONS = [
  'supine',
  'prone',
  'side-lying',
  'seated',
  'kneeling',
  'quadruped',
  'standing',
  'standing-supported',
] as const;

export type StartPosition = (typeof START_POSITIONS)[number];

export const POSITION_LABEL: Record<StartPosition, string> = {
  supine: 'Lying on your back',
  prone: 'Lying face down',
  'side-lying': 'Lying on your side',
  seated: 'Sitting',
  kneeling: 'Kneeling',
  quadruped: 'On hands and knees',
  standing: 'Standing',
  'standing-supported': 'Standing, holding support',
};

/**
 * Figure geometry, shared by the Astro component and the Preact island so the two
 * views cannot drift apart. Every figure sits on one baseline (GROUND) so positions
 * read as comparable rather than as unrelated drawings.
 */
export const GROUND = 76;

export const POSITION_FIGURES: Record<
  StartPosition,
  { body: string; limbs: string[]; head: [number, number] }
> = {
  // Knees drawn up, feet on the floor — the position nearly every supine exercise here uses.
  supine: {
    head: [26, 68],
    body: 'M 34 68 L 70 68',
    limbs: ['M 70 68 L 84 44 L 98 74', 'M 42 68 L 58 75'],
  },
  // Thigh flat, lower leg lifted — the prone-hang and prone-quad-stretch silhouette.
  prone: {
    head: [26, 68],
    body: 'M 34 68 L 70 68',
    limbs: ['M 70 68 L 90 68 L 96 44', 'M 42 68 L 58 74'],
  },
  // Head resting on the extended lower arm, knees bent forward and stacked.
  'side-lying': {
    head: [28, 60],
    body: 'M 36 68 L 72 68',
    limbs: ['M 36 68 L 12 68', 'M 72 68 L 90 58 L 96 74'],
  },
  seated: {
    head: [40, 24],
    body: 'M 40 32 L 40 60',
    limbs: ['M 40 60 L 76 60 L 76 76', 'M 40 60 L 40 74'],
  },
  kneeling: {
    head: [44, 20],
    body: 'M 44 28 L 46 56',
    limbs: ['M 46 56 L 44 74 L 62 74', 'M 46 56 L 66 62 L 66 74'],
  },
  quadruped: {
    head: [26, 40],
    body: 'M 34 44 L 78 44',
    limbs: ['M 36 44 L 34 74', 'M 76 44 L 78 74'],
  },
  standing: {
    head: [48, 18],
    body: 'M 48 26 L 48 50',
    limbs: ['M 48 50 L 42 74', 'M 48 50 L 56 74'],
  },
  'standing-supported': {
    head: [54, 18],
    body: 'M 54 26 L 54 50',
    limbs: ['M 54 50 L 48 74', 'M 54 50 L 62 74', 'M 54 34 L 26 30'],
  },
};
