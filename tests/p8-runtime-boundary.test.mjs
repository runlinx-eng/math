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
  const viewModules = file => (file.startsWith('learning/phase4/') || file.startsWith('learning/phase5/')) && file.endsWith('-view.js');
  const accidental = [...entry].filter(viewModules);
  assert.deepEqual(accidental, [], 'Unexpected lesson views on first-screen graph');
  assert.ok([...lesson].some(viewModules), 'Lesson workspace must retain task renderers');
  assert.ok(!entry.has('learning/phase4/view-engine.js'));
  assert.ok(lesson.has('learning/phase4/view-engine.js'));
  const bytes = [...entry].reduce((n, file) => n + statSync(path.join(root, file)).size, 0);
  console.log(JSON.stringify({startupStaticModules: entry.size, startupStaticJsBytes: bytes,
    lessonStaticModules: lesson.size, excludedLessonViews: [...lesson].filter(viewModules).length}));
});

test('lightweight lesson directory preserves all runtime lesson IDs, routes and reflections', async () => {
  const heavy = await import('../dist/learning/phase4/task-catalog.js');
  const light = await import('../dist/learning/phase4/light-catalog.js');
  assert.deepEqual(light.EXTRA_LESSONS, heavy.EXTRA_LESSONS,
    'The first-screen catalog must not change lesson identity or content');
  assert.deepEqual(light.EXTRA_ROUTES, heavy.EXTRA_ROUTES,
    'The first-screen catalog must not change route order or IDs');
  assert.deepEqual(light.EXTRA_REFLECTIONS, heavy.EXTRA_REFLECTIONS,
    'The first-screen catalog must preserve reflection prompts');
  const sections = [6,10,13,16,18,19,20,21,22,23,24,25,27,28,30,31,32,33,34,35,37,38];
  const original = await Promise.all(sections.map(i =>
    import('../dist/learning/phase5/b' + String(i).padStart(2, '0') + '.js')));
  assert.deepEqual(light.EXTRA_SECTIONS, original.flatMap(batch => batch.SECTIONS ?? []));
});

test('metadata is separated but not activated before a safe async validator split', () => {
  const startupCatalog = read('learning/catalog.js');
  const light = read('learning/phase4/light-catalog.js');
  assert.ok(startupCatalog.includes("from './phase4/catalog.js'"));
  assert.ok(!light.includes("from '../phase5/b"));
  assert.ok(!light.includes("from './b02.js'"));
  assert.ok(!light.includes("from './task-catalog.js'"));
});
