import { parseArgs } from 'node:util';
import { checkCoverage } from './lib/coverage.mjs';
import { listReferenceFiles, parseFilesFlag, readManifest, readSkillFile } from './lib/skill-files.mjs';

const { values } = parseArgs({ options: { files: { type: 'string' } } });
const errors = checkCoverage({
  manifest: readManifest(),
  existingFiles: listReferenceFiles(),
  readReference: readSkillFile,
  only: parseFilesFlag(values.files),
});
for (const e of errors) console.error(e);
console.log(errors.length ? `coverage: ${errors.length} error(s)` : 'coverage: OK');
process.exitCode = errors.length ? 1 : 0;
