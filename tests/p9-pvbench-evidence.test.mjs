import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import fixture from './fixtures/p9-pvbench-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionMeta,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as M from '../dist/learning/phase5/b07-model.js';
import * as V from '../dist/learning/phase5/b07-view.js';
import {freshLesson,submitLesson,validateLesson} from '../dist/learning/state.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {pvbenchBinding,replayPVBenchEvidence} from '../dist/learning/pvbench-evidence.js';
import {pvbenchEvidenceExample,pvbenchEvidenceSteps} from '../scripts/pvbench-evidence-fixture.mjs';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import {auditEvidenceExpansion} from '../scripts/audit-evidence-expansion.mjs';

await ensureB39Ready();
const {cases,associated,unbound}=fixture;
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const taskFor=c=>sessionTasks(c.id)[c.index],clone=structuredClone;
const original=(task,model)=>{assert.equal(M.valid(task,model),true);assert.equal(M.inspect(task,model).correct,true);};
const accepted=(task,model)=>{original(task,model);const proof=replayPVBenchEvidence(task,model);assert.ok(proof);return proof;};
const rejected=(task,model,label)=>assert.equal(replayPVBenchEvidence(task,model),null,label);
const swap=(task,model,kind)=>M.act(task,model,'pv-swap',{kind});
const save=(task,model)=>M.act(task,model,'pv-save');
const opposite={up1:'down1',down1:'up1',up10:'down10',down10:'up10',up100:'down100',down100:'up100'};
const button=(task,model,action,kind)=>[...V.render(task,model).matchAll(/<button\b[^>]*>/g)]
 .map(m=>m[0]).find(html=>html.includes(`data-x="${action}"`)&&(kind===undefined||html.includes(`data-kind="${kind}"`)));
const applyVisible=(task,model,step)=>{
 const html=V.render(task,model);
 if(step.field){
  assert.ok(html.includes(`data-xfield="${step.field}"`),'field is genuinely rendered: '+step.field);
  const [key,index]=step.field.split('.');if(index===undefined)model[key]=step.value;else model[key][index]=step.value;
  M.field(task,model,step.field);
 }else{
  const control=button(task,model,step.action,step.data?.kind);
  assert.ok(control,'action is genuinely rendered: '+JSON.stringify(step));assert.doesNotMatch(control,/\bdisabled\b/);
  const before=clone(model);M.act(task,model,step.action,step.data);
  assert.notDeepEqual(model,before,'every positive sample action really succeeds');
 }
};
const boundedFeedback=(task,model,record,context)=>pvbenchBinding(task,context)&&latestSubmissionMatches(model,record)?
 replayPVBenchEvidence(task,model):null;

test('all fixed source entries reject malformed JSON keys before source lookup without changing valid work',()=>{
 for(const c of cases){
  const task=taskFor(c),model=pvbenchEvidenceExample(task),record={support:false,attempts:[{value:clone(model)}]};
  const before=JSON.stringify({task,model,record}),good=pvbenchBinding(task,c);
  assert.ok(good);assert.ok(thinkingGuide(task,c));assert.ok(thinkingFeedback(task,model,record,c));
  const malformed=JSON.parse(JSON.stringify([
   {sessionId:{toString:null},index:c.index},{sessionId:{toString:0,valueOf:null},index:c.index},
   {sessionId:[c.id],index:c.index},{sessionId:null,index:c.index},{sessionId:false,index:c.index},
   {sessionId:c.id,index:{toString:null}},{sessionId:c.id,index:[c.index]},
   {sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:false},{sessionId:c.id,index:0.5}
  ]));
  for(const context of malformed){
   assert.equal(pvbenchBinding(task,context),null);
   assert.equal(thinkingGuide(task,context),null);assert.equal(thinkingFeedback(task,model,record,context),null);
  }
  assert.deepEqual(pvbenchBinding(task,JSON.parse(JSON.stringify(c))),good);
  assert.equal(JSON.stringify({task,model,record}),before);
 }
});

