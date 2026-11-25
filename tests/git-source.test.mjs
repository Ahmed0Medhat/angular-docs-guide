import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkout, blobMap, readRepoFile } from '../scripts/lib/git-source.mjs';
import { makeFixtureRepo } from './helpers/fixture-repo.mjs';

test('sparse checkout by SHA exposes only docs dirs with correct blob SHAs', (t) => {
  const repo = makeFixtureRepo();
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'adg-co-')), 'repo');
  t.after(() => { repo.cleanup(); fs.rmSync(path.dirname(dir), { recursive: true, force: true }); });

  const result = checkout({ repo: repo.root, ref: repo.commit, dir });
  assert.equal(result.commit, repo.commit);
  assert.equal(readRepoFile(dir, 'adev/src/content/guide/security.md'), '# Security\n\nSanitize values.\n');
  assert.equal(fs.existsSync(path.join(dir, 'packages/core/index.ts')), false);

  const blobs = blobMap(dir);
  const expected = execFileSync('git', ['rev-parse', 'HEAD:adev/src/content/guide/security.md'], {
    cwd: repo.root, encoding: 'utf8',
  }).trim();
  assert.equal(blobs.get('adev/src/content/guide/security.md'), expected);
  assert.ok(blobs.has('adev/src/app/routing/navigation-entries/index.ts'));
  assert.equal(blobs.has('packages/core/index.ts'), false);
});

test('checkout by branch name and reuse of an up-to-date dir', (t) => {
  const repo = makeFixtureRepo();
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'adg-co-')), 'repo');
  t.after(() => { repo.cleanup(); fs.rmSync(path.dirname(dir), { recursive: true, force: true }); });

  assert.equal(checkout({ repo: repo.root, ref: 'main', dir }).commit, repo.commit);
  const marker = path.join(dir, '.reuse-marker');
  fs.writeFileSync(marker, '');
  checkout({ repo: repo.root, ref: repo.commit, dir });
  assert.equal(fs.existsSync(marker), true, 'dir at the requested SHA must be reused, not re-cloned');
});

test('unknown ref throws', (t) => {
  const repo = makeFixtureRepo();
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'adg-co-')), 'repo');
  t.after(() => { repo.cleanup(); fs.rmSync(path.dirname(dir), { recursive: true, force: true }); });
  assert.throws(() => checkout({ repo: repo.root, ref: 'no-such-ref', dir }));
});
