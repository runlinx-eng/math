import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-mixedaxis-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {PRACTICE} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b16-model.js';
import * as V from '../dist/learning/phase5/b16-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import {mixedAxisBinding as binding,replayMixedAxisEvidence as replay} from '../dist/learning/mixedaxis-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

// Independent test author: literal source fixture, BigInt arithmetic and the
// original visible controls. No adapter helper, M.solveSteps or example oracle.
await ensureB39Ready();
const {cases,bridges,practices}=fixture,cp=structuredClone;
const FIELDS=['rows','cols','parts','take','answer','unit','equation','den','num','whole','remainder','copies','prediction','relation','left','right','reason','step','position','choice','result','shift','rotation','x','y','per','total','color','decimal','percent','top','bottom','word','count','fixed'];
const RELATIONS=['','<','=','>','≠','≤','≥'];
const task=c=>sessionTaskFor(c.id,c.index),at=(id,index)=>cases.find(c=>c.id===id&&c.index===index);
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?
 Object.fromEntries(Object.keys(x).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const metrics={fields:0,buttons:0,acceptedModels:0,permutations:0,correctOrders:0,submissions:0,actualChromium:false};
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const atlas=JSON.parse(fs.readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
function exact(n,d=1n){
 n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}
 const g=gcd(n,d);return[n/g,d/g];
}
function literal(raw){
 const match=String(raw).trim().match(/^([+-]?)(\d+)(?:\.(\d+)|\/(\d+))?$/);
 assert.ok(match,'independent fixed source rational '+raw);
 const sign=match[1]==='-'?-1n:1n;
 return match[3]?exact(sign*BigInt(match[2]+match[3]),10n**BigInt(match[3].length)):
  exact(sign*BigInt(match[2]),match[4]?BigInt(match[4]):1n);
}
const pair=q=>{const v=q.map(Number);assert.ok(v.every(Number.isSafeInteger));return v;};
const compare=(a,b)=>{const n=BigInt(a[0])*BigInt(b[1])-BigInt(b[0])*BigInt(a[1]);return n<0n?-1:n>0n?1:0;};
const truth=(a,s,b)=>{const q=compare(a,b);return{'<':q<0,'=':q===0,'>':q>0,'≠':q!==0,'≤':q<=0,'≥':q>=0}[s]??false;};
const sorted=(values,ids)=>ids.every((id,i)=>i===0||compare(values[ids[i-1]],values[id])<=0);
function permutations(ids){
 if(ids.length===0)return[[]];
 return ids.flatMap((id,i)=>permutations([...ids.slice(0,i),...ids.slice(i+1)]).map(rest=>[id,...rest]));
}
function coordinate(raw,t){
 const syntax=typeof raw==='string'&&/^[+-]?\d{1,12}(?:\.\d{1,8})?$/.test(raw.trim());
 const q=syntax?literal(raw):null;
 return{syntaxValid:syntax,value:q,inRange:!!q&&compare(q,[t.min,1])>=0&&compare(q,[t.max,1])<=0};
}

function field(t,m,key,value){
 const html=V.render(t,m),found=[...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
  .filter(x=>attrs(x[0])['data-xfield']===key);
 assert.equal(found.length,1,'actual visible field '+key);assert.doesNotMatch(found[0][0],/\bdisabled\b/);
 const a=attrs(found[0][0]);if(a.maxlength)assert.ok(String(value).length<=Number(a.maxlength));
 if(key==='relation')assert.ok(RELATIONS.includes(String(value)),'actual select option');
 m[key]=String(value);M.field(t,m,key);metrics.fields++;return m;
}
function act(t,m,action,index){
 const buttons=(V.render(t,m).match(/<button\b[^>]*>/g)||[]).filter(s=>{
  const a=attrs(s);return a['data-x']==='b16-'+action&&
   (index===undefined?a['data-index']===undefined:a['data-index']===String(index));
 });
 assert.equal(buttons.length,1,'unique actual visible button '+action+' '+String(index));
 assert.doesNotMatch(buttons[0],/\bdisabled\b/);const n=m.history.length;
 M.act(t,m,'b16-'+action,index===undefined?{}:{index});
 assert.equal(m.history.length,Math.min(n+1,2000));metrics.buttons++;return m;
}
const rawAct=(t,m,action,data={})=>M.act(t,m,'b16-'+action,data);
function place(c,m,index,raw=c.expected.positionTexts[index]){
 const t=task(c);act(t,m,'select',index);field(t,m,'position',raw);act(t,m,'place');return m;
}
function order(c,m,ids=c.expected.validOrders[0]){
 const t=task(c);for(const id of [...m.board.ordered])act(t,m,'order',id);
 for(const id of ids)act(t,m,'order',id);return m;
}
function symbols(c,m){
 const t=task(c);for(let i=m.board.symbols.length;i<c.expected.statements.length;i++){
  field(t,m,'relation',c.expected.statements[i].symbol);act(t,m,'symbol');
 }return m;
}
function finish(c,m=M.initial(task(c)),{orderFirst=false,reverse=false,ids=c.expected.validOrders[0]}={}){
 if(orderFirst){order(c,m,ids);symbols(c,m);}
 const indices=c.expected.cardValues.map((_,i)=>i);if(reverse)indices.reverse();
 for(const i of indices)place(c,m,i);
 if(!orderFirst){order(c,m,ids);symbols(c,m);}return m;
}
const record=m=>({support:false,attempts:[{value:cp(m)}]});
function accepts(c,m){
 const t=task(c),before=JSON.stringify(m);
 assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
 const p=replay(t,m);assert.ok(p,c.id+':'+c.index+' strict applied-work proof');
 assert.equal(JSON.stringify(m),before,'replay does not edit a saved model');
 assert.deepEqual(p.axis,{min:t.min,max:t.max});
 assert.deepEqual(p.cards.map(x=>[x.index,x.raw,x.value]),t.cards.map((raw,i)=>[i,raw,c.expected.cardValues[i]]));
 assert.equal(p.placements.length,t.cards.length);
 for(const [i,want]of c.expected.cardValues.entries()){
  const applied=p.placements.find(x=>x.index===i);assert.ok(applied);
  assert.equal(applied.card,t.cards[i]);assert.deepEqual(applied.cardValue,want);assert.deepEqual(applied.value,want);
  assert.equal(applied.coordinate,m.board.placements[i]);assert.equal(applied.matchesCard,true);
  const e=m.history[applied.historyIndex];assert.equal(e.action,'place');assert.equal(applied.raw,e.data.fields.position);
  assert.deepEqual(pair(literal(applied.raw)),want);
 }
 assert.deepEqual(p.order.indices,m.board.ordered);
 assert.deepEqual(p.order.values,m.board.ordered.map(i=>c.expected.cardValues[i]));
 assert.equal(p.order.adjacent.length,t.cards.length-1);
 for(const [i,a]of p.order.adjacent.entries()){
  const left=m.board.ordered[i],right=m.board.ordered[i+1];assert.equal(a.leftIndex,left);assert.equal(a.rightIndex,right);
  assert.deepEqual(a.leftValue,c.expected.cardValues[left]);assert.deepEqual(a.rightValue,c.expected.cardValues[right]);
  assert.equal(a.relation,compare(a.leftValue,a.rightValue)===0?'=':'<');
 }
 assert.equal(p.comparisons.length,c.expected.statements.length);
 for(const [i,s]of p.comparisons.entries()){
  const want=c.expected.statements[i],source=t.statements[i];assert.equal(s.index,i);
  assert.deepEqual(s.left,{raw:source.a,value:want.a});assert.deepEqual(s.right,{raw:source.b,value:want.b});
  assert.equal(s.word,want.word);assert.equal(s.requiredSymbol,want.symbol);assert.equal(s.submittedSymbol,want.symbol);
  assert.equal(s.mathematicallyTrue,true);assert.equal(s.meaningMatches,true);
  assert.equal(m.history[s.historyIndex].action,'symbol');
  assert.equal(m.history[s.historyIndex].data.fields.relation,want.symbol);
 }
 assert.deepEqual(p.finalConstruction,m.board);assert.equal(p.issue,m.issue);
 assert.equal(p.eventCount,m.history.length);assert.equal(p.events.length,m.history.length);
 assert.deepEqual(p.events.map(e=>e.historyIndex),m.history.map((_,i)=>i));
 assert.deepEqual(p.events.map(e=>e.action),m.history.map(e=>e.action));
 assert.deepEqual(p.events.map(e=>e.fields),m.history.map(e=>({position:e.data.fields.position,relation:e.data.fields.relation})));
 assert.deepEqual(p.failedRequests,p.events.filter(e=>!e.accepted));assert.deepEqual(p.resets,p.events.filter(e=>e.action==='reset'));
 assert.equal(p.firstPlacement.index,m.board.first.index);assert.equal(p.firstPlacement.coordinate,m.board.first.position);
 assert.equal(m.history[p.firstPlacement.historyIndex].action,'place');
 assert.equal(p.currentDraft.selectedIndex,m.board.selected);assert.equal(p.currentDraft.raw,m.position);
 assert.equal(p.currentDraft.card,t.cards[m.board.selected]);assert.deepEqual(p.currentDraft.appliedValue,c.expected.cardValues[m.board.selected]);
 assert.equal(p.assessmentLimits.method,null);assert.equal(p.assessmentLimits.recordingLimit,2000);
 for(const key of ['independentDrawingAssessed','authorshipAssessed','understandingAssessed','generalMasteryAssessed',
  'allLaterClicksRecorded','historyCompletenessAuthenticated','exactKeystrokeOrderKnown'])assert.equal(p.assessmentLimits[key],false,key);
 metrics.acceptedModels++;return p;
}
function rejects(c,m,why){
 const before=JSON.stringify(m);assert.equal(replay(task(c),m),null,why);assert.equal(JSON.stringify(m),before);
}
function originalOnly(c,m,why){
 assert.equal(M.valid(task(c),m),true,why);assert.equal(M.inspect(task(c),m).correct,true,why);rejects(c,m,why);
}

test('literal source fingerprints enumerate all 8 native, 10 associated and 2 practice positions',()=>{
 assert.deepEqual(Object.keys(M.fields),FIELDS);assert.equal(FIELDS.length,35);
 assert.equal(cases.length,8);assert.equal(new Set(cases.map(c=>c.nodeId)).size,4);
 assert.equal(cases.reduce((n,c)=>n+c.task.cards.length,0),29);
 assert.equal(cases.reduce((n,c)=>n+c.expected.statements.length,0),6);
 assert.equal(bridges.length,10);assert.equal(practices.length,2);
 for(const[file,want]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+file,import.meta.url))),want,file);
 for(const c of [...cases,...bridges,...practices]){
  assert.deepEqual(task(c),c.task);assert.equal(hash(task(c)),c.taskHash);
  assert.equal((LESSONS[c.id]||BRIDGES[c.id]).topicId,c.nodeId);
  assert.deepEqual(c.task.cards.map(raw=>pair(literal(raw))),c.expected.cardValues);
  assert.deepEqual(c.expected.positionTexts.map(raw=>pair(literal(raw))),c.expected.cardValues);
  for(const[i,s]of (c.task.statements||[]).entries()){
   assert.deepEqual(pair(literal(s.a)),c.expected.statements[i].a);assert.deepEqual(pair(literal(s.b)),c.expected.statements[i].b);
   assert.equal(truth(c.expected.statements[i].a,s.symbol,c.expected.statements[i].b),true);
  }
 }
 const native=[],bound=[],associated=[],practice=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((t,index)=>{
  if(t.type==='x-mixedaxis')native.push(id+':'+index);if(binding(t,{sessionId:id,index}))bound.push(id+':'+index);
 });
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((t,index)=>{
  assert.equal(binding(t,{sessionId:id,index}),null);if(t.type==='x-mixedaxis')associated.push(id+':'+index);
 });
 for(const[id,t]of Object.entries(PRACTICE)){
  assert.equal(binding(t,{sessionId:id,index:-1}),null);if(t.type==='x-mixedaxis')practice.push(id+':-1');
 }
 assert.deepEqual(native.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(bound.sort(),native);
 assert.deepEqual(associated.sort(),bridges.map(c=>c.id+':'+c.index).sort());assert.deepEqual(practice.sort(),practices.map(c=>c.id+':-1').sort());
});

