export function whenToUse(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.trim() === '## When to use');
  if (start < 0) return [];
  const tasks = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    const m = /^[-*]\s+(.*)$/.exec(lines[i].trim());
    if (m) tasks.push(m[1]);
  }
  return tasks;
}

export function renderRoutingTable(entries) {
  const rows = entries.map(({ file, tasks }) =>
    `| ${tasks.slice(0, 3).join('; ').replaceAll('|', '\\|')} | [${file}](${file}) |`);
  return ['| Task | Open |', '|---|---|', ...rows].join('\n');
}

export function injectBetweenMarkers(text, start, end, content) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a < 0 || b < a) throw new Error(`SKILL.md routing markers not found (${start} … ${end})`);
  return `${text.slice(0, a + start.length)}\n${content}\n${text.slice(b)}`;
}
