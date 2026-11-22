import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, example, initial, inspect} from '../dist/learning/phase5/b20-model.js';
import {P116F_SOURCES, replayP116FFractionDotplotEvidence, submittedP116FFractionDotplotEvidence} from '../dist/learning/p116f-fraction-dotplot-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) :
  value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,ordered(value[key])])) : value;

for (const {sessionId, index, taskHash} of P116F_SOURCES) {
  test(`${sessionId}:${index} requires exact eighths and the latest Check`, () => {
    const context = {sessionId, index};
    const task = sessionTaskFor(sessionId, index);
    const replay = model => replayP116FFractionDotplotEvidence(task, model, context);
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), taskHash);
    const correct = example(task);
    assert.ok(inspect(task, correct).correct);
    assert.deepEqual(replay(correct)?.ticks, task.values);
    assert.equal(replayP116FFractionDotplotEvidence(task, correct, {sessionId, index:-1}), null);
    const wrong = initial(task);
    assert.equal(submittedP116FFractionDotplotEvidence(task, correct, {attempts:[{value:wrong}]}, context), null);
    assert.deepEqual(submittedP116FFractionDotplotEvidence(task, correct, {attempts:[{value:structuredClone(correct)}]}, context), replay(correct));
    const forged = structuredClone(correct);
    forged.board.placed[0] += 1;
    assert.equal(replay(forged), null);
    const drift = initial(task);
    for (const [i,tick] of task.values.entries()) {
      drift.value = String(tick / task.d + (i === 0 ? 1e-10 : 0));
      act(task, drift, 'b20-dot');
    }
    drift.answers = correct.answers;
    assert.ok(inspect(task, drift).correct);
    assert.equal(replay(drift), null);
    act(task, correct, 'b20-reset');
    assert.equal(replay(correct), null);
  });
}
