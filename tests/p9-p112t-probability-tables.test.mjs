import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b22-model.js';
import {P112T_SOURCES, replayP112TProbabilityTablesEvidence, submittedP112TProbabilityTablesEvidence} from '../dist/learning/p112t-probability-tables-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P112T_SOURCES) {
  test(`${sessionId}:${index} replays probability tables using exact fractions`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP112TProbabilityTablesEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.weights, task.weights);
    assert.equal(replayP112TProbabilityTablesEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '8';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP112TProbabilityTablesEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP112TProbabilityTablesEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].f.values[0] = '0';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.values[0] = String(Number(tampered.board.built[0])+1e-9);
    assert.ok(inspect(task,tampered).correct);
    assert.equal(replay(tampered),null);
  });
}
