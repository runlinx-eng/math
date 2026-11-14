import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as place from '../dist/learning/phase5/b11-model.js';
import {placeBinding,replayPlaceEvidence} from '../dist/learning/place-evidence.js';
import {placeRemovalBinding,replayPlaceRemovalEvidence} from '../dist/learning/place-removal-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-place-removal-cases.cjs';

await ensureB39Ready();
const {cases,associated,sourceHashes}=fixture;
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const sha=x=>createHash('sha256').update(x).digest('hex');
const hash=t=>sha(JSON.stringify(stable(t)));
const taskAt=c=>sessionTasks(c.id)[c.index];
const amount=counts=>counts.reduce((sum,count,i)=>sum+count*10**i,0);
const start=(t,guess='0')=>{
 const m=place.initial(t);m.guess=guess;m.align=t.values.map(()=> '0');place.act(t,m,'b11-place-start');return m;
};
const finish=(c,m)=>{m.answer=String(c.answer);return m;};
const build=(c,route='direct')=>{
 const t=taskAt(c),m=start(t);
 if(route==='before')place.act(t,m,'b11-exchange',{index:c.column,dir:'down'});
 place.act(t,m,'b11-remove',{index:c.column});
 if(route==='before')place.act(t,m,'b11-exchange',{index:c.column-1,dir:'up'});
 if(route==='after'){
  place.act(t,m,'b11-exchange',{index:c.column,dir:'down'});
  place.act(t,m,'b11-exchange',{index:c.column-1,dir:'up'});
 }
 return finish(c,m);
};
const accept=(t,m)=>{
 assert.equal(place.valid(t,m),true);assert.equal(place.inspect(t,m).correct,true);
 const before=JSON.stringify(m),p=replayPlaceRemovalEvidence(t,m);assert.ok(p);
 assert.equal(JSON.stringify(m),before);return p;
};
const reject=(t,m)=>assert.equal(replayPlaceRemovalEvidence(t,m),null);

test('six exact native positions preserve original source fingerprints and have no borrowed MP label',()=>{
 assert.equal(cases.length,6);assert.equal(new Set(cases.map(c=>c.nodeId)).size,5);
 for(const [path,expected]of Object.entries(sourceHashes))assert.equal(sha(fs.readFileSync(new URL('../'+path,import.meta.url))),expected);
 for(const c of cases){
  const t=taskAt(c),b=placeRemovalBinding(t,c);
  assert.equal(hash(t),c.taskHash);assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.deepEqual(t.values,[c.start,c.take]);assert.equal(t.op,'-');assert.equal(t.scale??1,1);
  assert.equal(c.start-c.take,c.answer);assert.equal(c.count*c.unit,c.take);
  assert.equal(b?.nodeId,c.nodeId);assert.equal(b.method,null);assert.equal(b.scope,'integer-removal');
  assert.equal(placeBinding(t,c),null,'existing exchange scope stays unchanged');
  assert.equal(placeRemovalBinding(structuredClone(t),c)?.nodeId,c.nodeId);
 }
});

test('only the reviewed six native positions bind; all 29 associated place tasks remain isolated',()=>{
 const bound=[],bridged=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(placeRemovalBinding(t,{sessionId:id,index}))bound.push(id+':'+index);
 });
 assert.deepEqual(bound.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(placeRemovalBinding(t,{sessionId:id,index}),null);
  if(t.type==='x-placecalc')bridged.push(id+':'+index);
 });
 assert.equal(bridged.length,29);assert.equal(associated.length,9);
 for(const c of associated){const t=taskAt(c);assert.equal(hash(t),c.taskHash);assert.equal(t.op,'-');assert.equal(t.scale??1,1);}
});

test('source context and complete task changes cannot borrow a reviewed binding',()=>{
 for(const c of cases){
  const t=taskAt(c);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},
   {...c,sessionId:'__proto__'},{...c,sessionId:'constructor'}])assert.equal(placeRemovalBinding(t,context),null);
  for(const changed of [{...t,prompt:t.prompt+' changed'},{...t,values:[...t.values].reverse()},
   {...t,scale:100},{...t,op:'+'},{...t,extra:true}])assert.equal(placeRemovalBinding(changed,c),null);
 }
});