test('eleven reviewed native questions, six source nodes, complete hashes and no associated authorization',()=>{
 assert.equal(cases.length,11);assert.equal(new Set(cases.map(c=>c.nodeId)).size,6);
 assert.equal(cases.filter(c=>c.savedGoal===null).length,8);assert.equal(cases.filter(c=>c.savedGoal!==null).length,3);
 const found=[];
 for(const id of Object.keys(LESSONS))sessionTasks(id).forEach((task,index)=>{
  if(pvbenchBinding(task,{sessionId:id,index}))found.push(id+':'+index);
 });
 assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const c of cases){
  const task=taskFor(c);assert.equal(hash(task),c.taskHash);assert.equal(sessionMeta(c.id).topicId,c.nodeId);
  assert.equal(pvbenchBinding(task,c)?.nodeId,c.nodeId);assert.equal(pvbenchBinding(task,c)?.method,null);
  assert.deepEqual(task.start,c.start);assert.equal(task.n,c.n);
  for(const context of [null,[],false,{}, {...c,index:String(c.index)},{...c,index:-1},
   {...c,sessionId:'__proto__'},{...c,index:999}])assert.equal(pvbenchBinding(task,context),null);
  for(const changed of [{...task,prompt:task.prompt+' changed'},{...task,n:task.n+1},
   {...task,start:[0,0,0,0]},{...task,fixed:false}])assert.equal(pvbenchBinding(changed,c),null);
 }
 for(const [file,expected] of Object.entries(fixture.sourceHashes))
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),expected,file);
});

test('all twenty-six nonfixed native tasks and eighteen associated benches remain isolated',()=>{
 assert.equal(unbound.length,26);assert.equal(associated.length,18);
 const natives=Object.keys(LESSONS).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task})))
  .filter(c=>c.task.type==='x-pvbench');assert.equal(natives.length,37);
 assert.deepEqual(natives.filter(c=>!c.task.fixed).map(c=>c.id+':'+c.index).sort(),unbound.map(c=>c.id+':'+c.index).sort());
 const links=Object.keys(BRIDGES).flatMap(id=>sessionTasks(id).map((task,index)=>({id,index,task})))
  .filter(c=>c.task.type==='x-pvbench');
 assert.deepEqual(links.map(c=>c.id+':'+c.index).sort(),associated.map(c=>c.id+':'+c.index).sort());
 for(const c of [...unbound,...associated]){
  const task=taskFor(c);assert.equal(hash(task),c.taskHash);assert.equal(pvbenchBinding(task,c),null);
  const model=pvbenchEvidenceExample(task);original(task,model);
  if(!task.fixed){rejected(task,model);assert.deepEqual(model,M.example(task));}
 }
});

for(const c of cases)test(`${c.id}:${c.index} original controls build the reviewed successful exchanges and saved goal`,()=>{
 const task=taskFor(c),model=M.initial(task),steps=pvbenchEvidenceSteps(task);
 assert.deepEqual(steps.filter(s=>s.action).map(s=>s.action==='pv-save'?'save':s.data.kind),c.actions);
 for(const step of steps)applyVisible(task,model,step);
 assert.deepEqual(model,pvbenchEvidenceExample(task));assert.deepEqual(model.u,c.final);
 const before=clone({task,model}),proof=accepted(task,model);
 assert.deepEqual(proof.initial,c.start);assert.deepEqual(proof.final,c.final);assert.equal(proof.total,c.n);
 assert.deepEqual(proof.unitOrder,['hundreds','tens','ones','thousands']);assert.deepEqual(proof.unitValues,[100,10,1,1000]);
 assert.equal(proof.swapCount,c.actions.filter(a=>a!=='save').length);
 assert.equal(proof.swapCount,proof.combined+proof.split);
 assert.equal(proof.historyScope,'successful-swaps-only');assert.equal(proof.inputScope,'stored-numbers');
 assert.equal(proof.saved?.goal??null,c.savedGoal);
 if(proof.saved){assert.equal(proof.saved.exactTimingKnown,false);assert.equal(proof.saved.compatibleWithRecordedPath,true);
  assert.deepEqual(proof.saved.representations,model.saved.map(s=>({units:s.u,form:s.form})));}
 for(const step of proof.swaps){assert.equal(M.total(step.before),c.n);assert.equal(M.total(step.after),c.n);
  assert.notDeepEqual(step.before,step.after);assert.ok([10,100,1000].includes(step.quantity));}
 assert.deepEqual({task,model},before,'replay cannot mutate the real work or the question');
});

