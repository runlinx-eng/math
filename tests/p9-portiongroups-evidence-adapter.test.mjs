import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b16-model.js';
import * as V from '../dist/learning/phase5/b16-view.js';
import {portionGroupsBinding,replayPortionGroupsEvidence} from '../dist/learning/portiongroups-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-portiongroups-cases.cjs';

await ensureB39Ready();
const {cases,associatedCases}=fixture;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(value).digest('hex');
const hash=task=>digest(JSON.stringify(stable(task)));
const taskAt=(id,index=0)=>sessionTasks(id)[index];
const act=(task,model,action,index)=>M.act(task,model,'b16-'+action,index===undefined?{}:{index});
const fill=(task,model)=>{
 model.per=String(task.total/task.d);model.answer=String(task.total*task.n/task.d);
 if(task.name){model.num=String(task.n);model.den=String(task.d);}
 if(task.equation)model.equation=task.equation[0];return model;
};
const distribute=(task,model,reverse=false)=>{
 const order=Array.from({length:task.d},(_,i)=>i);if(reverse)order.reverse();
 for(const group of order){
  act(task,model,'group',group);
  const tokens=Array.from({length:task.total},(_,i)=>i).filter(i=>i%task.d===group);if(reverse)tokens.reverse();
  for(const token of tokens)act(task,model,'token',token);
 }
 return model;
};
const build=(task,{reverse=false,early=false}={})=>{
 const model=M.initial(task),selected=Array.from({length:task.n},(_,i)=>reverse?task.d-i-1:i);
 if(early)for(const group of selected)act(task,model,'take',group);
 distribute(task,model,reverse);if(!early)for(const group of selected)act(task,model,'take',group);
 return fill(task,model);
};
const sample=(id='halfpaper',index=0)=>{const task=taskAt(id,index);return {task,model:build(task)};};
const accepted=(task,model)=>{
 assert.equal(M.valid(task,model),true);assert.equal(M.inspect(task,model).correct,true);
 const before=JSON.stringify(model),proof=replayPortionGroupsEvidence(task,model);assert.ok(proof);
 assert.equal(JSON.stringify(model),before,'evidence lookup preserves every original value');return proof;
};
const rejected=(task,model,label)=>assert.equal(replayPortionGroupsEvidence(task,model),null,label);
const oldOnly=(task,model,label)=>{
 assert.equal(M.valid(task,model),true,label+' retains the original valid history');
 assert.equal(M.inspect(task,model).correct,true,label+' retains original completion');rejected(task,model,label);
};

test('all 13 native positions and seven sources have complete independent fingerprints; 20 associated positions stay separate',()=>{
 assert.equal(cases.length,13);assert.equal(new Set(cases.map(c=>c.nodeId)).size,7);assert.equal(Object.keys(M.fields).length,35);
 for(const [path,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected);
 for(const c of cases){
  const task=taskAt(c.id,c.index),binding=portionGroupsBinding(task,c);
  assert.equal(hash(task),c.taskHash);assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(task.type,'x-portiongroups');assert.equal(task.total,c.total);assert.equal(task.d,c.partitions);assert.equal(task.n,c.selected);
  assert.equal(!!task.name,c.name);assert.deepEqual(task.equation||[],c.equations);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question.length>20);
  assert.equal(portionGroupsBinding(structuredClone(task),c)?.nodeId,c.nodeId);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},
   {...c,index:999},{...c,sessionId:'__proto__'},{...c,sessionId:'constructor'}])assert.equal(portionGroupsBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,total:task.total+1},
   {...task,d:task.d+1},{...task,n:0},{...task,type:'x-portionbar'},{...task,name:!task.name},
   {...task,equation:['0=0']},{...task,extra:true}])assert.equal(portionGroupsBinding(changed,c),null);
 }
 const found=[],related=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(portionGroupsBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(portionGroupsBinding(task,{sessionId:id,index}),null);
  if(task.type==='x-portiongroups')related.push(id+':'+index);
 });
 assert.deepEqual(related.sort(),associatedCases.map(c=>c.id+':'+c.index).sort());assert.equal(related.length,20);
 for(const c of associatedCases)assert.equal(hash(taskAt(c.id,c.index)),c.taskHash);
});

