/**
 * Cross-link derivation (FR-017, FR-024).
 *
 * The muscle -> exercises edge is DERIVED, never stored. Exercises declare what they
 * target; a muscle's exercise list is that relation inverted. Storing it on both sides
 * would create two places for the same fact to be wrong, and nothing would keep them
 * agreeing.
 */

export interface TargetingExercise {
  id: string;
  targets: string[];
}

/** muscleId -> exercise ids targeting it. Muscles with none are simply absent. */
export function buildMuscleExerciseIndex<T extends TargetingExercise>(
  exercises: T[],
): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const exercise of exercises) {
    for (const muscleId of exercise.targets) {
      const list = index.get(muscleId);
      if (list) list.push(exercise);
      else index.set(muscleId, [exercise]);
    }
  }
  return index;
}

/**
 * Exercises targeting one muscle. Returns [] when there are none — the muscle page
 * renders an explicit note in that case rather than an empty list (SC-005), so an
 * empty result is a normal state, not an error.
 */
export function exercisesForMuscle<T extends TargetingExercise>(
  index: Map<string, T[]>,
  muscleId: string,
): T[] {
  return index.get(muscleId) ?? [];
}

/** Muscle ids with no targeting exercise. Feeds the SC-005 content-policy check. */
export function unreferencedMuscles(
  muscleIds: string[],
  index: Map<string, unknown[]>,
): string[] {
  return muscleIds.filter((id) => !index.has(id));
}