test('latest checked snapshots retain wrong answers, corrections and complete original v2 attempts',()=>{
 for(const c of cases){
  const task=taskFor(c),record=freshLesson(c.id);record.index=c.index;record.models[c.index]=pvbenchEvidenceExample(task);
  const model=record.models[c.index];model.answer=task.n-1;
  assert.equal(submitLesson(record).correct,false);const first=clone(record.cases[c.index].attempts[0]);
  assert.equal(boundedFeedback(task,model,record.cases[c.index],c),null);
  model.answer=task.n;assert.equal(boundedFeedback(task,model,record.cases[c.index],c),null);
  assert.equal(submitLesson(record).correct,true);assert.ok(boundedFeedback(task,model,record.cases[c.index],c));
  const saved=clone(record),before=clone(record.cases[c.index].attempts);
  const loop=model.u[3]?['down100','up100']:model.u[1]?['down1','up1']:['up1','down1'];
  for(const kind of loop)swap(task,model,kind);
  original(task,model);assert.equal(boundedFeedback(task,model,record.cases[c.index],c),null,'new successful actions still require a new check');
  assert.equal(submitLesson(record).correct,true);assert.ok(boundedFeedback(task,model,record.cases[c.index],c));
  assert.equal(record.cases[c.index].attempts.length,3);assert.deepEqual(record.cases[c.index].attempts.slice(0,2),before);
  assert.deepEqual(record.cases[c.index].attempts[0],first);
  const restored=validateLesson(JSON.parse(JSON.stringify(record)),c.id);
  assert.deepEqual(restored.models[c.index],model);assert.deepEqual(restored.cases[c.index],record.cases[c.index]);
  assert.ok(boundedFeedback(task,restored.models[c.index],restored.cases[c.index],c));
  assert.equal(boundedFeedback(task,saved.models[c.index],record.cases[c.index],c),null,'older correct work cannot outrank the latest attempt');
 }
});

test('successful legal detours preserve the exact quantity and required ordered exchange subsequence',()=>{
 let checked=0;
 for(const c of cases){
  const task=taskFor(c),base=pvbenchEvidenceExample(task),paths=[[]];
  for(let depth=0;depth<3;depth++)for(const path of paths.filter(p=>p.length===depth)){
   const model=clone(base);for(const kind of path)swap(task,model,kind);
   for(const kind of Object.keys(opposite)){
    const next=clone(model),before=next.history.length;swap(task,next,kind);
    if(next.history.length===before)continue;
    const extended=[...path,kind];paths.push(extended);
    for(const reverse of [...extended].reverse())swap(task,next,opposite[reverse]);
    const proof=accepted(task,next);assert.deepEqual(next.u,base.u);assert.equal(proof.swapCount,base.history.length+extended.length*2);checked++;
   }
  }
 }
 assert.ok(checked>100,'compare many genuine model paths, including one/ten/hundred/thousand boundaries');
});

test('unlogged insufficient-stock and representation-limit clicks cannot become observed exchanges',()=>{
 const small=taskFor(cases[0]),empty=M.initial(small),disabled=button(small,empty,'pv-swap','down1');
 assert.match(disabled,/\bdisabled\b/);const unchanged=clone(empty);swap(small,empty,'down1');assert.deepEqual(empty,unchanged);
 const task=sessionTasks('problems1000')[0],model=pvbenchEvidenceExample(task);
 for(let i=0;i<9;i++)swap(task,model,'down1');assert.deepEqual(model.u,[0,14,96,0]);
 assert.doesNotMatch(button(task,model,'pv-swap','down1'),/\bdisabled\b/,'the actual UI leaves this limit-hitting control enabled');
 const before=clone(model);swap(task,model,'down1');assert.deepEqual(model,before,'106 ones exceeds the unchanged model limit and creates no history entry');
 for(let i=0;i<9;i++)swap(task,model,'up1');
 const proof=accepted(task,model);assert.equal(proof.swapCount,20);assert.equal(proof.historyScope,'successful-swaps-only');
 assert.equal(proof.swaps.filter(s=>s.kind==='down1').length,9,'the ignored tenth click is not reported as an exchange');
});

