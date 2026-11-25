import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tokenize, parseNavArray, flattenPages } from '../scripts/lib/nav-parser.mjs';

const fixture = fs.readFileSync(new URL('./fixtures/nav.ts', import.meta.url), 'utf8');
const SECTIONS = ['In-depth Guides', 'Developer Tools', 'Best Practices', 'Extended Ecosystem'];

test('parses the top-level array and drops dev-only spreads', () => {
  const nav = parseNavArray(fixture, 'DOCS_SUB_NAVIGATION_DATA');
  assert.deepEqual(nav.map((n) => n.label), [
    'Introduction', 'In-depth Guides', 'Developer Tools', 'Best Practices', 'Extended Ecosystem',
  ]);
});

test('flattens in-scope pages in nav order with group and url', () => {
  const { pages } = flattenPages(parseNavArray(fixture, 'DOCS_SUB_NAVIGATION_DATA'), SECTIONS);
  assert.deepEqual(pages.map((p) => p.contentPath), [
    'guide/signals/overview', 'guide/signals/linked-signal', 'guide/security',
    'tools/cli/overview', 'best-practices/style-guide',
  ]);
  const linked = pages[1];
  assert.equal(linked.title, "It's linked");
  assert.equal(linked.group, 'Signals');
  assert.equal(linked.section, 'In-depth Guides');
  assert.equal(linked.url, 'https://angular.dev/guide/signals/linked-signal');
});

test('a page listed in two sections appears once with alsoIn', () => {
  const { pages } = flattenPages(parseNavArray(fixture, 'DOCS_SUB_NAVIGATION_DATA'), SECTIONS);
  const security = pages.filter((p) => p.contentPath === 'guide/security');
  assert.equal(security.length, 1);
  assert.equal(security[0].section, 'In-depth Guides');
  assert.deepEqual(security[0].alsoIn, ['Best Practices']);
});

test('external links are recorded separately', () => {
  const { external } = flattenPages(parseNavArray(fixture, 'DOCS_SUB_NAVIGATION_DATA'), SECTIONS);
  assert.deepEqual(external, [
    { section: 'Extended Ecosystem', title: 'Angular Material', url: 'https://material.angular.dev/' },
  ]);
});

test('missing section fails loudly', () => {
  const nav = parseNavArray(fixture, 'DOCS_SUB_NAVIGATION_DATA');
  assert.throws(() => flattenPages(nav, ['Nope']), /Section "Nope" not found/);
});

test('missing export fails loudly', () => {
  assert.throws(() => parseNavArray(fixture, 'NOPE'), /NOPE not found/);
});

test('unterminated string fails loudly', () => {
  assert.throws(() => tokenize("const a = 'oops"), /Unterminated string/);
});
