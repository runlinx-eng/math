import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b17-model.js';
import * as view from '../dist/learning/phase5/b17-view.js';
import {
  HUNDREDTHS_SOURCES, hundredthsConstructionBinding, replayHundredthsConstructionEvidence,
  submittedHundredthsConstructionEvidence
} from '../dist/learning/a214-hundredths-construction-evidence.js';
import {taskFingerprint} from '../scripts/audit-evidence-expansion.mjs';
import {visibleModel} from './helpers/p9-basic-visible-controls.mjs';

for (const source of HUNDREDTHS_SOURCES) {
  test('tenthtohundred:' + source.index + ' converts complete strips and disjoint single cells', () => {
    const task = sessionTaskFor(source.sessionId, source.index);
    assert.equal(taskFingerprint(task), source.taskHash);
    assert.equal(hundredthsConstructionBinding(task, source)?.nodeId, source.nodeId);
    assert.equal(hundredthsConstructionBinding(task, {...source, index: 0}), null);
    assert.equal(hundredthsConstructionBinding({...task, tenths: 1}, source), null);

    const build = unit => {
      const {action, field, model} = visibleModel(task, original, view);
      const stripCount = task.tenths * 10;
      const total = stripCount + task.hundredths;
      for (let i = 0; i < (unit === 'ten' ? task.tenths : stripCount); i++) action('b17-' + unit, {index: i});
      action('b17-layer', {index: 1});
      action('b17-cell', {index: 0}); // The original control refuses overlap.
      for (let i = stripCount; i < total; i++) action('b17-cell', {index: i});
      field('left', stripCount + '/100');
      field('answer', total + '/110');
      field('decimal', (total / 100).toFixed(2));
      const wrong = structuredClone(model);
      assert.equal(original.inspect(task, wrong).correct, false);
      field('answer', total + '/100');
      return {model, wrong};
    };
    const {model, wrong} = build('ten');
    const record = {attempts: [{value: wrong}, {value: structuredClone(model)}]};
    const replay = submittedHundredthsConstructionEvidence(task, model, record, source);
    assert.equal(replay?.tenthsAsHundredths, source.index === 1 ? 30 : 20);
    assert.equal(replay?.totalHundredths, source.index === 1 ? 34 : 27);
    assert.equal(replay?.events.filter(event => event.blocked).length, 1);
    assert.equal(submittedHundredthsConstructionEvidence(task, model, {attempts: record.attempts.slice(0, 1)}, source), null);

    const individual = build('cell').model;
    assert.equal(original.inspect(task, individual).correct, true);
    assert.equal(replayHundredthsConstructionEvidence(task, individual, source), null, 'same color counts do not establish whole-strip action');
    const forged = structuredClone(model);
    forged.history[0].f.reason = 'hidden';
    assert.equal(original.valid(task, forged), true);
    assert.equal(replayHundredthsConstructionEvidence(task, forged, source), null);
  });
}
