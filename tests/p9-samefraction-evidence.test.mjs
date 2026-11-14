import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b16-model.js';
import * as V from '../dist/learning/phase5/b16-view.js';
import {sameFractionBinding,replaySameFractionEvidence} from '../dist/learning/samefraction-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import fixture from './fixtures/p9-samefraction-cases.cjs';

await ensureB39Ready();
const {cases,associatedCases}=fixture;
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const digest=v=>createHash('sha256').update(v).digest('hex'),hash=t=>digest(JSON.stringify(stable(t)));
const taskAt=(id,index)=>sessionTasks(id)[index];
const relation=task=>{const a=BigInt(task.left[0])*BigInt(task.right[1]),b=BigInt(task.right[0])*BigInt(task.left[1]);return a<b?'<':a>b?'>':'=';};
const wrong=value=>value==='<'?'>':'<';
const act=(task,model,action,data={})=>M.act(task,model,'b16-'+action,data);
const paint=(task,model,reverse=false)=>{
 for(const row of reverse?['right','left']:['left','right']){
  const ids=Array.from({length:task[row][0]},(_,i)=>reverse?task[row][1]-1-i:i);
  for(const index of ids)act(task,model,'fraction',{row,index});
 }
 return model;
};
const fill=(task,model)=>{
 model.relation=relation(task);model.reason='same-whole';
 if(task.common){const d=model.board.refine;model.left=task.left[0]*d/task.left[1]+'/'+d;model.right=task.right[0]*d/task.right[1]+'/'+d;}
 return model;
};
const build=(task,{reverse=false,earlyOverlay=false,earlyRefine=false,denominator=12,guess=relation(task),existing=null}={})=>{
 const model=existing||M.initial(task);model.prediction=guess;act(task,model,'predict');
 if(earlyOverlay)act(task,model,'overlay');
 if(task.common&&earlyRefine){model.parts=String(denominator);act(task,model,'refine');}
 paint(task,model,reverse);if(!earlyOverlay)act(task,model,'overlay');
 if(task.common&&!earlyRefine){model.parts=String(denominator);act(task,model,'refine');}
 return fill(task,model);
};
const sample=(id='smallershare',index=0)=>{const task=taskAt(id,index);return {task,model:build(task)};};
const accepted=(task,model)=>{
 assert.equal(M.valid(task,model),true);assert.equal(M.inspect(task,model).correct,true);
 const before=JSON.stringify(model),proof=replaySameFractionEvidence(task,model);assert.ok(proof);
 assert.equal(JSON.stringify(model),before,'strict replay leaves the original saved work unchanged');return proof;
};
const rejected=(task,model,label)=>assert.equal(replaySameFractionEvidence(task,model),null,label);
const originalOnly=(task,model,label)=>{
 assert.equal(M.valid(task,model),true,label+' original validity');assert.equal(M.inspect(task,model).correct,true,label+' original completion');
 rejected(task,model,label);
};

test('eight native positions from six sources and all fifteen associated positions have complete independent hashes',()=>{
 assert.equal(cases.length,8);assert.equal(new Set(cases.map(c=>c.nodeId)).size,6);assert.equal(Object.keys(M.fields).length,35);
 for(const [path,expected]of Object.entries(fixture.sourceHashes))assert.equal(digest(fs.readFileSync(new URL('../'+path,import.meta.url))),expected);
 for(const c of cases){
  const task=taskAt(c.id,c.index),binding=sameFractionBinding(task,c);
  assert.equal(hash(task),c.taskHash);assert.equal(LESSONS[c.id].topicId,c.nodeId);assert.equal(task.type,'x-samefraction');
  assert.deepEqual(task.left,c.left);assert.deepEqual(task.right,c.right);assert.equal(task.common,c.common);assert.equal(relation(task),c.relation);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);assert.ok(binding.question.length>20);
  assert.equal(sameFractionBinding(structuredClone(task),c)?.nodeId,c.nodeId);
  for(const context of [null,[],true,c.id,{}, {...c,index:String(c.index)},{...c,index:-1},{...c,index:99},
   {...c,sessionId:'__proto__'},{...c,sessionId:'constructor'}])assert.equal(sameFractionBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,left:[2,3]},{...task,right:[3,7]},
   {...task,common:!task.common},{...task,type:'x-fdpboard'},{...task,extra:true}])assert.equal(sameFractionBinding(changed,c),null);
 }
 const found=[],native=[],related=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(task.type==='x-samefraction')native.push(id+':'+index);
  if(sameFractionBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());assert.deepEqual(native.sort(),found.sort());
 for(const id of Object.keys(BRIDGES))sessionTasks(id).forEach((task,index)=>{
  assert.equal(sameFractionBinding(task,{sessionId:id,index}),null);
  if(task.type==='x-samefraction')related.push(id+':'+index);
 });
 assert.deepEqual(related.sort(),associatedCases.map(c=>c.id+':'+c.index).sort());assert.equal(related.length,15);
 for(const c of associatedCases){const task=taskAt(c.id,c.index);assert.equal(hash(task),c.taskHash);accepted(task,M.example(task));}
});

