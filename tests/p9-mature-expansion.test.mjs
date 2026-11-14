import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import reviewed from './fixtures/p9-mature-expansion-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {exampleModel,defaultModel,inspect,validModel} from '../dist/learning/tasks.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as arrays from '../dist/learning/phase5/b13-model.js';
import * as patterns from '../dist/learning/phase5/b34-model.js';
import {arrayBinding,replayArrayEvidence} from '../dist/learning/array-evidence.js';
import {sequenceBinding,replaySequenceEvidence} from '../dist/learning/sequence-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
const record=value=>({support:false,attempts:[{value:structuredClone(value)}]});
const context=spec=>({sessionId:spec.id,index:spec.index});
const handlers={sequence:{type:'x-p34-sequence',bind:sequenceBinding,replay:replaySequenceEvidence},
 array:{type:'x-mularray',bind:arrayBinding,replay:replayArrayEvidence}};
const source=JSON.parse(readFileSync(new URL('../docs/spatial-learning/thinking-source-map.json',import.meta.url)));
const mpNodes=new Set(source.groups.flatMap(group=>group.nodes.map(node=>node.id)));
const key=spec=>spec.id+':'+spec.index;

test('53 independently reviewed new positions have 27 genuine native sources and no inherited MP labels',()=>{
 assert.equal(reviewed.sequence.length,11);assert.equal(reviewed.array.length,42);
 assert.equal(new Set([...reviewed.sequence,...reviewed.array].map(spec=>spec.nodeId)).size,27);
 for(const [family,specs] of Object.entries(reviewed))for(const spec of specs){
  const task=sessionTasks(spec.id)[spec.index],h=handlers[family],binding=h.bind(task,context(spec));
  assert.equal(task.type,h.type,key(spec));
  assert.equal(LESSONS[spec.id].topicId,spec.nodeId);
  assert.equal(binding?.nodeId,spec.nodeId);
  assert.equal(binding.method,null,'native domain facts must not impersonate an MP source');
  assert.equal(mpNodes.has(spec.nodeId),false,key(spec));
  assert.ok(thinkingGuide(task,context(spec))?.question);
  assert.equal(h.bind({...task,prompt:task.prompt+' changed'},context(spec)),null);
  assert.equal(h.bind(task,{sessionId:spec.id,index:String(spec.index)}),null);
  assert.equal(h.bind(task,{sessionId:'__proto__',index:spec.index}),null);
  assert.equal(h.bind(task,null),null);
 }
});

for(const [family,specs] of Object.entries(reviewed))for(const spec of specs){
 test(`${family} ${key(spec)}: exact source, genuine replay, errors and latest-submission isolation`,()=>{
  const t=sessionTasks(spec.id)[spec.index],m=exampleModel(t),h=handlers[family],ctx=context(spec);
  assert.ok(validModel(t,m)&&inspect(t,m).correct);
  assert.ok(h.replay(t,m));
  const saved=record(m),before=JSON.stringify(saved),feedback=thinkingFeedback(t,m,saved,ctx);
  assert.ok(feedback);assert.equal(feedback.method,null);
  assert.match(feedback.detail.join(' '),/长期掌握/);
  assert.equal(thinkingFeedback(t,m,null,ctx),null);
  assert.equal(thinkingFeedback(t,m,record(defaultModel(t)),ctx),null);
  assert.equal(thinkingFeedback(t,m,{attempts:[...saved.attempts,{value:defaultModel(t)}]},ctx),null);
  assert.equal(thinkingFeedback(t,m,saved,{sessionId:'__unreviewed__',index:spec.index}),null);
  const edit=structuredClone(m);if(family==='array')edit.answer='999999';else edit.answers[0]='__wrong__';
  assert.equal(thinkingFeedback(t,edit,saved,ctx),null);
  assert.equal(thinkingFeedback(t,edit,record(edit),ctx),null);
  const absent=structuredClone(m);absent.history=[];
  assert.equal(h.replay(t,absent),null);assert.equal(thinkingFeedback(t,absent,record(absent),ctx),null);
  const forged=structuredClone(m);forged.history[0].extra=true;
  assert.equal(h.replay(t,forged),null);
  const board=structuredClone(m);if(family==='array')board.board.rows++;else board.board.values[1]++;
  assert.equal(h.replay(t,board),null);
  const extra=structuredClone(m);extra.unrecordedEvidence=true;
  assert.equal(h.replay(t,extra),null,'additional fabricated model fields do not establish evidence');
  assert.equal(JSON.stringify(saved),before,'deriving feedback never mutates historical attempts');
 });
}

