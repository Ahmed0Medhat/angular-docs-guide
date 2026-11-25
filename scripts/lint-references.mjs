import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { CACHE_DIR, CONTENT_DIR, SKILL_DIR } from './lib/config.mjs';
import { lintReference, lintSkill } from './lib/lint.mjs';
import { listReferenceFiles, parseFilesFlag, readManifest, readSkillFile } from './lib/skill-files.mjs';

const { values } = parseArgs({ options: { files: { type: 'string' } } });
if (!fs.existsSync(path.join(CACHE_DIR, CONTENT_DIR))) {
  console.error(`Missing ${CACHE_DIR}; run "node scripts/inventory.mjs" first.`);
  process.exit(2);
}
const manifest = readManifest();
const only = parseFilesFlag(values.files);
const files = only ?? listReferenceFiles();
const errors = [];
for (const file of files) {
  const sourceTexts = manifest.pages
    .filter((p) => p.reference === file)
    .map((p) => fs.readFileSync(path.join(CACHE_DIR, CONTENT_DIR, `${p.contentPath}.md`), 'utf8'));
  errors.push(...lintReference({ file, text: readSkillFile(file), sourceTexts }));
}
if (!only && fs.existsSync(path.join(SKILL_DIR, 'SKILL.md'))) {
  errors.push(...lintSkill({ text: readSkillFile('SKILL.md'), referenceFiles: listReferenceFiles() }));
}
for (const e of errors) console.error(e);
console.log(errors.length ? `lint: ${errors.length} error(s)` : `lint: OK (${files.length} reference files)`);
process.exitCode = errors.length ? 1 : 0;
