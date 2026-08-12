/**
 * "Find a demonstration" links.
 *
 * These are YouTube SEARCH urls, not links to specific videos, and that is a
 * deliberate constraint rather than a shortcut.
 *
 * Linking a specific video would mean asserting that it exists, shows this movement,
 * and demonstrates it safely — three claims this project cannot verify and cannot keep
 * verified as videos are edited, renamed, or taken down. On a page that also carries
 * contraindications, silently pointing at the wrong demonstration is a worse failure
 * than pointing at nothing. A search URL asserts nothing, cannot rot, and is derivable
 * from the record, so every exercise gets one and new exercises get one for free.
 *
 * These are links, not embeds: nothing is fetched at page load, so Principle V holds.
 * Following one does leave the app for a third-party site, which the UI says plainly.
 */

export interface VideoSearchable {
  name: string;
  traditionalName?: string;
  modality: string;
}

/** Qualifier that steers results toward instruction rather than performance. */
const MODALITY_QUALIFIER: Record<string, string> = {
  'clinical-rom': 'physiotherapy exercise',
  yoga: 'yoga pose how to',
  pilates: 'pilates exercise how to',
  'taichi-qigong': 'tai chi how to',
};

/**
 * The traditional name is preferred where one exists: "Supta Padangusthasana"
 * finds demonstrations far more reliably than "reclining hand-to-big-toe pose".
 */
export function videoSearchQuery(exercise: VideoSearchable): string {
  const subject = exercise.traditionalName ?? exercise.name;
  const qualifier = MODALITY_QUALIFIER[exercise.modality] ?? 'exercise';
  return `${subject} ${qualifier}`;
}

export function videoSearchUrl(exercise: VideoSearchable): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(videoSearchQuery(exercise))}`;
}
