import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b30-model.js';
import {P079_SOURCES, p079NetSurfaceBinding, replayP079NetSurfaceEvidence, submittedP079NetSurfaceEvidence} from '../dist/learning/p079-net-surface-evidence.js';

const cases = P079_SOURCES.map(source => ({source, context: {sessionId: source.sessionId, index: source.index}, task: sessionTaskFor(source.sessionId, source.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
const complete = (e, turn = true) => {
  const m = original.initial(e.task);
  if (turn) original.act(e.task, m, 'a30-turn');
  for (let i = 0; i < e.task.faces.length; i++) { original.act(e.task, m, 'a30-face', {index: i}); m.faceValues[i] = String(e.task.faces[i].area); }
  m.area = String(e.task.surface); m.unit = e.task.unit + '²'; return m;
};

test('P079 locks fingerprints', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    assert.equal(p079NetSurfaceBinding(e.task, e.context)?.nodeId, e.source.nodeId);
  }
});
test('P079 verifies box 94 and pyramid 96', () => {
  const want = [94, 96];
  for (let i = 0; i < cases.length; i++) {
    const m = complete(cases[i], true), before = structuredClone(m);
    assert.equal(replayP079NetSurfaceEvidence(cases[i].task, m, cases[i].context)?.surface, want[i]);
    assert.deepEqual(m, before);
    assert.equal(replayP079NetSurfaceEvidence(cases[i].task, complete(cases[i], false), cases[i].context), null);
  }
});
test('P079 requires fresh Check and rejects wrong area/unit', () => {
  for (const e of cases) {
    const good = complete(e, true), bad = structuredClone(good); bad.area = '999';
    assert.equal(submittedP079NetSurfaceEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP079NetSurfaceEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP079NetSurfaceEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.surface, e.task.surface);
    const bu = structuredClone(good); bu.unit = 'cm'; assert.equal(replayP079NetSurfaceEvidence(e.task, bu, e.context), null);
  }
});
test('P079 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p079NetSurfaceBinding(cases[0].task, {sessionId: 'netSurface', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-a30-solid') assert.equal(p079NetSurfaceBinding(rel, {sessionId: id, index: idx}), null);
});
