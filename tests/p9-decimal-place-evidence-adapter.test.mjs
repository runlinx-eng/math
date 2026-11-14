import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as place from '../dist/learning/phase5/b11-model.js';
import {placeBinding,replayPlaceEvidence} from '../dist/learning/place-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
// Fixed course identities, original operand units and alignment expectations
// are reviewed independently of adapter discovery and the example generator.
const cases=[
 {sessionId:'decimalsum',index:1,nodeId:'mt_JH_6RpNWjr',scale:100,values:[345,278],op:'+',align:['0','0'],total:623,display:'6.23'},
 {sessionId:'decimalsum',index:2,nodeId:'mt_JH_6RpNWjr',scale:100,values:[340,278],op:'+',align:['1','0'],total:618,display:'6.18'},
 {sessionId:'decimalsum',index:3,nodeId:'mt_JH_6RpNWjr',scale:100,values:[503,267],op:'-',align:['0','0'],total:236,display:'2.36'},
 {sessionId:'decimalsum',index:4,nodeId:'mt_JH_6RpNWjr',scale:100,values:[490,411],op:'-',align:['1','0'],total:79,display:'0.79'},
 {sessionId:'decimalmeasure3',index:1,nodeId:'mt_sA2OvTiech',scale:1000,values:[1234,567,2199],op:'+',align:['0','0','0'],total:4000,display:'4.000'},
 {sessionId:'decimalmeasure3',index:2,nodeId:'mt_sA2OvTiech',scale:1000,values:[1500,375],op:'-',align:['2','0'],total:1125,display:'1.125'},
 {sessionId:'fractionmeasure',index:1,nodeId:'mt_wB-GBDkoNr',scale:100,values:[250,75],op:'-',align:['1','0'],total:175,display:'1.75'},
 {sessionId:'fractionfour',index:13,nodeId:'mt_gNUE4B3vuk',scale:1000,values:[1345,278],op:'+',align:['0','0'],total:1623,display:'1.623'},
 {sessionId:'fractionfour',index:14,nodeId:'mt_gNUE4B3vuk',scale:1000,values:[2000,875],op:'-',align:['3','0'],total:1125,display:'1.125'}
];
const key=c=>c.sessionId+':'+c.index;
const amount=counts=>counts.reduce((sum,n,i)=>sum+n*10**i,0);
const record=value=>({support:false,attempts:[{value:structuredClone(value)}]});
const accepts=(task,model)=>{
 assert.equal(place.valid(task,model),true);assert.equal(place.inspect(task,model).correct,true);
 const proof=replayPlaceEvidence(task,model);assert.ok(proof);return proof;
};
const rejects=(task,model,label)=>assert.equal(replayPlaceEvidence(task,model),null,label);
const start=(task,guess='0')=>{
 const model=place.initial(task);model.guess=guess;model.align=task.values.map((_,i)=>String(place.rowOffset(task,i)));
 place.act(task,model,'b11-place-start');return model;
};
const finish=(task,model)=>{
 model.answer=place.fmt(place.answer(task),task.scale);
 if(task.written)for(let i=0;i<=place.lastWrittenColumn(task);i++)model.columnAnswers[i]=String(model.counts[i]);
 return model;
};

test('nine decimal tasks bind four exact nodes and preserve a separate integer scope',()=>{
 assert.equal(cases.length,9);assert.equal(new Set(cases.map(c=>c.nodeId)).size,4);
 const actual=[],integers=[];
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  const binding=placeBinding(task,{sessionId,index});
  if(binding?.scope==='decimal')actual.push(key({sessionId,index}));
  if(binding?.scope==='integer')integers.push(key({sessionId,index}));
 });
 assert.deepEqual(actual.sort(),cases.map(key).sort());assert.equal(integers.length,26);
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],binding=placeBinding(task,c);
  assert.equal(binding.nodeId,c.nodeId);assert.equal(sessionMeta(c.sessionId).topicId,c.nodeId);
  assert.equal(binding.scope,'decimal');assert.equal(binding.scale,c.scale);assert.equal(binding.method,null);
  assert.deepEqual(task.values,c.values);assert.equal(task.op,c.op);assert.equal(task.scale,c.scale);
  assert.match(thinkingGuide(task,c).question,/相同大小的单位/);
  for(const context of [null,[],false,{}, {...c,index:String(c.index)}, {...c,index:-1}, {...c,sessionId:'onesbridge'}])
   assert.equal(placeBinding(task,context),null);
  for(const changed of [{...task,scale:1},{...task,scale:c.scale===100?1000:100},
   {...task,labels:c.values.map(n=>place.fmt(n,c.scale))},{...task,prompt:task.prompt+' changed'}]){
   if(JSON.stringify(changed)===JSON.stringify(task))continue;
   assert.equal(placeBinding(changed,c),null,'complete original task, labels and scale must remain identical');
  }
 }
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>
  assert.equal(placeBinding(task,{sessionId,index}),null,'associated exercise stays independent: '+sessionId+':'+index));
});

