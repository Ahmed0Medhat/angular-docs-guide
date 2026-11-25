import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { CACHE_DIR, PINNED } from './lib/config.mjs';
import { checkout } from './lib/git-source.mjs';
import { manifestFromCheckout, summarize } from './lib/manifest.mjs';
import { REFERENCE_RULES } from './reference-map.mjs';

const { values } = parseArgs({
  options: {
    ref: { type: 'string', default: PINNED.commit },
    out: { type: 'string', default: 'sources.json' },
  },
});

const { dir, commit } = checkout({ ref: values.ref, dir: CACHE_DIR });
const ref = values.ref === PINNED.commit ? PINNED.ref : values.ref;
const manifest = manifestFromCheckout({ dir, commit, ref, rules: REFERENCE_RULES });
fs.writeFileSync(values.out, `${JSON.stringify(manifest, null, 2)}\n`);

const summary = summarize(manifest);
console.log(`${manifest.pages.length} pages, ${summary.totalWords} words, ${manifest.external.length} external links @ ${commit}`);
for (const r of summary.references) {
  console.log(`${String(r.words).padStart(7)}w ${String(r.pages).padStart(3)}p  ${r.reference}`);
}
if (summary.unmapped.length) {
  console.log(`\nUnmapped pages (${summary.unmapped.length}):`);
  for (const p of summary.unmapped) console.log(`  ${p}`);
  process.exitCode = 1;
}
