import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as place from '../dist/learning/phase5/b11-model.js';
import {placeBinding,replayPlaceEvidence} from '../dist/learning/place-evidence.js';
import {placeRemovalBinding,replayPlaceRemovalEvidence} from '../dist/learning/place-removal-evidence.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';

await ensureB39Ready();
// Reviewed native identities are independent of adapter discovery and solver output.
const groups=[
 ['onesbridge',[0,1],'mt_AKAtWEwpcj'],['tensmove',[3],'mt_I5j1ZWo2cn'],
 ['decadetake',[2],'mt_HJTuIGHvcR'],['twodigitpair',[0,1],'mt_UQnAFPs83F'],
 ['flexhundred',[0,1],'mt_cChv2j_-Da'],['oneslarge',[3],'mt_oDU_8zMZjp'],
 ['tenslarge',[2,3],'mt_aHQ9kNt3is'],['showwhy',[0,2],'mt_zxST3MarI9'],
 ['fourparts',[2],'mt_TiQbi027PE'],['buildthousand',[0,1,2],'mt_ewmuMMPAzP'],
 ['columnthree',[1,3],'mt_SrrsLiJkr3'],['flexthousand',[2,4],'mt_HFRYjTb-Z5'],
 ['columnfour',[1,3],'mt_mpS-JK_p_m'],['columnlarge',[1,3,4],'mt_Yw1_4Nfsql']
];
const cases=groups.flatMap(([sessionId,indices,nodeId])=>indices.map(index=>({sessionId,index,nodeId})));
const record=value=>({support:false,attempts:[{value:structuredClone(value)}]});
const originalAccepts=(task,model,label='original rules still apply')=>{
 assert.equal(place.valid(task,model),true,label);assert.equal(place.inspect(task,model).correct,true,label);
};
const accepts=(task,model)=>{originalAccepts(task,model);const proof=replayPlaceEvidence(task,model);assert.ok(proof);return proof;};
const rejects=(task,model,label)=>assert.equal(replayPlaceEvidence(task,model),null,label);
const actualAnswer=task=>task.op==='+'?task.values.reduce((sum,n)=>sum+n,0):task.values[0]-task.values[1];
const amount=counts=>counts.reduce((sum,n,i)=>sum+n*10**i,0);
const start=(task,guess='0')=>{
 const model=place.initial(task);model.guess=guess;model.align=task.values.map(()=> '0');
 place.act(task,model,'b11-place-start');return model;
};
const finish=(task,model)=>{
 model.answer=String(actualAnswer(task));
 if(task.written)for(let i=0;i<=place.lastWrittenColumn(task);i++)model.columnAnswers[i]=String(model.counts[i]);
 return model;
};
const remainingSteps=(task,model)=>{
 const steps=place.solveSteps(task),startIndex=steps.findIndex(step=>step.action==='b11-place-start');
 for(const step of steps.slice(startIndex+1)){
  if(step.field){const parts=step.field.split('.');let item=model;for(const key of parts.slice(0,-1))item=item[key];item[parts.at(-1)]=step.value;place.field(task,model,step.field);}
  else place.act(task,model,step.action,step.data);
 }
 return model;
};

test('twenty-six integer exchange tasks bind exactly fourteen original nodes without borrowing a thinking label',()=>{
 assert.equal(cases.length,26);assert.equal(new Set(cases.map(c=>c.nodeId)).size,14);
 for(const c of cases){
  const task=sessionTasks(c.sessionId)[c.index],binding=placeBinding(task,c);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(sessionMeta(c.sessionId).topicId,c.nodeId);
  assert.equal(binding.method,null);assert.equal(binding.scope,'integer');assert.equal(binding.scale,1);
  assert.ok(thinkingGuide(task,c)?.question.length>10);
  assert.equal(task.scale??1,1);
  for(const changed of [null,[],false,'onesbridge',{}, {...c,index:String(c.index)},{...c,index:-1},{...c,sessionId:'__proto__'}])
   assert.equal(placeBinding(task,changed),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,values:task.values.map(n=>n+1)},
   {...task,op:task.op==='+'?'-':'+'},{...task,scale:10},{...task,written:!task.written}])
   assert.equal(placeBinding(changed,c),null,'binding includes the complete actual task definition');
 }
 const actual=[];
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  if(placeBinding(task,{sessionId,index})?.scope==='integer')actual.push(sessionId+':'+index);
 });
 assert.deepEqual(actual.sort(),cases.map(c=>c.sessionId+':'+c.index).sort());
 for(const sessionId of Object.keys(BRIDGES))sessionTasks(sessionId).forEach((task,index)=>{
  assert.equal(placeBinding(task,{sessionId,index}),null,sessionId+':'+index+' is an independent associated exercise');
 });
});

