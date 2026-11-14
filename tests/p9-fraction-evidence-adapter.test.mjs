import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionTasks,sessionMeta,BRIDGES} from '../dist/learning/bridges.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as fractions from '../dist/learning/phase5/b17-model.js';
import {fractionBinding,replayFractionEvidence} from '../dist/learning/fraction-evidence.js';
import {fractionEvidenceExample} from '../scripts/fraction-evidence-fixture.mjs';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const groups=[
 ['recutnames',[0,1,2],'mt_FP-mjXaq3B'],['samenames',[0,1,2],'mt_ebPelt-qAl'],
 ['simplestparts',[0,2],'mt_b7T-CjOYUR'],['tenthtohundred',[0,2],'mt_NaqEP8xDhZ'],
 ['thousandparts',[1],'mt_kdWoAel3Zl'],['decimalstops',[0,1],'mt_SBkTGjiZjZ']
];
const cases=groups.flatMap(([sessionId,indices,nodeId])=>indices.map(index=>({sessionId,index,nodeId})));
const record=m=>({support:false,attempts:[{value:structuredClone(m)}]});
const act=(task,m,a,fields={})=>{Object.assign(m,fields);return fractions.act(task,m,'b17-'+a);};
const accept=(task,m)=>{assert.equal(fractions.valid(task,m),true);assert.equal(fractions.inspect(task,m).correct,true);assert.ok(replayFractionEvidence(task,m));};
const rejects=(task,m,message)=>assert.equal(replayFractionEvidence(task,m),null,message);

test('thirteen native fraction tasks bind six exact original sources without inheriting MP.2',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
 const mp2=source.groups.find(g=>g.code==='ccss-math:MP.2');
 for(const c of cases){
  const t=sessionTasks(c.sessionId)[c.index],binding=fractionBinding(t,c);
  assert.equal(binding?.nodeId,c.nodeId);
  assert.equal(binding.method,null);
  assert.equal(sessionMeta(c.sessionId).topicId,c.nodeId);
  assert.equal(mp2.nodes.some(n=>n.id===c.nodeId),false);
  assert.ok(thinkingGuide(t,c)?.question.length>10);
  assert.equal(fractionBinding(t,{}),null);
  assert.equal(fractionBinding(t,{...c,index:String(c.index)}),null);
  assert.equal(fractionBinding({...t,prompt:t.prompt+' changed'},c),null);
  assert.equal(fractionBinding({...t,n:t.n+1},c),null);
 }
 const found=[];
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((t,index)=>{
  if(fractionBinding(t,{sessionId,index}))found.push(sessionId+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.sessionId+':'+c.index).sort());
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((t,index)=>{
  assert.equal(fractionBinding(t,{sessionId,index}),null,sessionId+':'+index);
 });
});

for(const c of cases)test(`${c.sessionId}:${c.index} requires actual repartitioning and the latest exact submission`,()=>{
 const t=sessionTasks(c.sessionId)[c.index],m=fractionEvidenceExample(t),proof=replayFractionEvidence(t,m);
 accept(t,m);
 assert.deepEqual(proof.start,[t.n,t.d]);
 assert.equal(proof.splits+proof.merges,proof.transformations.length);
 assert.ok(proof.saved.length>0);
 for(const [n,d] of proof.saved)assert.equal(BigInt(n)*BigInt(t.d),BigInt(t.n)*BigInt(d));
 const feedback=thinkingFeedback(t,m,record(m),c);
 assert.ok(feedback);assert.equal(feedback.method,null);
 assert.equal(thinkingFeedback(t,m,null,c),null);
 assert.equal(thinkingFeedback(t,m,{attempts:[]},c),null);
 assert.equal(thinkingFeedback(t,m,record(m),{}),null);
 assert.equal(thinkingFeedback({...t,prompt:'another task'},m,record(m),c),null);
 const changed=structuredClone(m);changed.answer='my unassessed explanation';
 assert.equal(thinkingFeedback(t,changed,record(m),c),null);
 const wrong=structuredClone(m);wrong.reason='top';
 assert.equal(thinkingFeedback(t,wrong,record(wrong),c),null);
 assert.equal(thinkingFeedback(t,m,{attempts:[{value:m},{value:wrong}]},c),null);
 const resumed=JSON.parse(JSON.stringify({m,record:record(m)}));
 assert.ok(thinkingFeedback(t,resumed.m,resumed.record,c));
});