test('a forged logged no-op, insufficient stock or overflowing representation fails even when final grading succeeds',()=>{
 const task=sessionTasks('tenexchange')[0],model=pvbenchEvidenceExample(task);
 model.history.unshift('down1','up1');original(task,model);rejected(task,model,'initial ten ones do not contain a ten to split');
 const large=sessionTasks('problems1000')[0],overflow=pvbenchEvidenceExample(large);
 overflow.history.push(...Array(10).fill('down1'),...Array(10).fill('up1'));
 original(large,overflow);rejected(large,overflow,'106 ones exceeds the actual board limit even if a later forged exchange cancels it');
 const full=sessionTasks('screen1000')[2],wrong=pvbenchEvidenceExample(full);wrong.history.unshift('up100');
 original(full,wrong);rejected(full,wrong,'a second thousand is outside both stock and capacity');
});

test('the original example remains unchanged but cannot manufacture evidence or invisible field edits',()=>{
 for(const c of cases){const task=taskFor(c),old=M.example(task);original(task,old);rejected(task,old,c.id+':'+c.index);}
 const changed={...sessionTasks('rename')[0],prompt:'unreviewed saving instruction'};
 assert.throws(()=>pvbenchEvidenceExample(changed),/Unreviewed/);assert.throws(()=>pvbenchEvidenceSteps(changed),/Unreviewed/);
 assert.throws(()=>pvbenchEvidenceExample({type:'x-other'}),/Expected/);
});

test('rename zero must retain the changed target representation, not just any same-total snapshot',()=>{
 const task=sessionTasks('rename')[0],model=M.initial(task);save(task,model);swap(task,model,'down1');model.answer=34;model.why='same';
 original(task,model);rejected(task,model,'the old grader accepts saving only the start; the actual prompt asks for the changed form');
 save(task,model);const proof=accepted(task,model);
 assert.equal(proof.saved.goal,'specified-end');assert.equal(proof.saved.count,2);assert.equal(proof.saved.exactTimingKnown,false);
 const before=clone(model);save(task,model);assert.deepEqual(model,before,'the unchanged original save button ignores a duplicate');
 assert.deepEqual(accepted(task,model),proof,'a duplicate click supplies no additional saved representation');
});

test('three different saved representations must all occur along one compatible ordered recorded path',()=>{
 const task=sessionTasks('rename')[1],model=pvbenchEvidenceExample(task);
 for(const change of [m=>{m.saved.reverse();},m=>{m.saved[1].u=[0,2,32,0];},
  m=>{m.saved[1]=clone(m.saved[0]);},m=>{m.saved[0].form='sticks';},m=>{m.history=[];}]){
  const bad=clone(model);change(bad);rejected(task,bad);
 }
 const detour=M.initial(task);save(task,detour);swap(task,detour,'down1');save(task,detour);swap(task,detour,'up1');
 swap(task,detour,'down1');swap(task,detour,'down1');save(task,detour);detour.answer=52;
 const proof=accepted(task,detour);assert.equal(proof.saved.count,3);assert.equal(proof.swapCount,4);
 assert.equal(proof.saved.exactTimingKnown,false);assert.ok(proof.saved.representations.every(s=>!Object.hasOwn(s,'eventIndex')));
});

test('before/after one ten requires the actual two saved forms and an observed corresponding split',()=>{
 const task=sessionTasks('problems1000')[2],model=M.initial(task);save(task,model);swap(task,model,'down10');save(task,model);model.answer=362;
 original(task,model);rejected(task,model,'two arbitrary distinct forms do not fulfil the instruction to split one ten');
 swap(task,model,'up10');swap(task,model,'down1');save(task,model);
 const proof=accepted(task,model);assert.equal(proof.saved.count,3);assert.equal(proof.saved.goal,'before-after-one-ten');
 const backwards=M.initial(task);swap(task,backwards,'down1');save(task,backwards);swap(task,backwards,'up1');save(task,backwards);backwards.answer=362;
 original(task,backwards);rejected(task,backwards,'saving after then before is not the requested ordered pair');
 // This path visits both snapshots in order but never splits a ten directly
 // from the original representation: the recorded edge is still necessary.
 const bypass=M.initial(task);save(task,bypass);swap(task,bypass,'down10');swap(task,bypass,'down1');swap(task,bypass,'up10');save(task,bypass);bypass.answer=362;
 original(task,bypass);rejected(task,bypass,'same endpoints alone cannot infer the missing specific exchange');
});

