import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {freshLesson, submitLesson} from '../dist/learning/state.js';
import * as original from '../dist/learning/phase5/b15-model.js';
import {P084_SOURCES, p084ExpressionBuildBinding, replayP084ExpressionBuildEvidence, submittedP084ExpressionBuildEvidence} from '../dist/learning/p084-expression-build-evidence.js';

const cases = P084_SOURCES.map(s => ({source: s, context: {sessionId: s.sessionId, index: s.index}, task: sessionTaskFor(s.sessionId, s.index)}));
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);
test('P084 locks fingerprints and replays AST build including syntax error recovery', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    const m = original.initial(e.task);
    m.expression = '(8+7'; original.act(e.task, m, 'b15-build');
    m.expression = e.task.expected; original.act(e.task, m, 'b15-build');
    if (e.task.reason) m.reason = e.task.reason;
    const p = replayP084ExpressionBuildEvidence(e.task, m, e.context);
    assert.equal(p?.expected, e.task.expected);
    assert.equal(p?.failedBuilds, 1);
  }
});
test('P084 rejects missing parentheses and requires fresh Check', () => {
  for (const e of cases) {
    const good = original.example(e.task), bad = original.initial(e.task);
    bad.expression = e.task.expected.replace(/[()]/g, ''); original.act(e.task, bad, 'b15-build');
    assert.equal(submittedP084ExpressionBuildEvidence(e.task, bad, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP084ExpressionBuildEvidence(e.task, good, {attempts:[{value:bad}]}, e.context), null);
    assert.equal(submittedP084ExpressionBuildEvidence(e.task, good, {attempts:[{value:bad},{value:good}]}, e.context)?.expected, e.task.expected);
  }
});

test('P084 requires a new build and Check after the original reset', () => {
  for (const {task, context} of cases) {
    const lesson = freshLesson(context.sessionId);
    lesson.index = context.index;
    const model = original.initial(task);
    lesson.models[context.index] = model;
    model.expression = '(8+7';
    original.act(task, model, 'b15-build');
    model.expression = task.expected;
    original.act(task, model, 'b15-build');
    if (task.reason) model.reason = task.reason;

    assert.equal(submitLesson(lesson).correct, true);
    const record = lesson.cases[context.index];
    const saved = structuredClone(record.attempts[0]);

    original.act(task, model, 'b15-reset');
    assert.equal(model.board.tree, null);
    assert.equal(model.board.first, '(8+7');
    assert.equal(replayP084ExpressionBuildEvidence(task, model, context), null);
    original.act(task, model, 'b15-build');
    const rebuilt = replayP084ExpressionBuildEvidence(task, model, context);
    assert.equal(rebuilt?.resets, 1);
    assert.equal(rebuilt.failedBuilds, 1);
    assert.equal(submittedP084ExpressionBuildEvidence(task, model, record, context), null);

    assert.equal(submitLesson(lesson).correct, true);
    assert.deepEqual(record.attempts[0], saved);
    assert.deepEqual(submittedP084ExpressionBuildEvidence(task, model, record, context), rebuilt);

    const altered = structuredClone(model);
    altered.history.find(event => event.action === 'b15-reset').data.index = 0;
    assert.equal(replayP084ExpressionBuildEvidence(task, altered, context), null);
  }
});

test('P084 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p084ExpressionBuildBinding(e.task, {sessionId: 'expressions', index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-orderlab') assert.equal(p084ExpressionBuildBinding(rel, {sessionId: id, index: idx}), null);
});
