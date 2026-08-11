/**
 * CLI shell for the content policy gate. All rules live in ./content-policy.ts so
 * they are testable against fixtures; this file only loads from disk and reports.
 */
import { loadAll } from './content-loader.ts';
import { checkContent } from './content-policy.ts';

const collections = loadAll();
const { problems, notes } = checkContent(collections);

const counts = Object.entries(collections)
  .map(([name, records]) => `${name}=${records.length}`)
  .join('  ');
console.log(`Content: ${counts}`);
for (const note of notes) console.log(`  note: ${note}`);

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} content policy violation(s):\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('✓ Content policy checks passed');