for(const c of cases)test(`${c.id}:${c.index} preserves actual token identities, equal groups and selected quantity`,()=>{
 const task=taskAt(c.id,c.index);
 for(const options of [{},{reverse:true},{early:true},{reverse:true,early:true}]){
  const model=build(task,options),proof=accepted(task,model);
  const selected=Array.from({length:c.selected},(_,i)=>options.reverse?c.partitions-i-1:i);
  assert.equal(proof.total,c.total);assert.equal(proof.partitions,c.partitions);assert.equal(proof.each,c.each);
  assert.deepEqual(proof.counts,Array(c.partitions).fill(c.each));assert.equal(proof.selectedTotal,c.answer);
  assert.equal(proof.unselectedTotal,c.total-c.answer);assert.deepEqual(proof.selectedGroups,selected);
  assert.deepEqual(proof.selectedTokens,Array.from({length:c.total},(_,i)=>i).filter(i=>selected.includes(i%c.partitions)));
  assert.deepEqual(proof.groups,Array.from({length:c.partitions},(_,g)=>Array.from({length:c.total},(_,i)=>i).filter(i=>i%c.partitions===g)));
  assert.deepEqual(proof.fraction.groups,[c.selected,c.partitions]);assert.deepEqual(proof.fraction.tokens,[c.answer,c.total]);
  assert.equal(proof.assignments.length,c.total);assert.equal(proof.navigation.length,c.partitions);assert.equal(proof.selections.length,c.selected);
  assert.equal(proof.resets.length,0);assert.equal(proof.eventCount,c.total+c.partitions+c.selected);
  for(const move of proof.assignments){assert.equal(move.from,-1);assert.equal(move.to,move.token%c.partitions);}
  assert.deepEqual(proof.fraction.submitted,c.name?{numerator:c.selected,denominator:c.partitions,submissionOnly:true}:null);
  assert.deepEqual(proof.equation,c.equations.length?{raw:c.equations[0],value:c.answer,exactValue:String(c.answer),submissionOnly:true}:null);
  const record={attempts:[{value:structuredClone(model)}]};assert.ok(latestSubmissionMatches(model,record));
  const changed=structuredClone(model);changed.answer=String(c.answer+1);
  assert.equal(latestSubmissionMatches(changed,record),false);
  assert.equal(latestSubmissionMatches(model,{attempts:[...record.attempts,{value:changed}]}),false);
 }
 // Standard original paths also remain supported, including group 0 first.
 accepted(task,M.example(task));
});

test('same-group navigation is a legal confirmation, never another token move',()=>{
 const {task,model}=sample();act(task,model,'group',1);act(task,model,'group',1);act(task,model,'group',0);act(task,model,'group',0);
 const proof=accepted(task,model);assert.equal(proof.assignments.length,task.total);
 assert.deepEqual(proof.navigation.slice(-4).map(e=>e.changed),[false,false,true,false]);
});

test('moving a token across groups and back is a legitimate correction with full provenance',()=>{
 const {task,model}=sample('nonunitamount',1);
 act(task,model,'group',1);act(task,model,'token',0);act(task,model,'group',0);act(task,model,'token',0);
 const proof=accepted(task,model);assert.equal(proof.assignments.length,task.total+2);
 assert.deepEqual(proof.assignments.slice(-2).map(({token,from,to})=>({token,from,to})),[{token:0,from:0,to:1},{token:0,from:1,to:0}]);
 assert.equal(proof.selectedTotal,12);
});

test('take before distributing and take/cancel/take are real toggles, without an invented ordering requirement',()=>{
 const task=taskAt('nonunitamount',0),model=M.initial(task);
 act(task,model,'take',4);act(task,model,'take',4);act(task,model,'take',4);
 act(task,model,'take',3);act(task,model,'take',2);distribute(task,model);fill(task,model);
 const proof=accepted(task,model);assert.deepEqual(proof.selectedGroups,[4,3,2]);
 assert.deepEqual(proof.selections.map(s=>s.selected),[true,false,true,true,true]);
 assert.ok(proof.selections.at(-1).historyIndex<proof.assignments[0].historyIndex);
});

test('reset fully replays the old board and retains all prior assignments and selections',()=>{
 const {task,model}=sample('unitsets',2),oldLength=model.history.length;
 act(task,model,'reset');assert.equal(model.per,'3');assert.equal(model.num,'1');assert.equal(model.den,'4');
 assert.deepEqual(model.board,{groups:Array(12).fill(-1),group:0,taken:[]});
 distribute(task,model,true);act(task,model,'take',3);fill(task,model);
 const proof=accepted(task,model);assert.equal(proof.resets.length,1);
 assert.deepEqual(proof.resets[0],{historyIndex:oldLength,assigned:12,selected:[0]});
 assert.equal(proof.assignments.length,24);assert.deepEqual(proof.selectedGroups,[3]);
 assert.equal(model.history[oldLength].data.fields.per,'3');
});

