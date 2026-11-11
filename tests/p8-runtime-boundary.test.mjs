import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = file => readFileSync(path.join(root, file), 'utf8');

function reachable(entry) {
  const seen = new Set(), pending = [entry];
  while (pending.length) {
    const file = pending.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const source = read(file);
    const imports = source.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?['"]([^'"]+)['"]/g);
    for (const match of imports) {
      if (!match[1].startsWith('.')) continue;
      const next = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
      if (next.startsWith('..') || !next.endsWith('.js') || !existsSync(path.join(root, next))) continue;
      pending.push(next);
    }
  }
  return seen;
}

test('task-specific rendering is absent from the static 3D startup graph', () => {
  const entry = reachable('space.js');
  const lesson = reachable('learning/learn.js');
  const viewModules = file => /^learning\\/phase[45]\\/.*-view\\.js$/.test(file);
  const accidental = [...entry].filter(viewModules);
  assert.deepEqual(accidental, [], 'Unexpected lesson views on first-screen graph');
  assert.ok([...lesson].some(viewModules), 'Lesson workspace must retain task renderers');
  assert.ok(!entry.has('learning/phase4/view-engine.js'));
  assert.ok(lesson.has('learning/phase4/view-engine.js'));
  const bytes = [...entry].reduce((n, file) => n + statSync(path.join(root, file)).size, 0);
  console.log(JSON.stringify({startupStaticModules: entry.size, startupStaticJsBytes: bytes,
    lessonStaticModules: lesson.size, excludedLessonViews: [...lesson].filter(viewModules).length}));
});
