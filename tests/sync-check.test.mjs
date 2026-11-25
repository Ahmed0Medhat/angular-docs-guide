import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkout } from '../scripts/lib/git-source.mjs';
import { manifestFromCheckout } from '../scripts/lib/manifest.mjs';
import { REFERENCE_RULES } from '../scripts/reference-map.mjs';
import { makeFixtureRepo } from './helpers/fixture-repo.mjs';

const script = fileURLToPath(new URL('../scripts/sync-check.mjs', import.meta.url));
const syncDirs = () => fs.readdirSync(os.tmpdir()).filter((d) => d.startsWith('angular-docs-sync-'));

function setup(t) {
  const repo = makeFixtureRepo();
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'adg-sync-test-'));
  t.after(() => { repo.cleanup(); fs.rmSync(work, { recursive: true, force: true }); });
  const { dir, commit } = checkout({ repo: repo.root, ref: repo.commit, dir: path.join(work, 'co') });
  const manifest = manifestFromCheckout({ dir, commit, ref: 'main', rules: REFERENCE_RULES });
  const manifestPath = path.join(work, 'sources.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const run = (ref) => spawnSync(process.execPath, [script, '--repo', repo.root, '--ref', ref, '--manifest', manifestPath], { encoding: 'utf8' });
  return { repo, run };
}

test('no drift → exit 0', (t) => {
  const { repo, run } = setup(t);
  const r = run(repo.commit);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /No drift/);
});

test('edited page → exit 1 listing the page and its reference', (t) => {
  const { repo, run } = setup(t);
  const next = repo.commitFile('adev/src/content/guide/security.md', '# Security\n\nSanitize every value.\n');
  const r = run(next);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stdout, /Changed \(1\)/);
  assert.match(r.stdout, /https:\/\/angular\.dev\/best-practices\/security .*references\/guide\/security\.md/);
});

test('unknown ref → exit 2 and temp dir removed', (t) => {
  const before = syncDirs();
  const { run } = setup(t);
  const r = run('no-such-ref');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /sync-check failed/);
  assert.deepEqual(syncDirs(), before);
});
