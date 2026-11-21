import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {freshLesson, submitLesson} from '../dist/learning/state.js';
import * as original from '../dist/learning/phase5/b15-model.js';
import {P075_SOURCES, p075PairTableBinding, replayP075PairTableEvidence, submittedP075PairTableEvidence} from '../dist/learning/p075-pair-table-evidence.js';

const cases = P075_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P075 locks both pairtable fingerprints and verifies 12 distinct pairs', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.example(e.task), before = structuredClone(m);
    assert.equal(replayP075PairTableEvidence(e.task, m, e.context)?.total, 12);
    assert.deepEqual(m, before);
  }
});
test('P075 requires fresh Check and rejects wrong count or incomplete pairs', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = structuredClone(good); bad.answer = '7';
    assert.equal(submittedP075PairTableEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP075PairTableEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP075PairTableEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.total, 12);
  }
});

test('P075 counts only pairs made since the original reset and requires a fresh Check', () => {
  for (const {task, context} of cases) {
    const lesson = freshLesson(context.sessionId);
    lesson.index = context.index;
    const model = original.example(task);
    lesson.models[context.index] = model;
    assert.equal(submitLesson(lesson).correct, true);
    const record = lesson.cases[context.index];
    const saved = structuredClone(record.attempts[0]);

    original.act(task, model, 'b15-reset');
    assert.deepEqual(model.board, {pairs: [], left: null});
    assert.equal(replayP075PairTableEvidence(task, model, context), null);
    original.act(task, model, 'b15-left', {index: 0});
    original.act(task, model, 'b15-pair', {index: 0});
    assert.equal(replayP075PairTableEvidence(task, model, context), null);

    for (const step of original.solveSteps(task)) {
      if (step.field) {
        model[step.field] = String(step.value);
        original.field(task, model, step.field);
      } else {
        original.act(task, model, step.action, step.data);
      }
    }
    const rebuilt = replayP075PairTableEvidence(task, model, context);
    assert.equal(rebuilt?.total, 12);
    assert.equal(rebuilt.resets, 1);
    assert.equal(rebuilt.duplicateAttempts, 1);
    assert.equal(submittedP075PairTableEvidence(task, model, record, context), null);

    assert.equal(submitLesson(lesson).correct, true);
    assert.deepEqual(record.attempts[0], saved);
    assert.deepEqual(submittedP075PairTableEvidence(task, model, record, context), rebuilt);

    const altered = structuredClone(model);
    altered.history.find(event => event.action === 'b15-reset').data.value = 'unrecognized';
    assert.equal(replayP075PairTableEvidence(task, altered, context), null);
  }
});

test('P075 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p075PairTableBinding(e.task, {sessionId: e.source.sessionId, index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-pairtable') assert.equal(p075PairTableBinding(rel, {sessionId: id, index: idx}), null);
});
