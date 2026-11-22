import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase4/b05-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-parity-argument-evidence.js';

test('justify:2 verifies stored pairs, the supplied argument and a genuine counterexample', () => {
  const [source] = SOURCES;
  const task = sessionTaskFor(source.sessionId, source.index);
  assert.equal(taskFingerprint(task), source.taskHash);
  assert.equal(binding(task, source)?.nodeId, source.nodeId);
  const good = original.example(task);
  const result = replay(task, good, source);
  assert.equal(result?.joinedEvenExamples[0].total, 10);
  assert.equal(result?.constructedCounterexample.leftover, 1);
  assert.equal(result?.freeExplanationAssessed, false);
  const wrong = {...good, counterA: good.counterA + 1};
  assert.equal(replay(task, wrong, source), null);
  assert.equal(replay(task, {...good, counterBuilt: false}, source), null);
  assert.equal(replay(task, {...good, examples: [good.examples[0], good.examples[0], good.examples[1]]}, source), null);
  assert.equal(replay(task, {...good, chain: [...good.chain].reverse()}, source), null);
  assert.equal(submitted(task, good, {attempts: [{value: wrong}]}, source), null);
  assert.ok(submitted(task, good, {attempts: [{value: wrong}, {value: structuredClone(good)}]}, source));
});
