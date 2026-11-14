import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b16-model.js';
import * as V from '../dist/learning/phase5/b16-view.js';
import {fdpBoardBinding,replayFdpBoardEvidence} from '../dist/learning/fdpboard-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingFeedback,thinkingGuide} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-fdpboard-cases.cjs';

await ensureB39Ready();
const {cases,associatedCases}=fixture;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort((a,b)=>a.localeCompare(b,'en')).map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(value).digest('hex');
const hash=task=>digest(JSON.stringify(stable(task)));
const taskAt=(id,index)=>sessionTasks(id)[index];
const act=(task,model,action,value)=>M.act(task,model,'b16-'+action,
 value===undefined?{}:action==='view'?{value}:{index:value});
const fill=(task,model)=>Object.assign(model,{num:String(task.n),den:String(task.d),decimal:String(task.n/task.d),percent:String(task.n*100/task.d)});
const paint=(task,model,{reverse=false,scattered=false}={})=>{
 const ids=Array.from({length:task.n},(_,i)=>scattered?(i*3)%task.d:i);if(reverse)ids.reverse();
 // 3 is coprime to both native denominators; this produces distinct real IDs.
 for(const id of ids)act(task,model,'cell',id);return ids;
};
const build=(task,{reverse=false,early=false,scattered=false}={})=>{
 const model=M.initial(task);
 if(early)for(const value of task.views)act(task,model,'view',value);
 paint(task,model,{reverse,scattered});
 for(const value of task.views)act(task,model,'view',value);
 return fill(task,model);
};
const sample=(id='viewlinks',index=1)=>{const task=taskAt(id,index);return {task,model:build(task)};};
const accepted=(task,model)=>{
 assert.equal(M.valid(task,model),true);assert.equal(M.inspect(task,model).correct,true);
 const before=JSON.stringify(model),proof=replayFdpBoardEvidence(task,model);assert.ok(proof);
 assert.equal(JSON.stringify(model),before,'the evidence lookup changes no saved value');return proof;
};
const rejected=(task,model,label)=>assert.equal(replayFdpBoardEvidence(task,model),null,label);
const originalOnly=(task,model,label)=>{
 assert.equal(M.valid(task,model),true,label+' retains the original valid model');
 assert.equal(M.inspect(task,model).correct,true,label+' retains the original completion');rejected(task,model,label);
};

test('all 15 native positions, eight source nodes and 19 associated positions have independent complete fingerprints',()=>{
 assert.equal(cases.length,15);assert.equal(new Set(cases.map(c=>c.nodeId)).size,8);assert.equal(Object.keys(M.fields).length,35);
 for(const [path,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected);
 for(const c of cases){
  const task=taskAt(c.id,c.index),binding=fdpBoardBinding(task,c);
  assert.equal(hash(task),c.taskHash);assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(task.type,'x-fdpboard');assert.equal(task.n,c.n);assert.equal(task.d,c.d);assert.deepEqual(task.views,c.views);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question.length>20);
  assert.equal(fdpBoardBinding(structuredClone(task),c)?.nodeId,c.nodeId);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},
   {...c,index:999},{...c,sessionId:'__proto__'},{...c,sessionId:'constructor'},
   ...JSON.parse(JSON.stringify([
    {sessionId:null,index:c.index},{sessionId:7,index:c.index},{sessionId:[c.id],index:c.index},
    {sessionId:{toString:null},index:c.index},{sessionId:c.id,index:null},
    {sessionId:c.id,index:[c.index]},{sessionId:c.id,index:{toString:null}},{sessionId:c.id,index:0.5}
   ]))])assert.equal(fdpBoardBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,n:task.n+1},
   {...task,d:task.d+1},{...task,type:'x-portiongroups'},{...task,views:['grid']},{...task,extra:true}])
   assert.equal(fdpBoardBinding(changed,c),null);
 }
 const found=[],native=[],related=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(task.type==='x-fdpboard')native.push(id+':'+index);
  if(fdpBoardBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(native.sort(),found.sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(fdpBoardBinding(task,{sessionId:id,index}),null);
  if(task.type==='x-fdpboard')related.push(id+':'+index);
 });
 assert.deepEqual(related.sort(),associatedCases.map(c=>c.id+':'+c.index).sort());assert.equal(related.length,19);
 for(const c of associatedCases){const task=taskAt(c.id,c.index);assert.equal(hash(task),c.taskHash);accepted(task,M.example(task));}
});

