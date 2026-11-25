import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ANGULAR_REPO, SPARSE_DIRS } from './config.mjs';

const git = (cwd, args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const headOf = (dir) => git(dir, ['rev-parse', 'HEAD']).trim();

export function checkout({ repo = ANGULAR_REPO, ref, dir }) {
  if (fs.existsSync(path.join(dir, '.git'))) {
    try {
      if (headOf(dir) === ref) return { dir, commit: ref };
    } catch {
      // No HEAD yet: fall through and rebuild.
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q']);
  git(dir, ['remote', 'add', 'origin', repo]);
  git(dir, ['fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', ref]);
  git(dir, ['sparse-checkout', 'set', ...SPARSE_DIRS]);
  git(dir, ['checkout', '-q', 'FETCH_HEAD']);
  return { dir, commit: headOf(dir) };
}

export function blobMap(dir) {
  const out = git(dir, ['ls-tree', '-r', '-z', 'HEAD', '--', ...SPARSE_DIRS]);
  const map = new Map();
  for (const entry of out.split('\0')) {
    const m = /^\d+ blob ([0-9a-f]{40})\t(.+)$/.exec(entry);
    if (m) map.set(m[2], m[1]);
  }
  return map;
}

export function readRepoFile(dir, repoPath) {
  return fs.readFileSync(path.join(dir, repoPath), 'utf8');
}
