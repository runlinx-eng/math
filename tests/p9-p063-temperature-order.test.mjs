import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b29-model.js';
import {P063_SOURCES, p063TemperatureOrderBinding, replayP063TemperatureOrderEvidence, submittedP063TemperatureOrderEvidence} from '../dist/learning/p063-temperature-order-evidence.js';

const [source] = P063_SOURCES, context = {sessionId: source.sessionId, index: source.index}, task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P063 locks fingerprint and verifies ascending signed order', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  const m = original.example(task), before = structuredClone(m);
  assert.deepEqual(replayP063TemperatureOrderEvidence(task, m, context)?.orderedValues, [-7, -3, 0, 2, 5]);
  assert.deepEqual(m, before);
});
test('P063 requires fresh Check and rejects reversed negative order', () => {
  const good = original.example(task), bad = original.initial(task);
  for (const i of [1, 0, 2, 3, 4]) original.act(task, bad, 'm29-choose', {index: i});
  assert.equal(submittedP063TemperatureOrderEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP063TemperatureOrderEvidence(task, good, {attempts:[{value:bad}]}, context), null);
  assert.deepEqual(submittedP063TemperatureOrderEvidence(task, good, {attempts:[{value:bad},{value:good}]}, context)?.orderedValues, [-7, -3, 0, 2, 5]);
});
test('P063 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p063TemperatureOrderBinding(task, {sessionId: 'temperaturechange', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-m29-order') assert.equal(p063TemperatureOrderBinding(rel, {sessionId: id, index: idx}), null);
});