for(const c of cases)test(`${c.id}:${c.index} keeps the colored identities and distinguishes submissions from system displays`,()=>{
 const task=taskAt(c.id,c.index);
 for(const options of [{},{reverse:true,early:true},{scattered:true,early:true},{reverse:true,scattered:true}]){
  const model=build(task,options),proof=accepted(task,model);
  const ids=Array.from({length:c.n},(_,i)=>options.scattered?(i*3)%c.d:i);if(options.reverse)ids.reverse();
  assert.equal(proof.denominator,c.d);assert.equal(proof.selectedCount,c.n);assert.equal(proof.unselectedCount,c.d-c.n);
  assert.equal(proof.baseRepresentation,c.baseRepresentation);assert.deepEqual(proof.selectedIds,ids);
  assert.equal(proof.changes.length,c.n);assert.equal(proof.resets.length,0);
  assert.equal(proof.viewRequests.length,c.views.length*(options.early?2:1));
  assert.equal(proof.eventCount,c.n+proof.viewRequests.length);
  for(const [i,change]of proof.changes.entries()){
   assert.deepEqual(change.added,[ids[i]]);assert.deepEqual(change.removed,[]);assert.equal(change.beforeCount,i);assert.equal(change.afterCount,i+1);
  }
  assert.deepEqual(proof.fraction.actual,[c.n,c.d]);
  assert.equal(proof.fraction.submitted.numerator,c.n);assert.equal(proof.fraction.submitted.denominator,c.d);
  assert.equal(proof.fraction.submitted.submissionOnly,true);assert.equal(proof.decimal.raw,c.decimal);assert.equal(proof.percent.raw,c.percent);
  assert.equal(proof.decimal.submissionOnly,true);assert.equal(proof.percent.submissionOnly,true);
  assert.equal(proof.decimal.exactValue,proof.fraction.submitted.exactValue);
  assert.equal(!!proof.systemRepresentations.line,c.views.includes('line'));
  assert.equal(!!proof.systemRepresentations.additionalCircle,c.d===100&&c.views.includes('pie'));
  for(const display of Object.values(proof.systemRepresentations).filter(Boolean)){
   assert.equal(display.numerator,c.n);assert.equal(display.denominator,c.d);assert.equal(display.systemComputed,true);
  }
  if(options.early)assert.deepEqual(proof.viewRequests.map(v=>v.selectedCount),[...c.views.map(()=>0),...c.views.map(()=>c.n)]);
 }
 accepted(task,M.example(task));
});

test('a partial row adds nine new identities and a second row click removes all ten',()=>{
 const task=taskAt('viewlinks',1),model=M.initial(task);
 act(task,model,'cell',0);act(task,model,'row',0);act(task,model,'row',0);
 paint(task,model);for(const value of task.views)act(task,model,'view',value);fill(task,model);
 const proof=accepted(task,model);
 assert.deepEqual(proof.changes[1],{historyIndex:1,action:'row',index:0,added:[1,2,3,4,5,6,7,8,9],removed:[],beforeCount:1,afterCount:10});
 assert.deepEqual(proof.changes[2],{historyIndex:2,action:'row',index:0,added:[],removed:[0,1,2,3,4,5,6,7,8,9],beforeCount:10,afterCount:0});
 assert.equal(proof.selectedCount,35);assert.equal(proof.changes.length,38);
});