test('binding requires exact raw context types, full original task and source position',()=>{
 for(const [i,c]of cases.entries()){
  const t=task(c),m=finish(c);assert.equal(binding(cp(t),c).nodeId,c.nodeId);assert.equal(binding(t,c).method,null);
  assert.ok(thinkingGuide(t,c));
  for(const context of [null,{},[],c.id,{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},
   {sessionId:c.id,index:Infinity},{sessionId:c.id,index:99},{sessionId:['mixedpoints'],index:1},
   {sessionId:'__proto__',index:0},{sessionId:'constructor',index:0},cases[(i+1)%cases.length]])assert.equal(binding(t,context),null);
  for(const patch of [{min:t.min-1},{max:t.max+1},{prompt:t.prompt+' '},{cards:[...t.cards].reverse()},
   {extra:true},{type:'x-fracorder'},{statements:[...(t.statements||[]),{a:'0',b:'1',symbol:'<',word:'严格小于'}]}]){
   const changed={...t,...patch};assert.equal(binding(changed,c),null);assert.equal(replay(changed,m),null);
  }
  const changed=cp(t);if(Object.hasOwn(changed,'statements'))delete changed.statements;else changed.statements=[];
  assert.equal(binding(changed,c),null,'absent and empty source fields are not interchangeable');assert.equal(replay(changed,m),null);
 }
});

