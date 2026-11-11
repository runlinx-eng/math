import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('3D map does not import task-specific view engine through validation', () => {
  const engine = read('../dist/learning/phase4/engine.js');
  const viewEngine = read('../dist/learning/phase4/view-engine.js');
  const lesson = read('../dist/learning/learn.js');
  assert.doesNotMatch(engine, /from ['"][^'"]+-view\\.js['"]/);
  assert.doesNotMatch(engine, /(?:renderExtra|visualExtra|controlsExtra)/);
  for (const name of ['renderExtra','visualExtra','controlsExtra']) {
    assert.match(viewEngine, new RegExp('export const ' + name + '='));
  }
  assert.match(lesson, /from '\\.\\/phase4\\/view-engine\\.js'/);
});
