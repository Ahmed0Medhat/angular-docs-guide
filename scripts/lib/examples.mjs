const EXAMPLE_PATH = /<docs-code(?:-multifile)?\b[^>]*?\bpath="([^"]+)"/g;

export function extractExamplePaths(markdown) {
  return [...new Set([...markdown.matchAll(EXAMPLE_PATH)].map((m) => m[1]))].sort();
}
