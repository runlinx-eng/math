import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b34-model.js';
import {P103P_SOURCES, replayP103PPairedSequencesEvidence, submittedP103PPairedSequencesEvidence} from '../dist/learning/p103p-paired-sequences-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P103P_SOURCES) {
  test(`${sessionId}:${index} replays each pair and derives the relation from both columns`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP103PPairedSequencesEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.pairs.length, task.length);
    assert.equal(replayP103PPairedSequencesEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '0';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP103PPairedSequencesEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP103PPairedSequencesEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].i = '27';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.pairs[0][1]++;
    assert.equal(replay(tampered),null);
  });
}