for(const c of cases)test(`${c.id}:${c.index} verifies real selected identities and an exact same-whole comparison`,()=>{
 const task=taskAt(c.id,c.index);
 for(const options of [{},{reverse:true,guess:wrong(c.relation)},{earlyOverlay:true,earlyRefine:true},
  {reverse:true,earlyOverlay:true,earlyRefine:true,guess:wrong(c.relation)}]){
  const model=build(task,options),proof=accepted(task,model);
  for(const side of ['left','right']){
   assert.deepEqual(proof[side].fraction,c[side]);assert.deepEqual(proof[side].unit,[1,c[side][1]]);
   assert.equal(proof[side].selectedCount,c[side][0]);assert.equal(proof[side].denominator,c[side][1]);
   assert.deepEqual(proof[side].selectedIds,Array.from({length:c[side][0]},(_,i)=>options.reverse?c[side][1]-1-i:i));
  }
  assert.equal(proof.relation,c.relation);assert.deepEqual(proof.crossProducts,[String(c.left[0]*c.right[1]),String(c.right[0]*c.left[1])]);
  assert.equal(proof.changes.length,c.left[0]+c.right[0]);assert.equal(proof.predictions.length,1);
  assert.equal(proof.firstPrediction.correct,!options.guess||options.guess===c.relation);assert.deepEqual(proof.firstPrediction,proof.currentPrediction);
  assert.deepEqual(proof.sameWhole,{toolProvided:true,submitted:'same-whole',submissionOnly:true});
  assert.deepEqual(proof.submittedRelation,{value:c.relation,submissionOnly:true});
  assert.deepEqual(proof.systemOverlay,{left:c.left,right:c.right,systemComputed:true});
  assert.deepEqual(proof.overlays[0].left,options.earlyOverlay?[0,c.left[1]]:c.left);
  assert.deepEqual(proof.overlays[0].right,options.earlyOverlay?[0,c.right[1]]:c.right);
  assert.equal(!!proof.common,c.common);
  if(c.common){assert.equal(proof.common.denominator,12);assert.deepEqual(proof.common.left,[9,12]);assert.deepEqual(proof.common.right,[8,12]);}
 }
 accepted(task,M.example(task));
});

test('all five legal common denominators work, including refinement before overlay or before coloring',()=>{
 const task=taskAt('fractionreason',0);
 for(const denominator of [12,24,36,48,60])for(const options of [{},{earlyOverlay:true},{earlyRefine:true},{earlyOverlay:true,earlyRefine:true}]){
  const model=build(task,{denominator,...options}),proof=accepted(task,model);
  assert.deepEqual(proof.common.left,[3*denominator/4,denominator]);assert.deepEqual(proof.common.right,[2*denominator/3,denominator]);
  assert.equal(proof.common.submittedLeft.submissionOnly,true);assert.equal(proof.common.systemComputed,true);
  assert.equal(proof.refinements[0].leftScale,denominator/4);assert.equal(proof.refinements[0].rightScale,denominator/3);
 }
});

