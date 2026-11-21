import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b26-model.js';
import {P064_SOURCES, p064PythagorasAreaBinding, replayP064PythagorasAreaEvidence, submittedP064PythagorasAreaEvidence} from '../dist/learning/p064-pythagoras-area-evidence.js';

const [source] = P064_SOURCES, context = {sessionId: source.sessionId, index: source.index}, task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P064 locks fingerprint and verifies sums 25 and 100', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  const m = original.example(task), before = structuredClone(m);
  const p = replayP064PythagorasAreaEvidence(task, m, context);
  assert.deepEqual(p?.sums, [25, 100]); assert.deepEqual(m, before);
});
test('P064 requires fresh Check and rejects wrong answers or missing scale', () => {
  const good = original.example(task), bad = structuredClone(good); bad.answers[1] = '50';
  assert.equal(submittedP064PythagorasAreaEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP064PythagorasAreaEvidence(task, good, {attempts:[{value:bad}]}, context), null);
  assert.deepEqual(submittedP064PythagorasAreaEvidence(task, good, {attempts:[{value:bad},{value:good}]}, context)?.sums, [25, 100]);
  const c = structuredClone(good); c.history.length = 0; assert.equal(replayP064PythagorasAreaEvidence(task, c, context), null);
});
test('P064 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p064PythagorasAreaBinding(task, {sessionId: 'pythagoras', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-g26-area') assert.equal(p064PythagorasAreaBinding(rel, {sessionId: id, index: idx}), null);
});