test('saved data cannot introduce unknown forms, fields, unvisited states, duplicate or oversized lists',()=>{
 const task=sessionTasks('rename')[1],model=pvbenchEvidenceExample(task);
 for(const change of [m=>{m.saved[0].extra=true;},m=>{m.saved[0].u=[0,0,52,0];},
  m=>{m.saved[0].u=[0,5,2,1];},m=>{m.saved[0].u[2]=2.5;},m=>{m.saved[0].form='other';},
  m=>{m.saved=Array.from({length:21},()=>clone(m.saved[0]));},m=>{m.saved=[null];}]){
  const bad=clone(model);change(bad);rejected(task,bad);
 }
 const plain=sessionTasks('tenexchange')[0],noSave=pvbenchEvidenceExample(plain);
 assert.equal(button(plain,noSave,'pv-save'),undefined);save(plain,noSave);original(plain,noSave);rejected(plain,noSave,'an unavailable save control is not part of this task');
});

test('twenty-three full tens is a count of units, never a two-digit tens-place digit',()=>{
 const task=sessionTasks('problems1000')[0],model=pvbenchEvidenceExample(task),proof=accepted(task,model);
 assert.deepEqual(proof.final,[0,23,6,0]);assert.deepEqual(proof.submitted.packReport,{packs:23,remainder:6});
 assert.equal(proof.total,23*10+6);assert.equal(proof.swaps[0].fromUnit,'hundreds');assert.equal(proof.swaps[0].toUnit,'tens');
 for(const [packs,remainder] of [[3,6],[23,0],[24,-4]]){const bad=clone(model);bad.packs=packs;bad.remainder=remainder;rejected(task,bad);}
});

test('expanded values describe the current submission after the real exchange',()=>{
 const task=sessionTasks('faces1000')[3],model=pvbenchEvidenceExample(task),proof=accepted(task,model);
 assert.deepEqual(proof.initial,[3,14,2,0]);assert.deepEqual(proof.final,[4,4,2,0]);assert.deepEqual(proof.submitted.expanded,[400,40,2]);
 for(const parts of [[4,4,2],[300,140,2],[400,4,2]]){const bad=clone(model);bad.parts=parts;rejected(task,bad);}
 assert.equal(proof.swaps.length,1,'entering expanded values does not fabricate separate manipulation events');
});

test('stored integers are exact in the bounded domain while lost input spelling is explicitly outside evidence',()=>{
 const task=sessionTasks('rename')[0],base=pvbenchEvidenceExample(task);
 for(const answer of [34.5,33.99999999999999,-34,Infinity,NaN,'34',null]){const model=clone(base);model.answer=answer;rejected(task,model);}
 for(const value of [1.5,-1,Infinity,NaN,'2',Number.MAX_SAFE_INTEGER]){const model=clone(base);model.u[0]=value;rejected(task,model);}
 const rounded=clone(base);rounded.answer=Number('34.000000000000000001');assert.equal(rounded.answer,34);
 assert.equal(accepted(task,rounded).inputScope,'stored-numbers','the original input handler loses spelling before this adapter sees it');
 const limit=sessionTasks('screen1000')[2],proof=accepted(limit,pvbenchEvidenceExample(limit));
 assert.deepEqual(proof.final,[0,0,0,1]);assert.equal(proof.total,1000);assert.equal(proof.swaps.at(-1).quantity,1000);
});

test('hidden fields, model shape, history order and final stock must all agree',()=>{
 for(const c of cases){const task=taskFor(c),base=pvbenchEvidenceExample(task);
  const changes=[m=>{m.extra=true;},m=>{delete m.touched;},m=>{m.form='sticks';},m=>{m.mark=task.n;},
   m=>{m.touched=true;},m=>{m.cell=task.n;},m=>{m.words=[''];},m=>{m.history=[];},
   m=>{m.history.push('unknown');},m=>{m.history[0]={kind:m.history[0]};},m=>{m.u=[0,0,0,0];}];
  if(!task.expanded)changes.push(m=>{m.parts=[0,0,task.n];});
  if(!task.packReport)changes.push(m=>{m.packs=0;},m=>{m.remainder=0;});
  if(!task.why)changes.push(m=>{m.why='same';});
  for(const change of changes){const bad=clone(base);change(bad);rejected(task,bad,c.id+':'+c.index);}
 }
});

