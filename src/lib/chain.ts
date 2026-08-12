/**
 * The chain: structures to joints, and back.
 *
 * Structures declare which joints they influence. A joint's list of influencing
 * structures is that relation INVERTED, never stored — the same rule cross-links.ts
 * follows for muscle↔exercise. Storing both directions would create two places for one
 * fact to be wrong, with nothing keeping them in agreement.
 */

export type ChainAction = 'direct' | 'indirect';

export interface JointInfluence {
  joint: string;
  action: ChainAction;
  presentsAs: string;
}

export interface InfluencingStructure {
  id: string;
  jointInfluences: JointInfluence[];
}

export interface StructureAtJoint<T> {
  structure: T;
  action: ChainAction;
  presentsAs: string;
}

/** jointId -> the structures influencing it, each with how and in what way. */
export function buildJointStructureIndex<T extends InfluencingStructure>(
  structures: T[],
): Map<string, StructureAtJoint<T>[]> {
  const index = new Map<string, StructureAtJoint<T>[]>();
  for (const structure of structures) {
    for (const influence of structure.jointInfluences) {
      const entry = { structure, action: influence.action, presentsAs: influence.presentsAs };
      const list = index.get(influence.joint);
      if (list) list.push(entry);
      else index.set(influence.joint, [entry]);
    }
  }
  return index;
}

/**
 * Structures influencing one joint, split by how they act.
 *
 * The split is the point: a reader needs to know that gluteus medius affects the knee
 * without attaching to it. Presenting direct and indirect together would imply an
 * anatomical connection that is not there.
 */
export function structuresAtJoint<T extends InfluencingStructure>(
  index: Map<string, StructureAtJoint<T>[]>,
  jointId: string,
): { direct: StructureAtJoint<T>[]; indirect: StructureAtJoint<T>[] } {
  const all = index.get(jointId) ?? [];
  return {
    direct: all.filter((s) => s.action === 'direct'),
    indirect: all.filter((s) => s.action === 'indirect'),
  };
}

/** Joints no structure influences. Feeds the SC-102 policy check. */
export function unreachedJoints(jointIds: string[], index: Map<string, unknown[]>): string[] {
  return jointIds.filter((id) => !index.has(id));
}