for(const c of cases)test(`${c.id}:${c.index} reconstructs exact applied points and original visible controls`,()=>{
 for(const options of [{},{orderFirst:true,reverse:true}]){
  const m=finish(c,M.initial(task(c)),options),p=accepts(c,m);
  assert.equal(p.failedRequests.length,0);assert.equal(p.currentDraft.status,'matches-card');
  assert.equal(p.currentDraft.matchesAppliedPosition,true);assert.equal(p.currentDraft.matchesLastPlacementInput,true);
  assert.equal(p.firstPlacement.matchesCard,true);assert.deepEqual(p.firstPlacement,p.currentRoundFirstPlacement);
  assert.ok(thinkingFeedback(task(c),m,record(m),c));
 }
});

test('all 798 full card-identity permutations independently yield exactly the 11 valid orders',()=>{
 for(const c of cases){
  const t=task(c),values=c.expected.cardValues,prepared=M.initial(t);
  for(let i=0;i<t.cards.length;i++)place(c,prepared,i);symbols(c,prepared);
  const legal=[];
  for(const ids of permutations(t.cards.map((_,i)=>i))){
   const m=cp(prepared);order(c,m,ids);const want=sorted(values,ids);metrics.permutations++;
   assert.equal(M.inspect(t,m).correct,want,`${c.id}:${c.index} original ${ids}`);
   if(want){const p=accepts(c,m);assert.deepEqual(p.order.indices,ids);legal.push(ids);metrics.correctOrders++;}
   else rejects(c,m,`${c.id}:${c.index} descending adjacent pair ${ids}`);
  }
  assert.deepEqual(legal,c.expected.validOrders,'complete independently enumerated identity alternatives');
 }
 assert.equal(metrics.permutations,798);assert.equal(metrics.correctOrders,11);
});

