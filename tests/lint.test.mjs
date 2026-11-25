import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proseWords, verbatimRuns, lintReference, lintSkill } from '../scripts/lib/lint.mjs';

const GOOD = [
  '# Signals',
  '',
  '> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/signals',
  '',
  '## When to use', '- Holding reactive state in a component', '',
  '## Rules', '- MUST read signals by calling them', '',
  '## API cheat-sheet', '| API | Purpose | Notes |', '|---|---|---|', '| `signal()` | writable | |', '',
  '## Patterns', '```ts', 'const count = signal(0); // the docs use this exact code line too', '```', '',
  '## Pitfalls', '- Mutating objects in place does not notify', '',
  '## Version notes', '- [v22+] stable', '',
].join('\n');
const SOURCE = 'A signal is a wrapper around a value that notifies interested consumers when that value changes.\n'
  + '```ts\nconst count = signal(0); // the docs use this exact code line too\n```\n';

test('proseWords drops code, tags and urls', () => {
  assert.deepEqual(proseWords('Hi `code` <docs-code path="x"/> https://a.b/c ```ts\nx\n``` there'), ['hi', 'there']);
});

test('verbatimRuns finds a copied 12-word run but ignores copied code', () => {
  const copied = `${GOOD}\nA signal is a wrapper around a value that notifies interested consumers when that value changes.`;
  assert.equal(verbatimRuns(copied, [SOURCE]).length, 1);
  assert.deepEqual(verbatimRuns(GOOD, [SOURCE]), []);
});

test('a well-formed reference passes', () => {
  assert.deepEqual(lintReference({ file: 'r.md', text: GOOD, sourceTexts: [SOURCE] }), []);
});

test('missing heading, wrong order, TODO and length are reported', () => {
  const bad = GOOD.replace('## Pitfalls', '## Pitfalls-x').replace('## Rules', 'TODO')
    + '\n## Rules\n' + 'x\n'.repeat(600);
  const errors = lintReference({ file: 'r.md', text: bad, sourceTexts: [] });
  assert.ok(errors.includes('r.md: missing heading "## Pitfalls"'));
  assert.ok(errors.includes('r.md: heading "## API cheat-sheet" out of order'));
  assert.ok(errors.includes('r.md: contains TODO/TBD'));
  assert.ok(errors.some((e) => /^r\.md: \d+ lines \(max 600\)$/.test(e)));
});

test('lintSkill checks frontmatter, length and that every reference is linked', () => {
  const skill = '---\nname: angular-docs-guide\ndescription: Use when writing Angular code\n---\n\n# x\n\nSee references/guide/a.md\n';
  assert.deepEqual(lintSkill({ text: skill, referenceFiles: ['references/guide/a.md'] }), []);
  const errors = lintSkill({ text: '# no frontmatter\n', referenceFiles: ['references/guide/a.md'] });
  assert.deepEqual(errors, [
    'SKILL.md: frontmatter must declare name: angular-docs-guide',
    'SKILL.md: frontmatter must declare a description',
    'SKILL.md: does not link references/guide/a.md',
  ]);
});
