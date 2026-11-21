import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b19-model.js';
import {P066_SOURCES, p066DataCleanBinding, replayP066DataCleanEvidence, submittedP066DataCleanEvidence} from '../dist/learning/p066-data-clean-evidence.js';

const [source] = P066_SOURCES, context = {sessionId: source.sessionId, index: source.index}, task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P066 locks checkrecords:0 fingerprint and replays all 8 cleaning decisions (7 usable, 1 unknown)', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  const m = original.example(task), before = structuredClone(m);
  const p = replayP066DataCleanEvidence(task, m, context);
  assert.equal(p?.usable, 7); assert.equal(p?.unknown, 1);
  assert.deepEqual(m, before);
});
test('P066 rejects wrong usable/unknown counts and requires fresh Check', () => {
  const good = original.example(task), bad = structuredClone(good); bad.usable = '8'; bad.unknown = '0';
  assert.equal(submittedP066DataCleanEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP066DataCleanEvidence(task, good, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP066DataCleanEvidence(task, good, {attempts:[{value:bad},{value:good}]}, context)?.usable, 7);
});
test('P066 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p066DataCleanBinding(task, {sessionId: 'checkrecords', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-dataclean') assert.equal(p066DataCleanBinding(rel, {sessionId: id, index: idx}), null);
});
