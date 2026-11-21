import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b30-model.js';
import {P070_SOURCES, p070PerimeterWalkBinding, replayP070PerimeterWalkEvidence, submittedP070PerimeterWalkEvidence} from '../dist/learning/p070-perimeter-walk-evidence.js';

const [source] = P070_SOURCES, context = {sessionId: source.sessionId, index: source.index};
const task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
const complete = () => {
  const m = original.initial(task);
  for (const i of [0, 1, 2, 3]) original.act(task, m, 'a30-edge', {index: i});
  m.perimeter = '26'; m.unit = 'cm'; return m;
};

test('P070 locks fingerprint', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  assert.equal(p070PerimeterWalkBinding(task, context)?.nodeId, source.nodeId);
});
test('P070 verifies 4 edges and 26 cm perimeter', () => {
  const m = complete(), before = structuredClone(m);
  assert.equal(replayP070PerimeterWalkEvidence(task, m, context)?.perimeter, 26);
  assert.deepEqual(m, before);
});
test('P070 requires fresh Check and rejects missing edge/unit', () => {
  const good = complete(), bad = structuredClone(good); bad.perimeter = '40';
  assert.equal(submittedP070PerimeterWalkEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP070PerimeterWalkEvidence(task, good, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP070PerimeterWalkEvidence(task, good, {attempts:[{value:bad},{value:good}]}, context)?.perimeter, 26);
  const miss = structuredClone(good); original.act(task, miss, 'a30-undo');
  assert.equal(replayP070PerimeterWalkEvidence(task, miss, context), null);
  const bu = structuredClone(good); bu.unit = 'cm²'; assert.equal(replayP070PerimeterWalkEvidence(task, bu, context), null);
});
test('P070 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p070PerimeterWalkBinding(task, {sessionId: 'multiShape38', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-a30-grid') assert.equal(p070PerimeterWalkBinding(rel, {sessionId: id, index: idx}), null);
});
