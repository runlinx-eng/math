import test from 'node:test';
import assert from 'node:assert/strict';
import {TASKS} from '../dist/learning/phase5/b09.js';
import * as model from '../dist/learning/phase5/b09-model.js';
import {directedJumpBinding,replayDirectedJumpEvidence} from '../dist/learning/directed-jump-evidence.js';

const cases=[
 ['linejumps',1,[20,7]],['linejumps',2,[-20,-4]],
 ['linejumps',3,[10,6]],['negativecontext',1,[4,3]],
 ['signedwalk',0,[5]],['signedwalk',1,[-7]],
 ['signedwalk',2,[-7]],['signedwalk',5,[-2]]
];
const context=(sessionId,index)=>({sessionId,index});
function build(task,moves){
 const m=model.initial(task);
 m.anchor=task.start;model.field(task,m,'anchor');
 m.guess=String(task.start+(task.op==='+'?task.operand:-task.operand));
 model.act(task,m,'direct-predict');
 for(const delta of moves){
  m.size=String(Math.abs(delta));m.dir=delta<0?'left':'right';
  model.act(task,m,'direct-jump');
 }
 m.answer=m.guess;
 if(task.zero)m.zero='reference';
 return m;
}
test('eight actual B09 directed jumps admit exact signed displacement, never synthetic type inheritance',()=>{
 for(const [sessionId,index,moves] of cases){
  const task=TASKS[sessionId][index],ctx=context(sessionId,index);
  assert.ok(directedJumpBinding(task,ctx),sessionId+':'+index);
  const m=build(task,moves);
  assert.equal(model.inspect(task,m).correct,true,sessionId+':'+index);
  const proof=replayDirectedJumpEvidence(task,m,ctx);
  assert.ok(proof,sessionId+':'+index);
  assert.equal(proof.end,task.start+(task.op==='+'?task.operand:-task.operand));
  assert.equal(proof.observableSuccessfulJumps.length,moves.length);
  assert.equal(proof.learnerMasteryAssessed,false);
  assert.equal(replayDirectedJumpEvidence(task,m,context(sessionId==='signedwalk'?'linejumps':'signedwalk',index)),null);
 }
});
test('wrong direction, missing initial guess, forged history, changed origin, and wrong source fail closed',()=>{
 const t=TASKS.signedwalk[1],ctx=context('signedwalk',1),good=build(t,[-7]);
 const edit=fn=>{const m=structuredClone(good);fn(m);assert.equal(replayDirectedJumpEvidence(t,m,ctx),null);};
 edit(m=>m.history[0]=7);
 edit(m=>m.jumps[0]=7);
 edit(m=>m.committed=null);
 edit(m=>m.anchor=0);
 edit(m=>m.answer='-4');
 edit(m=>m.history.push(-7));
 edit(m=>m.jumps.push(0));
 assert.equal(directedJumpBinding(t,context('signedwalk',3)),null);
 assert.equal(directedJumpBinding(TASKS.signedwalk[3],context('signedwalk',3)),null);
});
test('undo leaves an irrecoverable chronology gap and does not acquire strict evidence',()=>{
 const t=TASKS.linejumps[1],ctx=context('linejumps',1),m=build(t,[20,7]);
 model.act(t,m,'direct-undo');
 m.size='7';m.dir='right';model.act(t,m,'direct-jump');
 assert.equal(model.inspect(t,m).correct,true);
 assert.equal(replayDirectedJumpEvidence(t,m,ctx),null);
});