test('every direct original action removes its actual count times place unit without claiming an exchange',()=>{
 for(const c of cases){
  const t=taskAt(c),m=build(c),p=accept(t,m);
  assert.equal(m.history.length,2);assert.equal(p.exchanges.length,0);assert.equal(p.up,0);assert.equal(p.down,0);
  assert.equal(replayPlaceEvidence(t,m),null,'original exchange evidence still requires an exchange');
  assert.equal(p.removals.length,1);const r=p.removals[0];
  assert.equal(r.index,c.column);assert.equal(r.count,c.count);assert.equal(r.unit,c.unit);assert.equal(r.quantity,c.take);
  assert.equal(amount(r.before),c.start);assert.equal(amount(r.after),c.answer);
  assert.equal(p.removed,c.take);assert.equal(p.total,c.answer);assert.equal(p.scale,1);
  assert.ok(p.remaining.every(n=>n===0));assert.equal(Object.hasOwn(m,'board'),false);
  assert.equal(p.display.total,String(c.answer));assert.equal(p.display.removed,String(c.take));
 }
});

test('meaningful exchanges before or after taking preserve quantity and the complete history',()=>{
 for(const c of cases)for(const route of ['before','after']){
  const m=build(c,route),p=accept(taskAt(c),m);
  assert.equal(m.history.length,4);assert.equal(p.exchanges.length,2);assert.equal(p.removals.length,1);
  assert.equal(p.up,1);assert.equal(p.down,1);assert.equal(p.total,c.answer);
  for(const e of p.exchanges){assert.equal(amount(e.before),amount(e.after));assert.equal(e.from.count*e.from.unit,e.to.count*e.to.unit);}
  assert.equal(p.removals[0].quantity,c.take);
 }
});

test('an incorrect initial guess is retained as a guess and never required to equal the final answer',()=>{
 for(const c of cases){const m=build(c);assert.equal(m.guess,'0');assert.equal(m.first,'0');accept(taskAt(c),m);}
});

test('forged before snapshots, required counts and place indices cannot justify the same final answer',()=>{
 for(const c of cases){
  const t=taskAt(c),m=build(c);
  for(const mutate of [x=>x.history[1].before[0]++,x=>x.history[1].needed++,x=>x.history[1].index++,
   x=>x.history[1].needed=0,x=>x.history[1].needed=-1,x=>x.history[1].index=String(c.column),
   x=>x.history[1].before.push(0),x=>x.history[1].extra=true]){const bad=structuredClone(m);mutate(bad);reject(t,bad);}
 }
});

test('a real repeated or zero-quantity remove remains in history and blocks extra evidence',()=>{
 for(const c of cases){
  const t=taskAt(c),m=build(c);place.act(t,m,'b11-remove',{index:c.column});
  assert.equal(m.history.at(-1).needed,0);assert.equal(place.inspect(t,m).correct,true);reject(t,m);
  const empty=start(t);place.act(t,empty,'b11-remove',{index:0});place.act(t,empty,'b11-remove',{index:c.column});finish(c,empty);
  assert.equal(place.inspect(t,empty).correct,true);reject(t,empty);
 }
});

test('a failed model-API exchange cannot be erased by a later correct removal',()=>{
 // This corrupt/invoked-model path is not a reachable UI click: the original
 // underfilled-column button is disabled and the browser test never forces it.
 const c=cases[0],t=taskAt(c),m=start(t);
 place.act(t,m,'b11-exchange',{index:0,dir:'up'});assert.ok(m.issue);
 place.act(t,m,'b11-remove',{index:c.column});finish(c,m);
 assert.equal(place.inspect(t,m).correct,true);assert.equal(m.issue,'');reject(t,m);
});

test('failed initial alignment followed by an actual corrected start does not erase its invalid event',()=>{
 const c=cases[0],t=taskAt(c),m=place.initial(t);m.guess='0';m.align=['1','0'];
 place.act(t,m,'b11-place-start');assert.equal(m.started,false);
 m.align=['0','0'];place.act(t,m,'b11-place-start');place.act(t,m,'b11-remove',{index:c.column});finish(c,m);
 assert.equal(place.inspect(t,m).correct,true);reject(t,m);
});

test('missing, reversed or altered events and a mathematically equal but inconsistent board are rejected',()=>{
 const c=cases[0],t=taskAt(c),m=build(c,'before');
 for(const mutate of [x=>x.history.pop(),x=>x.history.reverse(),x=>x.history[1].dir='up',
  x=>x.counts[0]+=10,x=>x.remaining[c.column]=c.count,x=>x.first='1',x=>x.guess='1',
  x=>x.align[0]='1',x=>x.started=false,x=>x.issue='old issue',x=>x.answer=String(c.answer+1),
  x=>x.history[0].extra=true,x=>x.board={}]){const bad=structuredClone(m);mutate(bad);reject(t,bad);}
 const sameTotal=structuredClone(m);sameTotal.counts[0]+=10;sameTotal.counts[1]--;assert.equal(amount(sameTotal.counts),c.answer);reject(t,sameTotal);
});