test('bounded event capacity accepts two hundred actual exchanges and rejects an extra claimed event',()=>{
 const task=sessionTasks('tenexchange')[0],model=pvbenchEvidenceExample(task);
 for(let i=1;i<100;i++){swap(task,model,'up1');swap(task,model,'down1');}
 assert.equal(accepted(task,model).swapCount,200);const before=clone(model);swap(task,model,'up1');assert.deepEqual(model,before);
 model.history.push('up1');rejected(task,model);
});

test('the actual browser loop selector uses enabled controls for every initial and final native or associated bench',()=>{
 const source=fs.readFileSync(new URL('./p9-pvbench-adapter-browser.cjs',import.meta.url),'utf8');
 const definition=source.match(/const loopFor=current=>[\s\S]*?;/)?.[0];assert.ok(definition);
 const choose=vm.runInNewContext(definition+'\nloopFor');
 for(const c of [...cases,...associated.filter(c=>c.fixed)]){
  const task=taskFor(c);
  for(const model of [M.initial(task),pvbenchEvidenceExample(task)]){
   const before=clone(model),path=Array.from(choose(model));assert.equal(path.length,2);
   for(const kind of path)applyVisible(task,model,{action:'pv-swap',data:{kind}});
   assert.deepEqual(model.u,before.u);assert.deepEqual(model.saved,before.saved);
   assert.equal(model.history.length,before.history.length+2);
   if(before.answer!==null)accepted(task,model);
  }
 }
});

test('the actual browser builder reaches all eleven native and eighteen associated tasks through original rendered controls',async t=>{
 const source=fs.readFileSync(new URL('./p9-pvbench-adapter-browser.cjs',import.meta.url),'utf8');
 const loop=source.match(/const loopFor=current=>[\s\S]*?;/)?.[0];assert.ok(loop);
 const start=source.indexOf('const build=async(spec'),end=source.indexOf('const check=async',start);
 assert.ok(start>=0&&end>start);let actions=0,fields=0,paths=0;
 const build=vm.runInNewContext(loop+'\n'+source.slice(start,end)+'\nbuild',{
  M,taskFor,pvbenchEvidenceSteps,label:'actual browser construction probe',ok:(value,message)=>assert.ok(value,message),
  apply:async(spec,expected,step)=>{applyVisible(taskFor(spec),expected,step);if(step.field)fields++;else actions++;}
 });
 for(const c of [...cases,...associated])for(const detour of [false,true]){
  const model=await build(c,{detour}),task=taskFor(c);original(task,model);
  if(task.fixed)accepted(task,model);else rejected(task,model);paths++;
 }
 assert.equal(paths,58);assert.ok(actions>100);assert.ok(fields>100);
 t.diagnostic(JSON.stringify({paths,enabledActualActions:actions,renderedActualFields:fields}));
});

test('unknown task purposes, save goals and malformed inputs fail closed without breaking the UI',()=>{
 const task=sessionTasks('tenexchange')[0],model=pvbenchEvidenceExample(task);
 for(const t of [null,{}, {...task,type:'x-countwalk'},{...task,fixed:false},{...task,n:0},
  {...task,forms:['blocks','sticks']},{...task,saveCount:2},{...task,why:'zero'},
  {...task,exchanges:['unknown']},{...task,start:[0,0,10,0,0]}])rejected(t,model);
 for(const value of [null,[],{},false,{...model,history:null},{...model,saved:null}])rejected(task,value);
 const cycle=clone(model);cycle.saved=[cycle];rejected(task,cycle);
});