test('different common grids preserve both quantities; repeated grid/overlay requests only confirm a display',()=>{
 const {task,model}=sample('fractionreason',0);
 for(const p of [24,24,60,12]){model.parts=String(p);act(task,model,'refine');}
 act(task,model,'overlay');act(task,model,'overlay');fill(task,model);
 const proof=accepted(task,model);assert.deepEqual(proof.refinements.map(r=>r.changed),[true,true,false,true,true]);
 assert.deepEqual(proof.overlays.map(r=>r.addedToDisplay),[true,false,false]);
 assert.equal(proof.changes.length,5);assert.deepEqual(proof.common.left,[9,12]);
});

test('reset keeps the first wrong prediction but allows a different current prediction and different selected identities',()=>{
 const task=taskAt('smallershare',0),model=build(task,{guess:'<'}),before=structuredClone(model);
 act(task,model,'reset');assert.deepEqual(model.board,{left:[],right:[],first:'<',prediction:null,overlay:false,refine:null});
 for(const key of Object.keys(M.fields))assert.equal(model[key],before[key]);
 build(task,{existing:model,guess:'>',reverse:true,earlyOverlay:true});const proof=accepted(task,model);
 assert.equal(proof.firstPrediction.value,'<');assert.equal(proof.firstPrediction.correct,false);
 assert.equal(proof.currentPrediction.value,'>');assert.equal(proof.currentPrediction.correct,true);
 assert.deepEqual(proof.predictions.map(p=>p.round),[0,1]);assert.deepEqual(model.history.slice(0,before.history.length),before.history);
 assert.deepEqual(proof.left.selectedIds,[1]);assert.deepEqual(proof.right.selectedIds,[3]);
});

test('a selected prediction before reset is a draft, while first comes only from a real predict event',()=>{
 const task=taskAt('smallershare',0),model=M.initial(task);model.prediction='<';act(task,model,'reset');
 assert.equal(model.board.first,null);build(task,{existing:model,guess:'>'});const proof=accepted(task,model);
 assert.equal(proof.firstPrediction.value,'>');assert.equal(proof.firstPrediction.historyIndex,1);assert.equal(proof.firstPrediction.round,1);
});

test('common reset hides and preserves all old names until a new prediction, overlay and grid make them editable',()=>{
 const {task,model}=sample('fractionreason',0),before=structuredClone(model);act(task,model,'reset');
 const controls=V.controls(task,model);assert.match(controls,/data-xfield="prediction"/);
 for(const field of ['parts','left','right','relation','reason'])assert.ok(!controls.includes(`data-xfield="${field}"`));
 assert.equal(model.left,'9/12');assert.equal(model.parts,'12');
 build(task,{existing:model,denominator:24,earlyRefine:true,guess:'<'});const proof=accepted(task,model);
 assert.equal(proof.firstPrediction.value,'>');assert.equal(proof.currentPrediction.value,'<');assert.deepEqual(proof.common.left,[18,24]);
 assert.deepEqual(model.history.slice(0,before.history.length),before.history);
});

test('actual wrong coloring and wrong visible submitted names can be corrected with the whole history retained',()=>{
 const {task,model}=sample('fractionreason',0);model.left='9/1 2';model.relation='<';model.reason='any-whole';
 act(task,model,'fraction',{row:'left',index:3});rejected(task,model,'four quarters do not match the task');
 act(task,model,'fraction',{row:'left',index:3});fill(task,model);const proof=accepted(task,model);
 assert.equal(proof.changes.at(-2).selected,true);assert.equal(proof.changes.at(-1).selected,false);
 assert.equal(model.history.at(-1).data.fields.left,'9/1 2');assert.equal(model.history.at(-1).data.fields.reason,'any-whole');
});

