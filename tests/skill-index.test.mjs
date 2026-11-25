import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whenToUse, renderRoutingTable, injectBetweenMarkers } from '../scripts/lib/skill-index.mjs';

test('whenToUse returns bullets of the When to use section only', () => {
  const text = '# T\n\n## When to use\n- Doing A\n* Doing B | C\n\n## Rules\n- MUST x\n';
  assert.deepEqual(whenToUse(text), ['Doing A', 'Doing B | C']);
});

test('renderRoutingTable escapes pipes and keeps at most 3 tasks', () => {
  const table = renderRoutingTable([{ file: 'references/guide/a.md', tasks: ['A', 'B | C', 'D', 'E'] }]);
  assert.equal(table, '| Task | Open |\n|---|---|\n| A; B \\| C; D | [references/guide/a.md](references/guide/a.md) |');
});

test('injectBetweenMarkers replaces content and requires both markers', () => {
  const text = 'x\n<!-- routing:start -->\nold\n<!-- routing:end -->\ny';
  assert.equal(injectBetweenMarkers(text, '<!-- routing:start -->', '<!-- routing:end -->', 'new'),
    'x\n<!-- routing:start -->\nnew\n<!-- routing:end -->\ny');
  assert.throws(() => injectBetweenMarkers('x', '<!-- routing:start -->', '<!-- routing:end -->', 'n'), /markers/);
});
