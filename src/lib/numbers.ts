/**
 * Small counts as words, for prose.
 *
 * Headings read as prose, and "The 6 sources of stiffness" reads as a database dump.
 * But hardcoding "six" is how "The three joints" survived into a four-joint reference
 * and "Four presentations" into a thirteen-pattern one — a number nothing checks goes
 * stale the moment content is added. Derive the count, spell it here.
 */

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve',
];

/** Falls back to digits above twelve, where words stop helping. */
export function inWords(n: number): string {
  return WORDS[n] ?? String(n);
}
