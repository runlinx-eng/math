import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {example, inspect} from '../dist/learning/phase5/b20-model.js';
import {P116H_SOURCES, replayP116HHistogramBinsEvidence, submittedP116HHistogramBinsEvidence} from '../dist/learning/p116h-histogram-bins-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P116H_SOURCES) {
  test(`${sessionId}:${index} replays all bins with an inclusive left edge`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP116HHistogramBinsEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.counts.reduce((a,b)=>a+b,0), task.values.length);
    assert.equal(replayP116HHistogramBinsEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = structuredClone(correct);
    wrong.history=[];
    assert.equal(replay(wrong), null);
    assert.equal(submittedP116HHistogramBinsEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP116HHistogramBinsEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.history[0].d.index='99';
    assert.equal(replay(forged), null);
    const altered=structuredClone(correct);
    altered.board.placed[0]++;
    assert.equal(replay(altered),null);
  });
}
