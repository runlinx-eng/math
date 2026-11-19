import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as M from '../dist/learning/phase5/b28-model.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTaskFor} from '../dist/learning/bridges.js';
import {plotBinding,replayPlotEvidence} from '../dist/learning/plot-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';

const native={measureplot:[0,1,2],quarterplot:[0,1,2],eighthplot:[0,1,2],
 modmoney:[2],modelChoice38:[2]};
const cp=structuredClone, ids=Object.entries(native).flatMap(([id,indices])=>indices.map(index=>({id,index})));
const at=({id,index})=>sessionTaskFor(id,index),ctx=({id,index})=>({sessionId:id,index});
const clone=spec=>cp(at(spec));
const model=t=>M.example(t),proof=(t,m)=>replayPlotEvidence(t,m);

test('eleven native source-bound B28 plot locations; full original source is unchanged',()=>{
 assert.equal(ids.length,11);assert.equal(new Set(ids.map(x=>LESSONS[x.id].topicId)).size,5);
 // Frozen original source blobs (not generated from the new proof adapter).
 const frozen={
  'dist/learning/phase5/b28-model.js':'5ddc6c6f10ad79ba997a88ab25764a655fad4b94',
  'dist/learning/phase5/b28.js':'51c25af8bd3f97959b4918a010a7488c142df943',
  'dist/learning/phase5/b33.js':'17e2e2ab793384399f0c9ae86912e636c382c211',
  'dist/learning/phase5/b38-more.js':'6e7d0a432925ed07be99440f5114bd7568c22baf'
 };
 for(const [p,want] of Object.entries(frozen)){
  const bytes=readFileSync(new URL('../'+p,import.meta.url));
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),want,p);
 }
 for(const s of ids){
  const t=at(s),m=model(t),b=plotBinding(t,ctx(s)),p=proof(t,m);
  assert.equal(t.type,'x-m28-plot',s.id+':'+s.index);
  assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);
  assert.ok(b,s.id+':'+s.index+' source binding');assert.equal(b.nodeId,LESSONS[s.id].topicId);
  assert.equal(b.method,null);assert.ok(p,s.id+':'+s.index+' precise replay');
  assert.equal(p.kind,'plot');assert.equal(p.construction.bins.length,t.end-t.start+1);
  assert.equal(p.construction.bins.reduce((a,x)=>a+x.frequency,0),t.raw.length);
  assert.equal(p.construction.bins.reduce((a,x)=>a+x.marks,0),t.raw.length);
  assert.equal(p.construction.questions.length,t.questions.length);
  assert.deepEqual(p.construction.firstMeasurements,m.board.first);
  const g=thinkingGuide(t,ctx(s));assert.ok(g);assert.match(g.summary,/可选/);
  assert.equal(plotBinding(t,{sessionId:s.id,index:s.index+100}),null);
  assert.equal(plotBinding(t,{sessionId:s.id,index:String(s.index)}),null);
  assert.equal(plotBinding({...t,prompt:t.prompt+'!'},ctx(s)),null);
 }
 assert.equal(EVIDENCE_ADAPTERS.filter(x=>x.id==='plot'&&x.type==='x-m28-plot').length,1);
});

test('all cloned associated/practice plot activities stay outside native binding',()=>{
 const linked=Object.entries(BRIDGES).flatMap(([id,b])=>
  b.tasks.flatMap((t,index)=>t.type==='x-m28-plot'?[{id,index,t}]:[]));
 assert.ok(linked.length>=6);
 for(const {id,index,t} of linked){
  assert.equal(plotBinding(t,{sessionId:id,index}),null);
  assert.ok(proof(t,model(t)),id+':'+index+' compatible replay');
 }
 for(const id of Object.keys(native)){
  const t=sessionTaskFor(id,-1);
  if(t?.type==='x-m28-plot'){assert.equal(plotBinding(t,{sessionId:id,index:-1}),null);assert.ok(proof(t,model(t)));}
 }
});

test('edit invalidates saved reading; wrong record and corrections retain the earliest event',()=>{
 const t=clone(ids[0]),m=model(t),before=cp(m.board.first),oldMarks=cp(m.board.marks);
 M.act(t,m,'m28-select',{index:0});m.measure='';
 M.field(t,m,'measure');
 assert.equal(m.board.records[0],null);
 assert.deepEqual(m.board.marks,oldMarks);
 assert.equal(M.inspect(t,m).correct,false);
 assert.equal(proof(t,m),null);
 m.measure='99';M.field(t,m,'measure');M.act(t,m,'m28-record');
 assert.equal(m.board.bad,true);assert.equal(M.inspect(t,m).correct,false);
 m.measure=String(M.measured(t)[0]/t.den);M.field(t,m,'measure');M.act(t,m,'m28-record');
 assert.equal(m.board.records[0],m.measure);
 assert.equal(m.board.first.measurement0,before.measurement0);
 assert.equal(m.board.bad,true);
 assert.equal(M.inspect(t,m).correct,true);
 assert.ok(proof(t,m));
});

