import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b26-model.js';
import {
  P085_SOURCES,
  p085PythagorasLengthBinding,
  replayP085PythagorasLengthEvidence,
  submittedP085PythagorasLengthEvidence
} from '../dist/learning/p085-pythagoras-length-evidence.js';

const cases = P085_SOURCES.map(source => {
  const {sessionId, index} = source;
  return {source, context: {sessionId, index}, task: sessionTaskFor(sessionId, index)};
});

const act = (task, model, action, data = {}) => original.act(task, model, 'g26-' + action, data);
const replay = (entry, model) => replayP085PythagorasLengthEvidence(entry.task, model, entry.context);
const submit = (entry, model, ...versions) => submittedP085PythagorasLengthEvidence(
  entry.task, model, {attempts: versions.map(value => ({value: structuredClone(value)}))}, entry.context
);

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b, 'en'))
      .map(key => [key, ordered(value[key])]));
  }
  return value;
}

function complete(entry, {corner = 'hfirst', withHelp = false, withReset = false, withFailedAttempts = false} = {}) {
  const {task} = entry;
  const model = original.initial(task, 314159);
  if (withFailedAttempts) {
    if (task.coord) act(task, model, 'hyp', {index: 1});
    act(task, model, 'op', {index: 'add'});
    act(task, model, 'save');
  }
  if (withReset) {
    if (task.coord) act(task, model, 'corner', {index: 'vfirst'});
    act(task, model, 'hyp', {index: 0});
    act(task, model, 'reset');
  }
  if (task.coord) act(task, model, 'corner', {index: corner});
  act(task, model, 'hyp', {index: 1});
  const goal = original.lengthGoal(task);
  act(task, model, 'op', {index: goal.op});
  if (withHelp) act(task, model, 'help');
  model.square = String(goal.square);
  model.result = String(goal.result);
  act(task, model, 'save');
  model.answers[0] = task.questions[0].value;
  return model;
}

test('P085 locks all three original pythagoras length prompts and SHA-256 fingerprints', () => {
  assert.equal(cases.length, 3);
  for (const entry of cases) {
    const hash = createHash('sha256').update(JSON.stringify(ordered(entry.task))).digest('hex');
    assert.equal(hash, entry.source.taskHash);
    assert.equal(p085PythagorasLengthBinding(entry.task, entry.context)?.nodeId, entry.source.nodeId);
    assert.equal(p085PythagorasLengthBinding({...entry.task, a: entry.task.a + 1}, entry.context), null);
    assert.equal(p085PythagorasLengthBinding(entry.task, {...entry.context, index: String(entry.source.index)}), null);
  }
});

test('P085 independently verifies hypotenuse addition, leg subtraction and coordinate distance', () => {
  const expected = [
    {index: 2, op: 'add', knownSquares: [36, 64], square: 100, result: 10, legs: [6, 8], hyp: 10, answer: 'longest', coord: false},
    {index: 3, op: 'subtract', knownSquares: [169, 25], square: 144, result: 12, legs: [5, 12], hyp: 13, answer: 'shorter', coord: false},
    {index: 4, op: 'add', knownSquares: [16, 9], square: 25, result: 5, legs: [4, 3], hyp: 5, answer: 'diagonal', coord: true}
  ];
  for (let i = 0; i < cases.length; i++) {
    const entry = cases[i], want = expected[i];
    const model = complete(entry, {corner: 'vfirst', withHelp: i === 1, withReset: i === 0, withFailedAttempts: true});
    const before = structuredClone(model);
    const proof = replay(entry, model);
    assert.ok(original.inspect(entry.task, model).correct);
    assert.equal(proof?.operation, want.op);
    assert.deepEqual(proof?.knownSquares, want.knownSquares);
    assert.equal(proof?.square, want.square);
    assert.equal(proof?.result, want.result);
    assert.deepEqual(proof?.legs, want.legs);
    assert.equal(proof?.hypotenuse, want.hyp);
    assert.equal(proof?.answer, want.answer);
    assert.equal(proof?.coord, want.coord);
    assert.equal(proof?.helpUsed, i === 1);
    assert.equal(proof?.resets, i === 0 ? 1 : 0);
    assert.ok(proof.failedEvents >= 2);
    assert.deepEqual(model, before);
  }
});

test('P085 rejects approximate inputs accepted by original tolerance and requires exact integer values', () => {
  for (const entry of cases) {
    const approx = complete(entry);
    const goal = original.lengthGoal(entry.task);
    approx.square = String(goal.square + 0.01);
    approx.result = String(goal.result + 0.01);
    act(entry.task, approx, 'save');
    assert.ok(original.inspect(entry.task, approx).correct, 'original tolerance still accepts 0.01 drift');
    assert.equal(replay(entry, approx), null, 'strict evidence rejects approximate square/result');
  }
});

test('P085 requires a fresh Check after editing and preserves failed prior attempts', () => {
  for (const entry of cases) {
    const model = complete(entry);
    const wrong = structuredClone(model);
    wrong.square = '999';
    act(entry.task, wrong, 'save');
    assert.equal(submit(entry, wrong, wrong), null);
    assert.equal(submit(entry, model, wrong), null);
    const accepted = submit(entry, model, wrong, model);
    assert.equal(accepted?.result, original.lengthGoal(entry.task).result);
  }
});

test('P085 rejects tampered history, forged board state, malformed indices and non-coord corner actions', () => {
  for (const entry of cases) {
    const model = complete(entry);
    const mutations = [
      m => { m.history.length = 0; },
      m => { m.board.hyp = 0; },
      m => { m.square = String(Number(m.square) + 1); },
      m => { m.answers[0] = entry.task.questions[0].options[1][0]; },
      m => { const h = m.history.find(e => e.a === 'hyp'); h.d.index = '01'; },
      m => { m.issue = 'stale error'; }
    ];
    if (!entry.task.coord) {
      mutations.push(m => { act(entry.task, m, 'corner', {index: 'hfirst'}); });
    }
    for (const mutate of mutations) {
      const copy = structuredClone(model);
      mutate(copy);
      assert.equal(replay(entry, copy), null, mutate.toString());
    }
  }
});

test('P085 excludes pythagoras precursors, practice index and bridge tasks', async () => {
  await ensureB39Ready();
  for (const other of [0, 1]) {
    assert.equal(p085PythagorasLengthBinding(sessionTaskFor('pythagoras', other), {sessionId: 'pythagoras', index: other}), null);
  }
  for (const entry of cases) {
    assert.equal(p085PythagorasLengthBinding(entry.task, {sessionId: 'pythagoras', index: -1}), null);
  }
  for (const [id, bridge] of Object.entries(BRIDGES)) {
    for (const [index, related] of bridge.tasks.entries()) {
      if (related?.type === 'x-g26-length') {
        assert.equal(p085PythagorasLengthBinding(related, {sessionId: id, index}), null);
      }
    }
  }
});