for(const context of cases)test(`${context.sessionId}:${context.index} validates actual exchanges, arithmetic and the latest submitted work`,()=>{
 const task=sessionTasks(context.sessionId)[context.index],model=place.example(task),before=JSON.stringify(model);
 const proof=accepts(task,model);
 assert.equal(Object.hasOwn(model,'board'),false,'the actual v2 top-level workpiece needs no fictional board');
 assert.ok(model.history.some(event=>event.action==='b11-exchange'));
 assert.equal(amount(model.counts),actualAnswer(task));assert.ok(model.remaining.every(n=>n===0));
 assert.ok(model.counts.every(n=>n>=0&&n<10));
 assert.equal(proof.operation,task.op);assert.deepEqual(proof.values,task.values);
 assert.equal(proof.total,actualAnswer(task));assert.deepEqual(proof.counts,model.counts);
 assert.deepEqual(proof.remaining,model.remaining);
 assert.equal(proof.up,model.history.filter(e=>e.action==='b11-exchange'&&e.dir==='up').length);
 assert.equal(proof.down,model.history.filter(e=>e.action==='b11-exchange'&&e.dir==='down').length);
 assert.equal(proof.removed,task.op==='-'?task.values[1]:0);
 for(const exchange of proof.exchanges){
  assert.equal(amount(exchange.before),amount(exchange.after));
  assert.equal(exchange.total,amount(exchange.before));
  assert.equal(exchange.from.count*exchange.from.unit,exchange.to.count*exchange.to.unit);
  assert.equal(exchange.from.count,exchange.direction==='up'?10:1);
  assert.equal(exchange.to.count,exchange.direction==='up'?1:10);
 }
 for(const removal of proof.removals){
  assert.equal(removal.quantity,removal.count*10**removal.index);
  assert.equal(amount(removal.before)-amount(removal.after),removal.quantity);
 }
 const saved=record(model),feedback=thinkingFeedback(task,model,saved,context);
 assert.ok(feedback);assert.equal(feedback.method,null);
 assert.match(feedback.observation,new RegExp(String(actualAnswer(task))));
 assert.match(feedback.detail.join(' '),/解释|证明|掌握/);
 assert.equal(thinkingFeedback(task,model,null,context),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[]},context),null);
 assert.equal(thinkingFeedback(task,model,saved,{}),null);
 const edited=structuredClone(model);edited.answer='999999';
 assert.equal(thinkingFeedback(task,edited,saved,context),null);
 assert.equal(thinkingFeedback(task,edited,record(edited),context),null);
 assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:edited}]},context),null);
 const absent=structuredClone(model);absent.history=[];rejects(task,absent);
 assert.equal(thinkingFeedback(task,absent,record(absent),context),null);
 const restored=JSON.parse(JSON.stringify({model,saved}));
 assert.ok(thinkingFeedback(task,restored.model,restored.saved,context));
 assert.equal(JSON.stringify(model),before,'replay and derived feedback never rewrite the saved work');
});

test('wrong but valid initial predictions remain evidence, preserving the exact first prediction string',()=>{
 for(const guess of ['0','+0.0',' 1 ']){
  const task=sessionTasks('onesbridge')[0],model=remainingSteps(task,start(task,guess));
  accepts(task,model);assert.equal(model.first,guess);assert.equal(model.history[0].guess,guess);
 }
});

test('a real down/up detour conserves value and requires a fresh submission even after returning to the same digits',()=>{
 for(const context of cases){
  const task=sessionTasks(context.sessionId)[context.index],model=place.example(task),saved=record(model);
  const original=[...model.counts],column=model.counts.findIndex((n,i)=>i>0&&n>0),value=amount(original);
  assert.ok(column>0,'each reviewed final answer has a decomposable non-unit place');
  place.act(task,model,'b11-exchange',{index:column,dir:'down'});
  assert.equal(amount(model.counts),value);assert.equal(model.counts[column-1],original[column-1]+10);
  place.act(task,model,'b11-exchange',{index:column-1,dir:'up'});
  assert.deepEqual(model.counts,original);accepts(task,model);
  assert.equal(thinkingFeedback(task,model,saved,context),null,'new actual operations invalidate the old submission');
  assert.ok(thinkingFeedback(task,model,record(model),context));
 }
});

