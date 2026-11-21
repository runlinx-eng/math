import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import {act,initial} from '../dist/learning/phase5/b22-model.js';
import {P057_SOURCES,p057ChanceConditionSortBinding,replayP057ChanceConditionSortEvidence,submittedP057ChanceConditionSortEvidence} from '../dist/learning/p057-chance-condition-sort-evidence.js';

const [source]=P057_SOURCES;
const {sessionId,index}=source;
const context={sessionId,index};
const task=sessionTaskFor(sessionId,index);
const choices=['independent','independent','dependent','dependent','independent'];
const append=(m,choice)=>{m.choice=choice;act(task,m,'p22-classify');};
const replay=m=>replayP057ChanceConditionSortEvidence(task,m,context);

test('P057 binds only the exact original five cases',()=>{
  const sorted=Object.fromEntries(Object.entries(task).sort(([a],[b])=>a.localeCompare(b,'en')));
  assert.equal(createHash('sha256').update(JSON.stringify(sorted)).digest('hex'),source.taskHash);
  assert.ok(p057ChanceConditionSortBinding(task,context));
  assert.equal(p057ChanceConditionSortBinding(task,{sessionId,index:-1}),null);
  assert.equal(p057ChanceConditionSortBinding({...task,items:[]},context),null);
});

test('P057 retains incorrect sort attempts and checks change of conditions',()=>{
  const m=initial(task,1);
  append(m,'dependent');
  assert.equal(m.board.cursor,0);
  assert.equal(replay(m),null);
  choices.forEach(choice=>append(m,choice));
  const proof=replay(m);
  assert.deepEqual(proof?.placed,choices);
  assert.deepEqual(proof.attempts[0],{index:0,choice:'dependent',changesNextConditions:false,accepted:false});
  assert.deepEqual(proof.attempts.slice(1).map(a=>a.changesNextConditions),[false,false,true,true,false]);
});

test('P057 excludes stale Checks and unexpected recorded parameters',()=>{
  const m=initial(task,1);
  choices.slice(0,4).forEach(choice=>append(m,choice));
  const partial=structuredClone(m);
  append(m,choices[4]);
  assert.equal(submittedP057ChanceConditionSortEvidence(task,m,{attempts:[{value:partial}]},context),null);
  assert.ok(submittedP057ChanceConditionSortEvidence(task,m,{attempts:[{value:m}]},context));
  m.history[0].d.index='0';
  assert.equal(replay(m),null);
});