test('equal-value cards retain separate identities and either order without inventing unequal positions',()=>{
 for(const c of cases.filter(c=>c.expected.validOrders.length===2)){
  const m=finish(c),p=accepts(c,m),groups=p.order.equalValueGroups;
  const pairIds=c.expected.cardValues.map((q,i)=>[q,i]).filter(([q])=>compare(q,[3,4])===0).map(([,i])=>i);
  assert.ok(groups.some(g=>compare(g.value,[3,4])===0&&g.indices.length===2&&pairIds.every(id=>g.indices.includes(id))));
  for(const id of pairIds)assert.equal(m.board.placements[id],0.75);
  order(c,m,c.expected.validOrders[1]);const q=accepts(c,m);assert.deepEqual(q.order.indices,c.expected.validOrders[1]);
 }
});

test('invalid place has no issue or first; a legal wrong coordinate is an accepted first action and survives correction/reset',()=>{
 for(const c of cases){
  const t=task(c),m=M.initial(t);field(t,m,'position','not a coordinate');act(t,m,'place');
  assert.deepEqual(m.board.placements,{});assert.equal(m.board.first,null);assert.equal(m.issue,'');
  field(t,m,'position',String(t.min-1));act(t,m,'place');assert.equal(m.board.first,null);assert.equal(m.issue,'');
  field(t,m,'position',String(t.min));act(t,m,'place');
  assert.deepEqual(m.board.first,{index:0,position:t.min});assert.equal(M.inspect(t,m).correct,false);
  const first=cp(m.board.first),history=cp(m.history);finish(c,m);let p=accepts(c,m);
  assert.equal(p.firstPlacement.matchesCard,false);assert.equal(p.firstPlacement.historyIndex,2);
  assert.equal(p.firstPlacement.raw,String(t.min));assert.equal(p.events[2].accepted,true);
  assert.equal(p.events[2].placement.matchesCard,false);assert.equal(p.failedRequests.length,2);
  assert.deepEqual(m.history.slice(0,history.length),history);assert.deepEqual(m.board.first,first);
  const fields=Object.fromEntries(FIELDS.map(k=>[k,m[k]]));act(t,m,'reset');
  assert.deepEqual(Object.fromEntries(FIELDS.map(k=>[k,m[k]])),fields);assert.deepEqual(m.board.first,first);
  assert.deepEqual(m.board.placements,{});assert.deepEqual(m.board.ordered,[]);assert.deepEqual(m.board.symbols,[]);
  rejects(c,m,'reset is not completed work');finish(c,m);p=accepts(c,m);
  assert.equal(p.firstPlacement.matchesCard,false);assert.equal(p.currentRoundFirstPlacement.matchesCard,true);
  assert.ok(p.currentRoundFirstPlacement.historyIndex>p.resets[0].historyIndex);assert.equal(p.resets.length,1);
 }
});

test('the original decimal lexical grammar and inclusive axis bounds are independently respected',()=>{
 const c=at('mixedpoints',1),t=task(c),m=M.initial(t);
 const inputs=['',' ','-3','3','-3.00000000','+003.00000000','-0','+0','  -0.75000000  ',
  '000000000000.60000000','0000000000000.6','0.600000000','-3.00000001','3.00000001',
  '1/2','.5','-.5','1.','1e0','0x1','Infinity','NaN','−1','1,0','1 0','--1','+ 1','999999999999.99999999'];
 for(const raw of inputs){
  const before=cp(m.board),want=coordinate(raw,t);field(t,m,'position',raw);act(t,m,'place');
  if(want.inRange){const placed=m.board.placements[0];assert.equal(Object.is(placed,-0)?0:placed,Number(want.value[0])/Number(want.value[1]));}
  else assert.deepEqual(m.board,before);
  assert.equal(m.issue,'','original invalid/out-of-range place has no invented message');
 }
 finish(c,m);const p=accepts(c,m),events=p.events.slice(0,inputs.length);
 assert.deepEqual(events.map(e=>e.accepted),inputs.map(raw=>coordinate(raw,t).inRange));
 assert.ok(events.filter(e=>!e.accepted).every(e=>e.issue===''&&!e.constructionChanged));
 assert.deepEqual(p.firstPlacement.value,[-3,1]);assert.equal(p.firstPlacement.raw,'-3');
});

test('same-card selections, equal repeated placements and actual order withdrawal/re-append retain no-effect events',()=>{
 const c=at('mixedpoints',2),t=task(c),m=finish(c);act(t,m,'select',m.board.selected);
 act(t,m,'place');let p=accepts(c,m);assert.equal(p.events.at(-2).constructionChanged,false);
 assert.equal(p.events.at(-1).constructionChanged,false);assert.equal(p.events.at(-1).accepted,true);
 const old=cp(m.history);act(t,m,'order',2);assert.deepEqual(m.board.ordered,[0,1,3]);rejects(c,m,'removed identity');
 act(t,m,'order',2);p=accepts(c,m);assert.deepEqual(p.order.indices,[0,1,3,2]);
 assert.deepEqual(m.history.slice(0,old.length),old);assert.equal(p.firstPlacement.historyIndex,1);
});