test('different valid multi-step merges preserve the same exact fraction',()=>{
 const t=sessionTasks('simplestparts')[0],m=fractions.initial(t);
 act(t,m,'merge',{factor:'2'});act(t,m,'merge',{factor:'3'});
 act(t,m,'remember',{fraction:'3 / 4'});m.reason='recut';m.hcf='6';
 accept(t,m);
 const p=replayFractionEvidence(t,m);
 assert.deepEqual(p.transformations.map(x=>x.to),[[9,12],[3,4]]);
 assert.equal(p.merges,2);assert.equal(p.hcf,6);assert.equal(p.simplest,true);
});

test('meaningful splits, duplicate-save failures and no-op rewinds keep their separate meanings',()=>{
 const t=sessionTasks('thousandparts')[1],m=fractions.initial(t);
 act(t,m,'split',{factor:'10'});act(t,m,'split',{factor:'10'});
 act(t,m,'remember',{fraction:'100/1000'});m.reason='recut';accept(t,m);
 assert.equal(replayFractionEvidence(t,m).splits,2);
 const duplicate=structuredClone(m);act(t,duplicate,'remember');
 act(t,duplicate,'rewind');const duplicateProof=replayFractionEvidence(t,duplicate);assert.ok(duplicateProof);
 assert.equal(duplicateProof.history.failedRequests.length,1);assert.equal(duplicateProof.saved.length,1);
 assert.equal(duplicateProof.splits,2);assert.equal(duplicateProof.rewinds,1);
 const initialRewind=fractions.initial(t);act(t,initialRewind,'rewind');
 act(t,initialRewind,'split',{factor:'100'});act(t,initialRewind,'remember',{fraction:'100/1000'});
 initialRewind.reason='recut';assert.equal(fractions.valid(t,initialRewind),true);
 assert.equal(fractions.inspect(t,initialRewind).correct,true);const initialProof=replayFractionEvidence(t,initialRewind);
 assert.ok(initialProof);assert.equal(initialProof.history.ineffectiveRequests.length,1);assert.equal(initialProof.rewinds,0);
});

test('distinct equivalent names may be built by continuous splits or genuine rewinds',()=>{
 const t=sessionTasks('samenames')[1],m=fractions.initial(t);
 act(t,m,'remember',{fraction:'3/5'});
 for(const [factor,fraction] of [['2','6/10'],['2','12/20'],['2','24/40']]){
  act(t,m,'split',{factor});act(t,m,'remember',{fraction});
 }
 m.reason='recut';accept(t,m);
 const rewound=fractionEvidenceExample(sessionTasks('recutnames')[2]);
 assert.equal(replayFractionEvidence(sessionTasks('recutnames')[2],rewound).rewinds,1);
 assert.deepEqual(replayFractionEvidence(t,m).saved,[[3,5],[6,10],[12,20],[24,40]]);
});

test('decimal-start tasks require opening the exact original quantity before repartitioning',()=>{
 for(const index of [0,1]){
  const t=sessionTasks('decimalstops')[index],m=fractionEvidenceExample(t),p=replayFractionEvidence(t,m);
  assert.equal(p.decimalStart,t.decimalStart);assert.equal(p.decimal,t.decimalStart);
  const removed=structuredClone(m);removed.history.shift();rejects(t,removed);
  const wrong=structuredClone(m);wrong.history[0].f.fraction='1/2';rejects(t,wrong);
  const duplicate=structuredClone(m);duplicate.history.splice(1,0,structuredClone(m.history[0]));
  assert.equal(fractions.valid(t,duplicate),true);rejects(t,duplicate);
  const after=structuredClone(m);after.history.push(structuredClone(m.history[0]));
  assert.equal(fractions.valid(t,after),true);rejects(t,after);
 }
});

