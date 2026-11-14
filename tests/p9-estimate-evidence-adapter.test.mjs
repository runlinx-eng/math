import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as estimates from '../dist/learning/phase5/b11-model.js';
import {estimateBinding,replayEstimateEvidence} from '../dist/learning/estimate-evidence.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import fixture from './fixtures/p9-estimate-cases.cjs';

await ensureB39Ready();
const {cases,associatedCases}=fixture;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const hash=task=>createHash('sha256').update(JSON.stringify(stable(task))).digest('hex');
const taskAt=(id,index=0)=>sessionTasks(id)[index];
const display=(n,t)=>estimates.fmt(n,t.scale??1);
const accepted=(task,model)=>{
 assert.equal(estimates.valid(task,model),true);assert.equal(estimates.inspect(task,model).correct,true);
 const proof=replayEstimateEvidence(task,model);assert.ok(proof);return proof;
};
const rejected=(task,model,label)=>assert.equal(replayEstimateEvidence(task,model),null,label);
const fillEstimate=(task,model,path)=>Object.assign(model,{unit:String(path.unit),roundedA:display(path.rounded[0],task),
 roundedB:display(path.rounded[1],task),estimate:display(path.estimate,task)});
const fillFinal=(task,model,path,swap=false)=>Object.assign(model,{answer:display(path.answer,task),inverseStart:display(path.answer,task),
 inverseOp:task.op==='+'?'-':'+',inversePart:display(swap?task.a:task.b,task),inverseResult:display(swap?task.b:task.a,task),
 judgment:path.claim?.judgment??''});
const build=(task,path,swap=false)=>{
 const model=estimates.initial(task);fillEstimate(task,model,path);estimates.act(task,model,'b11-estimate');
 fillFinal(task,model,path,swap);return model;
};
const sample=(id='columnthree',index=0)=>{
 const spec=cases.find(c=>c.id===id&&c.index===index),task=taskAt(id,index);return {spec,task,model:build(task,spec.paths[0])};
};
const rewriteSelection=(model,key,value)=>{
 model[key]=value;model.history[0][key]=value;model.first[key]=value;model.locked[key]=value;return model;
};

test('24 exact native positions span 13 reviewed sources, with all six associated tasks isolated',()=>{
 assert.equal(cases.length,24);assert.equal(new Set(cases.map(c=>c.nodeId)).size,13);
 assert.equal(cases.reduce((n,c)=>n+c.paths.length,0),41);
 assert.equal(cases.reduce((n,c)=>n+c.paths.length*(taskAt(c.id,c.index).op==='+'?2:1),0),65);
 for(const c of cases){
  const task=taskAt(c.id,c.index),binding=estimateBinding(task,c);
  assert.equal(task.type,'x-estimatecheck');assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(hash(task),c.taskHash,'complete source task was independently reviewed');
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question.length>15);
  assert.equal(estimateBinding(structuredClone(task),c)?.nodeId,c.nodeId);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},
   {...c,index:10000},{...c,sessionId:'__proto__'},{...c,sessionId:'constructor'}])assert.equal(estimateBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,a:task.a+1},{...task,b:task.b+1},
   {...task,op:task.op==='+'?'-':'+'},{...task,scale:10},{...task,units:[...task.units,123]},
   {...task,claimed:999},{...task,accuracy:1}])assert.equal(estimateBinding(changed,c),null);
 }
 const found=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(estimateBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 const associated=[];
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(estimateBinding(task,{sessionId:id,index}),null);
  if(task.type==='x-estimatecheck')associated.push(id+':'+index);
 });
 assert.deepEqual(associated.sort(),associatedCases.map(c=>c.id+':'+c.index).sort());assert.equal(associated.length,6);
 for(const c of associatedCases)assert.equal(hash(taskAt(c.id,c.index)),c.taskHash);
});

