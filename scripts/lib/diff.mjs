export function diffManifests(oldManifest, newManifest) {
  const oldBy = new Map(oldManifest.pages.map((p) => [p.contentPath, p]));
  const newBy = new Map(newManifest.pages.map((p) => [p.contentPath, p]));
  const changed = [];
  const added = [];
  const removed = [];
  for (const [contentPath, page] of newBy) {
    const before = oldBy.get(contentPath);
    if (!before) {
      added.push({ url: page.url, contentPath, reference: page.reference });
      continue;
    }
    const reasons = [];
    if (before.blob !== page.blob) reasons.push('page');
    const oldExamples = new Map(before.examples.map((e) => [e.path, e.blob]));
    const newExamples = new Map(page.examples.map((e) => [e.path, e.blob]));
    for (const [examplePath, blob] of newExamples) if (oldExamples.get(examplePath) !== blob) reasons.push(`example ${examplePath}`);
    for (const examplePath of oldExamples.keys()) if (!newExamples.has(examplePath)) reasons.push(`example removed ${examplePath}`);
    if (reasons.length) changed.push({ url: page.url, contentPath, reference: before.reference, reasons });
  }
  for (const [contentPath, page] of oldBy) {
    if (!newBy.has(contentPath)) removed.push({ url: page.url, contentPath, reference: page.reference });
  }
  return { changed, added, removed };
}
