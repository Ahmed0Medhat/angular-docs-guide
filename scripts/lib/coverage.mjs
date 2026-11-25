const URL_RE = /https:\/\/angular\.dev\/[^\s,;)>\]]+/g;

export function sourcesUrls(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.startsWith('> Sources'));
  if (start < 0) return null;
  const block = [];
  for (let i = start; i < lines.length && lines[i].startsWith('>'); i++) block.push(lines[i]);
  return new Set((block.join(' ').match(URL_RE) ?? []).map((u) => u.replace(/\.$/, '')));
}

export function checkCoverage({ manifest, existingFiles, readReference, only }) {
  const errors = [];
  const byRef = new Map();
  for (const page of manifest.pages) {
    if (!page.reference) {
      if (!only) errors.push(`Unmapped page: ${page.contentPath}`);
      continue;
    }
    if (only && !only.includes(page.reference)) continue;
    if (!byRef.has(page.reference)) byRef.set(page.reference, []);
    byRef.get(page.reference).push(page.url);
  }
  for (const file of only ?? []) if (!byRef.has(file)) errors.push(`No pages map to ${file}`);
  for (const [file, urls] of byRef) {
    if (!existingFiles.includes(file)) {
      errors.push(`Missing reference file: ${file} (${urls.length} pages)`);
      continue;
    }
    const listed = sourcesUrls(readReference(file));
    if (!listed) {
      errors.push(`${file}: missing "> Sources" block`);
      continue;
    }
    const missing = urls.filter((u) => !listed.has(u));
    const extra = [...listed].filter((u) => !urls.includes(u));
    if (missing.length) errors.push(`${file}: Sources missing ${missing.join(', ')}`);
    if (extra.length) errors.push(`${file}: Sources lists unmapped ${extra.join(', ')}`);
  }
  if (!only) for (const file of existingFiles) if (!byRef.has(file)) errors.push(`Orphan reference file: ${file}`);
  return errors;
}