test('each of six wording-specific comparisons rejects other visible symbols even if numerically true',()=>{
 const c=at('orderforms',1),t=task(c);let inspected=0,trueButWrongMeaning=0;
 for(let index=0;index<6;index++)for(const symbol of RELATIONS){
  const m=M.initial(t);for(let i=0;i<index;i++){
   field(t,m,'relation',c.expected.statements[i].symbol);act(t,m,'symbol');
  }
  const want=c.expected.statements[index];field(t,m,'relation',symbol);act(t,m,'symbol');inspected++;
  const accepted=symbol===want.symbol&&truth(want.a,symbol,want.b);
  assert.equal(m.board.symbols.length,index+(accepted?1:0));assert.equal(m.board.first,null,'comparison does not place a point');
  if(!accepted){assert.match(m.issue,/严格大\/小/);if(truth(want.a,symbol,want.b))trueButWrongMeaning++;}
  else assert.equal(m.issue,'');
  finish(c,m,{orderFirst:true});const p=accepts(c,m);
  assert.equal(p.failedRequests.length,accepted?0:1);assert.equal(p.events[index].accepted,accepted);
  assert.deepEqual(p.comparisons.map(s=>s.submittedSymbol),['<','>','=','≠','≤','≥']);
 }
 assert.equal(inspected,42);assert.equal(trueButWrongMeaning,12);
});

test('all comparison statements may precede placement, hidden final relation is preserved, and reset reopens it',()=>{
 const c=at('orderforms',1),t=task(c),m=M.initial(t);order(c,m);symbols(c,m);
 assert.deepEqual(m.board.placements,{});assert.equal(m.board.first,null);
 assert.equal(m.relation,'≥');assert.doesNotMatch(V.render(t,m),/data-xfield="relation"|data-x="b16-symbol"/);
 assert.ok(t.statements.some(s=>!t.cards.includes(s.a)||!t.cards.includes(s.b)),'statements need not be cards on this board');
 for(let i=0;i<t.cards.length;i++)place(c,m,i);let p=accepts(c,m);
 assert.ok(p.comparisons.every(s=>s.historyIndex<p.firstPlacement.historyIndex));
 const snapshot=cp(m),changed=cp(m);changed.relation='';originalOnly(c,changed,'hidden relation cannot silently change');
 rawAct(t,changed,'select',{index:'0'});originalOnly(c,changed,'hidden alteration cannot be legitimized by another action');
 act(t,m,'reset');assert.equal(m.relation,'≥');assert.match(V.render(t,m),/data-xfield="relation"/);
 act(t,m,'symbol');assert.equal(m.board.symbols.length,0);assert.ok(m.issue);finish(c,m);p=accepts(c,m);
 assert.equal(p.failedRequests.length,1);assert.deepEqual(m.history.slice(0,snapshot.history.length),snapshot.history);
 assert.equal(p.firstPlacement.historyIndex,snapshot.history.findIndex(e=>e.action==='place'));
});

test('a failed symbol issue is cleared by a later invalid place exactly as in the original model',()=>{
 const c=at('orderforms',1),t=task(c),m=M.initial(t);field(t,m,'relation','≤');act(t,m,'symbol');assert.ok(m.issue);
 field(t,m,'position','bad');act(t,m,'place');assert.equal(m.issue,'');assert.equal(m.board.first,null);
 finish(c,m);const p=accepts(c,m);assert.equal(p.failedRequests.length,2);
 assert.ok(p.events[0].issue);assert.equal(p.events[1].issue,'');assert.equal(p.events[1].accepted,false);
 const forged=cp(m);forged.issue='看清是严格大/小、一样多，还是允许相等。';originalOnly(c,forged,'terminal issue must match last original event');
});

test('unapplied draft values, including invalid and out-of-range text, never replace the completed applied work',()=>{
 for(const c of cases){
  const t=task(c),m=finish(c),saved=cp(m.board),r=record(m),selected=m.board.selected;
  const variants=[['not a number','invalid-number'],[String(t.max+1),'outside-axis'],[String(t.min),'different-from-card']];
  for(const [raw,status]of variants){
   field(t,m,'position',raw);assert.equal(M.inspect(t,m).correct,true);const p=accepts(c,m);
   assert.deepEqual(m.board,saved);assert.equal(p.currentDraft.status,status);assert.equal(p.currentDraft.raw,raw);
   assert.equal(p.currentDraft.matchesCard,false);assert.equal(p.currentDraft.matchesAppliedPosition,false);
   assert.equal(latestSubmissionMatches(m,r),false);assert.equal(thinkingFeedback(t,m,r,c),null);
   r.attempts.push({value:cp(m)});const feedback=thinkingFeedback(t,m,r,c);assert.ok(feedback);
   assert.match(JSON.stringify(feedback),/当前输入/);
   assert.match(JSON.stringify(feedback),/仍保留在已经放下的位置|尚未改变它/);
   assert.equal(feedback.method,null);
  }
  const raw='  +'+c.expected.positionTexts[selected]+'0  ';
  // Every final card in this fixed set is nonnegative and its displayed text
  // either already has a decimal point or needs an explicit .0 suffix.
  const equivalent=c.expected.positionTexts[selected].includes('.')?raw:' +'+c.expected.positionTexts[selected]+'.0 ';
  field(t,m,'position',equivalent);const p=accepts(c,m);assert.equal(p.currentDraft.status,'matches-card');
  assert.equal(p.currentDraft.matchesAppliedPosition,true);assert.equal(p.currentDraft.matchesLastPlacementInput,false);
  assert.equal(thinkingFeedback(t,m,r,c),null,'equivalent mathematics is still a changed full saved snapshot');
 }
});

