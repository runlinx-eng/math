import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b25-model.js';
import {P065_SOURCES, p065SimilarTrianglesBinding, replayP065SimilarTrianglesEvidence, submittedP065SimilarTrianglesEvidence} from '../dist/learning/p065-similar-triangles-evidence.js';

const [source] = P065_SOURCES, context = {sessionId: source.sessionId, index: source.index}, task = sessionTaskFor(source.sessionId, source.index);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P065 locks fingerprint and verifies scale=2 and answer=many', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
  const m = original.example(task), before = structuredClone(m);
  const p = replayP065SimilarTrianglesEvidence(task, m, context);
  assert.equal(p?.scale, 2); assert.equal(p?.answer, 'many'); assert.deepEqual(m, before);
});
test('P065 requires fresh Check and rejects wrong answer or scale', () => {
  const good = original.example(task), bad = structuredClone(good); bad.answers[0] = 'one';
  assert.equal(submittedP065SimilarTrianglesEvidence(task, bad, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP065SimilarTrianglesEvidence(task, good, {attempts:[{value:bad}]}, context), null);
  assert.equal(submittedP065SimilarTrianglesEvidence(task, good, {attempts:[{value:bad},{value:good}]}, context)?.scale, 2);
});
test('P065 excludes practice and bridges', async () => {
  await ensureB39Ready();
  assert.equal(p065SimilarTrianglesBinding(task, {sessionId: 'trianglepossible', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-g25-similar') assert.equal(p065SimilarTrianglesBinding(rel, {sessionId: id, index: idx}), null);
});
