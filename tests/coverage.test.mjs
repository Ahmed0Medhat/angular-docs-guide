import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourcesUrls, checkCoverage } from '../scripts/lib/coverage.mjs';

const manifest = {
  pages: [
    { contentPath: 'guide/a', url: 'https://angular.dev/guide/a', reference: 'references/guide/a.md' },
    { contentPath: 'guide/a2', url: 'https://angular.dev/guide/a2', reference: 'references/guide/a.md' },
    { contentPath: 'guide/b', url: 'https://angular.dev/guide/b', reference: 'references/guide/b.md' },
    { contentPath: 'guide/c', url: 'https://angular.dev/guide/c', reference: null },
  ],
};
const okA = '# A\r\n\r\n> Sources (angular.dev, v22.3 @ bd1e32b): A — https://angular.dev/guide/a,\r\n> A2 — https://angular.dev/guide/a2.\r\n\r\n## When to use\r\n';

test('sourcesUrls reads a multi-line CRLF Sources block', () => {
  assert.deepEqual([...sourcesUrls(okA)].sort(), ['https://angular.dev/guide/a', 'https://angular.dev/guide/a2']);
  assert.equal(sourcesUrls('# A\n\nno sources'), null);
});

test('full check reports unmapped, missing, mismatched and orphan files', () => {
  const refs = {
    'references/guide/a.md': '# A\n\n> Sources: https://angular.dev/guide/a, https://angular.dev/guide/zzz\n',
    'references/guide/orphan.md': '# O\n',
  };
  const errors = checkCoverage({
    manifest, existingFiles: Object.keys(refs), readReference: (f) => refs[f],
  });
  assert.deepEqual(errors.sort(), [
    'Missing reference file: references/guide/b.md (1 pages)',
    'Orphan reference file: references/guide/orphan.md',
    'Unmapped page: guide/c',
    'references/guide/a.md: Sources lists unmapped https://angular.dev/guide/zzz',
    'references/guide/a.md: Sources missing https://angular.dev/guide/a2',
  ].sort());
});

test('--files mode checks only the listed files', () => {
  const errors = checkCoverage({
    manifest, existingFiles: ['references/guide/a.md'], readReference: () => okA,
    only: ['references/guide/a.md'],
  });
  assert.deepEqual(errors, []);
});

test('--files mode flags a file no page maps to', () => {
  const errors = checkCoverage({
    manifest, existingFiles: [], readReference: () => '', only: ['references/guide/nope.md'],
  });
  assert.deepEqual(errors, ['No pages map to references/guide/nope.md']);
});
