import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b17-model.js';
import * as view from '../dist/learning/phase5/b17-view.js';
import {
  AFFINE_RULE_SOURCES, affineRulejumpBinding, replayAffineRulejumpEvidence, submittedAffineRulejumpEvidence
} from '../dist/learning/a214-affine-rulejump-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {visibleModel} from './helpers/p9-basic-visible-controls.mjs';

const manifest = JSON.parse(readFileSync(new URL('../docs/spatial-learning/evidence-review-manifest.json', import.meta.url)));
const positions = new Set(manifest.tasks.map(row => row.sessionId + ':' + row.index));
const output = new Map([
  ['percentpatterns:1', [5, 13, 81, 401]],
  ['nth35:0', [3, 7, 11, 199, 399]],
  ['nth35:2', [4, 7, 31, 91]]
]);

for (const source of AFFINE_RULE_SOURCES) {
  const position = source.sessionId + ':' + source.index;
  test(position + ' preserves the failed evaluation and checks the exact affine rule', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(affineRulejumpBinding(task, source)?.nodeId, source.nodeId);
    assert.equal(affineRulejumpBinding({...task, inputs: [...task.inputs, 123]}, source), null);
    assert.equal(affineRulejumpBinding(task, {...source, index: String(source.index)}), null);
    assert.ok(!positions.has(position));
    const work = visibleModel(task, original, view);
    const {field, action, model} = work;
    // A scaled expression has the same slope and intercept.
    field('multiplier', task.a * 2);
    field('offset', task.b * 2);
    field('divisor', '2');
    action('b17-rule');
    field('n', task.inputs[0]);
    field('answer', output.get(position)[0] + 1);
    action('b17-run');
    const wrong = structuredClone(model);
    assert.equal(original.inspect(task, wrong).correct, false);
    assert.equal(replayAffineRulejumpEvidence(task, wrong, source), null);
    for (const [i, n] of task.inputs.entries()) {
      field('n', n);
      field('answer', output.get(position)[i]);
      action('b17-run');
    }
    const record = {attempts: [{value: wrong}, {value: structuredClone(model)}]};
    const replay = submittedAffineRulejumpEvidence(task, model, record, source);
    assert.ok(replay);
    assert.deepEqual(replay.recordedEvaluations.map(r => Number(r.result)), output.get(position));
    assert.equal(replay.events.filter(e => e.accepted === false).length, 1);
    assert.deepEqual(replay.configuredRule, [task.a * 2, task.b * 2, 2]);
    assert.equal(submittedAffineRulejumpEvidence(task, model, {attempts: record.attempts.slice(0, 1)}, source), null);

    const forged = structuredClone(model);
    forged.history[0].f.reason = 'hidden input';
    assert.equal(original.valid(task, forged), true);
    assert.equal(replayAffineRulejumpEvidence(task, forged, source), null);
    forged.history = [];
    assert.equal(replayAffineRulejumpEvidence(task, forged, source), null);
    const draft = {...model, answer: '999'};
    assert.equal(original.inspect(task, draft).correct, true);
    assert.equal(replayAffineRulejumpEvidence(task, draft, source), null);
  });
}