test('duplicate ticks, unmark, wrong tick, and over-cap requests remain in history',()=>{
 const t=clone(ids[0]),m=model(t),p=proof(t,m);assert.ok(p);
 const repeated=p.construction.bins.filter(x=>x.frequency>1);
 assert.ok(repeated.length);
 const i=p.construction.bins.findIndex(x=>x.frequency>0);M.act(t,m,'m28-unmark',{index:i});
 assert.equal(M.inspect(t,m).correct,false);assert.equal(proof(t,m),null);
 M.act(t,m,'m28-mark',{index:i});assert.ok(proof(t,m));
 M.act(t,m,'m28-mark',{index:0});assert.equal(M.inspect(t,m).correct,true);
 const replay=proof(t,m);assert.ok(replay);assert.equal(replay.events.at(-1).applied,false);
});

test('strict layer rejects near-only original success and current answer approximation',()=>{
 const t=clone(ids[0]),m=model(t);
 m.answers[0]=String(t.questions[0].value+1e-8);
 assert.equal(M.inspect(t,m).correct,true);
 assert.equal(proof(t,m),null);
 const a=model(t);M.act(t,a,'m28-select',{index:0});
 a.measure=String(M.measured(t)[0]/t.den+1e-8);M.field(t,a,'measure');M.act(t,a,'m28-record');
 assert.equal(M.inspect(t,a).correct,true);assert.equal(proof(t,a),null);
});

test('replay rejects fabricated events, board changes and source drift',()=>{
 const t=clone(ids[0]),m=model(t);
 for(const mutate of [
  x=>x.history.push({a:'mark',d:{index:'0'},f:{}}),
  x=>x.history[0].d.index='999',
  x=>x.history[0].a='make-up',
  x=>x.board.marks[0]++,
  x=>x.board.records[0]='4.00000001',
  x=>x.board.first.measurement0='fake',
  x=>x.issue='forged',
  x=>x.answers[0]='',
  x=>x.offset='3',
  x=>x.history[0].f.extra='fake',
 ]){
  const changed=cp(m);mutate(changed);assert.equal(proof(t,changed),null);
 }
 for(const mutate of [x=>x.raw[0]++,x=>x.den++,x=>x.start++,x=>x.questions[0].value++,
  x=>x.prompt+='x',x=>x.unit='g']){const changed=cp(t);mutate(changed);assert.equal(plotBinding(changed,ctx(ids[0])),null);assert.equal(proof(changed,m),null);}
});

test('hidden actions cannot borrow a valid original grade',()=>{
 const t=clone(ids[0]),m=model(t);
 const p=proof(t,m);assert.ok(p);
 assert.equal(p.physicalMeasurementAssessed,false);assert.equal(p.generalMasteryAssessed,false);
 for(const action of ['help','test','clear']){
  const hidden=cp(m);M.act(t,hidden,'m28-'+action);
  assert.equal(M.inspect(t,hidden).correct,true);
  assert.equal(proof(t,hidden),null,'hidden '+action+' must not become real UI evidence');
 }
});

test('feedback appears only for matching current latest submission',()=>{
 const s=ids[0],t=at(s),m=model(t),p=proof(t,m);assert.ok(p);
 const record={attempts:[{value:cp(m)}]};
 const shown=thinkingFeedback(t,m,record,ctx(s));
 assert.ok(shown);assert.equal(shown.method,null);assert.match(shown.observation,/点图/);
 assert.equal(thinkingFeedback(t,m,{attempts:[{value:{...cp(m),prose:'stale'}}]},ctx(s)),null);
 assert.equal(thinkingFeedback(t,m,record,{sessionId:'bad',index:0}),null);
 const edited=cp(m);edited.prose='changed';assert.equal(thinkingFeedback(t,edited,record,ctx(s)),null);
});

test('current exact plot model and original attempts survive v2 backup and storage bytes',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
 for(const spec of ids){
  const t=at(spec),m=model(t),lesson=State.freshLesson(spec.id);
  lesson.index=spec.index;lesson.view='task';lesson.models[spec.index]=cp(m);
  State.submitLesson(lesson);
  assert.deepEqual(lesson.cases[spec.index].attempts.at(-1).value,m);
  const state=Core.fresh();state.lessons[spec.id]=lesson;
  assert.deepEqual(Core.validate(cp(state),atlas),state);
  const payload=JSON.stringify({app:'math-explorer',version:2,state});
  const parsed=Core.parseBackup(payload,atlas);
  assert.deepEqual(parsed,state,'v2 parser did not change original model or attempt bytes');
  assert.ok(proof(t,parsed.lessons[spec.id].models[spec.index]));
  const raw=JSON.stringify(state),store=new Map();
  const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  Storage.writeStored(Core.KEY,raw,storage);
  assert.equal(Storage.readStored(Core.KEY,storage),raw);
 }
});