test('a huge but syntactically valid unplaced draft has an exact value without unsafe Number rounding',()=>{
 const c=at('mixedpoints',1),t=task(c),m=finish(c),raw='999999999999.12345678';field(t,m,'position',raw);
 const p=accepts(c,m),q=literal(raw);assert.equal(p.currentDraft.syntaxValid,true);assert.equal(p.currentDraft.inRange,false);
 assert.equal(p.currentDraft.value,null);assert.deepEqual(p.currentDraft.valueExact,q.map(String));
 assert.equal(p.currentDraft.status,'outside-axis');assert.equal(M.inspect(t,m).correct,true);
 act(t,m,'place');const f=accepts(c,m);assert.equal(f.events.at(-1).accepted,false);assert.equal(f.issue,'');
});

test('wrong applied work is rejected even when the current draft has been corrected but not placed',()=>{
 for(const c of cases){
  const t=task(c),m=finish(c),selected=m.board.selected;field(t,m,'position',String(t.min));act(t,m,'place');
  assert.equal(M.inspect(t,m).correct,false);rejects(c,m,'real wrong coordinate');
  field(t,m,'position',c.expected.positionTexts[selected]);assert.equal(M.inspect(t,m).correct,false);rejects(c,m,'typing is not placing');
  act(t,m,'place');const p=accepts(c,m);assert.equal(p.events.at(-2).placement.matchesCard,false);
  assert.equal(p.events.at(-2).accepted,true);assert.equal(p.events.at(-1).placement.matchesCard,true);
 }
});

test('hidden B16 fields and relation outside its visible window cannot acquire strict evidence',()=>{
 const c=at('mixedpoints',1),t=task(c);
 for(const key of FIELDS.filter(k=>k!=='position')){
  const historical=M.initial(t);historical[key]='unseen';finish(c,historical);originalOnly(c,historical,'hidden historical '+key);
  const current=finish(c);current[key]='unseen';originalOnly(c,current,'hidden current '+key);
 }
 const hasStatements=at('orderforms',1),s=task(hasStatements),m=finish(hasStatements),relation=m.relation;
 m.relation='=';rawAct(s,m,'select',{index:'0'});m.relation=relation;originalOnly(hasStatements,m,'transient hidden relation change remains in history');
 const badChoice=M.initial(s);badChoice.relation='<=';rawAct(s,badChoice,'symbol');finish(hasStatements,badChoice);
 originalOnly(hasStatements,badChoice,'non-rendered select spelling cannot become a visible choice');
});

test('canonical card dataset IDs and exact action payloads are required for visible operation evidence',()=>{
 const c=at('mixedpoints',1),t=task(c);
 for(const action of ['select','order'])for(const index of ['00','+0','0x0','0e0','0.0',' 0 ','-0','-1','4','NaN','Infinity','']){
  const m=M.initial(t);rawAct(t,m,action,{index});act(t,m,'reset');finish(c,m);originalOnly(c,m,action+' '+JSON.stringify(index));
 }
 for(const action of ['place','reset'])for(const data of [{index:'0'},{value:'0'},{row:'0'}]){
  const m=M.initial(t);rawAct(t,m,action,data);act(t,m,'reset');finish(c,m);originalOnly(c,m,'extraneous dataset '+action);
 }
 for(const action of ['select','order']){
  const m=M.initial(t);rawAct(t,m,action,{index:'0',value:'0'});act(t,m,'reset');finish(c,m);originalOnly(c,m,'extra indexed-button data');
 }
});

test('other widgets and completed hidden symbol controls do not become evidence through later reset',()=>{
 const c=at('mixedpoints',1),t=task(c);
 for(const action of ['fold','partition','save','fraction','overlay','plot','digit-save','algebra','view','cell','symbol']){
  const m=M.initial(t);rawAct(t,m,action);act(t,m,'reset');finish(c,m);originalOnly(c,m,'not a mixedaxis visible action '+action);
 }
 const s=at('orderforms',1),m=finish(s);rawAct(task(s),m,'symbol');originalOnly(s,m,'comparison button no longer exists');
});

