import fs from 'node:fs';
import path from 'node:path';
import { SKILL_DIR } from './lib/config.mjs';
import { injectBetweenMarkers, renderRoutingTable, whenToUse } from './lib/skill-index.mjs';
import { listReferenceFiles, readSkillFile } from './lib/skill-files.mjs';

const entries = listReferenceFiles().map((file) => ({ file, tasks: whenToUse(readSkillFile(file)) }));
const skillPath = path.join(SKILL_DIR, 'SKILL.md');
const next = injectBetweenMarkers(fs.readFileSync(skillPath, 'utf8'), '<!-- routing:start -->', '<!-- routing:end -->', renderRoutingTable(entries));
fs.writeFileSync(skillPath, next);
console.log(`routing table: ${entries.length} reference files`);
