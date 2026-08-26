import { describe, it, expect } from 'vitest';
import {
  buildMuscleExerciseIndex,
  exercisesForMuscle,
  unreferencedMuscles,
} from '../../src/lib/cross-links.ts';

const EXERCISES = [
  { id: 'heel-slide', targets: ['rectus-femoris', 'knee-capsule'] },
  { id: 'prone-hang', targets: ['biceps-femoris', 'knee-capsule'] },
  { id: 'bridge', targets: ['gluteus-maximus'] },
];

describe('buildMuscleExerciseIndex', () => {
  it('inverts the exercise -> muscle relation', () => {
    const index = buildMuscleExerciseIndex(EXERCISES);
    expect(index.get('knee-capsule')?.map((e) => e.id)).toEqual(['heel-slide', 'prone-hang']);
    expect(index.get('gluteus-maximus')?.map((e) => e.id)).toEqual(['bridge']);
  });

  it('omits muscles nothing targets', () => {
    expect(buildMuscleExerciseIndex(EXERCISES).has('popliteus')).toBe(false);
  });

  it('handles an empty exercise set — the state during early build phases', () => {
    expect(buildMuscleExerciseIndex([]).size).toBe(0);
  });
});

describe('exercisesForMuscle', () => {
  it('returns [] rather than undefined when nothing targets it', () => {
    // An empty result is a normal state the muscle page renders a note for (SC-005),
    // not an error condition.
    expect(exercisesForMuscle(buildMuscleExerciseIndex(EXERCISES), 'popliteus')).toEqual([]);
  });
});

describe('unreferencedMuscles', () => {
  it('reports exactly the muscles no exercise targets', () => {
    const index = buildMuscleExerciseIndex(EXERCISES);
    expect(
      unreferencedMuscles(['rectus-femoris', 'popliteus', 'soleus'], index).sort(),
    ).toEqual(['popliteus', 'soleus']);
  });
});
