import { CONTENT_DIR, NAV_EXPORT, NAV_FILE, PINNED, SECTIONS } from './config.mjs';
import { extractExamplePaths } from './examples.mjs';
import { blobMap, readRepoFile } from './git-source.mjs';
import { flattenPages, parseNavArray } from './nav-parser.mjs';

export const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

const matches = (contentPath, prefix) => contentPath === prefix || contentPath.startsWith(`${prefix}/`);

export function resolveReference(contentPath, rules) {
  for (const [prefix, target] of rules) {
    if (!matches(contentPath, prefix)) continue;
    const segment = contentPath === prefix ? prefix.split('/').at(-1) : contentPath.slice(prefix.length + 1).split('/')[0];
    return target.replace('{1}', segment);
  }
  return null;
}

export function buildManifest({ ref, commit, nav, navBlob, blobs, readFile, rules }) {
  const pages = nav.pages.map((page) => {
    const mdPath = `${CONTENT_DIR}/${page.contentPath}.md`;
    const blob = blobs.get(mdPath);
    if (!blob) throw new Error(`Page file missing at ${commit}: ${mdPath} (${page.url})`);
    const markdown = readFile(mdPath);
    const examples = extractExamplePaths(markdown).map((examplePath) => {
      const exampleBlob = blobs.get(examplePath);
      if (!exampleBlob) throw new Error(`Example missing for ${page.url}: ${examplePath}`);
      return { path: examplePath, blob: exampleBlob };
    });
    return {
      ...page,
      blob,
      words: countWords(markdown),
      examples,
      reference: resolveReference(page.contentPath, rules),
    };
  });
  return { angular: { repo: PINNED.repo, ref, commit }, navBlob, pages, external: nav.external };
}

export function manifestFromCheckout({ dir, commit, ref, rules }) {
  const blobs = blobMap(dir);
  const nav = flattenPages(parseNavArray(readRepoFile(dir, NAV_FILE), NAV_EXPORT), SECTIONS);
  return buildManifest({
    ref, commit, nav, navBlob: blobs.get(NAV_FILE), blobs, readFile: (p) => readRepoFile(dir, p), rules,
  });
}

export function summarize(manifest) {
  const byRef = new Map();
  const unmapped = [];
  for (const page of manifest.pages) {
    if (!page.reference) { unmapped.push(page.contentPath); continue; }
    const entry = byRef.get(page.reference) ?? { reference: page.reference, pages: 0, words: 0 };
    entry.pages += 1;
    entry.words += page.words;
    byRef.set(page.reference, entry);
  }
  return {
    totalWords: manifest.pages.reduce((sum, p) => sum + p.words, 0),
    references: [...byRef.values()],
    unmapped,
  };
}

export function batchFor(manifest, prefixes) {
  const batch = new Map();
  for (const page of manifest.pages) {
    if (!page.reference || !prefixes.some((prefix) => matches(page.contentPath, prefix))) continue;
    if (!batch.has(page.reference)) batch.set(page.reference, []);
    batch.get(page.reference).push(page);
  }
  return batch;
}
