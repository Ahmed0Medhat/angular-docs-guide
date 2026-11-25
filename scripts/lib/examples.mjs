const EXAMPLE_PATH = /<docs-code(?:-multifile)?\b[^>]*?\bpath="([^"]+)"/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

export function extractExamplePaths(markdown) {
  const rendered = markdown.replace(HTML_COMMENT, '');
  return [...new Set([...rendered.matchAll(EXAMPLE_PATH)].map((m) => m[1]))].sort();
}