test('taking a high place before borrowing is a valid independent subtraction order',()=>{
 const task=sessionTasks('buildthousand')[1],model=start(task,'250');
 assert.deepEqual(task.values,[402,137]);
 // 402 -> 302 -> 2 hundreds, 10 tens, 2 ones -> 2 hundreds, 9 tens, 12 ones.
 place.act(task,model,'b11-remove',{index:2});assert.deepEqual(model.counts,[2,0,3,0]);
 place.act(task,model,'b11-exchange',{index:2,dir:'down'});assert.deepEqual(model.counts,[2,10,2,0]);
 place.act(task,model,'b11-exchange',{index:1,dir:'down'});assert.deepEqual(model.counts,[12,9,2,0]);
 place.act(task,model,'b11-remove',{index:1});assert.deepEqual(model.counts,[12,6,2,0]);
 place.act(task,model,'b11-remove',{index:0});assert.deepEqual(model.counts,[5,6,2,0]);
 finish(task,model);accepts(task,model);assert.equal(model.answer,'265');
 assert.notDeepEqual(model.history,place.example(task).history,'replay cannot demand the solver ordering');
});

test('a multi-addend column may require the same effective exchange twice with successive before states',()=>{
 const task=sessionTasks('columnlarge')[4],model=place.example(task);accepts(task,model);
 assert.deepEqual(task.values,[36489,27858,15937]);
 const up=model.history.filter(event=>event.action==='b11-exchange'&&event.index===0);
 assert.equal(up.length,2);assert.equal(up[0].before[0],24);assert.equal(up[1].before[0],14);
 const repeated=structuredClone(model);repeated.history.splice(2,0,structuredClone(repeated.history[1]));
 originalAccepts(task,repeated);rejects(task,repeated,'a duplicate old before state is not a second effective exchange');
});

test('failed alignment or insufficient removal cannot be hidden by a later correct original result',()=>{
 const alignTask=sessionTasks('onesbridge')[0],alignModel=place.initial(alignTask);
 alignModel.guess='40';alignModel.align=['1','0'];place.act(alignTask,alignModel,'b11-place-start');
 assert.equal(alignModel.started,false);alignModel.align=['0','0'];place.act(alignTask,alignModel,'b11-place-start');
 remainingSteps(alignTask,alignModel);originalAccepts(alignTask,alignModel);rejects(alignTask,alignModel);
 const task=sessionTasks('onesbridge')[1],model=start(task);
 place.act(task,model,'b11-remove',{index:0});assert.ok(model.issue);
 remainingSteps(task,model);originalAccepts(task,model);rejects(task,model,'an earlier failed take remains in history');
});

test('ineffective exchanges and zero-needed removals remain outside the strict contract',()=>{
 const task=sessionTasks('onesbridge')[0];
 for(const data of [{index:0,dir:'up'},{index:2,dir:'down'},{index:0,dir:'down'},
  {index:2,dir:'up'},{index:1,dir:'sideways'}]){
  const model=place.example(task);place.act(task,model,'b11-exchange',data);
  model.issue='';originalAccepts(task,model);rejects(task,model,JSON.stringify(data));
 }
 const subtract=sessionTasks('onesbridge')[1],model=place.example(subtract);
 place.act(subtract,model,'b11-remove',{index:0});originalAccepts(subtract,model);
 assert.equal(model.history.at(-1).needed,0);rejects(subtract,model,'taking zero has no mathematical effect');
});