for(const c of cases)test(`${key(c)} replays smallest units and displays the actual decimal quantities`,()=>{
 const task=sessionTasks(c.sessionId)[c.index],model=place.example(task),before=JSON.stringify(model);
 const proof=accepts(task,model);
 assert.equal(proof.scale,c.scale);assert.equal(proof.total,c.total);assert.equal(amount(model.counts),c.total);
 assert.equal(proof.display.total,c.display);assert.deepEqual(model.align,c.align);assert.deepEqual(model.history[0].align,c.align);
 assert.deepEqual(proof.display.values,task.labels??c.values.map(n=>place.fmt(n,c.scale)));
 const names=c.scale===100?['百分之一','十分之一','一','十','百']:['千分之一','百分之一','十分之一','一','十','百'];
 for(const e of proof.exchanges){
  assert.equal(amount(e.before),amount(e.after));assert.equal(e.total,amount(e.before));
  assert.equal(e.from.count*e.from.unit,e.to.count*e.to.unit);
  const targetColumn=e.index+(e.direction==='up'?1:-1);
  assert.equal(e.from.unitLabel,names[e.index]);assert.equal(e.to.unitLabel,names[targetColumn]);
  assert.equal(e.from.unit,10**e.index);assert.equal(e.to.unit,10**targetColumn);
 }
 for(const e of proof.removals){
  assert.equal(e.quantity,e.count*10**e.index);
  assert.equal(amount(e.before)-amount(e.after),e.quantity);
 }
 const saved=record(model),feedback=thinkingFeedback(task,model,saved,c);
 assert.ok(feedback);assert.equal(feedback.method,null);
 assert.ok(feedback.observation.includes(`结果 ${c.display} 相符`));
 assert.ok(feedback.observation.includes(proof.exchanges[0].from.unitLabel));
 assert.ok(feedback.observation.includes(proof.exchanges[0].to.unitLabel));
 if(task.op==='-')assert.ok(feedback.observation.includes(`拿走 ${place.fmt(c.values[1],c.scale)}`));
 else assert.ok(feedback.observation.includes(proof.display.values.join(' + ')));
 assert.ok(!feedback.observation.includes(`结果 ${c.total} 相符`),'integer smallest-unit counts cannot become displayed decimal answers');
 assert.equal(thinkingFeedback(task,model,null,c),null);
 const wrong=structuredClone(model);wrong.answer=String(c.total);
 rejects(task,wrong,'unscaled integer is not the decimal result');
 assert.equal(thinkingFeedback(task,wrong,saved,c),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:wrong}]},c),null);
 const roundTrip=JSON.parse(JSON.stringify({model,saved}));
 assert.ok(thinkingFeedback(task,roundTrip.model,roundTrip.saved,c));
 assert.equal(JSON.stringify(model),before,'derived scale/labels do not mutate v2 work');
 for(const mutate of [m=>m.history=[],m=>m.history[1].before[0]++,m=>m.history[0].align[0]='99',
  m=>m.counts[0]++,m=>m.remaining[0]++,m=>m.history[1].dir='across',m=>m.scale=c.scale,
  m=>m.history.push(structuredClone(m.history[1])),m=>m.guess='changed']){
  const altered=structuredClone(model);mutate(altered);rejects(task,altered);
 }
});

test('unknown scales and invalid displayed labels never fall back to another unit interpretation',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],model=place.example(task);
  for(const scale of [null,0,false,'100',10,10000,-100,100.5,NaN,Infinity])
   rejects({...task,scale},model,'unknown scale '+String(scale));
  for(const labels of [null,{},[],[...c.values.map(String),'0'],new Array(c.values.length),
   c.values.map(()=> '0x10'),c.values.map(()=> ''),c.values.map(()=> ' 0 '),
   c.values.map(()=> '1e0'),c.values.map(()=> '+1'),c.values.map(()=> '0.00001'),
   c.values.map(n=>place.fmt(n+1,c.scale))])
   rejects({...task,labels},model,'invalid label must not silently use fmt');
 }
});

