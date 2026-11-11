import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('3D map validation never imports task-specific view engine', () => {
  const engine = read('../dist/learning/phase4/engine.js');
  const viewEngine = read('../dist/learning/phase4/view-engine.js');
  const lesson = read('../dist/learning/learn.js');
  assert.equal(engine.includes('-view.js'), false);
  assert.equal(engine.includes('renderExtra'), false);
  assert.equal(engine.includes('visualExtra'), false);
  assert.equal(engine.includes('controlsExtra'), false);
  for (const name of ['renderExtra', 'visualExtra', 'controlsExtra']) {
    assert.equal(viewEngine.includes('export const ' + name + '='), true);
  }
  assert.equal(lesson.includes("from './phase4/view-engine.js'"), true);
});
