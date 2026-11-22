import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase4/b04-model.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {SOURCES, binding, replay, submitted} from '../dist/learning/a214-sorting-counts-evidence.js';

for (const source of SOURCES) {
  test(source.sessionId + ':' + source.index + ' checks every assignment, frequency and applicable sort', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(binding(task, source)?.nodeId, source.nodeId);
    const good = original.example(task);
    if (!task.ordered) good.order = [];
    const expected = task.labels.map((_, i) => task.items.reduce((sum, item) => sum + (item[task.rule] === i), 0));
    const proof = replay(task, good, source);
    assert.deepEqual(proof?.categories.map(row => row.count), expected);
    assert.equal(proof?.assignmentChronologyRecorded, false);
    const misplaced = {...good, dest: [...good.dest]};
    misplaced.dest[0] = (misplaced.dest[0] + 1) % task.labels.length;
    assert.equal(replay(task, misplaced, source), null);
    assert.equal(submitted(task, good, {attempts: [{value: misplaced}]}, source), null);
    assert.ok(submitted(task, good, {attempts: [{value: misplaced}, {value: structuredClone(good)}]}, source));
  });
}
