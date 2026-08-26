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
  // The ankle joint itself, distinct from the calf above it and the foot below. The
  // talocrural capsule and the lateral ligaments live here and nowhere else — before
  // this zone existed they had to borrow 'foot', which put them in the wrong place.
  'ankle',
  'foot',
  // The forefoot and the big toe. Separate from 'foot' because the first toe joint is
  // where the foot's most consequential stiffness sits, and highlighting the whole
  // sole for it would point the reader at the wrong end.
  'toes',
] as const;

export type DiagramZone = (typeof DIAGRAM_ZONES)[number];