test('legal fraction whitespace and decimal integer grid inputs are exact without joining separate digit tokens',()=>{
 for(const parts of ['12','+12','012','12.00000000',' 12.0 ']){
  const {task,model}=sample('fractionreason',0);model.parts=parts;act(task,model,'refine');model.left=' 9 / 12 ';model.right='8 ÷ 12';accepted(task,model);
 }
 for(const [key,value]of [['left','9/1 2'],['right','8/1 2']]){
  const {task,model}=sample('fractionreason',0);model[key]=value;originalOnly(task,model,'digit concatenation '+value);
 }
 for(const [key,value]of [['left','0 9/12'],['left','18/24'],['left','0.75'],['left','9.000000000000001/12'],['right','8/0'],['left','-9/-12'],['parts','12.00000001'],['parts','1e1'],['parts','12.0000000001']]){
  const {task,model}=sample('fractionreason',0);model[key]=value;rejected(task,model,key+' '+value);
 }
});

test('invalid refinement histories stay excluded after a valid correction or reset',()=>{
 for(const bad of ['0','5','11','13','61','12.5','12.00000001','NaN','Infinity','1e1','12.0000000001']){
  const {task,model}=sample('fractionreason',0);model.parts=bad;act(task,model,'refine');
  model.parts='12';act(task,model,'refine');fill(task,model);originalOnly(task,model,'failed refinement '+bad);
  act(task,model,'reset');build(task,{existing:model});originalOnly(task,model,'reset after failed refinement '+bad);
 }
});

test('hidden predict, fraction, overlay and non-common refinement actions cannot borrow later valid work',()=>{
 for(const action of ['fraction','overlay','refine','predict']){
  const task=taskAt('smallershare',0),model=M.initial(task);
  if(action==='refine')model.parts='4';
  act(task,model,action,action==='fraction'?{row:'left',index:0}:{});
  act(task,model,'reset');model.parts='1';build(task,{existing:model});originalOnly(task,model,'hidden/empty '+action);
 }
 const {task,model}=sample();act(task,model,'predict');originalOnly(task,model,'hidden repeated predict');
 const common=sample('fractionreason',0);act(common.task,common.model,'predict');originalOnly(common.task,common.model,'hidden common predict');
});

test('both side and index must be actual visible identities, not permissive coercions or default-left aliases',()=>{
 for(const data of [{index:0},{row:'other',index:0},{row:'left',index:'00'},{row:'left',index:'+0'},
  {row:'left',index:'0.0'},{row:'right',index:'0x0'},{row:'right',index:''},{row:'left',index:2},{row:'right',index:4}]){
  const {task,model}=sample();act(task,model,'fraction',data);act(task,model,'fraction',data);originalOnly(task,model,JSON.stringify(data));
 }
});

test('current hidden fields and every historical snapshot obey the real visibility of all 35 fields',()=>{
 for(const key of ['parts','left','right','relation','reason']){
  const task=taskAt('fractionreason',0),model=M.initial(task);model[key]=key==='relation'?'<':key==='reason'?'same-whole':'12';
  build(task,{existing:model});originalOnly(task,model,'hidden initial '+key);
 }
 for(const key of Object.keys(M.fields).filter(k=>!['prediction','parts','left','right','relation','reason'].includes(k))){
  const {task,model}=sample();model[key]='foreign';originalOnly(task,model,'current foreign '+key);
  const old=build(task);old.history[0].data.fields[key]='foreign';originalOnly(task,old,'old foreign '+key);
 }
 const {task,model}=sample();model.prediction='<';originalOnly(task,model,'hidden current prediction differs from its event');
});

test('exact model, board, event, data and field keys reject foreign information and missing history',()=>{
 const mutations=[m=>m.extra=true,m=>m.board.extra=true,m=>m.history[0].extra=true,m=>m.history[0].data.before={},
  m=>m.history[0].data.after={},m=>m.history[0].data.id='x',m=>m.history[0].data.value='<',m=>m.history[0].data.fields.extra='',
  m=>delete m.history[0].data.fields.answer,m=>m.history[1].data.index=0,m=>m.history[0].data.fields.prediction='≠',
  m=>m.history[0].data.fields.prediction=0,m=>m.history=[],m=>m.history=null,m=>m.issue='stale'];
 for(const mutate of mutations){const {task,model}=sample();mutate(model);rejected(task,model,String(mutate));}
 for(const action of ['cell','token','walk','unknown']){const {task,model}=sample();model.history.push({action,data:{fields:{...M.fields}}});rejected(task,model,action);}
 const {task,model}=sample();model.history=Array(2001).fill(model.history[0]);rejected(task,model,'history limit');
});

