import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b39-model.js';
import {P088R_SOURCES, replayP088RGraphReadingEvidence, submittedP088RGraphReadingEvidence} from '../dist/learning/p088r-graph-reading-evidence.js';

const {ensureB39Ready}=await import('../dist/learning/phase4/async-batches.js');
await ensureB39Ready();
const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P088R_SOURCES) {
  test(`${sessionId}:${index} replays the graph marker and uses the reading tolerance`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP088RGraphReadingEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.expected, index===0?-1.75:4);
    assert.equal(replayP088RGraphReadingEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.answer = '999';
    assert.equal(replay(wrong), null);
    assert.equal(submittedP088RGraphReadingEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP088RGraphReadingEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].v = '0';
    assert.equal(replay(forged), null);
    const tampered=structuredClone(correct);
    tampered.board.marks[0]++;
    assert.equal(replay(tampered),null);
  });
}
