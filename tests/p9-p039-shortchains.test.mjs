import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act, initial, solveSteps} from '../dist/learning/phase5/b38-model.js';
import {P039_SOURCES, p039ShortChainsBinding, replayP039ShortChainsEvidence, submittedP039ShortChainsEvidence} from '../dist/learning/p039-shortchains-evidence.js';

const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort((a,b) => a.localeCompare(b,'en')).map(key => [key, ordered(value[key])]))
  : value;

for (const source of P039_SOURCES) {
  const {sessionId, index} = source;
  const context = {sessionId, index};
  const task = sessionTaskFor(sessionId, index);
  const replay = model => replayP039ShortChainsEvidence(task, model, context);
  const submit = (model, saved) => submittedP039ShortChainsEvidence(task, model, {attempts:[{value:saved}]}, context);
  const play = (model, steps) => {
    for (const step of steps) {
      if (step.field) {
        if (step.field.startsWith('answers.')) model.answers[Number(step.field.split('.')[1])] = step.value;
        else model[step.field] = step.value;
      } else act(task, model, step.action === 'turn-extra' ? 'a30-turn' : step.action, step.data);
    }
  };
  test(`P039 locks ${sessionId}:${index} and rejects stale or modified work`, () => {
    assert.equal(createHash('sha256').update(JSON.stringify(ordered(task))).digest('hex'), source.taskHash);
    assert.ok(p039ShortChainsBinding(task, context));
    assert.equal(p039ShortChainsBinding(task, {sessionId,index:-1}), null);
    const model = initial(task);
    play(model, [{action:'r38-card',data:{index:task.scene==='array'?'wrong':'flip'}}]);
    const failed = structuredClone(model);
    assert.equal(replay(model), null);
    play(model, [{action:'r38-undo'}, ...solveSteps(task)]);
    const accepted = replay(model);
    assert.ok(accepted);
    assert.equal(submit(model, failed), null);
    assert.deepEqual(submit(model, structuredClone(model)), accepted);
    const forged = structuredClone(model);
    forged.history = [];
    assert.equal(replay(forged), null);
  });
}