test('sequence feedback uses actual labels for distant, current, multiple and next-item questions',()=>{
 for(const [id,index] of [['reason34',1],['linear34',0],['linear34',1],['linear34',2],['rules34',2],['tables34',2]]){
  const t=sessionTasks(id)[index],m=patterns.example(t),f=thinkingFeedback(t,m,record(m),{sessionId:id,index});
  for(const q of t.questions)assert.ok(f.observation.includes(q.label),id+':'+index+' '+q.label);
  if(!t.questions.some(q=>q.label.includes('下一项')))assert.doesNotMatch(f.observation,/下一项/);
 }
 const old=sessionTasks('reason34')[1],done=patterns.example(old);
 assert.match(thinkingFeedback(old,done,record(done),{sessionId:'reason34',index:1}).observation,/第20项.*81/);
});

test('sequence rules keep exact scale, negative steps and meaningful undo while rejecting no-op history',()=>{
 for(const spec of reviewed.sequence){
  const t=sessionTasks(spec.id)[spec.index],m=patterns.example(t);
  const prior=structuredClone(m);prior.history.unshift({a:'undo',i:'',v:'',w:''});
  assert.ok(patterns.valid(t,prior)&&patterns.inspect(t,prior).correct);
  assert.equal(replaySequenceEvidence(t,prior),null,'an initial no-op cannot be hidden by later correct work');
  const ignored=structuredClone(m);ignored.history.push({a:'show',i:'',v:'',w:''});
  assert.ok(patterns.valid(t,ignored)&&patterns.inspect(t,ignored).correct);
  assert.equal(replaySequenceEvidence(t,ignored),null);
  const changed=structuredClone(m);changed.history[0].v='999';
  assert.equal(replaySequenceEvidence(t,changed),null);
  const issue=structuredClone(m);issue.issue='fabricated';
  assert.ok(patterns.inspect(t,issue).correct);assert.equal(replaySequenceEvidence(t,issue),null);
  const pending=structuredClone(m);pending.value='999';
  assert.ok(patterns.inspect(t,pending).correct);assert.equal(replaySequenceEvidence(t,pending),null,
   'the recorded last value must still match the current completed input');
  patterns.act(t,m,'p34-undo');
  m.value=patterns.example(t).history.at(-1).v;patterns.act(t,m,'p34-next');
  const p=replaySequenceEvidence(t,m);assert.ok(p);assert.equal(p.undos,1);assert.equal(p.advances,t.length);
 }
 const scaled=sessionTasks('linear34')[0];
 assert.deepEqual(replaySequenceEvidence(scaled,patterns.example(scaled)).displayValues,['2.5','4','5.5','7']);
 const negative=sessionTasks('linear34')[1];
 assert.deepEqual(replaySequenceEvidence(negative,patterns.example(negative)).displayValues,['3','1','-1','-3']);
});

test('eleven unknown-factor and unknown-total tasks check the requested quantity and original substitution',()=>{
 const specs=reviewed.array.filter(spec=>sessionTasks(spec.id)[spec.index].hidden);
 assert.equal(specs.length,11);
 for(const spec of specs){
  const t=sessionTasks(spec.id)[spec.index],m=arrays.example(t),p=replayArrayEvidence(t,m);
  const want=t.hidden==='a'?t.a:t.hidden==='b'?t.b*(t.unit||1):t.a*t.b*(t.unit||1);
  assert.equal(p.unknown.kind,t.hidden);assert.equal(p.unknown.value,want);
  const wrong=structuredClone(m);wrong.answer=String(want+1);assert.equal(replayArrayEvidence(t,wrong),null);
  const wrongCheck=structuredClone(m);wrongCheck.check='999=999';assert.equal(replayArrayEvidence(t,wrongCheck),null);
  const wrongEquation=structuredClone(m);wrongEquation.equation=`${t.a}×${t.b}=${t.a*t.b}`;
  assert.equal(replayArrayEvidence(t,wrongEquation),null,'an equation omitting the original unknown is insufficient');
  const reverse=structuredClone(m);reverse.check=m.check.split('=').reverse().join('=');
  assert.ok(arrays.inspect(t,reverse).correct);assert.ok(replayArrayEvidence(t,reverse),'equivalent reversed substitution remains valid');
 }
});

