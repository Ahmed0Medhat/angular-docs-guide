import path from 'node:path';
import { CACHE_DIR, CONTENT_DIR } from './lib/config.mjs';
import { batchFor } from './lib/manifest.mjs';
import { readManifest } from './lib/skill-files.mjs';

const prefixes = process.argv.slice(2);
if (!prefixes.length) {
  console.error('usage: node scripts/list-batch.mjs <contentPath prefix>...');
  process.exit(2);
}
for (const [reference, pages] of batchFor(readManifest(), prefixes)) {
  const words = pages.reduce((sum, p) => sum + p.words, 0);
  console.log(`\n${reference}  (${pages.length} pages, ${words} words)`);
  for (const p of pages) {
    console.log(`  ${p.title} — ${p.url}`);
    console.log(`    ${path.join(CACHE_DIR, CONTENT_DIR, `${p.contentPath}.md`)}`);
    for (const e of p.examples) console.log(`    example ${path.join(CACHE_DIR, e.path)}`);
  }
}
