import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveReference, buildManifest, summarize, batchFor, countWords } from '../scripts/lib/manifest.mjs';

const RULES = [
  ['guide/hydration', 'references/guide/ssr.md'],
  ['guide', 'references/guide/{1}.md'],
  ['tools', 'references/tools/{1}.md'],
];

test('resolveReference: exact rule, {1} segment, nested page, unmapped', () => {
  assert.equal(resolveReference('guide/hydration', RULES), 'references/guide/ssr.md');
  assert.equal(resolveReference('guide/zoneless', RULES), 'references/guide/zoneless.md');
  assert.equal(resolveReference('guide/signals/overview', RULES), 'references/guide/signals.md');
  assert.equal(resolveReference('tools/cli/overview', RULES), 'references/tools/cli.md');
  assert.equal(resolveReference('guidelines/x', RULES), null);
  assert.equal(resolveReference('cli/build', RULES), null);
});

const page = (contentPath) => ({
  section: 'In-depth Guides', group: '', title: contentPath, url: `https://angular.dev/${contentPath}`, contentPath, alsoIn: [],
});
const files = {
  'adev/src/content/guide/signals/overview.md': 'one two three <docs-code path="adev/src/content/examples/s/a.ts"/>',
  'adev/src/content/guide/zoneless.md': 'four five',
};
const blobs = new Map([
  ['adev/src/content/guide/signals/overview.md', 'b1'],
  ['adev/src/content/guide/zoneless.md', 'b2'],
  ['adev/src/content/examples/s/a.ts', 'b3'],
]);
const build = (pages, overrides = {}) => buildManifest({
  ref: '22.3.x', commit: 'c0ffee', nav: { pages, external: [] }, navBlob: 'nb', blobs,
  readFile: (p) => files[p], rules: RULES, ...overrides,
});

test('buildManifest records blobs, examples, words and reference', () => {
  const m = build([page('guide/signals/overview'), page('guide/zoneless')]);
  assert.deepEqual(m.angular, { repo: 'angular/angular', ref: '22.3.x', commit: 'c0ffee' });
  assert.equal(m.navBlob, 'nb');
  assert.equal(m.pages[0].blob, 'b1');
  assert.deepEqual(m.pages[0].examples, [{ path: 'adev/src/content/examples/s/a.ts', blob: 'b3' }]);
  assert.equal(m.pages[0].reference, 'references/guide/signals.md');
  assert.equal(m.pages[1].words, 2);
});

test('buildManifest fails naming the missing page file', () => {
  assert.throws(() => build([page('guide/missing')]),
    /Page file missing at c0ffee: adev\/src\/content\/guide\/missing\.md/);
});

test('buildManifest fails naming page and missing example', () => {
  const noExample = new Map(blobs);
  noExample.delete('adev/src/content/examples/s/a.ts');
  assert.throws(() => build([page('guide/signals/overview')], { blobs: noExample }),
    /Example missing for https:\/\/angular\.dev\/guide\/signals\/overview: adev\/src\/content\/examples\/s\/a\.ts/);
});

test('summarize groups words per reference and lists unmapped pages', () => {
  const m = build([page('guide/signals/overview'), page('guide/zoneless')]);
  m.pages[1].reference = null;
  const s = summarize(m);
  assert.equal(s.totalWords, countWords(files['adev/src/content/guide/signals/overview.md']) + 2);
  assert.deepEqual(s.references, [{
    reference: 'references/guide/signals.md', pages: 1,
    words: countWords(files['adev/src/content/guide/signals/overview.md']),
  }]);
  assert.deepEqual(s.unmapped, ['guide/zoneless']);
});

test('batchFor selects references whose pages match any prefix', () => {
  const m = build([page('guide/signals/overview'), page('guide/zoneless')]);
  const batch = batchFor(m, ['guide/signals']);
  assert.deepEqual([...batch.keys()], ['references/guide/signals.md']);
  assert.equal(batch.get('references/guide/signals.md').length, 1);
});
