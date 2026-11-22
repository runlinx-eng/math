// #342 P004c; original native task identities, math and signed UI traces.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {closedPolygonPickBinding as binding,
 replayClosedPolygonPickEvidence as replay,
 submittedClosedPolygonPickEvidence as submitted}
 from '../dist/learning/p004c-closed-polygon-pick-evidence.js';
const specs=[
 ['shapehello',0,'mt_KJeEeTutJI','triangle',[0,3]],
 ['shapehello',1,'mt_KJeEeTutJI','triangle',[0,1,2]],
 ['shapeidentity',1,'mt_bfhng6mOuy','triangle',[0,1,2]],
 ['shapeidentity',2,'mt_bfhng6mOuy','triangle',[1,3]],
 ['sidesfold',2,'mt_sBcRdUfAzV','quadrilateral',[1,4]],
 ['shapesides',1,'mt_zuOGOGFAKb','quadrilateral',[1,4]]
];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const ctx=s=>({sessionId:s[0],index:s[1]});
const task=s=>sessionTaskFor(s[0],s[1]);
const choose=(t,m,i)=>native.act(t,m,'g23-toggle',{index:i});
function fixture(s,wrong=false){
 const t=task(s),m=native.initial(t,314159);
 const selected=wrong?s[4].slice(0,-1):s[4];
 for(const i of selected)choose(t,m,i);
 for(const [i,q] of t.questions.entries())m.answers[i]=String(q.value);
 return {t,m};
}
for(const s of specs){
 const name=s[0]+':'+s[1];
 test('P004c '+name+' exact source, task SHA, independent edges and original model',()=>{
  const {t,m}=fixture(s);
  const sha=digest(t);console.log('P004C_NATIVE_FULL_TASK_SHA256 '+name+' '+sha);
  assert.match(sha,/^[a-f0-9]{64}$/);assert.equal(t.type,'x-s23-pick');
  assert.equal(t.want,s[3]);assert.equal(binding(t,ctx(s))?.nodeId,s[2]);
  assert.equal(native.valid(t,m),true);assert.equal(native.inspect(t,m).correct,true);
  const p=replay(t,m,ctx(s));assert.ok(p);
  assert.deepEqual(p.independentlyCalculatedMatches,s[4]);
  assert.deepEqual(p.originalSelectedCards,s[4]);
  assert.equal(p.expectedStraightSides,s[3]==='triangle'?3:4);
  assert.equal(p.generalMasteryAssessed,false);
 });
 test('P004c '+name+' original wrong -> correct, latest Check only',()=>{
  const {t,m}=fixture(s,true),before=structuredClone(m);
  assert.equal(native.inspect(t,m).correct,false);
  assert.equal(replay(t,m,ctx(s)),null);
  choose(t,m,s[4].at(-1));assert.equal(native.inspect(t,m).correct,true);
  const record={attempts:[{value:before},{value:structuredClone(m)}]};
  assert.ok(submitted(t,m,record,ctx(s)));
  assert.equal(submitted(t,m,{attempts:[{value:before}]},ctx(s)),null);
  assert.equal(submitted(t,before,record,ctx(s)),null);
  assert.equal(submitted(t,m,{attempts:[]},ctx(s)),null);
 });
 test('P004c '+name+' rejects edited/no/replayed wrong controls',()=>{
  const {t,m}=fixture(s);
  const invalid=[
   x=>{x.history=[];},x=>{x.history[0].a='sort';},
   x=>{x.history[0].d.index='00';},
   x=>{x.history[0].d.index=1;},
   x=>{x.history[0].d.index='99';},
   x=>{x.history[0].f.fake='1';},
   x=>{x.history[0].d.extra='1';},
   x=>{x.history[0].extra='1';},
   x=>{x.board.selected=[];},
   x=>{x.issue='edited';},
   x=>{x.answers[0]='forged';},
   x=>{x.extra='forged';}
  ];
  for(const edit of invalid){const copy=structuredClone(m);edit(copy);
   assert.equal(replay(t,copy,ctx(s)),null,edit.toString());}
  const forged=native.initial(t,1);forged.board.selected=[...s[4]];
  forged.answers=t.questions.map(q=>String(q.value));
  assert.equal(replay(t,forged,ctx(s)),null);
 });
 test('P004c '+name+' rejects task/source/position alteration',()=>{
  const {t,m}=fixture(s);
  for(const c of [null,{sessionId:s[0],index:String(s[1])},
    {sessionId:s[0],index:s[1]+1},{sessionId:'quadsort',index:3}])
   assert.equal(replay(t,m,c),null);
  for(const altered of [{...t,prompt:t.prompt+' '},{...t,want:'other'},
   {...t,cards:[...t.cards].reverse()},
   {...t,questions:[...t.questions,{label:'x',value:'x'}]}])
   assert.equal(replay(altered,m,ctx(s)),null);
 });
 test('P004c '+name+' reset and undo-selection are replayed',()=>{
  const {t,m}=fixture(s);
  choose(t,m,s[4][0]); // deselect, makes wrong
  assert.equal(replay(t,m,ctx(s)),null);
  choose(t,m,s[4][0]); // reselect, restored
  assert.ok(replay(t,m,ctx(s)));
  native.act(t,m,'g23-reset');assert.equal(replay(t,m,ctx(s)),null);
  for(const i of s[4])choose(t,m,i);
  const p=replay(t,m,ctx(s));assert.ok(p);
  assert.ok(p.originalControlEvents.some(e=>e.action==='reset'));
 });
}