test('first/current prediction, row identities, event order and the whole latest submission must match',()=>{
 for(const mutate of [m=>m.board.first='<',m=>m.board.prediction='<',m=>m.board.left[0]=1,m=>m.board.overlay=false,
  m=>m.board.refine=4,m=>m.history.shift(),m=>m.history.reverse(),m=>m.history.pop()]){
  const {task,model}=sample();mutate(model);rejected(task,model,'changed board/history');
 }
 const {task,model}=sample('fractionreason',0),record={attempts:[{value:structuredClone(model)}]};
 assert.equal(latestSubmissionMatches(model,record),true);
 const changed=structuredClone(model);changed.left='18/24';assert.equal(latestSubmissionMatches(changed,record),false);
 assert.equal(latestSubmissionMatches(model,{attempts:[...record.attempts,{value:changed}]}),false);
 act(task,model,'fraction',{row:'left',index:0});act(task,model,'fraction',{row:'left',index:0});accepted(task,model);
 assert.equal(latestSubmissionMatches(model,record),false,'an equal final quantity with different full history still needs a fresh check');
});

test('malformed tasks and saved models fail closed',()=>{
 const {task,model}=sample();
 for(const t of [null,{}, {...task,type:'x-fdpboard'},{...task,left:[0,2]},{...task,left:[2,1]},
  {...task,right:[1,0]},{...task,left:[1,2,3]},{...task,common:1},{...task,prompt:0},{...task,extra:true}])rejected(t,model,'bad task');
 for(const m of [null,{},[],true,{...model,board:null}])rejected(task,m,'bad model');
});

test('noncontiguous selected identities represent the same exact fraction without changing the supplied whole',()=>{
 for(const [id,index,chosen]of [['setfractions',1,{left:[1],right:[0,2]}],['tools39',2,{left:[1,4,7],right:[3]}]]){
  const task=taskAt(id,index),model=M.initial(task);model.prediction=wrong(relation(task));act(task,model,'predict');act(task,model,'overlay');
  for(const row of ['right','left'])for(const index of chosen[row])act(task,model,'fraction',{row,index});
  fill(task,model);const proof=accepted(task,model);
  for(const row of ['left','right'])assert.deepEqual(proof[row].selectedIds,chosen[row]);
  assert.equal(proof.sameWhole.toolProvided,true);assert.equal(proof.systemOverlay.systemComputed,true);
 }
});