for(const c of cases)test(`${c.id}:${c.index} replays every legal rounding unit and inverse equation`,()=>{
 const task=taskAt(c.id,c.index);
 for(const path of c.paths)for(const swap of task.op==='+'?[false,true]:[false]){
  const model=build(task,path,swap),before=JSON.stringify(model),proof=accepted(task,model);
  assert.equal(proof.operation,task.op);assert.equal(proof.scale,task.scale??1);assert.deepEqual(proof.values,[task.a,task.b]);
  assert.equal(proof.unit,path.unit);assert.deepEqual(proof.rounded,path.rounded);
  assert.equal(proof.estimate,path.estimate);assert.equal(proof.answer,path.answer);assert.equal(proof.estimateEventCount,1);
  assert.deepEqual(proof.bounds,{lowTwice:path.lowTwice,highTwice:path.highTwice,denominator:2,
   lowerInclusive:path.lowerInclusive,upperInclusive:false,systemDerived:true});
  assert.deepEqual(proof.inverse,{start:path.answer,operation:task.op==='+'?'-':'+',part:swap?task.a:task.b,
   result:swap?task.b:task.a,submissionOnly:true});
  assert.deepEqual(proof.claim,path.claim);
  assert.deepEqual(proof.accuracy,task.accuracy===undefined?null:{limit:task.accuracy,selectedUnit:path.unit,withinLimit:true});
  assert.deepEqual(proof.display.values,[display(task.a,task),display(task.b,task)]);
  assert.deepEqual(proof.display.rounded,path.rounded.map(n=>display(n,task)));
  assert.equal(proof.display.unit,display(path.unit,task));assert.equal(proof.display.estimate,display(path.estimate,task));
  assert.equal(proof.display.answer,display(path.answer,task));
  assert.equal(proof.display.low,display(path.lowTwice/2,task));assert.equal(proof.display.high,display(path.highTwice/2,task));
  assert.equal(proof.display.claim,path.claim===null?null:display(path.claim.value,task));
  assert.equal(proof.display.inverse,`${display(path.answer,task)} ${task.op==='+'?'−':'+'} ${display(swap?task.a:task.b,task)} = ${display(swap?task.b:task.a,task)}`);
  assert.equal(model.history.length,1,'inverse and judgment do not invent additional actions');
  assert.equal(JSON.stringify(model),before,'proof lookup never changes the saved work');
  const record={attempts:[{value:structuredClone(model)}]};assert.ok(latestSubmissionMatches(model,record));
  const edit=structuredClone(model);edit.answer+='0';assert.equal(latestSubmissionMatches(edit,record),false);
  assert.equal(latestSubmissionMatches(model,{attempts:[...record.attempts,{value:edit}]}),false);
 }
});

test('a plausible claim is independent of exact correctness: 800 is not 412 + 389',()=>{
 const {task,model}=sample('checkrough',2),proof=accepted(task,model);
 assert.equal(proof.estimate,800);assert.equal(proof.answer,801);
 assert.deepEqual(proof.claim,{value:800,judgment:'plausible',plausible:true,exactCorrect:false});
 assert.equal(proof.display.low,'790');assert.equal(proof.display.high,'810');
 model.answer='800';rejected(task,model,'being inside the estimation interval does not establish the exact answer');
 model.answer='801';model.judgment='impossible';rejected(task,model,'a wrong exact claim can still be plausible');
});

test('submitted inverse fields are checked as equations, without claiming a separately observed calculation',()=>{
 for(const c of cases){
  const task=taskAt(c.id,c.index),model=build(task,c.paths[0]);
  for(const [key,value] of [['answer','0'],['inverseStart','0'],['inverseOp',task.op],['inversePart','0'],['inverseResult','0']]){
   const bad=structuredClone(model);bad[key]=value;rejected(task,bad,key+' is mathematically required');
  }
  const proof=accepted(task,model);assert.equal(proof.inverse.submissionOnly,true);assert.equal(proof.bounds.systemDerived,true);
 }
});

test('no missing, repeated, foreign or extra estimate event can certify an otherwise correct final answer',()=>{
 const {task,model}=sample();
 for(const mutate of [m=>m.history=[],m=>m.history.push(structuredClone(m.history[0])),m=>m.history[0].action='b11-hop',
  m=>m.history[0].extra='unobserved',m=>m.history[0].from=347,m=>delete m.history[0].roundedB,
  m=>m.history.push({action:'b11-estimate',unit:'100',roundedA:'300',roundedB:'200',estimate:'500'})]){
  const bad=structuredClone(model);mutate(bad);assert.equal(estimates.inspect(task,bad).correct,true);
  rejected(task,bad,'unverified history is not repaired by a correct final answer');
 }
 for(const history of [null,{},[null],[[]],['b11-estimate'],Array(10001).fill(model.history[0])]){
  const bad=structuredClone(model);bad.history=history;rejected(task,bad);
 }
});

test('first, locked and hidden current rounding fields must equal the single real event exactly',()=>{
 const {task,model}=sample();
 for(const container of ['first','locked'])for(const key of ['unit','roundedA','roundedB','estimate']){
  const bad=structuredClone(model);bad[container][key]+='0';rejected(task,bad,container+'.'+key);
 }
 for(const key of ['unit','roundedA','roundedB','estimate']){
  const bad=structuredClone(model);bad[key]+='0';assert.equal(estimates.inspect(task,bad).correct,true);
  rejected(task,bad,'hidden current '+key+' cannot contradict the retained event');
 }
 for(const mutate of [m=>m.extra=true,m=>m.first.extra='1',m=>m.locked.extra='1',m=>m.first=null,m=>m.locked=null,
  m=>m.judgment='plausible',m=>m.issue='old invalid operation']){
  const bad=structuredClone(model);mutate(bad);rejected(task,bad);
 }
 const legalOther=build(task,cases[0].paths[1]),wrong=structuredClone(model);
 wrong.locked=structuredClone(legalOther.locked);assert.equal(estimates.inspect(task,wrong).correct,true);
 rejected(task,wrong,'another mathematically valid rounding unit still needs its own actual event');
});

