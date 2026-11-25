import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ANGULAR_REPO } from './lib/config.mjs';
import { diffManifests } from './lib/diff.mjs';
import { checkout } from './lib/git-source.mjs';
import { manifestFromCheckout } from './lib/manifest.mjs';
import { REFERENCE_RULES } from './reference-map.mjs';

const { values } = parseArgs({
  options: {
    ref: { type: 'string', default: 'main' },
    repo: { type: 'string', default: ANGULAR_REPO },
    manifest: { type: 'string', default: 'sources.json' },
  },
});

const print = (title, items, describe) => {
  if (!items.length) return;
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  ${describe(item)}`);
};

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'angular-docs-sync-'));
try {
  const previous = JSON.parse(fs.readFileSync(values.manifest, 'utf8'));
  const { dir, commit } = checkout({ repo: values.repo, ref: values.ref, dir: path.join(temp, 'repo') });
  const next = manifestFromCheckout({ dir, commit, ref: values.ref, rules: REFERENCE_RULES });
  const { changed, added, removed } = diffManifests(previous, next);
  console.log(`Compared ${previous.angular.commit.slice(0, 7)} → ${commit.slice(0, 7)} (${values.ref})`);
  print('Changed', changed, (c) => `${c.url}  → ${c.reference ?? 'unmapped'}  [${c.reasons.join('; ')}]`);
  print('Added', added, (a) => `${a.url}  → ${a.reference ?? 'unmapped: add a rule in scripts/reference-map.mjs'}`);
  print('Removed', removed, (r) => `${r.url}  (was ${r.reference ?? 'unmapped'})`);
  const drift = changed.length + added.length + removed.length;
  if (!drift) console.log('No drift.');
  process.exitCode = drift ? 1 : 0;
} catch (error) {
  console.error(`sync-check failed: ${error.message}`);
  process.exitCode = 2;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