test('addition contrast is independently calculated and never treated as equal repartitioning',()=>{
 for(const [sessionId,index] of [['recutnames',0],['samenames',0],['simplestparts',2]]){
  const t=sessionTasks(sessionId)[index],m=fractionEvidenceExample(t),p=replayFractionEvidence(t,m);
  assert.deepEqual(p.addition,{from:[t.n,t.d],to:[t.n+1,t.d+1],relation:'changed'});
  const wrong=structuredClone(m);wrong.relation='same';rejects(t,wrong);
  const twice=structuredClone(m);act(t,twice,'test-add');
  assert.equal(fractions.valid(t,twice),true);assert.equal(fractions.inspect(t,twice).correct,true);
  const repeated=replayFractionEvidence(t,twice);assert.ok(repeated);assert.deepEqual(repeated.addition,p.addition);
  assert.equal(repeated.history.ineffectiveRequests.at(-1).action,'test-add');
 }
 const t=sessionTasks('recutnames')[1],m=fractionEvidenceExample(t);act(t,m,'test-add');
 assert.equal(fractions.valid(t,m),true);assert.equal(fractions.inspect(t,m).correct,true);rejects(t,m);
});

test('real failed requests and reset stay observable after correction, while hidden actions remain invalid',()=>{
 const t=sessionTasks('recutnames')[1];
 for(const [action,factor] of [['merge','3'],['split','1'],['split','0'],['split','-2'],['split','1.5'],['split','1001'],['card','2'],['reset','2'],['open-decimal','2']]){
  const m=fractions.initial(t);act(t,m,action,{factor});
  act(t,m,'merge',{factor:'4'});act(t,m,'remember',{fraction:'1/2'});m.reason='recut';
  assert.equal(fractions.valid(t,m),true,action+factor);
  assert.equal(fractions.inspect(t,m).correct,true,action+factor);
  if(['card','open-decimal'].includes(action))rejects(t,m,action+factor);
  else{
   const p=replayFractionEvidence(t,m);assert.ok(p,action+factor);
   assert.equal(p.history.failedRequests.length,action==='reset'?0:1);
   assert.equal(p.history.resetCount,action==='reset'?1:0);
   assert.equal(p.merges,1);assert.equal(p.splits,0);
   if(action!=='reset')assert.deepEqual(m.board.first,{action,factor});
  }
 }
 const capped=sessionTasks('simplestparts')[0],m=fractions.initial(capped);
 act(capped,m,'split',{factor:'1000'});act(capped,m,'merge',{factor:'6'});
 act(capped,m,'remember',{fraction:'3/4'});m.reason='recut';m.hcf='6';
 assert.equal(fractions.valid(capped,m),true);assert.equal(fractions.inspect(capped,m).correct,true);
 const p=replayFractionEvidence(capped,m);assert.ok(p);assert.equal(p.history.failedRequests.length,1);
 assert.equal(p.splits,0);assert.equal(p.merges,1);
});

test('integer bounds, exact division and decimal syntax are checked independently',()=>{
 const t=sessionTasks('recutnames')[1];
 for(const factor of ['0x4','4e0']){
  const m=fractions.initial(t);act(t,m,'merge',{factor});
  act(t,m,'remember',{fraction:'1/2'});m.reason='recut';
  assert.equal(fractions.inspect(t,m).correct,true);rejects(t,m);
 }
 const decimal=sessionTasks('samenames')[2],m=fractionEvidenceExample(decimal);
 m.decimal='3/10';assert.equal(fractions.inspect(decimal,m).correct,true);rejects(decimal,m);
 const exact=fractionEvidenceExample(decimal);exact.decimal='0.300';accept(decimal,exact);
 exact.decimal='0.30000001';rejects(decimal,exact);
});

test('a real reset preserves the first failed request and starts fresh successful counts',()=>{
 const t=sessionTasks('recutnames')[1],m=fractions.initial(t);
 act(t,m,'merge',{factor:'3'});const first=structuredClone(m.board.first);
 assert.ok(m.issue);act(t,m,'reset');assert.deepEqual(m.board.first,first);
 act(t,m,'merge',{factor:'4'});act(t,m,'remember',{fraction:'1/2'});m.reason='recut';accept(t,m);
 const p=replayFractionEvidence(t,m);assert.equal(p.history.resetCount,1);assert.equal(p.history.failedRequests.length,1);
 assert.equal(p.merges,1);assert.equal(p.splits,0);assert.deepEqual(m.board.first,{action:'merge',factor:'3'});
 const forged=structuredClone(m);forged.board.first.factor='4';rejects(t,forged);
});