test('a real wrong rounding attempt followed by correction preserves original completion but cannot become strict history',()=>{
 for(const c of cases){
  const task=taskAt(c.id,c.index),path=c.paths[0],model=estimates.initial(task);
  fillEstimate(task,model,path);model.roundedA=display(path.rounded[0]+1,task);estimates.act(task,model,'b11-estimate');
  assert.ok(model.issue);assert.equal(model.locked,null);assert.equal(model.history.length,1);
  fillEstimate(task,model,path);estimates.act(task,model,'b11-estimate');fillFinal(task,model,path);
  assert.equal(model.history.length,2);assert.equal(estimates.valid(task,model),true);assert.equal(estimates.inspect(task,model).correct,true);
  rejected(task,model,'correction retains the invalid earlier event');
  rejected(task,JSON.parse(JSON.stringify(model)),'serialization cannot erase an invalid earlier event');
 }
});

test('the accuracy requirement is applied to the selected configured unit, including failed coarse attempts',()=>{
 const {task,spec}=sample('checkpurpose',1),fine=build(task,spec.paths[0]);
 assert.deepEqual(accepted(task,fine).accuracy,{limit:100,selectedUnit:100,withinLimit:true});
 const coarse=estimates.initial(task);
 fillEstimate(task,coarse,{unit:1000,rounded:[48000,23000],estimate:71000});estimates.act(task,coarse,'b11-estimate');
 assert.ok(coarse.issue);assert.equal(coarse.locked,null);
 fillEstimate(task,coarse,spec.paths[0]);estimates.act(task,coarse,'b11-estimate');fillFinal(task,coarse,spec.paths[0]);
 assert.equal(estimates.inspect(task,coarse).correct,true);rejected(task,coarse);
 for(const spelling of ['1e2','0x64','100.0','+100',' 100 ']){
  const aliased=structuredClone(fine);rewriteSelection(aliased,'unit',spelling);
  assert.equal(estimates.inspect(task,aliased).correct,true);rejected(task,aliased,'a select never supplied '+spelling);
 }
});

test('addition has a closed lower and open upper bound; subtraction has two open bounds',()=>{
 for(const [op,a,b,claims] of [['+',12,8,[[9,false],[10,true],[29,true],[30,false]]],['-',23,8,[[0,false],[1,true],[19,true],[20,false]]]]){
  for(const [claimed,plausible] of claims){
   const task={type:'x-estimatecheck',a,b,op,units:[10],prompt:'Endpoint probe',claimed},proof=accepted(task,estimates.example(task));
   assert.equal(proof.claim.plausible,plausible);assert.equal(proof.bounds.lowerInclusive,op==='+');
   assert.equal(proof.bounds.upperInclusive,false);
   assert.equal(proof.bounds.lowTwice,op==='+'?20:0);assert.equal(proof.bounds.highTwice,op==='+'?60:40);
  }
 }
});

test('rounding around zero is clipped at zero and half-unit bounds use exact doubled integers',()=>{
 const samples=[
  [{a:2,b:1,op:'+',units:[10],claimed:0},[0,20,'0','10',true]],
  [{a:2,b:1,op:'-',units:[10],claimed:-5},[-10,10,'-5','5',false]],
  [{a:0,b:4,op:'+',units:[3],claimed:2},[3,12,'1.5','6',true]],
  [{a:4,b:0,op:'-',units:[3],claimed:4},[0,9,'0','4.5',true]],
  [{a:4,b:0,op:'-',units:[3],scale:1000,claimed:4},[0,9,'0.000','0.0045',true]]
 ];
 for(const [config,wanted] of samples){
  const task={type:'x-estimatecheck',prompt:'Exact boundary probe',...config},proof=accepted(task,estimates.example(task));
  assert.deepEqual([proof.bounds.lowTwice,proof.bounds.highTwice,proof.display.low,proof.display.high,proof.claim.plausible],wanted);
 }
});

test('ties round upwards in smallest units and maximum accepted operands do not lose precision',()=>{
 for(const [a,b,u,rounded] of [[15,5,10,[20,10]],[1,1,2,[2,2]],[999999999,1,1,[999999999,1]]]){
  const task={type:'x-estimatecheck',a,b,op:'+',units:[u],prompt:'Exact tie and limit probe'},proof=accepted(task,estimates.example(task));
  assert.deepEqual(proof.rounded,rounded);assert.equal(proof.answer,a+b);
 }
 const task={type:'x-estimatecheck',a:1000000000,b:1,op:'+',units:[1],prompt:'Input limit probe'};
 rejected(task,estimates.example(task),'an answer outside the original input range is not rounded or silently truncated');
});