test('empty reset and partial reset are controls, do not fabricate assignments, and keep the entire history',()=>{
 const task=taskAt('halfpaper'),model=M.initial(task);
 act(task,model,'reset');act(task,model,'reset');act(task,model,'token',0);act(task,model,'take',1);act(task,model,'reset');
 distribute(task,model);act(task,model,'take',0);fill(task,model);
 const proof=accepted(task,model);assert.equal(proof.resets.length,3);assert.equal(proof.assignments.length,9);
 assert.deepEqual(proof.resets.map(r=>r.assigned),[0,0,1]);assert.equal(proof.selectedTotal,4);
});

test('same-token same-group placement remains original completion but never strict mathematical evidence',()=>{
 const {task,model}=sample();act(task,model,'group',0);act(task,model,'token',0);oldOnly(task,model,'duplicate no-op placement');
});

test('reset cannot wash a no-op, invalid index, or cross-widget action out of retained history',()=>{
 for(const invalid of ['duplicate','out-of-range','cross-type']){
  const task=taskAt('halfpaper'),model=M.initial(task);
  if(invalid==='duplicate'){act(task,model,'token',0);act(task,model,'token',0);}
  if(invalid==='out-of-range')act(task,model,'token',task.total);
  if(invalid==='cross-type')act(task,model,'bar');
  act(task,model,'reset');distribute(task,model);act(task,model,'take',0);fill(task,model);oldOnly(task,model,invalid);
 }
});

test('indices must be actual UI token/group identities, not Number coercion aliases',()=>{
 for(const action of ['group','token','take'])for(const value of ['', ' ', '-1','01','+0','0.0','0x0','1e0','Infinity','NaN','999999999999999999999999']){
  const {task,model}=sample();M.act(task,model,'b16-'+action,{index:value});rejected(task,model,action+' '+value);
 }
 for(const [action,value]of [['group',2],['token',8],['take',2]]){
  const {task,model}=sample();act(task,model,action,value);oldOnly(task,model,'out of range '+action);
 }
});

test('exact model, board, event, data and 35-field keys reject hidden or foreign records',()=>{
 const mutations=[m=>m.extra=true,m=>m.board.extra=true,m=>m.history[0].extra=true,
  m=>m.history[0].data.extra='0',m=>m.history[0].data.value='',m=>m.history[0].data.row='',
  m=>m.history[0].data.fields.extra='',m=>delete m.history[0].data.fields.answer,
  m=>m.history[0].data.fields.answer=0,m=>m.history[0].data.index=0,
  m=>m.history[0].action='bar',m=>m.history[0].action='unknown',m=>m.history[0].action='b16-group',
  m=>m.history[0].data=null,m=>m.history=[],m=>m.history=null,m=>m.board=null,
  m=>m.issue='unexpected failure',m=>m.per=4,m=>m.answer='4'.repeat(2001),m=>m.history=Array(2001).fill(m.history[0])];
 for(const change of mutations){const {task,model}=sample();change(model);rejected(task,model,String(change));}
 for(const key of Object.keys(M.fields).filter(key=>!['per','answer'].includes(key))){
  const one=sample();one.model[key]+='x';rejected(one.task,one.model,'hidden current '+key);
  const two=sample();two.model.history[0].data.fields[key]+='x';rejected(two.task,two.model,'hidden event '+key);
 }
});

test('answer controls are unavailable before full distribution, and reset retains their last visible values',()=>{
 const task=taskAt('halfpaper'),model=M.initial(task);
 assert.equal(V.controls(task,model).includes('data-xfield="per"'),false);
 assert.equal(V.visual(task,model).includes('data-x="b16-take"'),true);
 model.per='4';act(task,model,'group',0);model.per='';distribute(task,model);act(task,model,'take',0);fill(task,model);
 oldOnly(task,model,'hidden per entered before any complete distribution');
 const after=build(task);act(task,after,'reset');after.per='8';act(task,after,'group',0);after.per='4';
 distribute(task,after);act(task,after,'take',0);fill(task,after);oldOnly(task,after,'hidden field edit after reset');
});

test('temporary visible answer mistakes are submitted fields, not false mathematical events',()=>{
 const {task,model}=sample('nonunitamount',1);model.per='wrong';model.answer='not yet';model.equation='unfinished';
 act(task,model,'group',1);model.per='6';model.answer='12';model.equation='18/3*2=12';
 accepted(task,model);
});

