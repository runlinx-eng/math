import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b24-model.js';
import {P115S_SOURCES, replayP115SStudioSymmetryEvidence, submittedP115SStudioSymmetryEvidence} from '../dist/learning/p115s-studio-symmetry-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P115S_SOURCES) {
  test(`${sessionId}:${index} replays reflection before a half-turn and verifies both axes`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP115SStudioSymmetryEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.parts.length, 4);
    assert.equal(replayP115SStudioSymmetryEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answers[0] = 'one';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP115SStudioSymmetryEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP115SStudioSymmetryEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history.reverse();
    assert.equal(replay(forged), null);
    assert.equal(replay({...correct,answers:['one','180']}),null);
  });
}
