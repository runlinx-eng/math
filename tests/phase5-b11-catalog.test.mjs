import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LESSONS, ROUTES, TASKS, BRIDGES} from '../dist/learning/phase5/b11.js';
import {map} from '../scripts/phase5-b11-goals.mjs';
import {BRIDGES as allBridges, sourceBridge} from '../dist/learning/bridges.js';
import {defaultModel, exampleModel, validModel, inspect} from '../dist/learning/tasks.js';
const read = p => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const plan = read('../docs/content-plan/catalog.json'), atlas = read('../dist/data/atlas.json');

test('B11 covers exactly its 23 planned source nodes, eight short routes and 23 source edges', () => {
  assert.deepEqual(Object.values(LESSONS).map(l => l.topicId).sort(), plan.batches.find(b => b.id === 'B11').topicIds.slice().sort());
  assert.equal(ROUTES.length, 8);
  assert.deepEqual(ROUTES.flatMap(r => r.ids).sort(), Object.keys(LESSONS).sort());
  assert.ok(ROUTES.every(r => r.ids.length >= 2 && r.ids.length <= 4 && ['act', 'parts', 'strategy'].includes(r.section)));
  assert.equal(BRIDGES.length, 23);
  for (const b of Object.values(allBridges).filter(b => b.batch === 'B11')) assert.ok(sourceBridge(b.id, atlas), b.id);
});

test('all 72 B11 source goals have existing task references and explicit bounded claims', () => {
  let goals = 0;
  for (const [id, l] of Object.entries(LESSONS)) {
    const node = plan.nodes.find(n => n.id === l.topicId);
    assert.equal(map[id].length, node.learningGoals.length, id);
    for (const [indices, claim] of map[id]) {
      assert.ok(indices.length > 0 && indices.every(i => TASKS[id][i]), id);
      assert.ok(typeof claim === 'string' && claim.length > 10, id);
      goals++;
    }
  }
  assert.equal(goals, 72);
});

test('all 86 new tasks and 46 joint tasks dispatch through shared state and survive JSON', () => {
  assert.equal(Object.values(TASKS).flat().length, 86);
  assert.equal(BRIDGES.flatMap(b => b.tasks).length, 46);
  for (const t of [...Object.values(TASKS).flat(), ...BRIDGES.flatMap(b => b.tasks)]) {
    const empty = defaultModel(t), done = exampleModel(t);
    assert.ok(validModel(t, empty), t.prompt);
    assert.equal(inspect(t, empty).correct, false, t.prompt);
    assert.ok(validModel(t, JSON.parse(JSON.stringify(done))), t.prompt);
    assert.ok(inspect(t, done).correct, t.prompt);
  }
});
