import { describe, it, expect } from 'vitest';
import {
  buildJointStructureIndex,
  structuresAtJoint,
  unreachedJoints,
  type InfluencingStructure,
} from '../../src/lib/chain.ts';

const S = (id: string, ...inf: [string, 'direct' | 'indirect'][]): InfluencingStructure => ({
  id,
  jointInfluences: inf.map(([joint, action]) => ({ joint, action, presentsAs: `${id} at ${joint}` })),
});

const STRUCTURES = [
  S('gastrocnemius', ['ankle', 'direct'], ['knee', 'direct']),
  S('soleus', ['ankle', 'direct'], ['knee', 'indirect']),
  S('gluteus-medius', ['hip', 'direct'], ['knee', 'indirect']),
  S('popliteus', ['knee', 'direct']),
];

describe('buildJointStructureIndex', () => {
  it('inverts structure -> joint into joint -> structures', () => {
    const index = buildJointStructureIndex(STRUCTURES);
    expect(index.get('ankle')?.map((s) => s.structure.id).sort()).toEqual([
      'gastrocnemius',
      'soleus',
    ]);
    expect(index.get('knee')).toHaveLength(4);
  });

  it('carries the per-joint statement, not one averaged description', () => {
    const index = buildJointStructureIndex(STRUCTURES);
    const atKnee = index.get('knee')!.find((s) => s.structure.id === 'gastrocnemius')!;
    const atAnkle = index.get('ankle')!.find((s) => s.structure.id === 'gastrocnemius')!;
    expect(atKnee.presentsAs).not.toBe(atAnkle.presentsAs);
  });
});

describe('structuresAtJoint', () => {
  it('splits direct from indirect', () => {
    // The split matters: gluteus medius affects the knee without attaching to it,
    // and presenting the two together would imply a connection that is not there.
    const { direct, indirect } = structuresAtJoint(buildJointStructureIndex(STRUCTURES), 'knee');
    expect(direct.map((s) => s.structure.id).sort()).toEqual(['gastrocnemius', 'popliteus']);
    expect(indirect.map((s) => s.structure.id).sort()).toEqual(['gluteus-medius', 'soleus']);
  });

  it('returns empty lists rather than undefined for an uninfluenced joint', () => {
    const { direct, indirect } = structuresAtJoint(buildJointStructureIndex(STRUCTURES), 'elbow');
    expect(direct).toEqual([]);
    expect(indirect).toEqual([]);
  });
});

describe('unreachedJoints', () => {
  it('reports exactly the joints nothing influences', () => {
    const index = buildJointStructureIndex(STRUCTURES);
    expect(unreachedJoints(['knee', 'hip', 'ankle', 'elbow'], index)).toEqual(['elbow']);
  });
});
