import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as original from '../dist/learning/phase5/b37-model.js';
import {ratioShareBinding,replayRatioShareEvidence} from '../dist/learning/ratioshare-evidence.js';

// Expected numbers are independently specified, not taken from the native grader.
const cases=[
 ['ratioShare37',0,40,[3,5],5,[15,25]],
 ['ratioShare37',1,30,[6,3,1],3,[18,9,3]],
 ['ratioShare37',2,50,[2,3],10,[20,30]],
 ['ratioDivide37',0,60,[2,3],12,[24,36]],
 ['ratioDivide37',1,24,[5,7],2,[10,14]],
 ['ratioDivide37',2,180,[1,2,3],30,[30,60,90]]
];
const context=(id,index)=>({sessionId:id,index});
const proof=(id,index,m)=>replayRatioShareEvidence(sessionTaskFor(id,index),m,context(id,index));
const act=(t,m,name,index)=>original.act(t,m,'r37-'+name,
 index===undefined?{}:{index});
function fill(t,m){
 const slots=t.parts.reduce((a,b)=>a+b,0);let i=0;
 for(let person=0;person<t.parts.length;person++){
  act(t,m,'person',person);
  for(let n=0;n<t.parts[person];n++)act(t,m,'slot',i++);
 }
 assert.equal(i,slots);
 t.questions.forEach((q,j)=>m.answers[j]=String(q.value));
}

for(const [id,index,total,parts,one,amounts] of cases){
 test('#280 six native equal-share constructions '+id+':'+index,()=>{
  const t=sessionTaskFor(id,index),m=original.example(t);
  const before=JSON.stringify({t,m});
  assert.equal(t.type,'x-r37-share');
  assert.equal(t.total,total);
  assert.deepEqual(t.parts,parts);
  assert.equal(original.valid(t,m),true);
  assert.equal(original.inspect(t,m).correct,true);
  assert.ok(ratioShareBinding(t,context(id,index)));
  const r=proof(id,index,m);
  assert.ok(r,'original person/slot actions must be replayed');
  assert.equal(r.construction.partSize,one);
  assert.deepEqual(r.construction.amounts,amounts);
  assert.deepEqual(r.construction.counts,parts);
  assert.equal(r.construction.totalSlots,parts.reduce((a,b)=>a+b,0));
  assert.equal(r.construction.amounts.reduce((a,b)=>a+b,0),total);
  assert.deepEqual(r.construction.fractions.map(x=>[x.numerator,x.denominator]),
   parts.map(x=>[x,parts.reduce((a,b)=>a+b,0)]));
  assert.equal(r.construction.assigned,r.construction.totalSlots);
  assert.equal(r.construction.removed,0);
  assert.equal(r.construction.reassigned,0);
  assert.equal(r.eventCount,m.history.length);
  assert.equal(r.checkedSubmissionAssessed,false);
  assert.equal(r.independentStrategyAssessed,false);
  assert.equal(r.physicalSharingAssessed,false);
  assert.equal(JSON.stringify({t,m}),before,'read-only original model');
 });
 test('#280 reject unreviewed source / shortcut '+id+':'+index,()=>{
  const t=sessionTaskFor(id,index),m=original.example(t);
  assert.equal(ratioShareBinding(t),null);
  assert.equal(proof(id,index,null),null);
  assert.equal(replayRatioShareEvidence(t,m,{}),null);
  assert.equal(replayRatioShareEvidence(t,m,{sessionId:id,index:String(index)}),null);
  assert.equal(proof(id,index,{...m,history:[]}),null);
  const forged=structuredClone(t);forged.total++;
  assert.equal(replayRatioShareEvidence(forged,m,context(id,index)),null);
  assert.equal(ratioShareBinding(forged,context(id,index)),null);
  const changed=structuredClone(m);changed.board.slots[0]=1;
  assert.equal(proof(id,index,changed),null);
  const incomplete=structuredClone(m);incomplete.history.pop();
  assert.equal(proof(id,index,incomplete),null);
  const corrupted=structuredClone(m);corrupted.history[0].i='';
  assert.equal(proof(id,index,corrupted),null);
  const spurious=structuredClone(m);act(t,spurious,'step');
  assert.equal(proof(id,index,spurious),null,
   'ignored/unrelated actions cannot become mathematical evidence');
 });
}
test('#280 wrong distribution, honest removal and correction remain observable',()=>{
 const t=sessionTaskFor('ratioShare37',0),m=original.initial(t);
 // Initial allocation puts one of the eight shares with the wrong person.
 act(t,m,'person',0);
 for(let i=0;i<4;i++)act(t,m,'slot',i);
 act(t,m,'person',1);
 for(let i=4;i<8;i++)act(t,m,'slot',i);
 t.questions.forEach((q,i)=>m.answers[i]=String(q.value));
 assert.equal(original.inspect(t,m).correct,false);
 assert.equal(proof('ratioShare37',0,m),null);
 // Reassign the fourth slot from A to B, which should not erase the first event.
 act(t,m,'slot',3);
 assert.equal(original.inspect(t,m).correct,true);
 const r=proof('ratioShare37',0,m);
 assert.ok(r);
 assert.equal(r.construction.reassigned,1);
 assert.equal(r.construction.assigned,8);
 assert.equal(r.construction.removed,0);
 assert.deepEqual(r.construction.counts,[3,5]);
 assert.equal(r.construction.firstAssigned[3].owner,0);
 assert.ok(r.construction.events.some(e=>e.action==='slot'&&e.slot===3&&e.from===0&&e.to===1));
});
test('#280 remove and reassign are not silently treated as first allocation',()=>{
 const t=sessionTaskFor('ratioDivide37',0),m=original.initial(t);
 fill(t,m);
 // Last active person is B: clicking one of B's slots removes it.
 act(t,m,'slot',2);
 assert.equal(original.inspect(t,m).correct,false);
 assert.equal(proof('ratioDivide37',0,m),null);
 act(t,m,'slot',2);
 const r=proof('ratioDivide37',0,m);
 assert.ok(r);
 assert.equal(r.construction.removed,1);
 assert.equal(r.construction.assigned,6);
 assert.equal(r.construction.reassigned,0);
});
test('#280 never conflate a changed final numeric answer with a correct share',()=>{
 const t=sessionTaskFor('ratioShare37',2),m=original.example(t);
 m.answers[0]='3/5';
 assert.equal(original.inspect(t,m).correct,false);
 assert.equal(proof('ratioShare37',2,m),null);
});
test('#280 repeated and out-of-bound person/slot controls do not prove shares',()=>{
 const t=sessionTaskFor('ratioShare37',0),m=original.example(t);
 const extra=structuredClone(m);
 act(t,extra,'slot',999);
 assert.equal(original.valid(t,extra),true);
 assert.equal(proof('ratioShare37',0,extra),null);
 const bad=structuredClone(m);
 bad.history[0].i='01';
 assert.equal(proof('ratioShare37',0,bad),null);
});