test('all browser mathematical paths use unique reachable original controls and actual select options',t=>{
 const totals={paths:0,buttons:0,fields:0,verdicts:0};
 const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
 const driver=task=>{
  const model=M.initial(task);
  const field=(key,value)=>{
   const html=V.render(task,model),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(match=>match[0]);
   const matches=tags.filter(tag=>attrs(tag)['data-xfield']===key);assert.equal(matches.length,1,'reachable field '+key);
   assert.doesNotMatch(matches[0],/\bdisabled\b/);
   if(matches[0].startsWith('<select')){
    const select=[...html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/g)].find(match=>attrs(match[0])['data-xfield']===key);
    const choices=[...select[0].matchAll(/<option value="([^"]*)"/g)].map(match=>match[1]);assert.ok(choices.includes(String(value)),key+' actual option '+value);
   }
   model[key]=String(value);M.field(task,model,key);totals.fields++;
  };
  const action=(name,data={})=>{
   const tags=[...V.render(task,model).matchAll(/<button\b[^>]*>/g)].map(match=>match[0]);
   const matches=tags.filter(tag=>{const a=attrs(tag);return a['data-x']==='b16-'+name&&Object.entries(data).every(([key,value])=>a['data-'+key]===String(value));});
   assert.equal(matches.length,1,'reachable action '+name+' '+JSON.stringify(data));assert.doesNotMatch(matches[0],/\bdisabled\b/);
   act(task,model,name,data);assert.equal(M.valid(task,model),true);totals.buttons++;
  };
  const names=d=>{field('left',task.left[0]*d/task.left[1]+'/'+d);field('right',task.right[0]*d/task.right[1]+'/'+d);};
  const build=({reverse=false,early=false,d=12,guess=wrong(relation(task))}={})=>{
   field('prediction',guess);action('predict');if(early)action('overlay');
   if(task.common&&early){field('parts',d);action('refine');}
   for(const row of reverse?['right','left']:['left','right'])for(let i=0;i<task[row][0];i++)
    action('fraction',{row,index:reverse?task[row][1]-1-Math.floor(i*task[row][1]/task[row][0]):i});
   action('overlay');if(task.common){if(!early){field('parts',d);action('refine');}names(d);}
   field('relation',relation(task));field('reason','same-whole');
  };
  const check=(original,strict)=>{assert.equal(M.inspect(task,model).correct,original);assert.equal(!!replaySameFractionEvidence(task,model),strict);totals.verdicts++;};
  return {model,field,action,names,build,check};
 };
 for(const reverse of [false,true]){
  for(const spec of [...cases,...associatedCases]){
   const task=taskAt(spec.id,spec.index),ui=driver(task);totals.paths++;
   ui.build({reverse,early:reverse,d:reverse?24:12});
   if(spec.nodeId){
    ui.field('relation',wrong(relation(task)));ui.check(false,false);
    ui.field('relation',relation(task));ui.check(true,true);
    ui.field('reason','any-whole');ui.check(false,false);
    ui.field('reason','same-whole');ui.check(true,true);
    const index=ui.model.board.left[0];ui.action('fraction',{row:'left',index});ui.action('fraction',{row:'left',index});ui.check(true,true);
   }else{ui.check(true,true);assert.equal(sameFractionBinding(task,spec),null);}
  }
  const task=taskAt('fractionreason',0),reset=driver(task);totals.paths++;
  reset.build({early:true,guess:'<'});reset.check(true,true);reset.action('reset');reset.build({reverse:true,early:true,d:60,guess:'>'});reset.check(true,true);
  const proof=replaySameFractionEvidence(task,reset.model);assert.equal(proof.firstPrediction.value,'<');assert.equal(proof.currentPrediction.value,'>');
  const grids=driver(task);totals.paths++;grids.build({early:true});
  for(const d of [24,36,48,60,12,12]){grids.field('parts',d);grids.action('refine');grids.names(d);grids.action('overlay');grids.check(true,true);}
  assert.equal(replaySameFractionEvidence(task,grids.model).refinements.at(-1).changed,false);
  const invalid=driver(task);totals.paths++;invalid.field('prediction','<');invalid.action('predict');invalid.field('parts','5');invalid.action('refine');
  invalid.field('parts','12');invalid.action('refine');for(const row of ['left','right'])for(let index=0;index<task[row][0];index++)invalid.action('fraction',{row,index});
  invalid.action('overlay');invalid.names(12);invalid.field('relation','>');invalid.field('reason','same-whole');invalid.check(true,false);
  invalid.action('reset');invalid.build({reverse:true,early:true,d:24});invalid.check(true,false);
  const split=driver(task);totals.paths++;split.build();split.field('left','9/1 2');split.action('overlay');split.check(true,false);
  split.field('left',' 9 / 12 ');split.field('right','8 ÷ 12');split.check(true,true);
 }
 assert.equal(totals.paths,54);assert.equal(totals.verdicts,134);t.diagnostic(JSON.stringify(totals));
});

