import { MAX_REFERENCE_LINES, MAX_SKILL_LINES } from './config.mjs';

const HEADINGS = ['## When to use', '## Rules', '## API cheat-sheet', '## Patterns', '## Pitfalls', '## Version notes'];
const SHINGLE = 12;

export function proseWords(markdown) {
  return (
    markdown
      .replace(/\r\n/g, '\n')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .toLowerCase()
      .match(/[a-z0-9']+/g) ?? []
  );
}

export function verbatimRuns(refText, sourceTexts, size = SHINGLE) {
  const seen = new Set();
  for (const src of sourceTexts) {
    const words = proseWords(src);
    for (let i = 0; i + size <= words.length; i++) seen.add(words.slice(i, i + size).join(' '));
  }
  const words = proseWords(refText);
  const hits = [];
  for (let i = 0; i + size <= words.length; i++) {
    const shingle = words.slice(i, i + size).join(' ');
    if (seen.has(shingle)) {
      hits.push(shingle);
      i += size - 1;
    }
  }
  return hits;
}

export function lintReference({ file, text, sourceTexts }) {
  const errors = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (!lines[0]?.startsWith('# ')) errors.push(`${file}: first line must be a "# " title`);
  if (!lines.some((l) => l.startsWith('> Sources'))) errors.push(`${file}: missing "> Sources" block`);
  let last = -1;
  for (const heading of HEADINGS) {
    const at = lines.findIndex((l) => l.trim() === heading);
    if (at < 0) errors.push(`${file}: missing heading "${heading}"`);
    else if (at < last) errors.push(`${file}: heading "${heading}" out of order`);
    else last = at;
  }
  if (lines.length > MAX_REFERENCE_LINES) errors.push(`${file}: ${lines.length} lines (max ${MAX_REFERENCE_LINES})`);
  if (/\b(TODO|TBD)\b/.test(text)) errors.push(`${file}: contains TODO/TBD`);
  for (const run of verbatimRuns(text, sourceTexts).slice(0, 3)) errors.push(`${file}: verbatim run "${run}"`);
  return errors;
}

export function lintSkill({ text, referenceFiles }) {
  const errors = [];
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text.replace(/\r\n/g, '\n'))?.[1] ?? '';
  if (!/^name: angular-docs-guide$/m.test(front)) errors.push('SKILL.md: frontmatter must declare name: angular-docs-guide');
  if (!/^description: \S/m.test(front)) errors.push('SKILL.md: frontmatter must declare a description');
  const lines = text.split('\n').length;
  if (lines > MAX_SKILL_LINES) errors.push(`SKILL.md: ${lines} lines (max ${MAX_SKILL_LINES})`);
  if (/\b(TODO|TBD)\b/.test(text)) errors.push('SKILL.md: contains TODO/TBD');
  for (const file of referenceFiles) if (!text.includes(file)) errors.push(`SKILL.md: does not link ${file}`);
  return errors;
}
