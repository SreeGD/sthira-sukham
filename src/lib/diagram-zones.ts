/**
 * Where a structure is highlighted on the leg locator diagram.
 *
 * Single source of truth, imported by both the content schema (which validates the
 * field) and the LegLocator component (which draws it). Duplicating the list would
 * let a zone be authorable but undrawable.
 */
export const DIAGRAM_ZONES = [
  'hip-front',
  'hip-side',
  'hip-back',
  'thigh-front',
  'thigh-inner',
  'thigh-outer',
  'thigh-back',
  'knee-front',
  'knee-back',
  'calf',
  // Ankle zones. Without these every lower-leg structure collapses into "calf" and
  // the ankle's map has one region, which communicates nothing.
  'shin',
  'lower-leg-outer',
  'foot',
] as const;

export type DiagramZone = (typeof DIAGRAM_ZONES)[number];
