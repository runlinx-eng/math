import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b06-model.js';
import {P106P_SOURCES, replayP106PPartWholeSnapshotsEvidence, submittedP106PPartWholeSnapshotsEvidence} from '../dist/learning/p106p-part-whole-snapshots-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P106P_SOURCES) {
  test(`${sessionId}:${index} distinguishes different saved decompositions from a color swap`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP106PPartWholeSnapshotsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.combinations, [[3,5],[4,4]]);
    assert.equal(replayP106PPartWholeSnapshotsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.total=7;
    assert.equal(replay(wrong), null);
    assert.equal(submittedP106PPartWholeSnapshotsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP106PPartWholeSnapshotsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.saved=[[3,5],[5,3]];
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.saved[0][0]++;
    assert.equal(replay(tampered),null);
  });
}
