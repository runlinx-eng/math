import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TASKS} from '../dist/learning/phase5/b34.js';
import * as p34 from '../dist/learning/phase5/b34-model.js';
import {sessionMeta} from '../dist/learning/bridges.js';
import {sequenceBinding,replaySequenceEvidence} from '../dist/learning/sequence-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

const attempt=value=>({value:structuredClone(value)});
const record=value=>({support:false,attempts:[attempt(value)]});
const cases=[
  ['general34',2,'mt_fZTn0W_iZR'],
  ['general34',3,'mt_fZTn0W_iZR'],
  ['tables34',0,'mt_2jbUekyTu4'],
  ['tables34',2,'mt_2jbUekyTu4'],
  ['reason34',1,'mt_iyovKgZC1q']
];

test('five reviewed native positions bind exactly to their own MP.8 source goal',()=>{
  const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url),'utf8'));
  const nodes=source.groups.find(g=>g.code==='ccss-math:MP.8').nodes;
  for(const [id,index,nodeId] of cases){
    const task=TASKS[id][index],context={sessionId:id,index},bound=sequenceBinding(task,context);
    assert.equal(task.type,'x-p34-sequence');
    assert.equal(bound?.nodeId,nodeId);
    assert.equal(sessionMeta(id).topicId,nodeId);
    assert.ok(nodes.find(n=>n.id===nodeId)?.goals.some(g=>g.tasks.some(x=>x.index===index&&x.type===task.type)),
      id+':'+index+' was reviewed in the original source mapping');
    assert.ok(thinkingGuide(task,context)?.question);
    assert.equal(thinkingGuide(task,context)?.type,task.type);
  }
  const eligible=new Set(cases.map(([id,i])=>id+':'+i));
  for(const [id,tasks] of Object.entries(TASKS)){
    for(const [index,task] of tasks.entries()){
      if(task.type!=='x-p34-sequence')continue;
      const key=id+':'+index,binding=sequenceBinding(task,{sessionId:id,index});
      assert.equal(!!binding?.method,eligible.has(key),key+' must not inherit an MP.8 source label');
    }
  }
  const t=TASKS.tables34[2];
  assert.equal(sequenceBinding(t,{sessionId:'linear34',index:2}),null);
  assert.equal(sequenceBinding(t,{sessionId:'link-linear34-reason34',index:0}),null);
  const altered={...t,start:51};
  assert.equal(sequenceBinding(altered,{sessionId:'tables34',index:2}),null);
});

test('all five tasks require real replay-valid steps plus current correct submission',()=>{
  for(const [id,index,nodeId] of cases){
    const t=TASKS[id][index],context={sessionId:id,index},start=p34.initial(t),done=p34.example(t);
    assert.equal(p34.valid(t,done),true);
    assert.equal(p34.inspect(t,done).correct,true);
    const proof=replaySequenceEvidence(t,done);
    assert.ok(proof,id+':'+index+' retains checked operations');
    assert.equal(proof.advances,t.length-1);
    assert.equal(proof.values.length,t.length);
    assert.equal(thinkingFeedback(t,start,record(start),context),null);
    assert.equal(thinkingFeedback(t,done,null,context),null);
    assert.equal(thinkingFeedback(t,done,record(start),context),null);
    assert.equal(thinkingFeedback(t,done,record(done)),null);
    const feedback=thinkingFeedback(t,done,record(done),context);
    assert.equal(feedback?.method?.nodeId,nodeId);
    assert.equal(feedback.method.code,'ccss-math:MP.8');
    assert.match(feedback.observation,/实际留下了/);
    assert.match(feedback.detail.join(' '),/不能据此判断独立归纳/);
    const edit=structuredClone(done);edit.prose='我改过了';
    assert.equal(thinkingFeedback(t,edit,record(done),context),null,'outdated feedback must disappear');
    const wrong=structuredClone(done);wrong.answers[0]='__wrong_answer__';
    assert.equal(thinkingFeedback(t,wrong,record(wrong),context),null);
    assert.equal(thinkingFeedback(t,done,record(done),{sessionId:'linear34',index:2}),null);
  }
});

test('strict sequence proof also handles negative, scaled, multiply, affine, position rules',()=>{
  const tasks=[
    TASKS.linear34[0],TASKS.linear34[1],TASKS.rules34[1],
    TASKS.rules34[2],TASKS.design34[2],TASKS.tables34[2]
  ];
  for(const t of tasks){
    const done=p34.example(t),proof=replaySequenceEvidence(t,done);
    assert.ok(proof,t.prompt);
    assert.equal(proof.advances,t.length-1);
    assert.equal(proof.undos,0);
    assert.deepEqual(proof.values,done.board.values);
  }
  assert.deepEqual(replaySequenceEvidence(TASKS.linear34[0],p34.example(TASKS.linear34[0])).displayValues,
    ['2.5','4','5.5','7']);
  assert.deepEqual(replaySequenceEvidence(TASKS.linear34[1],p34.example(TASKS.linear34[1])).displayValues,
    ['3','1','-1','-3']);
});

test('tampering, no-op actions, illegal order and recovered bad actions cannot create process evidence',()=>{
  const t=TASKS.tables34[0],done=p34.example(t);
  const mutated=(fn)=>{const x=structuredClone(done);fn(x);return x;};
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history.push({a:'show',i:'',v:'',w:''}))),null,
    'original validator can ignore an event, but strict adapter rejects it');
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history.push({a:'__unknown__',i:'',v:'',w:''}))),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history.push({a:'undo',i:'',v:'',w:''}))),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history.reverse())),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history.pop())),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history[0].i='1')),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history[0].w='1')),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history[0].v='5')),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history[0].extra=true)),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.board.values[1]=5)),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.board.bad=true)),null);
  assert.equal(replaySequenceEvidence(t,mutated(m=>m.history=[])),null);
  const recovered=p34.initial(t);
  recovered.value='9';p34.act(t,recovered,'p34-next');
  for(const v of ['4','8','12','16']){recovered.value=v;p34.act(t,recovered,'p34-next');}
  recovered.answers[0]='even';
  assert.equal(p34.valid(t,recovered),true);
  assert.equal(p34.inspect(t,recovered).correct,true);
  assert.equal(recovered.board.bad,true);
  assert.equal(replaySequenceEvidence(t,recovered),null,'prior invalid operation is not clean sequence evidence');
});

test('meaningful undo and redo replay; undo before first step is an invalid no-op',()=>{
  const t=TASKS.general34[3],m=p34.initial(t);
  for(const value of ['7','12']){m.value=value;p34.act(t,m,'p34-next');}
  p34.act(t,m,'p34-undo');
  m.value='12';p34.act(t,m,'p34-next');
  m.answers[0]='two-seven';
  const proof=replaySequenceEvidence(t,m);
  assert.ok(proof);
  assert.deepEqual(proof.displayValues,['2','7','12']);
  assert.equal(proof.advances,3);
  assert.equal(proof.undos,1);
  const noOp=p34.initial(t);p34.act(t,noOp,'p34-undo');
  for(const value of ['7','12']){noOp.value=value;p34.act(t,noOp,'p34-next');}
  noOp.answers[0]='two-seven';
  assert.equal(p34.valid(t,noOp),true);
  assert.equal(replaySequenceEvidence(t,noOp),null);
});