test('editing the current fraction cannot reuse an old saved name even after another submit',()=>{
 for(const c of cases){
  const t=sessionTasks(c.sessionId)[c.index],m=fractionEvidenceExample(t),before=record(m);
  m.fraction='7/9';
  assert.equal(fractions.valid(t,m),true);assert.equal(fractions.inspect(t,m).correct,true);
  assert.equal(thinkingFeedback(t,m,before,c),null);
  rejects(t,m);assert.equal(thinkingFeedback(t,m,record(m),c),null);
  const last=m.board.saved.at(-1);m.fraction=` ${last[0]} / ${last[1]} `;
  accept(t,m);
 }
});

test('current decimal, addition comparison, invariant choice and common factor must still agree',()=>{
 const mutations=[
  ['samenames',2,'decimal','0.31'],['decimalstops',0,'decimal','0.35'],
  ['recutnames',0,'relation','same'],['simplestparts',2,'relation',''],
  ['simplestparts',0,'hcf','3'],['simplestparts',0,'hcf','6e0'],
  ['tenthtohundred',0,'reason','top']
 ];
 for(const [sessionId,index,key,value] of mutations){
  const t=sessionTasks(sessionId)[index],m=fractionEvidenceExample(t),before=record(m);
  m[key]=value;rejects(t,m,sessionId+':'+key);
  assert.equal(thinkingFeedback(t,m,before,{sessionId,index}),null);
  assert.equal(thinkingFeedback(t,m,record(m),{sessionId,index}),null);
 }
});

test('missing, malformed, truncated, reordered and forged events or boards yield no proof',()=>{
 for(const c of cases){
  const t=sessionTasks(c.sessionId)[c.index],base=fractionEvidenceExample(t);
  const mutations=[
   m=>m.history=[],m=>m.history.reverse(),m=>m.history.pop(),
   m=>m.history[0].a='unknown',m=>m.history[0].extra='forged',
   m=>m.history[0].d={index:'0'},m=>m.history[0].f.extra='forged',
   m=>delete m.history[0].f.reason,m=>m.history[0].f.factor=2,
   m=>m.history[0].f.factor='2'.repeat(501),
   m=>m.board.n++,m=>m.board.d++,m=>m.board.moves++,
   m=>m.board.saved[0][0]++,m=>m.board.first.factor='999',
   m=>m.board.opened=false,m=>m.board.extra='forged',m=>m.issue='invalid',
   m=>m.extra='forged'
  ];
  for(const mutate of mutations){const m=structuredClone(base);mutate(m);rejects(t,m,c.sessionId+':'+c.index);}
  rejects(t,{...base,history:Array(1501).fill(base.history[0])});
  rejects({...t,n:Number.MAX_SAFE_INTEGER},base);
  rejects({...t,targets:[[1,0]]},base);
 }
});

test('a final saved answer without operations is insufficient even when the original inspector accepts it',()=>{
 for(const c of cases){
  const t=sessionTasks(c.sessionId)[c.index],m=fractionEvidenceExample(t);m.history=[];
  assert.equal(fractions.inspect(t,m).correct,true);rejects(t,m);
  assert.equal(thinkingFeedback(t,m,record(m),c),null);
 }
});


test('Issue 166 original visible controls preserve failed requests, resets and latest failed issues',async()=>{
 const {verifyVisibleCorrections}=await import('./helpers/p9-fraction-correction-controls.mjs');
 const result=await verifyVisibleCorrections('fraction',replayFractionEvidence,thinkingFeedback);
 assert.equal(result.paths,result.nativeTasks*3);
 assert.ok(result.failedRequests>=result.nativeTasks);
 assert.equal(result.forgeriesRejected,result.paths*3);
});
