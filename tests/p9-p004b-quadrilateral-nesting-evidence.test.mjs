// #342 P004b: native source and independent nested quadrilateral replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sessionTaskFor} from '../dist/learning/bridges.js';
import * as native from '../dist/learning/phase5/b23-model.js';
import {quadrilateralNestingBinding as binding,replayQuadrilateralNestingEvidence as replay,
 submittedQuadrilateralNestingEvidence as submitted}
 from '../dist/learning/p004b-quadrilateral-nesting-evidence.js';
const ctx={sessionId:'quadsort',index:3},task=()=>sessionTaskFor('quadsort',3);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const put=(t,m,i,r)=>{m.item=String(i);m.slot=String(r);native.act(t,m,'g23-sort');};
function fixture(wrong=false){
 const t=task(),m=native.initial(t,314159);
 t.regions.forEach((r,i)=>put(t,m,i,wrong&&i===0?0:r));
 m.answers[0]='yes';return{t,m};
}
const edit=(m,f)=>{const x=structuredClone(m);f(x);return x;};
test('P004b native task SHA discovery and independent four-card geometry',()=>{
 const {t,m}=fixture();
 const hash=digest(t);console.log('P004B_NATIVE_FULL_TASK_SHA256 quadsort:3 '+hash);
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(t.type,'x-s23-nest');assert.equal(binding(t,ctx)?.nodeId,'mt_Xt1cRqaBOW');
 assert.equal(native.valid(t,m),true);assert.equal(native.inspect(t,m).correct,true);
 const p=replay(t,m,ctx);assert.ok(p);assert.deepEqual(p.independentlyCalculatedRegions,[2,1,0,0]);
 assert.equal(p.geometricChecks[0].square,true);
 assert.equal(p.geometricChecks[1].rectangle,true);
 assert.equal(p.geometricChecks[1].square,false);
 assert.equal(p.geometricChecks[2].rectangle,false);
 assert.equal(p.geometricChecks[3].rhombus,true);
 assert.equal(p.geometricChecks[3].rectangle,false);
 assert.equal(p.generalMasteryAssessed,false);
});
test('P004b original wrong-to-correct sort and latest Check',()=>{
 const {t,m}=fixture(true);
 assert.equal(native.valid(t,m),true);assert.equal(native.inspect(t,m).correct,false);
 assert.equal(replay(t,m,ctx),null);
 const wrong=structuredClone(m);put(t,m,0,2);
 assert.equal(native.inspect(t,m).correct,true);
 const record={attempts:[{value:wrong},{value:structuredClone(m)}]};
 const p=submitted(t,m,record,ctx);assert.ok(p);
 assert.ok(p.originalControlEvents.some(e=>e.isCorrection&&e.item===0));
 assert.equal(submitted(t,m,{attempts:[{value:wrong}]},ctx),null);
 assert.equal(submitted(t,wrong,record,ctx),null);
});
test('P004b missing, forged, malformed or stale events fail closed',()=>{
 const {t,m}=fixture();
 const mutations=[
  x=>{x.history=[];},x=>{x.history[0].a='test';},
  x=>{x.history[0].f.item='00';},x=>{x.history[0].f.item='4';},
  x=>{x.history[1].f.slot='03';},x=>{x.history[1].f.slot='3';},
  x=>{x.history[2].f.extra=1;},x=>{x.history[3].d.index='1';},
  x=>{x.history[3].f.item='0';},x=>{x.board.assigned[0]=0;},
  x=>{x.answers[0]='no';},x=>{x.issue='tampered';},
  x=>{x.extra='forged';}
 ];
 for(const f of mutations)assert.equal(replay(t,edit(m,f),ctx),null,f.toString());
 const fake=native.initial(t,314159);
 fake.board.assigned=[2,1,0,0];fake.answers[0]='yes';
 assert.equal(replay(t,fake,ctx),null);
});
test('P004b reset invalidates old work; all four new sort events required',()=>{
 const {t,m}=fixture();native.act(t,m,'g23-reset');
 assert.equal(replay(t,m,ctx),null);
 t.regions.forEach((r,i)=>put(t,m,i,r));
 const p=replay(t,m,ctx);assert.ok(p);
 assert.ok(p.originalControlEvents.some(e=>e.action==='reset'));
});
test('P004b source exclusion and original task isolation',()=>{
 const {t,m}=fixture();
 for(const c of [{sessionId:'quadsort',index:0},{sessionId:'quadsort',index:2},
  {sessionId:'quadhierarchy',index:0},{sessionId:'quadsort',index:'3'},null])
  assert.equal(replay(t,m,c),null);
 for(const f of [{...t,prompt:t.prompt+' '},{...t,regions:[0,1,2,0]},
  {...t,questions:[{...t.questions[0],value:'no'}]}])
  assert.equal(replay(f,m,ctx),null);
});