test('short decimal labels align the final written digit by its true unit, including an integer label',()=>{
 for(const c of cases.filter(c=>c.align.some(x=>x!=='0'))){
  const task=sessionTasks(c.sessionId)[c.index],model=place.example(task);
  assert.deepEqual(model.align,c.align);assert.ok(task.labels);
  const incorrect=structuredClone(model);incorrect.align=incorrect.align.map(()=> '0');
  incorrect.history[0].align=incorrect.history[0].align.map(()=> '0');
  rejects(task,incorrect,'same last-character column is not the same mathematical unit');
 }
 const task=sessionTasks('fractionfour')[14];
 assert.deepEqual(task.labels,['2','0.875']);assert.deepEqual(place.example(task).align,['3','0']);
});

test('decimal subtraction permits taking the whole-unit column before decomposing it',()=>{
 const task=sessionTasks('decimalsum')[3],model=start(task,'-0.25');
 place.act(task,model,'b11-remove',{index:2});
 place.act(task,model,'b11-exchange',{index:2,dir:'down'});
 place.act(task,model,'b11-exchange',{index:1,dir:'down'});
 place.act(task,model,'b11-remove',{index:1});
 place.act(task,model,'b11-remove',{index:0});
 finish(task,model);const proof=accepts(task,model);
 assert.equal(proof.display.total,'2.36');assert.equal(model.first,'-0.25');
 assert.notDeepEqual(model.history,place.example(task).history);
});

test('a real tenth/hundredth alternative route and repeated thousandth carries retain their actual unit sizes',()=>{
 const task=sessionTasks('fractionmeasure')[1],model=start(task,'1.00');
 place.act(task,model,'b11-exchange',{index:2,dir:'down'});
 place.act(task,model,'b11-exchange',{index:1,dir:'down'});
 place.act(task,model,'b11-remove',{index:1});
 place.act(task,model,'b11-remove',{index:0});finish(task,model);
 const proof=accepts(task,model);assert.equal(proof.display.total,'1.75');
 assert.deepEqual(proof.exchanges.map(e=>[e.from.unitLabel,e.to.unitLabel]),[['一','十分之一'],['十分之一','百分之一']]);
 const multi=sessionTasks('decimalmeasure3')[1],m=place.example(multi),p=accepts(multi,m);
 assert.equal(p.exchanges.filter(e=>e.index===0).length,2);
 assert.equal(p.display.total,'4.000');assert.equal(p.exchanges[0].from.unitLabel,'千分之一');
});

test('failed decimal alignment and an attempted oversized take cannot be erased by later correct work',()=>{
 const task=sessionTasks('decimalmeasure3')[2],model=place.initial(task);
 model.guess='1.000';model.align=['0','0'];place.act(task,model,'b11-place-start');
 assert.equal(model.started,false);model.align=['2','0'];place.act(task,model,'b11-place-start');
 const steps=place.solveSteps(task),offset=steps.findIndex(s=>s.action==='b11-place-start');
 for(const step of steps.slice(offset+1)){
  if(step.field){const ps=step.field.split('.');let object=model;for(const k of ps.slice(0,-1))object=object[k];object[ps.at(-1)]=step.value;}
  else place.act(task,model,step.action,step.data);
 }
 assert.equal(place.inspect(task,model).correct,true);rejects(task,model);
 const t=sessionTasks('decimalsum')[3],m=start(t);place.act(t,m,'b11-remove',{index:0});
 assert.ok(m.issue);
 for(const step of place.solveSteps(t).slice(place.solveSteps(t).findIndex(s=>s.action==='b11-place-start')+1)){
  if(step.field){const ps=step.field.split('.');let object=m;for(const k of ps.slice(0,-1))object=object[k];object[ps.at(-1)]=step.value;}
  else place.act(t,m,step.action,step.data);
 }
 assert.equal(place.inspect(t,m).correct,true);rejects(t,m);
});

test('a decimal operation edit invalidates an old submitted snapshot even after the digits return',()=>{
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],model=place.example(task),saved=record(model),digits=[...model.counts];
  const i=model.counts.findIndex((n,index)=>index>0&&n>0);assert.ok(i>0);
  place.act(task,model,'b11-exchange',{index:i,dir:'down'});
  place.act(task,model,'b11-exchange',{index:i-1,dir:'up'});
  assert.deepEqual(model.counts,digits);accepts(task,model);
  assert.equal(thinkingFeedback(task,model,saved,c),null);
  assert.ok(thinkingFeedback(task,model,record(model),c));
 }
});
