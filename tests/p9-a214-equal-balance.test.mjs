import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase4/b05-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-equal-balance-evidence.js';

test('communicate38:0 supplies its own releases, values and equality symbol', () => {
  const [source] = SOURCES;
  const task = sessionTaskFor(source.sessionId, source.index);
  assert.equal(taskFingerprint(task), source.taskHash);
  assert.equal(binding(task, source)?.nodeId, source.nodeId);
  const good = original.example(task);
  const wrong = {...good, guess: 'right', runs: [{...good.runs[0], guess: 'right'}]};
  good.runs.unshift(wrong.runs[0]);
  const proof = submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source);
  assert.equal(proof?.source.position, 'communicate38:0');
  assert.equal(proof?.source.nodeId, source.nodeId);
  assert.equal(proof?.independentlyCalculatedLeft, 5);
  assert.equal(proof?.independentlyCalculatedRight, 5);
  assert.equal(proof?.observedOrderedOriginalReleaseSnapshots.length, 2);
  assert.equal(replay(task, good, {sessionId: 'equality', index: 2}), null);
  assert.equal(replay(task, {...good, runs: []}, source), null);
  assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
});
