import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

export const FIXTURE_FILES = {
  'adev/src/app/routing/navigation-entries/index.ts':
    fs.readFileSync(new URL('../fixtures/nav.ts', import.meta.url), 'utf8'),
  'adev/src/content/guide/signals/overview.md':
    '# Signals\n\nSignals are reactive values.\n\n<docs-code header="app.ts"\n  path="adev/src/content/examples/signals/app.ts"/>\n',
  'adev/src/content/guide/signals/linked-signal.md': '# linkedSignal\n\nDependent state.\n',
  'adev/src/content/guide/security.md': '# Security\n\nSanitize values.\n',
  'adev/src/content/best-practices/style-guide.md': '# Style guide\n\nName files consistently.\n',
  'adev/src/content/tools/cli/overview.md': '# CLI\n\nUse ng.\n',
  'adev/src/content/examples/signals/app.ts': 'export const x = 1;\n',
  'packages/core/index.ts': 'export {};\n',
};

export function makeFixtureRepo(files = FIXTURE_FILES) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adg-fixture-'));
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'fixture@example.com']);
  git(root, ['config', 'user.name', 'fixture']);
  git(root, ['config', 'uploadpack.allowAnySHA1InWant', 'true']);
  git(root, ['config', 'uploadpack.allowFilter', 'true']);
  for (const [rel, content] of Object.entries(files)) write(rel, content);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'fixture']);
  return {
    root,
    commit: git(root, ['rev-parse', 'HEAD']),
    commitFile(rel, content) {
      write(rel, content);
      git(root, ['add', '-A']);
      git(root, ['commit', '-q', '-m', `edit ${rel}`]);
      return git(root, ['rev-parse', 'HEAD']);
    },
    cleanup() { fs.rmSync(root, { recursive: true, force: true }); },
  };
}
