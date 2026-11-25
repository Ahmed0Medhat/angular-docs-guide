import fs from 'node:fs';
import path from 'node:path';
import { SKILL_DIR } from './config.mjs';

export const readManifest = () => JSON.parse(fs.readFileSync('sources.json', 'utf8'));

export function listReferenceFiles() {
  const root = path.join(SKILL_DIR, 'references');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => `references/${f.split(path.sep).join('/')}`)
    .sort();
}

export const readSkillFile = (rel) => fs.readFileSync(path.join(SKILL_DIR, rel), 'utf8');

export const parseFilesFlag = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
