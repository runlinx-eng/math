import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,example,inspect} from '../dist/learning/phase5/b10-model.js';
import {P096S_SOURCES,replayP096SSubtractionGroupingEvidence,submittedP096SSubtractionGroupingEvidence} from '../dist/learning/p096s-subtraction-grouping-evidence.js';

test('verifies both recorded subtraction paths without inventing undo order',()=>{
  const {sessionId,index,taskHash}=P096S_SOURCES[0];
  const context={sessionId,index};
  const task=sessionTaskFor(sessionId,index);
  const replay=model=>replayP096SSubtractionGroupingEvidence(task,model,context);
  const ordered=Object.fromEntries(Object.entries(task).sort(([a],[b])=>a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(ordered)).digest('hex'),taskHash);
  const model=example(task);
  assert.deepEqual(replay(model)?.paths,[[7,5],[1,9]]);
  assert.equal(replayP096SSubtractionGroupingEvidence(task,model,{sessionId,index:-1}),null);
  const earlier=structuredClone(model);
  act(task,model,'subgroups-undo');
  model.next='9';
  act(task,model,'subgroups-next');
  assert.ok(replay(model));
  assert.equal(submittedP096SSubtractionGroupingEvidence(task,model,{attempts:[{value:earlier}]},context),null);
  assert.deepEqual(submittedP096SSubtractionGroupingEvidence(task,model,{attempts:[{value:structuredClone(model)}]},context),replay(model));
  const forged=structuredClone(model);
  forged.history.push({branch:0,next:'6'});
  assert.ok(inspect(task,forged).correct);
  assert.equal(replay(forged),null);
});
