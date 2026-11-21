import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BRIDGES, sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as original from '../dist/learning/phase5/b38-model.js';
import {P071_SOURCES, p071StoryChainBinding, replayP071StoryChainEvidence, submittedP071StoryChainEvidence} from '../dist/learning/p071-story-chain-evidence.js';

const cases = P071_SOURCES.map(source => ({source, context: {sessionId: source.sessionId, index: source.index}, task: sessionTaskFor(source.sessionId, source.index)}));
const act = (task, model, action, index) => original.act(task, model, 'r38-' + action, index === undefined ? {} : {index});
const replay = (entry, model) => replayP071StoryChainEvidence(entry.task, model, entry.context);
const submit = (entry, model, ...versions) => submittedP071StoryChainEvidence(entry.task, model, {attempts: versions.map(v => ({value: structuredClone(v)}))}, entry.context);
const ordered = v => Array.isArray(v) ? v.map(ordered) : (v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,ordered(v[k])])) : v);

function buildValid(entry, pi = 0, withUndo = false) {
  const {task} = entry, m = original.initial(task);
  if (withUndo) {
    const decoy = task.cards.find(c => !task.paths[pi].includes(c.id));
    if (decoy) { act(task, m, 'card', decoy.id); act(task, m, 'undo'); }
  }
  if (task.lines) act(task, m, 'mark', task.error);
  for (const id of task.paths[pi]) act(task, m, 'card', id);
  return m;
}

test('P071 locks exact source tasks and SHA-256 fingerprints', () => {
  for (const e of cases) {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(e.task))).digest('hex'), e.source.taskHash);
    assert.equal(p071StoryChainBinding(e.task, e.context)?.nodeId, e.source.nodeId);
    assert.equal(p071StoryChainBinding({...e.task, prompt: 'x'}, e.context), null);
    assert.equal(p071StoryChainBinding(e.task, {...e.context, index: String(e.source.index)}), null);
  }
});

test('P071 verifies all valid argument chains and undo recovery', () => {
  for (const e of cases) {
    for (let pi = 0; pi < e.task.paths.length; pi++) {
      const m = buildValid(e, pi, true), before = structuredClone(m);
      const p = replay(e, m);
      assert.ok(original.inspect(e.task, m).correct);
      assert.deepEqual(p?.path, e.task.paths[pi]);
      assert.equal(p?.marked, e.task.lines ? e.task.error : null);
      assert.deepEqual(m, before);
    }
  }
});

test('P071 rejects decoy cards, missing error mark and stale Check', () => {
  for (const e of cases) {
    const good = buildValid(e, 0, false), wrong = original.initial(e.task);
    const decoy = e.task.cards.find(c => !e.task.paths[0].includes(c.id));
    if (decoy) act(e.task, wrong, 'card', decoy.id);
    assert.equal(submit(e, wrong, wrong), null);
    assert.equal(submit(e, good, wrong), null);
    assert.ok(submit(e, good, wrong, good)?.path.length >= 3);
    if (e.task.lines) {
      const unmarked = original.initial(e.task);
      for (const id of e.task.paths[0]) act(e.task, unmarked, 'card', id);
      assert.equal(replay(e, unmarked), null);
    }
  }
});

test('P071 rejects tampered history and disallowed actions', () => {
  for (const e of cases) {
    const base = buildValid(e, 0, false);
    for (const mut of [m => { m.history.length = 0; }, m => { m.board.selected.pop(); }, m => { m.issue = 'err'; }, m => { m.history.push({a:'exchange',i:'',v:'',w:'',c:''}); }]) {
      const c = structuredClone(base); mut(c); assert.equal(replay(e, c), null);
    }
  }
});

test('P071 excludes practice and bridges', async () => {
  await ensureB39Ready();
  for (const e of cases) assert.equal(p071StoryChainBinding(e.task, {sessionId: e.source.sessionId, index: -1}), null);
  for (const [id, b] of Object.entries(BRIDGES)) {
    for (const [idx, rel] of b.tasks.entries()) if (rel?.type === 'x-r38-chain') assert.equal(p071StoryChainBinding(rel, {sessionId: id, index: idx}), null);
  }
});
