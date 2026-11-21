import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b14-model.js';
import {P062_SOURCES, p062ZeroPlaceProductBinding, replayP062ZeroPlaceProductEvidence, submittedP062ZeroPlaceProductEvidence} from '../dist/learning/p062-zero-place-product-evidence.js';

const [source] = P062_SOURCES, context = {sessionId: source.sessionId, index: source.index}, task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P062 locks bigproduct:2 fingerprint and independently replays all 8 place-value columns', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  const m = original.example(task), before = structuredClone(m);
  const p = replayP062ZeroPlaceProductEvidence(task, m, context);
  assert.equal(p?.product, 60800);
  assert.deepEqual(p?.rows, [0, 60800]);
  assert.equal(p?.workCount, 8);
  assert.deepEqual(m, before);
});
test('P062 preserves failed estimate/row attempts and rejects 6080 or tampered board', () => {
  const m = original.initial(task);
  m.estimate = '6000'; original.act(task, m, 'b14-estimate');
  for (const s of original.solveSteps(task)) { if (s.field) m[s.field] = s.value; else original.act(task, m, s.action, s.data); }
  const p = replayP062ZeroPlaceProductEvidence(task, m, context);
  assert.equal(p?.failedEvents, 1);
  const bad = structuredClone(m); bad.answer = '6080';
  assert.equal(submittedP062ZeroPlaceProductEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP062ZeroPlaceProductEvidence(task, m, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP062ZeroPlaceProductEvidence(task, m, {attempts:[{value:bad},{value:m}]}, context)?.product, 60800);
  const forged = structuredClone(m); forged.board.work.pop();
  assert.equal(replayP062ZeroPlaceProductEvidence(task, forged, context), null);
});
test('P062 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p062ZeroPlaceProductBinding(task, {sessionId: 'bigproduct', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-multable') assert.equal(p062ZeroPlaceProductBinding(rel, {sessionId: id, index: idx}), null);
});