test('all hundred-grid rows can be filled and cleared in arbitrary order without making extra cells',()=>{
 const task=taskAt('pctWhole37',3),model=M.initial(task);
 for(const row of [9,0,7,2,5,4,3,6,1,8])act(task,model,'row',row);
 act(task,model,'row',5);act(task,model,'row',5);fill(task,model);
 const proof=accepted(task,model);assert.equal(new Set(proof.selectedIds).size,100);assert.equal(proof.selectedCount,100);
 assert.equal(proof.changes.at(-2).removed.length,10);assert.equal(proof.changes.at(-1).added.length,10);
 assert.equal(proof.decimal.exactValue,'1');assert.equal(proof.percent.exactValue,'100');
});

test('configured views can be requested early and repeatedly; display requests never color a cell',()=>{
 const task=taskAt('viewlinks',1),model=M.initial(task);
 for(const value of ['line','pie','line','pie'])act(task,model,'view',value);
 paint(task,model,{scattered:true});act(task,model,'view','line');fill(task,model);
 const proof=accepted(task,model);assert.equal(proof.changes.length,35);
 assert.deepEqual(proof.viewRequests.map(v=>v.addedToDisplay),[true,true,false,false,false]);
 assert.deepEqual(proof.viewRequests.map(v=>v.selectedCount),[0,0,0,0,35]);
 assert.equal(proof.systemRepresentations.additionalCircle.exactValue,'7/20');
});

test('four-sector tasks start with the real circle, not an imaginary child-requested grid',()=>{
 const task=taskAt('representationmap',2),initial=M.initial(task),view=V.visual(task,initial);
 assert.deepEqual(initial.board.seen,['grid']);assert.match(view,/一整个圆平均分成4份/);assert.doesNotMatch(view,/b16-grid100/);
 assert.doesNotMatch(V.controls(task,initial),/data-x="b16-row"/);
 const proof=accepted(task,build(task));assert.equal(proof.baseRepresentation,'sector-circle');
 assert.deepEqual(proof.viewRequests.map(v=>v.value),['line']);assert.equal(proof.systemRepresentations.additionalCircle,null);
 assert.equal(proof.systemRepresentations.line.exactValue,'3/4');
});

test('reset keeps the whole history and hidden text values, while requiring fresh configured displays',()=>{
 const {task,model}=sample(),before=structuredClone(model);
 act(task,model,'reset');assert.deepEqual(model.board,{selected:[],seen:['grid']});
 for(const key of Object.keys(M.fields))assert.equal(model[key],before[key]);
 assert.doesNotMatch(V.controls(task,model),/data-xfield="(?:num|den|decimal|percent)"/);
 paint(task,model,{reverse:true});rejected(task,model,'required views must be requested again after reset');
 for(const value of task.views)act(task,model,'view',value);
 const proof=accepted(task,model);assert.deepEqual(proof.resets,[{historyIndex:before.history.length,selectedIds:before.board.selected,displayed:before.board.seen}]);
 assert.deepEqual(model.history.slice(0,before.history.length),before.history);assert.equal(proof.changes.length,70);
});

test('empty/partial resets are real controls but do not add mathematical construction events',()=>{
 const task=taskAt('pctNames37',2),model=M.initial(task);
 act(task,model,'reset');act(task,model,'reset');act(task,model,'cell',3);act(task,model,'reset');
 paint(task,model);fill(task,model);const proof=accepted(task,model);
 assert.deepEqual(proof.resets.map(r=>r.selectedIds),[[],[],[3]]);assert.equal(proof.changes.length,4);
});

test('wrong visible drafts can be corrected, and real coloring errors remain in the accepted correction history',()=>{
 const {task,model}=sample('pctNames37',2);
 model.decimal='wrong';model.percent='-75';act(task,model,'cell',3);
 assert.equal(M.inspect(task,model).correct,false);rejected(task,model,'all four parts are not three quarters');
 model.num='0 3';act(task,model,'cell',3);fill(task,model);
 const proof=accepted(task,model);assert.deepEqual(proof.changes.at(-2).added,[3]);assert.deepEqual(proof.changes.at(-1).removed,[3]);
 assert.equal(model.history.at(-1).data.fields.num,'0 3');assert.equal(model.history.at(-1).data.fields.percent,'-75');
 assert.equal(proof.fraction.submitted.numerator,3);
});

