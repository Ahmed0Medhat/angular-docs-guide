import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractExamplePaths } from '../scripts/lib/examples.mjs';

test('extracts docs-code and multifile paths, multi-line attributes, sorted and unique', () => {
  const md = [
    '<docs-code-multifile preview path="adev/src/content/examples/b/app.ts">',
    '  <docs-code header="app.html"',
    '     path="adev/src/content/examples/b/app.html"/>',
    '</docs-code-multifile>',
    '<docs-code language="ts" path="adev/src/content/examples/a/x.ts" visibleRegion="r"/>',
    '<docs-code path="adev/src/content/examples/a/x.ts"/>',
    '<docs-code language="shell">ng serve</docs-code>',
  ].join('\n');
  assert.deepEqual(extractExamplePaths(md), [
    'adev/src/content/examples/a/x.ts',
    'adev/src/content/examples/b/app.html',
    'adev/src/content/examples/b/app.ts',
  ]);
});

test('returns empty array when there are no examples', () => {
  assert.deepEqual(extractExamplePaths('# Title\n\nText.'), []);
});
