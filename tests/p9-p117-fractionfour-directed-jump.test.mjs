import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as b09 from '../dist/learning/phase5/b09-model.js';
import {
  P117_SOURCE,
  p117DirectedJumpBinding,
  replayP117DirectedJumpEvidence,
  submittedP117DirectedJumpEvidence
} from '../dist/learning/p117-fractionfour-directed-jump-evidence.js';

const {sessionId, index, nodeId, taskHash} = P117_SOURCE;
const context = {sessionId, index};
const task = sessionTaskFor(sessionId, index);

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key, ordered(value[key])]));
  }
  return value;
}

function start() {
  const model = b09.initial(task);
  model.anchor = -5;
  b09.field(task, model, 'anchor');
  model.guess = '0';
  b09.act(task, model, 'direct-predict');
  model.zero = 'reference';
  return model;
}

function draw(model, change) {
  const count = model.jumps.length;
  model.dir = change > 0 ? 'right' : 'left';
  model.size = String(Math.abs(change));
  b09.act(task, model, 'direct-jump');
  assert.equal(model.jumps.length, count + 1);
}

function work(moves = [3], answer = '-2') {
  const model = start();
  for (const change of moves) draw(model, change);
  model.answer = answer;
  return model;
}

const replay = (model) => replayP117DirectedJumpEvidence(task, model, context);
const attempts = (...models) => ({attempts: models.map(value => ({value: structuredClone(value)}))});

test('P117 freezes one exact original and leaves the formal review list untouched', () => {
  const digest = createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex');
  assert.equal(digest, taskHash);
  assert.equal(LESSONS[sessionId].topicId, nodeId);
  assert.equal(p117DirectedJumpBinding(task, context)?.nodeId, nodeId);
  const manifest = JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.tasks.some(row => row.sessionId === sessionId && row.index === index), false);
  const changes = [{prompt: '伪造题面'}, {max: 11}, {operand: 4}, {reverse: true}, {extra: true}];
  for (const change of changes) assert.equal(p117DirectedJumpBinding({...task, ...change}, context), null);
});

test('P117 replays the successful integer path and preserves signs, lengths and endpoints', () => {
  const model = work([-1, 4], '−2');
  const before = structuredClone(model);
  const proof = replay(model);
  assert.equal(b09.inspect(task, model).correct, true);
  assert.equal(proof.start, -5);
  assert.equal(proof.end, -2);
  assert.equal(proof.signedChange, 3);
  assert.deepEqual(proof.observableSuccessfulJumps, [
    {index: 0, from: -5, change: -1, direction: 'left', unitLength: 1, to: -6},
    {index: 1, from: -6, change: 4, direction: 'right', unitLength: 4, to: -2}
  ]);
  assert.equal(proof.zeroReferenceSelected, true);
  assert.equal(proof.initialGuessCorrectnessAssessed, false);
  assert.equal(proof.undoOrAnchorResetChronologyProven, false);
  assert.equal(proof.learnerMasteryAssessed, false);
  assert.deepEqual(model, before);
});

test('P117 accepts exact equivalent answers and a 40-jump original history', () => {
  for (const answer of ['−2', '-2.0', '-4/2']) assert.equal(replay(work([1, 2], answer))?.end, -2);
  const moves = [...Array.from({length: 19}, () => [1, -1]).flat(), 1, 2];
  assert.equal(replay(work(moves))?.observableSuccessfulJumps.length, 40);
  const tooLong = work(moves);
  tooLong.history.push(1);
  tooLong.jumps.push(1);
  assert.equal(replay(tooLong), null);
});

test('P117 rejects final-only, malformed, inconsistent and mathematically invalid snapshots', () => {
  const mutations = [
    model => { model.history = []; },
    model => { model.history = new Array(1); model.jumps = new Array(1); },
    model => { model.history.extra = 3; },
    model => { model.history = [3, 0]; model.jumps = [3, 0]; },
    model => { model.history = [0.5, 2.5]; model.jumps = [0.5, 2.5]; },
    model => { model.history = [-6, 9]; model.jumps = [-6, 9]; },
    model => { model.history = [-3]; model.jumps = [-3]; },
    model => { model.history = [Number.MAX_SAFE_INTEGER]; model.jumps = [Number.MAX_SAFE_INTEGER]; },
    model => { model.anchor = -4; },
    model => { model.touched = false; },
    model => { model.committed = null; },
    model => { model.guess = '5'; },
    model => { model.answer = '-2.000001'; },
    model => { model.zero = ''; },
    model => { model.refSaved = 0; },
    model => { delete model.refTouched; }
  ];
  for (const change of mutations) {
    const model = work();
    change(model);
    assert.equal(replay(model), null, change.toString());
  }
  assert.equal(replay(null), null);
});

test('P117 declines an undo or anchor reset that leaves extra history despite the original correct grade', () => {
  for (const reset of [
    model => b09.act(task, model, 'direct-undo'),
    model => b09.field(task, model, 'anchor')
  ]) {
    const model = work([-1]);
    reset(model);
    draw(model, 3);
    assert.deepEqual(model.jumps, [3]);
    assert.deepEqual(model.history, [-1, 3]);
    assert.equal(b09.inspect(task, model).correct, true);
    assert.equal(replay(model), null);
  }
});

test('P117 only yields submitted evidence for the latest matching correct Check', () => {
  const wrong = work([3], '-1');
  const good = work([3], '-2');
  const edit = work([1, 2], '-2');
  const submitted = (model, record) => submittedP117DirectedJumpEvidence(task, model, record, context);
  assert.equal(submitted(wrong, attempts(wrong)), null);
  assert.equal(submitted(good, attempts(wrong)), null);
  assert.equal(submitted(good, attempts(wrong, good))?.end, -2);
  assert.equal(submitted(good, attempts(good, wrong)), null);
  assert.equal(submitted(edit, attempts(wrong, good)), null);
  assert.equal(submitted(b09.initial(task), attempts(good)), null);
  assert.equal(submitted(good, {attempts: [null, {value: good}]}), null);
  assert.equal(submitted(good, {attempts: []}), null);
});

test('P117 source isolation uses true practice and bridge contexts', async () => {
  await ensureB39Ready();
  const boundAt = (original, ctx) => p117DirectedJumpBinding(original, ctx);
  assert.equal(boundAt(sessionTaskFor(sessionId, 9), {sessionId, index: 9}), null);
  assert.equal(boundAt(task, {sessionId, index: '8'}), null);
  assert.equal(boundAt(task, {sessionId: 'signedwalk', index}), null);
  assert.equal(boundAt(sessionTaskFor(sessionId, -1), {sessionId, index: -1}), null);
  assert.equal(boundAt(task, {sessionId, index: -1}), null);
  let directed = 0;
  for (const [bridgeId, bridge] of Object.entries(BRIDGES)) {
    for (const [bridgeIndex, original] of bridge.tasks.entries()) {
      if (original?.type !== task.type) continue;
      directed++;
      assert.equal(boundAt(original, {sessionId: bridgeId, index: bridgeIndex}), null);
      assert.equal(boundAt(task, {sessionId: bridgeId, index: bridgeIndex}), null);
    }
  }
  assert.ok(directed > 0);
});