test('erasing every part hides and retains fields; recoloring permits a new current submission',()=>{
 const {task,model}=sample('pctNames37',2);
 for(const id of [0,1,2])act(task,model,'cell',id);
 assert.deepEqual(model.board.selected,[]);assert.equal(model.decimal,'0.75');
 assert.doesNotMatch(V.controls(task,model),/data-xfield="decimal"/);
 paint(task,model,{reverse:true});model.num='6';model.den='8';model.decimal='+0.75000000';model.percent='75.00000000';
 const proof=accepted(task,model);assert.equal(proof.fraction.submitted.exactValue,'3/4');assert.equal(proof.percent.exactValue,'75');
});

test('separate integer numerator and denominator reject mixed-text concatenation without changing original completion',()=>{
 const {task,model}=sample('pctNames37',2);model.num='0 3';model.den='4';originalOnly(task,model,'split numerator');
 for(const [num,den]of [['6','8'],[' 3','4 '],['0003','0004'],['75000000','100000000']]){
  const m=build(task);m.num=num;m.den=den;accepted(task,m);
 }
 for(const [num,den]of [['-3','-4'],['+3','4'],['3.0','4'],['3','4.0'],['0','0'],['3','0'],['3/1','4'],['3','4/1'],['','4'],['3 ','4'],['3',' 4']]){
  const m=build(task);m.num=num;m.den=den;rejected(task,m,num+'/'+den);
 }
});

test('a fraction expression in the decimal or percent field is not a decimal representation',()=>{
 for(const [key,value]of [['decimal','3/4'],['decimal','0 3/4'],['percent','150/2'],['percent','75/1']]){
  const {task,model}=sample('pctNames37',2);model[key]=value;originalOnly(task,model,key+' '+value);
 }
});

test('exact decimal/percent literals keep scale and precision boundaries instead of floating-point tolerance',()=>{
 const task=taskAt('pctNames37',2);
 for(const [decimal,percent]of [['0.75','75'],['+0.7500','+75.00'],[' 000.75000000 ',' 075.00000000 ']]){
  const model=build(task);model.decimal=decimal;model.percent=percent;accepted(task,model);
 }
 for(const key of ['decimal','percent'])for(const value of ['NaN','Infinity','1e0','0x1','75%','.75','0.75.0','3/4','-0 3/4','−0.75','', '0.75000000000000001']){
  const model=build(task);model[key]=value;rejected(task,model,key+' '+value);
 }
 for(const [decimal,percent]of [['0.75000001','75'],['0.75','75.00000001'],['0.75','0.75'],['75','75'],['0.7','75'],['0.75','7500']]){
  const model=build(task);model.decimal=decimal;model.percent=percent;rejected(task,model,'wrong scale or precision');
 }
});

test('hidden views, rows on circles and cross-widget actions cannot be cleaned by reset',()=>{
 const invalids=[['pctWhole37',0,'view','line'],['pctNames37',2,'row',0],['viewlinks',1,'cell',100],
  ['viewlinks',1,'row',10],['viewlinks',1,'token',0],['viewlinks',1,'bar',undefined]];
 for(const [id,index,action,value]of invalids){
  const task=taskAt(id,index),model=M.initial(task);act(task,model,action,value);act(task,model,'reset');
  paint(task,model);for(const view of task.views)act(task,model,'view',view);fill(task,model);originalOnly(task,model,action+' '+value);
 }
});

test('UI indices are canonical identities, not permissive Number aliases',()=>{
 for(const action of ['cell','row'])for(const value of ['', ' ', '-1','01','+0','0.0','0x0','1e0','Infinity','NaN','999999999999999999']){
  const {task,model}=sample();act(task,model,action,value);rejected(task,model,action+' '+value);
 }
});

