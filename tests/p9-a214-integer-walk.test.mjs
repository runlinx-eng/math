import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b06-model.js';
import {
  INTEGER_WALK_SOURCES, integerWalkBinding, replayIntegerWalkEvidence, submittedIntegerWalkEvidence
} from '../dist/learning/a214-integer-walk-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';

const manifest = JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json', import.meta.url)));
const official = new Set(manifest.tasks.map(row => row.sessionId + ':' + row.index));

for (const source of INTEGER_WALK_SOURCES) {
  const position = source.sessionId + ':' + source.index;
  test(position + ' checks each stored adjacent stop, including an undone wrong entry', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(integerWalkBinding(task, source)?.nodeId, source.nodeId);
    assert.equal(integerWalkBinding({...task, start: task.start + 1}, source), null);
    assert.equal(integerWalkBinding(task, {...source, sessionId: 'link-' + source.sessionId}), null);
    assert.ok(!official.has(position));

    const model = original.initial(task);
    if (task.infer) model.step = task.step;
    if (task.reason) model.why = task.reason === 'ones' ? 'ones' : 'carry';
    model.next = task.start + task.step + 1;
    original.act(task, model, 'walk-hop');
    const wrong = structuredClone(model);
    assert.equal(original.inspect(task, wrong).correct, false);
    assert.equal(replayIntegerWalkEvidence(task, wrong, source), null);
    original.act(task, model, 'walk-undo');
    for (let i = 1; i <= task.count; i++) {
      model.next = task.start + i * task.step;
      original.act(task, model, 'walk-hop');
    }
    const record = {attempts: [{value: wrong}, {value: structuredClone(model)}]};
    const proof = submittedIntegerWalkEvidence(task, model, record, source);
    assert.ok(proof);
    assert.equal(proof.steps.length, task.count);
    assert.equal(proof.stations.at(-1), task.start + task.count * task.step);
    assert.equal(proof.sourceRetainsUndoneStops, false);
    assert.equal(submittedIntegerWalkEvidence(task, model, {attempts: record.attempts.slice(0, 1)}, source), null);

    const endpointOnly = {...model, hops: model.hops.slice(-1), next: model.hops.at(-1)};
    assert.equal(replayIntegerWalkEvidence(task, endpointOnly, source), null);
    if (task.count > 1) {
      const wrongPath = structuredClone(model);
      wrongPath.hops[0] += 1;
      assert.equal(replayIntegerWalkEvidence(task, wrongPath, source), null);
    }
    const hidden = task.infer ? {...model, next: model.hops.at(-1)} : {...model, step: task.step};
    assert.equal(original.inspect(task, hidden).correct, true);
    assert.equal(replayIntegerWalkEvidence(task, hidden, source), null);
  });
}
