import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffManifests } from '../scripts/lib/diff.mjs';

const p = (contentPath, blob, examples = [], reference = `references/${contentPath}.md`) => ({
  contentPath, url: `https://angular.dev/${contentPath}`, blob, examples, reference,
});

test('identical manifests have no drift', () => {
  const m = { pages: [p('guide/a', '1', [{ path: 'ex/a.ts', blob: 'e1' }])] };
  assert.deepEqual(diffManifests(m, m), { changed: [], added: [], removed: [] });
});

test('reports changed page, changed/added/removed example, added and removed pages', () => {
  const oldM = { pages: [
    p('guide/a', '1'),
    p('guide/b', '2', [{ path: 'ex/b.ts', blob: 'e1' }, { path: 'ex/gone.ts', blob: 'e2' }]),
    p('guide/old', '3'),
  ] };
  const newM = { pages: [
    p('guide/a', '1x'),
    p('guide/b', '2', [{ path: 'ex/b.ts', blob: 'e1x' }, { path: 'ex/new.ts', blob: 'e3' }]),
    p('guide/new', '4'),
  ] };
  const d = diffManifests(oldM, newM);
  assert.deepEqual(d.changed, [
    { url: 'https://angular.dev/guide/a', contentPath: 'guide/a', reference: 'references/guide/a.md', reasons: ['page'] },
    { url: 'https://angular.dev/guide/b', contentPath: 'guide/b', reference: 'references/guide/b.md',
      reasons: ['example ex/b.ts', 'example ex/new.ts', 'example removed ex/gone.ts'] },
  ]);
  assert.deepEqual(d.added, [{ url: 'https://angular.dev/guide/new', contentPath: 'guide/new', reference: 'references/guide/new.md' }]);
  assert.deepEqual(d.removed, [{ url: 'https://angular.dev/guide/old', contentPath: 'guide/old', reference: 'references/guide/old.md' }]);
});
