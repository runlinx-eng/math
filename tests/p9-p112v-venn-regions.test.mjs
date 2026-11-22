import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b22-model.js';
import {P112V_SOURCES, replayP112VVennRegionsEvidence, submittedP112VVennRegionsEvidence} from '../dist/learning/p112v-venn-regions-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P112V_SOURCES) {
  test(`${sessionId}:${index} replays the selected Venn mode and exact set membership`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP112VVennRegionsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.equal(replay(correct)?.mode,task.mode);
    assert.equal(replayP112VVennRegionsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = '8';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP112VVennRegionsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP112VVennRegionsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].a = 'sample';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.cursor++;
    assert.equal(replay(tampered),null);
  });
}