test('fixed token identity, ownership, counts, current group and selected set must equal the full replay',()=>{
 const mutations=[m=>m.board.groups.pop(),m=>m.board.groups.push(0),m=>m.board.groups[0]=-1,
  m=>m.board.groups[0]=1,m=>m.board.groups[0]=null,m=>m.board.groups[0]='0',m=>m.board.group=0,
  m=>m.board.taken.push(0),m=>m.board.taken.push(2),m=>m.board.taken=[],m=>m.board.taken=['0']];
 for(const change of mutations){const {task,model}=sample();change(model);rejected(task,model,String(change));}
 const {task,model}=sample();act(task,model,'group',1);act(task,model,'token',0);
 assert.equal(M.valid(task,model),true);assert.equal(M.inspect(task,model).correct,false);rejected(task,model,'unequal final groups');
});

test('per-group amount and selected amount retain their separate mathematical roles',()=>{
 const {task,model}=sample('nonunitamount',1);model.per='12';model.answer='6';rejected(task,model,'swapped amount roles');
 for(const key of ['per','answer'])for(const value of ['','3.00000001','NaN','Infinity','0x3','1e1','3%','-0 1/2','3/0','3 1/1']){
  const one=sample('unitsets',2);one.model[key]=value;rejected(one.task,one.model,key+' '+value);
 }
 for(const value of ['3','+3','0003','3.0','3.00000000','3/1','6/2','9/3']){
  const one=sample('unitsets',2);one.model.per=value;one.model.answer=value;accepted(one.task,one.model);
 }
});

test('numerator and denominator are parsed separately, while correct equivalent names stay valid',()=>{
 for(const [num,den]of [['1','4'],['3','12'],['2','8'],['01','04'],['25000000','100000000']]){
  const {task,model}=sample('unitsets',2);model.num=num;model.den=den;
  const proof=accepted(task,model);assert.deepEqual(proof.fraction.groups,[1,4]);assert.deepEqual(proof.fraction.tokens,[3,12]);
  assert.deepEqual(proof.fraction.submitted,{numerator:Number(num),denominator:Number(den),submissionOnly:true});
 }
 const {task,model}=sample('unitsets',2);model.num='0 1';model.den='4';oldOnly(task,model,'spliced mixed fraction');
 for(const [num,den]of [['1','3'],['3','9'],['1','0'],['-1','-4'],['1/2','2'],['1','2/8'],['','4'],['1.0','4']]){
  const one=sample('unitsets',2);one.model.num=num;one.model.den=den;rejected(one.task,one.model,num+'/'+den);
 }
});

test('every configured equation and its legitimate reordered spelling is exact submitted evidence only',()=>{
 for(const c of cases.filter(c=>c.equations.length))for(const raw of c.equations.flatMap(eq=>[eq,eq.split('=').reverse().join('='),eq.replaceAll('/','÷').replaceAll('*','×')])){
  const {task,model}=sample(c.id,c.index);model.equation=raw;const proof=accepted(task,model);
  assert.deepEqual(proof.equation,{raw,value:c.answer,exactValue:String(c.answer),submissionOnly:true});
  assert.equal(proof.assignments.length,c.total);assert.equal(proof.eventCount,c.total+c.partitions+c.selected);
 }
 for(const raw of ['2*(18/3)=12','12=2×(18÷3)','[18/3]*2=12','{18/3}·2=12.0000000000000000']){
  const {task,model}=sample('nonunitamount',1);model.equation=raw;accepted(task,model);
 }
});

test('floating-point-collapsed equation literals cannot inherit the original parser success',()=>{
 for(const raw of ['18.0000000000000001/3*2=12','18/3*2=12.0000000000000001',
  '18.000000000000000018/3.000000000000000003*2=12']){
  const {task,model}=sample('nonunitamount',1);model.equation=raw;oldOnly(task,model,raw);
 }
 for(const raw of ['12=12','18/3*2=13','18/0*2=12','18/3*2=12=12','1 8/3*2=12','18//3*2=12',
  '18/3*2=12;alert(1)','18/3*2=1e1','18/3*2=Math.sqrt(144)','18/3*2=','(18/3*2=12']){
  const {task,model}=sample('nonunitamount',1);model.equation=raw;rejected(task,model,raw);
 }
});

test('current mathematical inputs and the newest complete submission cannot borrow older success',()=>{
 const {task,model}=sample('unitsets',2),correct=structuredClone(model),record={attempts:[{value:correct}]};
 assert.ok(latestSubmissionMatches(model,record));
 model.answer='4';assert.equal(latestSubmissionMatches(model,record),false);rejected(task,model,'edited current answer');
 record.attempts.push({value:structuredClone(model)});assert.equal(latestSubmissionMatches(correct,record),false);
 model.answer='3';assert.equal(latestSubmissionMatches(model,record),false);accepted(task,model);
 record.attempts.push({value:structuredClone(model)});assert.ok(latestSubmissionMatches(model,record));
});