test('current board, first, terminal issue, exact keys and required history cannot be forged',()=>{
 const c=at('mixedpoints',1),good=finish(c);
 const mutations=[m=>m.extra=true,m=>m.board.extra=true,m=>m.board.first.extra=true,m=>m.board.first.position=0,
  m=>m.board.selected=0,m=>m.board.placements[0]=0,m=>m.board.placements.extra=0,m=>m.board.ordered.reverse(),
  m=>m.board.symbols.push('='),m=>m.issue='invented',m=>m.history=[],m=>m.history.reverse(),
  m=>m.history[0].extra=true,m=>m.history[0].data.extra='0',m=>m.history[0].data.fields.extra='',
  m=>delete m.history[0].data.fields.word,m=>m.history[0].data.fields.position=0,
  m=>m.history[0].data.index=0,m=>m.history[0].action='unknown',
  m=>m.history.splice(m.history.findIndex(e=>e.action==='place'),1)];
 for(const mutate of mutations){const m=cp(good);mutate(m);assert.notDeepEqual(m,good);rejects(c,m,String(mutate));}
 for(const m of [null,{},[],true,{...good,board:null},{...good,history:null},{...good,position:0},
  {...good,history:[null]},{...good,history:[{action:'place',data:null}]},{...good,history:[{action:'place',data:{fields:{}}}]}])
  assert.doesNotThrow(()=>assert.equal(replay(task(c),m),null));
 const relation=at('orderforms',1),completed=finish(relation);completed.board.symbols[0]='≤';rejects(relation,completed,'true but wrong original required symbol');
});

test('2000-character visible text is retained; 2001 and non-string saved fields remain outside the original contract',()=>{
 const c=at('mixedpoints',1),t=task(c),m=M.initial(t),raw=' '.repeat(1998)+'-2';
 field(t,m,'position',raw);act(t,m,'place');finish(c,m);let p=accepts(c,m);
 assert.equal(p.firstPlacement.raw.length,2000);assert.deepEqual(p.firstPlacement.value,[-2,1]);
 field(t,m,'position','x'.repeat(2000));p=accepts(c,m);assert.equal(p.currentDraft.raw.length,2000);assert.equal(p.currentDraft.status,'invalid-number');
 act(t,m,'place');p=accepts(c,m);assert.equal(p.events.at(-1).accepted,false);
 const tooLong=cp(m);tooLong.position+='x';assert.equal(M.valid(t,tooLong),false);rejects(c,tooLong,'2001-character current field');
 const old=cp(tooLong.history);rawAct(t,tooLong,'place');assert.deepEqual(tooLong.history,old,'original serialization rejects oversized event');
 const historyLong=cp(m);historyLong.history[0].data.fields.position=' '.repeat(2001);assert.equal(M.valid(t,historyLong),false);rejects(c,historyLong);
});

test('the 2000-action original cap preserves finite receipts and never claims later ignored clicks',()=>{
 const c=at('decimalorder2',0),t=task(c),m=M.initial(t),needed=9;
 assert.match(V.render(t,m),/data-x="b16-reset"/);
 for(let i=0;i<2000-needed;i++)act(t,m,'reset');finish(c,m);assert.equal(m.history.length,2000);
 let p=accepts(c,m);assert.equal(p.resets.length,1991);assert.equal(p.eventCount,2000);
 const before=JSON.stringify(m);act(t,m,'reset');assert.equal(JSON.stringify(m),before);
 field(t,m,'position','later unapplied draft');p=accepts(c,m);assert.equal(p.currentDraft.status,'invalid-number');
 assert.equal(p.assessmentLimits.allLaterClicksRecorded,false);assert.equal(p.assessmentLimits.historyCompletenessAuthenticated,false);
 const overflow=cp(m);overflow.history.push(cp(m.history[0]));assert.equal(M.valid(t,overflow),false);rejects(c,overflow,'2001 events');
 const incomplete=M.initial(t);for(let i=0;i<1992;i++)act(t,incomplete,'reset');finish(c,incomplete);
 assert.equal(M.inspect(t,incomplete).correct,false);rejects(c,incomplete,'ignored final order does not invent completion');
});

test('all associated/practice tasks remain isolated and original-valid records are not migrated or discarded',()=>{
 for(const c of [...bridges,...practices]){
  const t=task(c),m=finish(c);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
  assert.equal(binding(t,c),null);assert.equal(thinkingGuide(t,c),null);assert.equal(thinkingFeedback(t,m,record(m),c),null);
  const lesson=State.freshLesson(c.id);if(c.index===-1)lesson.models[-1]=m;else{lesson.index=c.index;lesson.models[c.index]=m;State.submitLesson(lesson);}
  const valid=State.validateLesson(lesson,c.id,{allowBridge:c.index!==-1});assert.deepEqual(valid,lesson);
 }
 const unique=bridges.find(c=>c.id==='link-signedwalk-orderforms'&&c.index===0);
 assert.deepEqual(unique.task.cards,['-2','-1','0','1']);assert.equal(replay(task(unique),finish(unique)),null,'not a known native task');
});

