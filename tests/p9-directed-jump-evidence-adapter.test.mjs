import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import source from './fixtures/p9-directed-jump-cases.cjs';
import {TASKS,PRACTICE,BRIDGES} from '../dist/learning/phase5/b09.js';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as model from '../dist/learning/phase5/b09-model.js';
import {directedJumpBinding,replayDirectedJumpEvidence} from '../dist/learning/directed-jump-evidence.js';

const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const context=({id,index})=>({sessionId:id,index});
const target=t=>t.start+(t.op==='+'?t.operand:-t.operand);
function build(t,moves){
 const m=model.initial(t);
 m.anchor=t.start;model.field(t,m,'anchor');
 m.guess=String(target(t));model.act(t,m,'direct-predict');
 for(const delta of moves){
  m.size=String(Math.abs(delta));m.dir=delta<0?'left':'right';
  const before=m.jumps.length;
  model.act(t,m,'direct-jump');
  assert.equal(m.jumps.length,before+1,'original native jump must succeed');
 }
 m.answer=m.guess;
 if(t.zero)m.zero='reference';
 return m;
}
test('#312 freezes eight complete native source hashes and signed displacement paths',()=>{
 assert.equal(source.cases.length,8);
 const positions=new Set();
 for(const row of source.cases){
  const t=sessionTaskFor(row.id,row.index),ctx=context(row),name=row.id+':'+row.index;
  assert.ok(t);
  assert.deepEqual(t,TASKS[row.id][row.index]);
  assert.equal(hash(t),row.taskHash,name+' source task fingerprint');
  assert.equal(t.type,'x-directedjump');
  assert.equal(t.reverse,undefined);
  assert.ok(!positions.has(name));positions.add(name);
  assert.equal(directedJumpBinding(t,ctx)?.nodeId,row.nodeId);
  const m=build(t,row.moves);
  assert.equal(model.valid(t,m),true,name);
  assert.equal(model.inspect(t,m).correct,true,name);
  const proof=replayDirectedJumpEvidence(t,m,ctx);
  assert.ok(proof,name+' independently replayed');
  assert.equal(proof.start,t.start);
  assert.equal(proof.end,target(t));
  assert.equal(proof.signedChange,target(t)-t.start);
  assert.deepEqual(proof.observableSuccessfulJumps.map(x=>x.change),row.moves);
  assert.ok(proof.observableSuccessfulJumps.every(e=>e.to-e.from===e.change));
  assert.equal(proof.initialGuessCorrectnessAssessed,false);
  assert.equal(proof.undoOrAnchorResetChronologyProven,false);
  assert.equal(proof.learnerMasteryAssessed,false);
  assert.deepEqual(replayDirectedJumpEvidence(t,m,{sessionId:'signedwalk',index:row.index}),row.id==='signedwalk'?proof:null);
  // The same path copied into another session or task is not a native proof.
  assert.equal(directedJumpBinding(t,{sessionId:'other',index:row.index}),null);
 }
});
test('#312 excludes reverse, signed-line, practice copies, all linked bridge copies',()=>{
 for(const i of [3,4]){
  assert.equal(directedJumpBinding(TASKS.signedwalk[i],{sessionId:'signedwalk',index:i}),null);
 }
 for(const [id,indices] of [['linejumps',[0]],['negativecontext',[0,2]]]){
  for(const index of indices)assert.equal(directedJumpBinding(TASKS[id][index],{sessionId:id,index}),null);
 }
 for(const [id,task] of Object.entries(PRACTICE))
  assert.equal(directedJumpBinding(task,{sessionId:id,index:0}),null);
 for(const bridge of BRIDGES)for(const task of bridge.tasks)
  assert.equal(directedJumpBinding(task,{sessionId:bridge.to,index:0}),null);
});
test('#312 adversarial mutation: forged source, path, prediction, reference and final answer fail closed',()=>{
 for(const row of source.cases){
  const t=sessionTaskFor(row.id,row.index),ctx=context(row),good=build(t,row.moves);
  const bad=[
   m=>{m.answer=String(target(t)+1);},
   m=>{m.answer=String(target(t))+'.0';},
   m=>{m.anchor=t.start===t.min?t.start+1:t.start-1;},
   m=>{m.touched=false;},
   m=>{m.committed=null;},
   m=>{m.guess='987';},
   m=>{m.reference=1;},
   m=>{m.refTouched=true;},
   m=>{m.refSaved=0;},
   m=>{m.history[0]=-m.history[0];},
   m=>{m.jumps[0]=-m.jumps[0];},
   m=>{m.history.push(row.moves.at(-1));},
   m=>{m.history.push(0);},
   m=>{m.jumps.push(0);},
   m=>{m.history.extra=1;},
   m=>{m.jumps.extra=1;},
   m=>{m.zero='nothing';}
  ];
  for(const mutate of bad){
   const m=structuredClone(good);mutate(m);
   // Non-zero tasks have no zero requirement: only zero=true checks it.
   if(!t.zero&&mutate===bad.at(-1))continue;
   assert.equal(replayDirectedJumpEvidence(t,m,ctx),null,row.id+':'+row.index+' '+String(mutate));
  }
  const prompt={...t,prompt:t.prompt+'!'};
  assert.equal(directedJumpBinding(prompt,ctx),null,'source text drift');
  assert.equal(replayDirectedJumpEvidence(prompt,good,ctx),null);
  assert.equal(directedJumpBinding({...t,operand:t.operand+1},ctx),null,'source mathematical drift');
  for(const malformed of [null,[],false,0,{sessionId:row.id,index:String(row.index)},{sessionId:row.id,index:1.1}]){
   assert.equal(directedJumpBinding(t,malformed),null);
  }
 }
});
test('#312 original undo and anchor reset expose irrecoverable chronology gaps, not evidence',()=>{
 for(const row of source.cases){
  const t=sessionTaskFor(row.id,row.index),ctx=context(row),m=build(t,row.moves);
  model.act(t,m,'direct-undo');
  const last=row.moves.at(-1);
  m.size=String(Math.abs(last));m.dir=last<0?'left':'right';
  model.act(t,m,'direct-jump');
  assert.equal(model.inspect(t,m).correct,true);
  assert.equal(replayDirectedJumpEvidence(t,m,ctx),null,'undo replay cannot invent an event');
  const reset=build(t,row.moves);
  model.field(t,reset,'anchor');
  for(const delta of row.moves){
   reset.size=String(Math.abs(delta));reset.dir=delta<0?'left':'right';
   model.act(t,reset,'direct-jump');
  }
  assert.equal(model.inspect(t,reset).correct,true);
  assert.equal(replayDirectedJumpEvidence(t,reset,ctx),null,'anchor reset did not reset history');
 }
});
test('#312 exact answer is stricter than original rational grader, not the reverse',()=>{
 const row=source.cases.find(r=>r.id==='signedwalk'&&r.index===1);
 const t=sessionTaskFor(row.id,row.index),ctx=context(row),m=build(t,row.moves);
 m.answer='-3.0';
 assert.equal(model.inspect(t,m).correct,true);
 assert.equal(replayDirectedJumpEvidence(t,m,ctx),null);
});

test('#312 latest checked attempt enables bounded feedback',async()=>{
 const {thinkingGuide,thinkingFeedback}=await import('../dist/learning/thinking-feedback.js');
 for(const row of source.cases){
  const t=sessionTaskFor(row.id,row.index),ctx=context(row),m=build(t,row.moves);
  const saved={support:false,attempts:[{value:structuredClone(m)}]};
  assert.ok(thinkingGuide(t,ctx));const feedback=thinkingFeedback(t,m,saved,ctx);
  assert.ok(feedback?.observation.includes(String(target(t))));
  assert.ok(feedback.detail.some(x=>x.includes('长期掌握')));
  assert.equal(thinkingFeedback(t,m,{support:false,attempts:[]},ctx),null);
  const altered=structuredClone(m);altered.answer=String(target(t)+1);
  assert.equal(thinkingFeedback(t,altered,saved,ctx),null);
  const undo=structuredClone(m);undo.history=[];
  assert.equal(thinkingFeedback(t,undo,{support:false,attempts:[{value:undo}]},ctx),null);
 }
});