test('equivalent decimal spellings are accepted exactly while fractional residues and mixed-number syntax are rejected',()=>{
 for(const [id,index] of [['columnthree',0],['decimalsum',0],['decimalmeasure3',0],['fractionfour',12]]){
  const {task,model}=sample(id,index),original=accepted(task,model);
  for(const key of ['roundedA','roundedB','estimate']){
   const varied=structuredClone(model),value=' ＋'+model[key]+(model[key].includes('.')?'00':'.0000')+' ';
   rewriteSelection(varied,key,value);assert.deepEqual(accepted(task,varied),original);
  }
  for(const key of ['answer','inverseStart','inversePart','inverseResult']){
   const varied=structuredClone(model);varied[key]=' +'+model[key]+(model[key].includes('.')?'00':'.0000')+' ';
   assert.deepEqual(accepted(task,varied),original);
  }
 }
 const {task,model}=sample('decimalsum');
 for(const value of ['3.000001','3.0000001','3e0','-0 3/1','3/1','3,00','NaN','Infinity','',null,3]){
  const bad=structuredClone(model);rewriteSelection(bad,'roundedA',value);rejected(task,bad,String(value));
 }
 for(const key of ['answer','inverseStart','inversePart','inverseResult']){
  const bad=structuredClone(model);bad[key]+='001';rejected(task,bad,'nonzero residue in '+key);
 }
});

test('unknown task shapes, unsupported scales and numeric metadata fail closed without changing original models',()=>{
 const {task,model}=sample(),before=JSON.stringify(model);
 const invalid=[null,{},[],{...task,type:'x-routecalc'},{...task,unknown:true},{...task,a:-1},{...task,b:NaN},
  {...task,a:1000000001},{...task,b:1.5},{...task,op:'*'},{...task,scale:0},{...task,scale:3},
  {...task,units:[]},{...task,units:[10,10]},{...task,units:[0]},{...task,units:['10']},
  {...task,accuracy:0},{...task,claimed:NaN},{...task,claimed:'532'},{...task,prompt:null}];
 for(const changed of invalid)rejected(changed,model);
 for(const bad of [null,{},[],{...model,history:new Set(model.history)},{...model,locked:[]},{...model,first:[]}])rejected(task,bad);
 const cyclic=structuredClone(model);cyclic.first.self=cyclic;rejected(task,cyclic);
 assert.equal(JSON.stringify(model),before);
});

test('feedback attributes one estimate to the learner, bounds to the system and inverse only to submitted fields',()=>{
 for(const c of cases)for(const path of c.paths)for(const swap of taskAt(c.id,c.index).op==='+'?[false,true]:[false]){
  const task=taskAt(c.id,c.index),model=build(task,path,swap),before=JSON.stringify(model);
  const record={support:false,attempts:[{value:structuredClone(model)}]};
  assert.equal(thinkingFeedback(task,model,{attempts:[]},c),null);
  const feedback=thinkingFeedback(task,model,record,c),proof=accepted(task,model);
  assert.ok(feedback);assert.equal(feedback.method,null);
  assert.match(feedback.observation,/实际留下估计/);
  const detail=feedback.detail.join(' ');
  assert.ok(detail.includes(proof.display.inverse));assert.match(detail,/提交的逆运算等式/);
  assert.match(detail,/没有记录一个独立的逆运算操作过程/);assert.match(detail,/系统依据.*推得范围/);
  assert.ok(detail.includes((proof.bounds.lowerInclusive?'不小于':'大于')+' '+proof.display.low));
  assert.ok(detail.includes('小于 '+proof.display.high));
  assert.match(detail,/没有自动评价自由解释.*长期掌握/);
  assert.equal(JSON.stringify(model),before);
  const edited=structuredClone(model);edited.inverseStart=display(c.paths[0].answer+1,task);
  assert.equal(thinkingFeedback(task,edited,record,c),null);
 }
});

test('plausible feedback explicitly distinguishes an estimate of 800 from the exact answer 801',()=>{
 const {spec,task,model}=sample('checkrough',2),record={support:false,attempts:[{value:structuredClone(model)}]};
 const feedback=thinkingFeedback(task,model,record,spec),words=feedback.detail.join(' ');
 assert.match(words,/800 落在.*估计范围/);assert.match(words,/800 不等于.*801/);
 assert.match(words,/可能并不代表精确正确/);
 const guide=thinkingGuide(task,spec);assert.ok(guide);assert.doesNotMatch(guide.question,/800|801/);
});