test('addition, decimal, zero-take and unsupported tasks cannot use the new integer-removal contract',()=>{
 const c=cases[0],m=build(c),t=taskAt(c);
 for(const changed of [null,{},[],{...t,op:'+'},{...t,scale:100},{...t,scale:1000},
  {...t,values:[82,0]},{...t,values:[40,82]},{...t,type:'x-routecalc'}])reject(changed,m);
 for(const bad of [null,{},[],true,'model'])reject(t,bad);
 const cyclic=structuredClone(m);cyclic.history[0].align=cyclic;reject(t,cyclic);
});

test('latest full submission identity prevents old successful work from surviving a changed answer or history',()=>{
 const c=cases[0],t=taskAt(c),m=build(c),record={attempts:[{value:structuredClone(m)}]};
 assert.ok(latestSubmissionMatches(m,record));m.answer='41';assert.equal(latestSubmissionMatches(m,record),false);
 record.attempts.push({value:structuredClone(m)});m.answer='42';accept(t,m);assert.equal(latestSubmissionMatches(m,record),false);
 record.attempts.push({value:structuredClone(m)});assert.ok(latestSubmissionMatches(m,record));
 place.act(t,m,'b11-exchange',{index:1,dir:'down'});place.act(t,m,'b11-exchange',{index:0,dir:'up'});
 accept(t,m);assert.equal(latestSubmissionMatches(m,record),false);
});

test('current checked feedback names actual place quantities and distinguishes direct removal from real exchanges',()=>{
 for(const c of cases)for(const route of ['direct','before','after']){
  const t=taskAt(c),m=build(c,route),before=JSON.stringify(m),record={attempts:[{value:structuredClone(m)}]};
  assert.equal(thinkingFeedback(t,m,{attempts:[]},c),null);
  const feedback=thinkingFeedback(t,m,record,c),guide=thinkingGuide(t,c);assert.ok(feedback);assert.ok(guide);
  assert.equal(feedback.method,null);assert.match(guide.summary,/可选/);
  const unit=c.column===1?'十':'百',words=feedback.observation;
  assert.ok(words.includes(`从${unit}位拿走 ${c.count} 个${unit}（${c.take}）`));
  assert.ok(words.includes(`合计拿走 ${c.take}`));assert.ok(words.includes(`结果 ${c.answer} 相符`));
  if(route==='direct'){assert.match(words,/没有交换数位/);assert.doesNotMatch(words,/每次交换.*数量不变/);}
  else{assert.match(words,/向高位合并 1 次、向低位拆开 1 次/);assert.doesNotMatch(words,/没有交换/);}
  const detail=feedback.detail.join(' ');
  assert.ok(detail.includes(`原来的 ${c.start}`));assert.ok(detail.includes(`合计始终为 ${c.take}`));
  assert.match(detail,/不把点击次数当作物品数量/);assert.match(detail,/没有自动评价.*长期掌握/);
  assert.equal(JSON.stringify(m),before);
 }
});

test('feedback remains bound to the latest complete submission, including when an old answer becomes correct again',()=>{
 const c=cases[0],t=taskAt(c),m=build(c),record={support:true,attempts:[{value:structuredClone(m)}]};
 assert.ok(thinkingFeedback(t,m,record,c));m.answer='41';assert.equal(thinkingFeedback(t,m,record,c),null);
 record.attempts.push({value:structuredClone(m)});m.answer='42';assert.equal(thinkingFeedback(t,m,record,c),null);
 record.attempts.push({value:structuredClone(m)});
 const feedback=thinkingFeedback(t,m,record,c);assert.ok(feedback);
 assert.match(feedback.detail.join(' '),/修改后又试了一次/);assert.match(feedback.detail.join(' '),/看过提示或比较反馈/);
 const bad=build(c);place.act(t,bad,'b11-remove',{index:c.column});assert.equal(place.inspect(t,bad).correct,true);
 assert.equal(thinkingFeedback(t,bad,{attempts:[{value:bad}]},c),null);
});