test('registered feedback uses actual checked work, preserves all attempts and never propagates to nonfixed or associated tasks',()=>{
 const adapter=EVIDENCE_ADAPTERS.find(a=>a.id==='pvbench');assert.ok(adapter);assert.equal(adapter.type,'x-pvbench');
 assert.equal(adapter.replay,replayPVBenchEvidence);assert.equal(adapter.binding,pvbenchBinding);
 for(const c of cases){
  const task=taskFor(c),model=pvbenchEvidenceExample(task),record={support:true,attempts:[{value:clone(model)}]},before=clone(record);
  assert.match(thinkingGuide(task,c).summary,/想一想/);
  const feedback=thinkingFeedback(task,model,record,c);assert.ok(feedback);assert.equal(feedback.method,null);
  assert.match(feedback.observation,/记录里有 \d+ 次成功交换/);assert.match(feedback.detail.join(' '),/自由解释.*长期掌握/);
  assert.equal(thinkingFeedback(task,model,null,c),null);
  const edited=clone(model);edited.answer=task.n-1;assert.equal(thinkingFeedback(task,edited,record,c),null);
  assert.equal(thinkingFeedback(task,edited,{attempts:[{value:edited}]},c),null);
  assert.equal(thinkingFeedback(task,model,{attempts:[{value:model},{value:edited}]},c),null);
  assert.equal(thinkingFeedback({...task,prompt:task.prompt+' changed'},model,record,c),null);
  assert.deepEqual(record,before,'production feedback never reconstructs or edits the checked record');
 }
 for(const c of [...unbound,...associated]){
  const task=taskFor(c),model=pvbenchEvidenceExample(task);
  assert.equal(thinkingGuide(task,c),null);assert.equal(thinkingFeedback(task,model,{attempts:[{value:model}]},c),null);
 }
});

test('feedback separates successful exchange records, saved-path compatibility, submitted values and unlogged input history',()=>{
 for(const c of cases){
  const task=taskFor(c),model=pvbenchEvidenceExample(task),feedback=thinkingFeedback(task,model,{attempts:[{value:model}]},c);
  const text=[feedback.observation,...feedback.detail].join(' '),proof=accepted(task,model);
  assert.ok(text.includes(String(proof.total)));assert.match(text,/没有留下交换记录的点击/);
  assert.doesNotMatch(text,/所有点击都|全部点击都|每次点击都.{0,12}(?:验证|正确|成功)|原始输入.{0,8}精确/);
  if(proof.saved){assert.ok(text.includes(`已保存 ${proof.saved.count} 种装法`));assert.match(text,/保存顺序可以与记录中的交换路径对应/);
   assert.match(text,/不能确定每次保存发生在第几次交换之后/);assert.doesNotMatch(text,/第\s*\d+\s*次交换后保存|紧接着.{0,8}保存/);}
  if(task.packReport){assert.match(text,/提交的记录是 23 包十颗，余 6 颗/);assert.doesNotMatch(text,/十位(?:数字)?(?:是|为)?\s*23/);}
  if(task.expanded)assert.match(text,/提交的展开记录是 400 \+ 40 \+ 2 = 442/);
 }
});

test('engineering fixtures cannot repair a learner bad saved target or invented history inside production replay or the audit',()=>{
 const c=cases.find(c=>c.id==='rename'&&c.index===0),task=taskFor(c),good=pvbenchEvidenceExample(task);
 for(const change of [m=>{m.saved=[{u:[...task.start],form:'blocks'}];},m=>{m.history.unshift('up1','down1');}]){
  const bad=clone(good);change(bad);const before=clone(bad);original(task,bad);
  rejected(task,bad);assert.equal(thinkingFeedback(task,bad,{attempts:[{value:clone(bad)}]},c),null);
  assert.deepEqual(bad,before,'the production path must not call the engineering helper to replace supplied work');
  const report=auditEvidenceExpansion({adapters:EVIDENCE_ADAPTERS.map(adapter=>adapter.id!=='pvbench'?adapter:{...adapter,
   replay:(t,model)=>{const supplied=clone(model);if(t===task)change(supplied);return adapter.replay(t,supplied);}
  })});
  assert.ok(report.defects.some(d=>d.kind==='reviewed-replay-failed'&&d.id==='rename:0'),
   'an invalid supplied replay is an audit defect, not silently replaced by a valid sample');
 }
 assert.deepEqual(pvbenchEvidenceExample(task),good,'sample creation itself remains deterministic and independent');
});