test('unavailable fields cannot change before first coloring or while a reset board is empty',()=>{
 for(const key of ['num','den','decimal','percent']){
  const task=taskAt('pctNames37',2),model=M.initial(task);model[key]='99';paint(task,model);fill(task,model);
  originalOnly(task,model,'hidden initial '+key);
  const reset=build(task);act(task,reset,'reset');reset[key]='99';paint(task,reset);fill(task,reset);
  originalOnly(task,reset,'hidden reset '+key);
 }
});

test('unrelated shared-widget fields stay at defaults in every event and current model',()=>{
 for(const key of Object.keys(M.fields).filter(k=>!['num','den','decimal','percent'].includes(k))){
  const {task,model}=sample();model[key]='foreign';originalOnly(task,model,'current '+key);
  const old=build(task);old.history[0].data.fields[key]='foreign';originalOnly(task,old,'history '+key);
 }
});

test('model, board, events, event data and every 35-field snapshot have exact keys',()=>{
 const mutations=[m=>m.extra=true,m=>m.board.extra=true,m=>m.history[0].extra=true,
  m=>m.history[0].data.extra='0',m=>m.history[0].data.value='',m=>m.history[0].data.row='',
  m=>m.history[0].data.fields.extra='',m=>delete m.history[0].data.fields.answer,
  m=>delete m.history[0].data.index,m=>m.history[0].data.index=0,m=>m.history[0].data.fields.num=0,
  m=>m.issue='a stale issue',m=>m.history[0].action='unknown',m=>m.history=[],m=>m.history=null];
 for(const mutate of mutations){const {task,model}=sample();mutate(model);rejected(task,model,String(mutate));}
 const {task,model}=sample();model.history=Array(2001).fill(model.history[0]);rejected(task,model,'history limit');
});

test('final identities, display history, order, and submitted snapshots must match their independent replay',()=>{
 for(const mutate of [m=>m.board.selected.reverse(),m=>m.board.selected[0]=99,m=>m.board.selected.push(0),
  m=>m.board.seen=['grid','line','pie'],m=>m.board.seen.push('line'),m=>m.history.shift(),
  m=>m.history[0].data.index='99',m=>m.history.at(-1).data.value='pie']){
  const {task,model}=sample();mutate(model);rejected(task,model,'modified retained history/board');
 }
 const {task,model}=sample(),record={attempts:[{value:structuredClone(model)}]};
 assert.equal(latestSubmissionMatches(model,record),true);
 const changed=structuredClone(model);changed.percent='350';assert.equal(latestSubmissionMatches(changed,record),false);
 assert.equal(latestSubmissionMatches(model,{attempts:[...record.attempts,{value:changed}]}),false);
 act(task,model,'cell',0);act(task,model,'cell',0);accepted(task,model);
 assert.equal(latestSubmissionMatches(model,record),false,'returning to the same quantity still requires a new real submission');
});

test('unsupported or malformed task structures fail closed without borrowing source bindings',()=>{
 const {task,model}=sample();
 for(const changed of [null,{}, {...task,type:'x-paperlab'},{...task,n:0},{...task,n:101},
  {...task,d:3},{...task,d:4.1},{...task,views:['line','line']},{...task,views:['grid']},
  {...task,views:null},{...task,extra:true},{...task,prompt:0}])rejected(changed,model,'invalid task');
 for(const malformed of [null,{},[],true,{...model,board:null}])rejected(task,malformed,'invalid model');
});