test('malformed, missing, reordered or altered event details cannot certify correct-looking digits',()=>{
 for(const context of cases){
  const task=sessionTasks(context.sessionId)[context.index],base=place.example(task);
  const exchange=base.history.findIndex(event=>event.action==='b11-exchange');
  const mutations=[
   ['missing start',m=>m.history.shift()],['missing exchange',m=>m.history.splice(exchange,1)],
   ['reverse events',m=>m.history.reverse()],['duplicate start',m=>m.history.splice(1,0,structuredClone(m.history[0]))],
   ['unknown action',m=>m.history[exchange].action='teleport'],['unknown direction',m=>m.history[exchange].dir='across'],
   ['extra event key',m=>m.history[exchange].extra=true],['missing before',m=>delete m.history[exchange].before],
   ['wrong before',m=>m.history[exchange].before[0]++],['wrong before type',m=>m.history[exchange].before[0]='1'],
   ['negative column',m=>m.history[exchange].index=-1],['fractional column',m=>m.history[exchange].index=0.5],
   ['string column',m=>m.history[exchange].index=String(m.history[exchange].index)],
   ['out of range column',m=>m.history[exchange].index=m.counts.length],
   ['changed first prediction',m=>m.first='999'],['changed current prediction',m=>m.guess='999'],
   ['changed historical prediction',m=>m.history[0].guess='999'],['nonnumeric prediction',m=>m.history[0].guess='0x10'],
   ['wrong current alignment',m=>m.align[0]='1'],['wrong historical alignment',m=>m.history[0].align[0]='1'],
   ['alignment number',m=>m.history[0].align[0]=0],['extra start key',m=>m.history[0].before=[]],
   ['wrong units count',m=>m.counts[0]++],['remaining take',m=>m.remaining[0]=1],
   ['active issue',m=>m.issue='invalid'],['unstarted current work',m=>m.started=false],
   ['invented board',m=>m.board={counts:m.counts}],['extra model field',m=>m.extra=true]
  ];
  for(const [label,mutate] of mutations){const model=structuredClone(base);mutate(model);rejects(task,model,context.sessionId+':'+context.index+' '+label);}
  for(const malformed of [null,{},[],{...base,history:null},{...base,counts:null},{...base,remaining:null},{...base,first:null}])rejects(task,malformed);
 }
});

test('each removal must use the exact current outstanding number of that unit',()=>{
 const task=sessionTasks('buildthousand')[1],base=place.example(task),index=base.history.findIndex(e=>e.action==='b11-remove');
 for(const mutate of [m=>m.history[index].needed++,m=>m.history[index].needed=0,
  m=>m.history[index].needed=String(m.history[index].needed),m=>delete m.history[index].needed,
  m=>m.history[index].before[0]++,m=>m.history[index].dir='down']){
  const model=structuredClone(base);mutate(model);originalAccepts(task,model);rejects(task,model);
 }
 const addition=sessionTasks('onesbridge')[0],model=place.example(addition);
 model.history.push({action:'b11-remove',index:0,before:[...model.counts],needed:0});
 originalAccepts(addition,model);rejects(addition,model,'an addition task has no take-away operation');
});

test('the same total cannot justify forged per-place counts, and written columns remain checked',()=>{
 const task=sessionTasks('showwhy')[2],base=place.example(task),model=structuredClone(base);
 model.counts[1]--;model.counts[0]+=10;
 assert.equal(amount(model.counts),amount(base.counts));assert.equal(place.valid(task,model),true);
 rejects(task,model,'unrecorded exchange preserves total but not the exact workpiece');
 for(const mutate of [m=>m.columnAnswers[0]='9',m=>m.columnAnswers[0]='',m=>m.columnAnswers.pop(),
  m=>m.columnAnswers.push('0'),m=>m.columnAnswers[0]=1,m=>delete m.columnAnswers]){
  const changed=structuredClone(base);mutate(changed);rejects(task,changed,'each originally required written digit must still match');
 }
 const zero=structuredClone(base);zero.columnAnswers[zero.columnAnswers.length-1]='0';accepts(task,zero);
});

test('no-exchange tasks never inherit exchange scope; six actual removals have their own reviewed contract',()=>{
 const reviewed=new Set(cases.map(c=>c.sessionId+':'+c.index));let ordinary=0,decimal=0,removal=0,addition=0;
 for(const sessionId of Object.keys(LESSONS))sessionTasks(sessionId).forEach((task,index)=>{
  if(task.type!=='x-placecalc'||reviewed.has(sessionId+':'+index))return;
  const model=place.example(task),context={sessionId,index};originalAccepts(task,model);
  if((task.scale??1)===1){
   ordinary++;assert.equal(placeBinding(task,context),null);assert.equal(replayPlaceEvidence(task,model),null);
   if(placeRemovalBinding(task,context)){
    removal++;assert.equal(task.op,'-');assert.ok(replayPlaceRemovalEvidence(task,model));
    assert.ok(thinkingGuide(task,context));assert.ok(thinkingFeedback(task,model,record(model),context));
   }else{
    addition++;assert.equal(task.op,'+');assert.equal(thinkingGuide(task,context),null);
    assert.equal(thinkingFeedback(task,model,record(model),context),null);
   }
  }else{
   decimal++;assert.equal(placeBinding(task,context)?.scope,'decimal');
   assert.notEqual(placeBinding(task,context)?.scale,1);
  }
 });
 assert.equal(ordinary,13);assert.equal(decimal,9);assert.equal(removal,6);assert.equal(addition,7);
});
