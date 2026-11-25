// Reads the angular.dev navigation source as text. It never evaluates it:
// anything that is not a plain object/array/string/boolean literal becomes undefined.

const WORD = /[A-Za-z_$][\w$]*|\d+(?:\.\d+)?/y;
const PUNCT = '{}[](),:?;=';

export function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new Error(`Unterminated comment at offset ${i}`);
      i = end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      let value = '';
      let interpolated = false;
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') { value += src[j + 1]; j += 2; continue; }
        if (c === '`' && src[j] === '$' && src[j + 1] === '{') {
          // Interpolated template: its value is unknowable without evaluating, so it stays opaque.
          interpolated = true;
          let depth = 0;
          do {
            if (src[j] === '{') depth++;
            else if (src[j] === '}') depth--;
            j++;
          } while (j < src.length && depth > 0);
          continue;
        }
        value += src[j++];
      }
      if (j >= src.length) throw new Error(`Unterminated string at offset ${i}`);
      tokens.push(interpolated ? { type: 'template', pos: i } : { type: 'string', value, pos: i });
      i = j + 1;
      continue;
    }
    if (src.startsWith('...', i)) { tokens.push({ type: 'punct', value: '...', pos: i }); i += 3; continue; }
    if (PUNCT.includes(c)) { tokens.push({ type: 'punct', value: c, pos: i }); i++; continue; }
    WORD.lastIndex = i;
    const m = WORD.exec(src);
    if (m) { tokens.push({ type: 'word', value: m[0], pos: i }); i += m[0].length; continue; }
    tokens.push({ type: 'punct', value: c, pos: i });
    i++;
  }
  return tokens;
}

const OPEN = new Set(['(', '[', '{']);
const CLOSE = new Set([')', ']', '}']);

class LiteralParser {
  constructor(tokens, pos) { this.t = tokens; this.i = pos; }
  peek() { return this.t[this.i]; }
  next() {
    const tok = this.t[this.i++];
    if (!tok) throw new Error('Unexpected end of navigation source');
    return tok;
  }
  expect(value) {
    const tok = this.next();
    if (tok.value !== value) throw new Error(`Expected "${value}" at offset ${tok.pos}, got "${tok.value}"`);
  }
  // Skips tokens until a ',' or closing bracket at depth 0 (the end of the current expression).
  skipExpression() {
    let depth = 0;
    for (;;) {
      const tok = this.peek();
      if (!tok) return;
      if (depth === 0 && tok.type === 'punct' && (tok.value === ',' || CLOSE.has(tok.value))) return;
      if (tok.type === 'punct' && OPEN.has(tok.value)) depth++;
      if (tok.type === 'punct' && CLOSE.has(tok.value)) depth--;
      this.i++;
    }
  }
  value() {
    const tok = this.peek();
    let result;
    if (tok?.type === 'string') { this.i++; result = tok.value; }
    else if (tok?.value === '[') result = this.array();
    else if (tok?.value === '{') result = this.object();
    else if (tok?.value === 'true' || tok?.value === 'false') { this.i++; result = tok.value === 'true'; }
    this.skipExpression();
    return result;
  }
  array() {
    this.expect('[');
    const items = [];
    while (this.peek()?.value !== ']') {
      if (this.peek()?.value === '...') { this.i++; this.skipExpression(); }
      else items.push(this.value());
      if (this.peek()?.value === ',') this.i++;
    }
    this.expect(']');
    return items;
  }
  object() {
    this.expect('{');
    const obj = {};
    while (this.peek()?.value !== '}') {
      if (this.peek()?.value === '...') { this.i++; this.skipExpression(); }
      else {
        const key = this.next().value;
        if (this.peek()?.value === ':') { this.i++; obj[key] = this.value(); }
        else this.skipExpression();
      }
      if (this.peek()?.value === ',') this.i++;
    }
    this.expect('}');
    return obj;
  }
}

export function parseNavArray(src, exportName) {
  const tokens = tokenize(src);
  const at = tokens.findIndex((t, k) => t.value === exportName && tokens[k - 1]?.value === 'const');
  if (at < 0) throw new Error(`${exportName} not found in navigation source`);
  let k = at;
  while (k < tokens.length && tokens[k].value !== '=') k++;
  const nav = new LiteralParser(tokens, k + 1).value();
  if (!Array.isArray(nav)) throw new Error(`${exportName} is not an array literal`);
  return nav;
}

const isExternal = (path) => typeof path === 'string' && /^https?:\/\//.test(path);

export function flattenPages(nav, sections) {
  const pages = [];
  const external = [];
  const byContentPath = new Map();
  const walk = (items, section, trail) => {
    for (const item of items ?? []) {
      if (!item || typeof item !== 'object') continue;
      if (item.contentPath) {
        const existing = byContentPath.get(item.contentPath);
        if (existing) {
          if (existing.section !== section && !existing.alsoIn.includes(section)) existing.alsoIn.push(section);
        } else {
          const page = {
            section,
            group: trail.join(' > '),
            title: item.label,
            url: `https://angular.dev/${item.path}`,
            contentPath: item.contentPath,
            alsoIn: [],
          };
          byContentPath.set(item.contentPath, page);
          pages.push(page);
        }
      } else if (isExternal(item.path)) {
        external.push({ section, title: item.label, url: item.path });
      }
      if (Array.isArray(item.children)) walk(item.children, section, [...trail, item.label]);
    }
  };
  for (const label of sections) {
    const top = nav.find((n) => n?.label === label);
    if (!top) throw new Error(`Section "${label}" not found in navigation`);
    walk(top.children, label, []);
  }
  return { pages, external };
}