test('task bounds, malformed values and wrong family contracts fail closed',()=>{
 const {task,model}=sample();
 for(const changed of [null,[],{}, {...task,type:'x-portionbar'},{...task,total:0},{...task,total:9},
  {...task,total:Infinity},{...task,d:0},{...task,d:1},{...task,d:13},{...task,n:0},{...task,n:3},
  {...task,name:false},{...task,equation:[]},{...task,equation:['1=1'],extra:true}])rejected(changed,model);
 for(const malformed of [null,[],{},true,'model'])rejected(task,malformed);
 const cyclic=structuredClone(model);cyclic.board.groups[0]=cyclic;rejected(task,cyclic);
});

test('feedback names the observed whole, selected groups and selected objects without imposing a take order',()=>{
 for(const c of cases)for(const early of [false,true])for(const reverse of [false,true]){
  const task=taskAt(c.id,c.index),model=build(task,{early,reverse}),before=JSON.stringify(model);
  const record={support:false,attempts:[{value:structuredClone(model)}]},proof=accepted(task,model);
  assert.equal(thinkingFeedback(task,model,{attempts:[]},c),null);
  const feedback=thinkingFeedback(task,model,record,c),guide=thinkingGuide(task,c);
  assert.ok(feedback);assert.ok(guide);assert.equal(feedback.method,null);assert.match(guide.summary,/可选/);
  assert.ok(feedback.observation.includes(`${c.total} 颗物品最终分成 ${c.partitions} 组，每组 ${c.each} 颗`));
  assert.ok(feedback.observation.includes(`选中了 ${c.selected} 组，包含 ${c.answer} 颗`));
  assert.ok(feedback.observation.includes(`未选中的还有 ${c.total-c.answer} 颗`));
  assert.match(feedback.observation,/每颗物品只有一个位置/);assert.doesNotMatch(feedback.observation,/先.*再|先.*后|按顺序/);
  const detail=feedback.detail.join(' ');
  assert.ok(detail.includes(`按组来看，当前选了 ${c.selected}/${c.partitions}`));
  assert.ok(detail.includes(`按物品来看，当前选了 ${c.answer}/${c.total}`));
  assert.ok(detail.includes(`整体都是全部 ${c.total} 颗物品`));
  assert.match(detail,/不能只把未选中的物品当作整体/);
  assert.match(detail,/没有自动评价自由解释、独立计算步骤或长期掌握/);
  assert.equal(proof.selectedTotal+proof.unselectedTotal,c.total);assert.equal(JSON.stringify(model),before);
  const edited=structuredClone(model);edited.answer=String(c.answer+1);
  assert.equal(thinkingFeedback(task,edited,record,c),null);
  assert.equal(thinkingFeedback(task,edited,{attempts:[{value:edited}]},c),null);
 }
});

test('feedback distinguishes an equivalent submitted name from physical groups and a written equation from a computation',()=>{
 const c=cases.find(c=>c.id==='unitsets'&&c.index===2),task=taskAt(c.id,c.index),model=build(task,{early:true});
 model.num='3';model.den='12';
 let record={support:true,attempts:[{value:structuredClone(model)}]},feedback=thinkingFeedback(task,model,record,c);
 assert.ok(feedback);assert.match(feedback.observation,/选中了 1 组，包含 3 颗/);
 let words=feedback.detail.join(' ');
 assert.match(words,/提交的分数 3\/12 与这部分等值/);assert.match(words,/实际选中的 1 组、全部 4 组/);
 assert.match(words,/你看过提示或比较反馈/);
 act(task,model,'reset');distribute(task,model);act(task,model,'take',0);fill(task,model);
 record={support:false,attempts:[{value:structuredClone(model)}]};feedback=thinkingFeedback(task,model,record,c);
 assert.ok(feedback);assert.match(feedback.detail.join(' '),/1 次重新摆；之前的事件仍保留/);
 for(const spec of cases.filter(c=>c.equations.length)){
  const t=taskAt(spec.id,spec.index),m=build(t),r={attempts:[{value:structuredClone(m)}]};
  words=thinkingFeedback(t,m,r,spec).detail.join(' ');
  assert.ok(words.includes('提交的等式 '+m.equation));assert.match(words,/没有记录一个独立的计算过程/);
 }
});