test('row sums, reversed equality and scaled units retain separate mathematical conditions',()=>{
 const repeated=reviewed.array.filter(spec=>sessionTasks(spec.id)[spec.index].repeated);
 assert.equal(repeated.length,3);
 for(const spec of repeated){
  const t=sessionTasks(spec.id)[spec.index],m=arrays.example(t),total=t.a*t.b;
  assert.deepEqual(replayArrayEvidence(t,m).addition,Array(t.a).fill(t.b));
  const wrong=structuredClone(m);wrong.addition=`${total}=${total}`;
  assert.equal(replayArrayEvidence(t,wrong),null,'a true equality without one addend per row is not row addition');
  m.addition=m.addition.split('=').reverse().join('=');assert.ok(replayArrayEvidence(t,m));
 }
 const reversed=sessionTasks('mulsymbols')[2],r=arrays.example(reversed);
 assert.ok(replayArrayEvidence(reversed,r)?.reversedEquation);
 r.equation=r.equation.split('=').reverse().join('=');assert.equal(replayArrayEvidence(reversed,r),null);
 for(const spec of reviewed.array.filter(spec=>sessionTasks(spec.id)[spec.index].unit!==1)){
  const t=sessionTasks(spec.id)[spec.index],m=arrays.example(t),p=replayArrayEvidence(t,m);
  assert.equal(p.total,t.a*t.b*t.unit);
  m.base=String(t.a*t.b*t.unit);assert.equal(replayArrayEvidence(t,m),null,'unit count cannot be confused with represented amount');
 }
});

test('the one estimate describes its approximate context and rejects exact-equality substitution',()=>{
 const spec={id:'tensproducts',index:3},t=sessionTasks(spec.id)[spec.index],m=arrays.example(t);
 assert.ok(replayArrayEvidence(t,m)?.approximate);
 const f=thinkingFeedback(t,m,record(m),context(spec));
 assert.equal(f.method,null);assert.match(f.observation,/每箱大约200个/);
 assert.match(f.observation,/5箱大约有 1000 个/);
 assert.match(f.detail.join(' '),/没有验证实际箱子的精确总数/);
 const exact=structuredClone(m);exact.equation=exact.equation.replace('≈','=');
 assert.equal(replayArrayEvidence(t,exact),null);assert.equal(thinkingFeedback(t,exact,record(exact),context(spec)),null);
 m.equation='1000≈200×5';assert.ok(arrays.inspect(t,m).correct);assert.ok(replayArrayEvidence(t,m));
});

test('every new array rejects ignored selector payloads, extra constructions and inconsistent prediction history',()=>{
 for(const spec of reviewed.array){
  const t=sessionTasks(spec.id)[spec.index],m=arrays.example(t);
  const forged=structuredClone(m);forged.history[0].data.index=1;
  assert.ok(arrays.valid(t,forged)&&arrays.inspect(t,forged).correct);
  assert.equal(replayArrayEvidence(t,forged),null,'an unrelated selector is not part of a genuine array action');
  const duplicate=structuredClone(m);duplicate.history.unshift(structuredClone(duplicate.history[0]));
  assert.ok(arrays.valid(t,duplicate)&&arrays.inspect(t,duplicate).correct);
  assert.equal(replayArrayEvidence(t,duplicate),null,'redundant initial construction remains visible to strict replay');
  const prediction=structuredClone(m);prediction.prediction='less';
  assert.ok(arrays.inspect(t,prediction).correct);assert.equal(replayArrayEvidence(t,prediction),null);
 }
});

test('nine new splits verify both pieces and allow every permitted cut instead of one solver path',()=>{
 const specs=reviewed.array.filter(spec=>sessionTasks(spec.id)[spec.index].split);assert.equal(specs.length,9);
 for(const spec of specs){
  const t=sessionTasks(spec.id)[spec.index];
  for(const cut of t.requiredCut===undefined?Array.from({length:t.b-1},(_,i)=>i+1):[t.requiredCut]){
   const m=arrays.initial(t);m.rows=String(t.a);m.cols=String(t.b);arrays.act(t,m,'b13-shape');
   m.cut=String(cut);arrays.act(t,m,'b13-cut');
   Object.assign(m,{equation:`${t.a}×${t.b}=${t.a*t.b}`,answer:String(t.a*t.b),left:String(t.a*cut),right:String(t.a*(t.b-cut))});
   const p=replayArrayEvidence(t,m);assert.ok(p,key(spec)+' cut '+cut);assert.equal(p.left+p.right,p.total);
   const pending=structuredClone(m);pending.cut=String(cut===1?2:1);
   assert.ok(arrays.inspect(t,pending).correct);assert.equal(replayArrayEvidence(t,pending),null,
    'a pending different cut is not the same checked construction');
   m.right=String(t.b-cut);assert.equal(replayArrayEvidence(t,m),null,'right piece keeps every row, not one row');
  }
 }
});

test('all associated uses of the two widgets stay isolated from native guides and feedback',()=>{
 const counts={sequence:0,array:0};
 for(const [id] of Object.entries(BRIDGES))for(const [index,t] of sessionTasks(id).entries()){
  for(const [family,h] of Object.entries(handlers))if(t.type===h.type){
   counts[family]++;
   const m=exampleModel(t),ctx={sessionId:id,index};
   assert.equal(h.bind(t,ctx),null);assert.equal(thinkingGuide(t,ctx),null);
   assert.equal(thinkingFeedback(t,m,record(m),ctx),null);
  }
 }
 assert.ok(counts.sequence>0&&counts.array>0);
});