test('feedback separates the actual equal parts from submitted equivalent names for every native source',()=>{
 for(const c of cases){
  const task=taskAt(c.id,c.index),model=build(task,{early:true});
  model.num=String(task.n*2);model.den=String(task.d*2);
  const saved={support:true,attempts:[{value:structuredClone(model)}]},before=JSON.stringify(saved);
  const feedback=thinkingFeedback(task,model,saved,c),guide=thinkingGuide(task,c);
  assert.ok(guide?.question);assert.ok(feedback);assert.equal(feedback.method,null);
  assert.ok(feedback.observation.includes(`当前${task.d===100?'百格图':'圆图'}平均分成 ${task.d} 份，实际涂了 ${task.n} 份`));
  assert.ok(feedback.observation.includes(`提交的分数 ${task.n*2}/${task.d*2}`));
  assert.ok(feedback.observation.includes(`小数 ${model.decimal}`));assert.ok(feedback.observation.includes(`百分数 ${model.percent}%`));
  assert.ok(!feedback.observation.includes(`平均分成 ${task.d*2} 份`));
  const words=[feedback.observation,...feedback.detail].join(' ');
  assert.doesNotMatch(words,/MP\.\d|你(?:已经|成功)?(?:计算|算出|换算|转换|画出|作图)/);
  assert.match(words,/自由解释/);assert.match(words,/长期掌握/);
  if(task.views.length){
   assert.ok(words.includes(`系统按当前涂出的 ${task.n}/${task.d} 自动显示`));
   assert.match(words,/重复请求视图只确认显示/);
   assert.doesNotMatch(words,/先.{0,20}比较|比较过.{0,10}最终|已经.{0,10}换算/);
  }
  assert.equal(JSON.stringify(saved),before,'rendering feedback does not rewrite any saved attempt');
 }
 for(const c of associatedCases){
  const task=taskAt(c.id,c.index),model=build(task);
  assert.equal(thinkingGuide(task,c),null);
  assert.equal(thinkingFeedback(task,model,{attempts:[{value:structuredClone(model)}]},c),null);
 }
});

test('the latest exact submission controls feedback through edits, wrong forms, real toggles and corrections',()=>{
 const c=cases.find(c=>c.id==='representationmap'),task=taskAt(c.id,c.index),model=build(task);
 const record={attempts:[{value:structuredClone(model)}]};assert.ok(thinkingFeedback(task,model,record,c));
 model.decimal='3/4';assert.equal(thinkingFeedback(task,model,record,c),null);
 record.attempts.push({value:structuredClone(model)});assert.equal(thinkingFeedback(task,model,record,c),null);
 model.decimal='0.75';assert.equal(thinkingFeedback(task,model,record,c),null);
 record.attempts.push({value:structuredClone(model)});assert.ok(thinkingFeedback(task,model,record,c));
 const earlier=structuredClone(record.attempts);
 act(task,model,'cell',0);act(task,model,'cell',0);assert.equal(thinkingFeedback(task,model,record,c),null);
 record.attempts.push({value:structuredClone(model)});
 assert.ok(thinkingFeedback(task,model,record,c));assert.deepEqual(record.attempts.slice(0,-1),earlier);
 const restored=JSON.parse(JSON.stringify({model,record}));assert.ok(thinkingFeedback(task,restored.model,restored.record,c));
 assert.equal(thinkingFeedback(task,model,{attempts:[]},c),null);
 assert.equal(thinkingFeedback(task,model,record,{...c,index:0}),null);
});

test('feedback describes the final board after partial-row exploration and reset without inventing ten new cells or conversion events',()=>{
 const c=cases.find(c=>c.id==='viewlinks'&&c.index===1),task=taskAt(c.id,c.index),model=M.initial(task);
 act(task,model,'view','pie');act(task,model,'view','line');
 act(task,model,'cell',0);act(task,model,'row',0);act(task,model,'row',0);
 paint(task,model);fill(task,model);act(task,model,'reset');
 paint(task,model,{scattered:true});for(const value of task.views)act(task,model,'view',value);fill(task,model);
 const proof=accepted(task,model),feedback=thinkingFeedback(task,model,{attempts:[{value:structuredClone(model)}]},c);
 assert.equal(proof.changes[1].added.length,9);assert.equal(proof.changes[2].removed.length,10);
 assert.ok(feedback.observation.includes('平均分成 100 份，实际涂了 35 份'));
 const words=[feedback.observation,...feedback.detail].join(' ');
 assert.match(words,/重摆前的操作和输入记录仍保留/);
 assert.doesNotMatch(words,/每(?:次|行).{0,10}(?:涂|增加).{0,5}10|你.{0,8}完成.{0,8}(?:换算|作图)/);
});