for(const c of cases)test(`${c.id}:${c.index} preserves seven submissions, latest unapplied draft, correction, reset and full v2 state`,()=>{
 const t=task(c),lesson=State.freshLesson(c.id);lesson.index=c.index;const m=State.modelForLesson(lesson);
 field(t,m,'position',String(t.min));act(t,m,'place');assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;
 const first=JSON.stringify(lesson.cases[c.index].attempts[0]);State.supportLesson(lesson);finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;assert.ok(thinkingFeedback(t,m,lesson.cases[c.index],c));
 field(t,m,'position',String(t.min));assert.equal(State.currentSubmission(lesson).status,'modified');
 assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;
 assert.match(JSON.stringify(thinkingFeedback(t,m,lesson.cases[c.index],c)),/当前输入.*尚未改变它/);
 act(t,m,'place');assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;act(t,m,'reset');
 assert.equal(State.submitLesson(lesson).correct,false);metrics.submissions++;finish(c,m);
 assert.equal(State.submitLesson(lesson).correct,true);metrics.submissions++;
 assert.equal(JSON.stringify(lesson.cases[c.index].attempts[0]),first);
 assert.deepEqual(lesson.cases[c.index].attempts.map(a=>M.inspect(t,a.value).correct),[false,true,true,false,true,false,true]);
 assert.equal(lesson.cases[c.index].attempts[0].supported,false);assert.equal(lesson.cases[c.index].attempts[0].exposed,false);
 assert.ok(lesson.cases[c.index].attempts.slice(1).every(a=>a.supported&&a.exposed));
 assert.equal(State.lessonSummary(lesson).cases[c.index].independent,false);const p=accepts(c,m);
 assert.equal(p.firstPlacement.matchesCard,false);assert.equal(p.currentRoundFirstPlacement.matchesCard,true);
 State.addLessonNote(lesson,'错点保留，再比较实际落点与卡片。');lesson.draft='未提交的比较说明';
 const state=Core.fresh();state.lessons[c.id]=lesson;state.lessonContinuation=c.id;
 state.visited[c.nodeId]='2026-11-15T00:00:00.000Z';state.bookmarks=[c.nodeId];state.openedPacks[atlas.packs[0].id]='2026-11-15T00:00:00.000Z';
 const before=JSON.stringify(state),exported=Core.backup(state);assert.equal(exported.version,2);
 const restored=Core.parseBackup(JSON.stringify(exported),atlas);assert.deepEqual(restored,state);assert.equal(JSON.stringify(state),before);
 assert.deepEqual(Core.merge(Core.fresh(),restored),restored);assert.deepEqual(Core.merge(restored,restored),restored);
 assert.deepEqual(replay(t,restored.lessons[c.id].models[c.index]),p);
 const altered=cp(restored);altered.lessons[c.id].models[c.index].position='unapplied restored draft';
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(altered)),atlas),altered);
 assert.equal(State.currentSubmission(altered.lessons[c.id]).status,'modified');
 assert.equal(thinkingFeedback(t,altered.lessons[c.id].models[c.index],altered.lessons[c.id].cases[c.index],c),null);
});

test('strict evidence refuses malformed historical fields without changing original v2 compatibility',()=>{
 const c=at('orderforms',1),t=task(c),m=finish(c);m.relation='';
 originalOnly(c,m,'old hidden-field edit');const lesson=State.freshLesson(c.id);lesson.index=c.index;lesson.models[c.index]=m;
 assert.equal(State.submitLesson(lesson).correct,true);assert.equal(thinkingFeedback(t,m,lesson.cases[c.index],c),null);
 const state=Core.fresh();state.lessons[c.id]=lesson;const before=JSON.stringify(state);
 assert.deepEqual(Core.parseBackup(JSON.stringify(Core.backup(state)),atlas),state);assert.equal(JSON.stringify(state),before);
});

test('full-model latest matching and feedback limits do not invent drawing, keystroke timing or authenticated history',()=>{
 const c=at('mixedpoints',1),t=task(c),m=finish(c),r=record(m),f=thinkingFeedback(t,m,r,c);
 assert.ok(f);assert.equal(f.method,null);assert.match(JSON.stringify(f),/工具|系统/);
 assert.match(JSON.stringify(f),/独立作图|独立画图|手工.*画|手动.*画/);assert.match(JSON.stringify(f),/理解|掌握/);
 const p=accepts(c,m);assert.equal(p.assessmentLimits.historyCompletenessAuthenticated,false);
 assert.equal(latestSubmissionMatches(cp(m),r),true,'existing full JSON equality; no invented provenance epoch');
 for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{}]}])
  assert.equal(thinkingFeedback(t,m,bad,c),null);
 const withoutNoEffect=cp(m);withoutNoEffect.history.shift();
 // The first visible selection selected the initial card again. Its omission
 // cannot be authenticated from a self-consistent remaining serialized trace.
 assert.equal(M.valid(t,withoutNoEffect),true);const limited=replay(t,withoutNoEffect);assert.ok(limited);
 assert.equal(limited.assessmentLimits.historyCompletenessAuthenticated,false);
});

after(()=>console.log('MIXEDAXIS_INDEPENDENT_PROBES '+JSON.stringify(metrics)));