const checked=model=>({support:false,attempts:[{value:structuredClone(model)}]});
const feedbackText=value=>[value.observation,...value.detail].join('\n');
test('all eight current native submissions receive bounded feedback and all fifteen related positions remain isolated',()=>{
 for(const spec of cases){
  const task=taskAt(spec.id,spec.index),model=build(task),saved=checked(model),before=JSON.stringify(saved);
  assert.ok(thinkingGuide(task,spec));const feedback=thinkingFeedback(task,model,saved,spec);assert.ok(feedback);
  assert.equal(feedback.method,null);assert.match(feedback.observation,/工具提供了同样大的两个整体/);
  assert.match(feedback.observation,/系统按当前选择自动显示叠图/);assert.match(feedback.observation,/本次提交的比较/);
  assert.match(feedbackText(feedback),/自由解释/);assert.match(feedbackText(feedback),/长期掌握/);
  assert.doesNotMatch(feedbackText(feedback),/你(?:已经|成功)?(?:画出|构造出|证明了|算出|换算出)/);
  assert.equal(thinkingFeedback(task,model,{attempts:[]},spec),null);assert.equal(JSON.stringify(saved),before);
 }
 for(const spec of associatedCases){
  const task=taskAt(spec.id,spec.index),model=build(task);
  assert.equal(thinkingGuide(task,spec),null);assert.equal(thinkingFeedback(task,model,checked(model),spec),null);
 }
});

test('feedback separates actual selected shares from system common grids and submitted equivalent names',()=>{
 const spec=cases.find(c=>c.common),task=taskAt(spec.id,spec.index),model=build(task,{reverse:true,earlyOverlay:true,earlyRefine:true,denominator:24});
 act(task,model,'overlay');act(task,model,'refine');
 const saved=checked(model);saved.support=true;saved.attempts.unshift({value:M.initial(task)});
 const feedback=thinkingFeedback(task,model,saved,spec),words=feedbackText(feedback);
 assert.match(feedback.observation,/上边 4 个等份中选了 3 份（3\/4）/);
 assert.match(feedback.observation,/下边 3 个等份中选了 2 份（2\/3）/);
 assert.match(words,/24 等份的共同网格，由系统画出/);assert.match(words,/提交的新分数 18\/24 和 16\/24/);
 assert.match(words,/较早请求的叠图显示当时所选的量/);assert.match(words,/按你的新选择更新显示/);
 assert.match(words,/修改后又试了一次/);assert.match(words,/看过提示或比较反馈/);
 assert.doesNotMatch(words,/你把.*整体.*分成|你.*(?:画出|对齐).*整体|你.*独立证明|你.*算出.*18/);
});

test('feedback retains the first prediction separately from a different current round after a real reset',()=>{
 const spec=cases.find(c=>c.common),task=taskAt(spec.id,spec.index),model=build(task,{guess:'<'});
 act(task,model,'reset');build(task,{existing:model,guess:'>',earlyOverlay:true,earlyRefine:true,denominator:60});
 const words=feedbackText(thinkingFeedback(task,model,checked(model),spec));
 assert.match(words,/本轮留下的预测是“>”/);assert.match(words,/第一次留下的预测“<”与本轮预测分别保留/);
 assert.match(words,/保留了 1 次重摆/);assert.match(words,/45\/60 和 40\/60/);
});

test('newest submissions, edits, ambiguous names and invalid recorded refinements cannot borrow positive feedback',()=>{
 const spec=cases.find(c=>c.common),task=taskAt(spec.id,spec.index),model=build(task),saved=checked(model);
 model.reason='any-whole';assert.equal(thinkingFeedback(task,model,saved,spec),null);assert.equal(thinkingFeedback(task,model,checked(model),spec),null);
 model.reason='same-whole';model.left='9/1 2';assert.equal(M.inspect(task,model).correct,true);
 assert.equal(thinkingFeedback(task,model,checked(model),spec),null);
 model.left=' 9 / 12 ';model.right='8 ÷ 12';assert.ok(thinkingFeedback(task,model,checked(model),spec));
 const newer={attempts:[{value:structuredClone(model)},{value:M.initial(task)}]};assert.equal(thinkingFeedback(task,model,newer,spec),null);
 model.parts='5';act(task,model,'refine');model.parts='12';act(task,model,'refine');fill(task,model);
 assert.equal(M.inspect(task,model).correct,true);assert.equal(thinkingFeedback(task,model,checked(model),spec),null);
 act(task,model,'reset');build(task,{existing:model});assert.equal(M.inspect(task,model).correct,true);
 assert.equal(thinkingFeedback(task,model,checked(model),spec),null);
});
