import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import fixture from './fixtures/p9-numeric-legacy.cjs';
import {number} from '../dist/learning/phase5/b20-model.js';
import * as b24 from '../dist/learning/phase5/b24-model.js';
import {visual} from '../dist/learning/phase5/b24-view.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {TASKS,validModel,inspect,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {usesSharedNumber} from '../dist/learning/phase4/engine.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {freshLesson,validateLesson,numericCompatibility,validStoredModel,retryNumericLesson,submitLesson,lessonSummary,currentSubmission,mergeLesson,assertNoConcurrentLessonOverwrite} from '../dist/learning/state.js';
import {fresh,validate,backup,parseBackup,merge,nodeProgress} from '../dist/exploration-core.js';
import {captureSession,validateScene,addQuestion,resumeQuestion} from '../dist/learning/daily.js';
import {assertNoImportConflicts} from '../dist/import-conflicts.js';
import {packText,unpackText,writeStored} from '../dist/storage.js';
import {thinkingFeedback} from '../dist/learning/thinking-feedback.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
const historical=path=>execFileSync('git',['show',fixture.sourceCommit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:4_000_000});
const dataURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const old20=historical('dist/learning/phase5/b20-model.js');
const old20URL=dataURL(old20);
const rewriteImports=(source,path,overrides={})=>source.replace(/(from\s*|import\s*)(['"])(\.\.?\/[^'"]+)\2/g,(_all,prefix,quote,specifier)=>prefix+quote+(overrides[specifier]||new URL(specifier,new URL('../'+path,import.meta.url)).href)+quote);
const engineIds=[20,21,22,23,24,25,26,28,29,30];
const engines=new Map();
for(const id of engineIds){
 const path=`dist/learning/phase5/b${id}-model.js`;
 engines.set(id,{current:await import('../'+path),old:await import(dataURL(rewriteImports(historical(path),path,{'./b20-model.js':old20URL})))});
}
await ensureB39Ready();
const legacy=id=>structuredClone(fixture.backup.state.lessons[id]);
const stateWith=record=>{const state=fresh();state.lessons[record.id]=record;return validate(state,atlas);};
const retried=id=>{const record=legacy(id);retryNumericLesson(record,JSON.stringify(record.models[record.index]));return record;};

test('the pinned legacy fixture comes from unmodified historical parsers and reproduces their accepted records',()=>{
 assert.equal(createHash('sha256').update(old20).digest('hex'),fixture.sourceHashes.b20);
 assert.equal(createHash('sha256').update(historical('dist/learning/phase5/b24-model.js')).digest('hex'),fixture.sourceHashes.b24);
 assert.equal(fixture.provenance.realHistoricalChildBackup,false);
 for(const {id,index,originalCorrect} of fixture.legacyCases){
  const task=sessionTasks(id)[index],model=legacy(id).models[index];
  assert.equal(engines.get(24).old.valid(task,model),true,id);
  assert.equal(engines.get(24).old.inspect(task,model).correct,originalCorrect,id);
  assert.equal(validModel(task,model),false,id);
  assert.equal(inspect(task,model).correct,false,id);
 }
});

test('mixed-number sign comes from the literal minus, including zero and leading zero whole parts',()=>{
 for(const [input,expected] of [['-0 1/2',-.5],['-00 5/1',-5],['-000 2/4',-.5],[' -0 1/3 ',-1/3],['-1 1/2',-1.5],['-01 2/3',-5/3],['0 1/2',.5],['00 5/1',5],['4 4/8',4.5],['8 7/8',8.875],['1 1/1',2],['-1 1/1',-2],['-0.5',-.5],['-1/2',-.5],['0',0]])
  assert.ok(Math.abs(number(input)-expected)<=Number.EPSILON*Math.max(1,Math.abs(expected)),input);
 assert.equal(Object.is(number('-0 0/2'),-0),true);
 for(const input of ['', ' ', '1/0','-0 1/0','-0 1/-2','+0 1/2','−0 1/2','1e2','-.5','- 0 1/2','0 1.5/2','NaN','Infinity'])assert.equal(Number.isNaN(number(input)),true,input);
});

for(const [id,expectedNative,expectedBridge] of [[20,46,57],[21,42,67],[22,45,66],[23,87,58],[24,64,70],[25,67,33],[26,10,3],[28,85,59],[29,15,15],[30,43,44]]){
 test(`B${id}: every standard native and associated example retains its exact historical snapshot and original result`,()=>{
  const {current,old}=engines.get(id),native=Object.entries(TASKS).flatMap(([sessionId,tasks])=>tasks.map((task,index)=>({sessionId,task,index}))).filter(x=>current.TYPES.has(x.task.type));
  const bridge=Object.entries(BRIDGES).flatMap(([sessionId,item])=>item.tasks.map((task,index)=>({sessionId,task,index}))).filter(x=>current.TYPES.has(x.task.type));
  assert.equal(native.length,expectedNative);assert.equal(bridge.length,expectedBridge);
  for(const {sessionId,task,index} of [...native,...bridge]){
   const label=`${sessionId}:${index}`,before=old.example(task),after=current.example(task);
   assert.equal(JSON.stringify(after),JSON.stringify(before),label+' full model unchanged');
   assert.equal(current.valid(task,before),true,label+' historical work still valid');
   assert.equal(current.inspect(task,before).correct,true,label+' historical work still passes');
   assert.equal(validModel(task,after),true,label+' current original validator');
   assert.equal(inspect(task,after).correct,true,label+' current original grader');
   assert.equal(numericCompatibility(task,after),false,label+' no archive compatibility for ordinary work');
  }
 });
}

test('actual shared-parser coverage is exactly 504 native and 472 associated tasks',()=>{
 assert.equal(Object.values(TASKS).flat().filter(usesSharedNumber).length,504);
 assert.equal(Object.values(BRIDGES).flatMap(b=>b.tasks).filter(usesSharedNumber).length,472);
});

test('fractional and signed mixed predictions draw the same finite coordinates as their numeric values',()=>{
 const task=sessionTasks('pointmove')[0];
 const drawing=(x,y)=>{const model=b24.initial(task,314159);model.predX=x;model.predY=y;b24.act(task,model,'p24-predict');assert.equal(b24.valid(task,model),true);return visual(task,model);};
 for(const [x,y,decimalX,decimalY] of [['5/1','3/1','5','3'],['0 1/2','-1 1/2','0.5','-1.5'],['-0 1/2','-00 3/1','-0.5','-3']]){
  const picture=drawing(x,y);assert.doesNotMatch(picture,/NaN|Infinity/);assert.match(picture,/你的猜想/);assert.equal(picture,drawing(decimalX,decimalY));
 }
 const corrupt=b24.initial(task,314159);corrupt.board.prediction={x:'1/0',y:'3'};
 assert.doesNotMatch(visual(task,corrupt),/NaN|Infinity|你的猜想/);
});

test('new negative predictions and negative movement remain genuine legal exploration, while a negative scale is rejected',()=>{
 const task=sessionTasks('pointmove')[0],model=b24.initial(task,314159);
 model.predX='-0 5/1';model.predY='3';b24.act(task,model,'p24-predict');
 assert.equal(model.board.first.incorrectPrediction,true);
 model.dx='-0 2/1';model.dy='0';b24.act(task,model,'p24-operate');
 assert.deepEqual(model.board.image,[[0,3]]);
 model.dx='3';b24.act(task,model,'p24-operate');model.answers=['5','3'];
 assert.equal(validModel(task,model),true);assert.equal(inspect(task,model).correct,true);assert.equal(numericCompatibility(task,model),false);
 model.answers[0]='-00 5/1';assert.equal(inspect(task,model).correct,false);
 const scaleTask=sessionTasks('growshape')[0],scale=b24.initial(scaleTask,314159);
 scale.predX='0';scale.predY='0';b24.act(scaleTask,scale,'p24-predict');scale.factor='-0 1/2';scale.cx='0';scale.cy='0';b24.act(scaleTask,scale,'p24-operate');
 assert.equal(scale.board.image,null);assert.match(scale.issue,/先填完整/);assert.equal(validModel(scaleTask,scale),true);assert.equal(inspect(scaleTask,scale).correct,false);
});

test('storage-only compatibility preserves every original model and attempt value, without granting mathematical validity',()=>{
 for(const {id,index} of fixture.legacyCases){
  const original=legacy(id),raw=JSON.stringify(original),task=sessionTasks(id)[index],model=original.models[index];
  assert.equal(numericCompatibility(task,model),true);assert.equal(validStoredModel(task,model),true);
  const restored=validateLesson(original,id);
  assert.equal(JSON.stringify(restored.models),JSON.stringify(original.models));assert.equal(JSON.stringify(restored.cases),JSON.stringify(original.cases));
  assert.equal(JSON.stringify(original),raw,'the compatibility projection never mutates its source');
  assert.equal(validModel(task,restored.models[index]),false);assert.equal(inspect(task,restored.models[index]).correct,false);
  assert.equal(lessonSummary(restored).completed,false);assert.notEqual(currentSubmission(restored).status,'correct');
  assert.equal(thinkingFeedback(task,model,restored.cases[index],{sessionId:id,index}),null);
  assert.equal(nodeProgress(stateWith(restored),LESSONS[id].topicId).historicalCorePass,false);
 }
});

test('trying to submit a quarantined record does not throw, invent an attempt or mutate the lesson',()=>{
 for(const {id} of fixture.legacyCases){const record=legacy(id),before=JSON.stringify(record);const result=submitLesson(record);assert.equal(result.correct,false);assert.equal(result.code,'numeric-legacy');assert.equal(JSON.stringify(record),before);}
});

test('a valid earlier success does not expose a legacy current workpiece to the summary retry shortcut',()=>{
 const record=legacy('pointmove'),task=sessionTasks(record.id)[0],before=JSON.stringify(record.models);
 record.cases[0].attempts.unshift({id:'genuine-earlier-pass',at:'2026-11-13T01:00:00.000Z',value:exampleModel(task),supported:false,exposed:false});record.cases[0].attempts[1].exposed=true;record.view='summary';
 assert.equal(lessonSummary(record).completed,true,'the genuine earlier checked result remains historical evidence');
 const restored=validateLesson(record,record.id);assert.equal(restored.view,'task');assert.equal(JSON.stringify(restored.models),before);assert.equal(numericCompatibility(task,restored.models[0]),true);assert.notEqual(currentSubmission(restored).status,'correct');
});

test('compatibility rejects unknown history, forged boards, missing fields, wrong task identities and non-shared families',()=>{
 const record=legacy('pointmove'),task=sessionTasks(record.id)[0];
 const mutations=[m=>m.history[0].a='invented',m=>m.history[0].f.predX='-0 1/0',m=>m.history[0].f.predX='-1 5/1',m=>m.board.image[0][0]=99,m=>m.board.first.prediction.x='bad',m=>delete m.predX,m=>m.seed=0,m=>m.history=[],m=>m.answers.push('extra'),m=>m.history[0].d.unknown='1'];
 for(const mutate of mutations){const bad=structuredClone(record.models[0]);mutate(bad);assert.equal(validStoredModel(task,bad),false);const invalid=structuredClone(record);invalid.models[0]=bad;assert.throws(()=>validateLesson(invalid,record.id));}
 assert.equal(numericCompatibility(sessionTasks('growshape')[0],record.models[0]),false);
 for(const id of ['share','lineplaces','fcompare']){const other=sessionTasks(id)?.[0];if(!other)continue;assert.equal(usesSharedNumber(other),false);assert.equal(numericCompatibility(other,record.models[0]),false);}
});

test('ordinary invalid work cannot borrow a signed literal in free text to become a legacy record',()=>{
 const task=sessionTasks('pointmove')[0],model=exampleModel(task);model.prose='-0 1/2';model.board.image[0][0]=77;
 assert.equal(numericCompatibility(task,model),false);assert.equal(validStoredModel(task,model),false);
});

for(const id of engineIds)test(`B${id}: storage-only compatibility accepts an actual legacy replay and rejects a corrupted result`,()=>{
 const {old,current}=engines.get(id);let witness=null;
 for(const [sessionId,tasks] of Object.entries(TASKS)){
  for(const [index,task] of tasks.entries()){
   if(!current.TYPES.has(task.type))continue;
   const steps=old.solveSteps(task,314159);
   for(const [changed,step] of steps.entries()){
    if(!step.field||!/^\d+$/.test(String(step.value))||!(+step.value>0))continue;
    const model=old.initial(task,314159);
    for(const [j,item] of steps.entries()){
     if(item.field){const parts=item.field.split('.'),host=parts.slice(0,-1).reduce((value,key)=>value[key],model);host[parts.at(-1)]=j===changed?'-0 '+step.value+'/1':item.value;old.field?.(task,model,item.field);}
     else old.act(task,model,item.action==='turn-extra'?(id===23?'g23-turn':id===30?'a30-turn':item.action):item.action,item.data);
    }
    if(old.valid(task,model)&&!current.valid(task,model)){witness={sessionId,index,task,model};break;}
   }
   if(witness)break;
  }
  if(witness)break;
 }
 assert.ok(witness,`B${id} has a real event whose result used the old sign`);
 const {task,model,sessionId,index}=witness,before=JSON.stringify(model);
 assert.equal(numericCompatibility(task,model),true,`${sessionId}:${index}`);assert.equal(validStoredModel(task,model),true);assert.equal(inspect(task,model).correct,false);assert.equal(JSON.stringify(model),before);
 const record=freshLesson(sessionId);record.index=index;record.models[index]=model;assert.equal(JSON.stringify(validateLesson(record,sessionId).models[index]),before);
 const corrupt=structuredClone(model);corrupt.board={};assert.equal(validStoredModel(task,corrupt),false);
});

test('explicit retry replaces only the exact exported current workpiece and never invents a checked attempt',()=>{
 for(const {id} of fixture.legacyCases){
  const record=legacy(id),before=structuredClone(record),exportedModel=JSON.stringify(record.models[0]);retryNumericLesson(record,exportedModel);
  for(const key of ['cases','notes','draft','ui'])assert.equal(JSON.stringify(record[key]),JSON.stringify(before[key]),key+' retained');
  assert.equal(validModel(sessionTasks(id)[0],record.models[0]),true);assert.equal(inspect(sessionTasks(id)[0],record.models[0]).correct,false);assert.equal(lessonSummary(record).completed,false);assert.equal(Object.hasOwn(record,'numericArchives'),false);assert.doesNotThrow(()=>validateLesson(record,id));
 }
 assert.equal(Object.keys(retried('growshape').cases).length,0,'an unsubmitted old draft does not turn into a fabricated attempt');
});

test('a missing or stale exported model never clears a legacy workpiece',()=>{
 for(const value of [undefined,null,'',JSON.stringify(legacy('growshape').models[0])]){const record=legacy('pointmove'),before=JSON.stringify(record);assert.throws(()=>retryNumericLesson(record,value));assert.equal(JSON.stringify(record),before);}
 const record=legacy('pointmove'),exported=JSON.stringify(record.models[0]);record.models[0].prose+='新的原话';const changed=JSON.stringify(record);assert.throws(()=>retryNumericLesson(record,exported),/重新导出/);assert.equal(JSON.stringify(record),changed);
});

test('later genuine checks retain the exact legacy attempt prefix and use only the repaired mathematical rules',()=>{
 const record=retried('pointmove'),prefix=JSON.stringify(record.cases[0].attempts),task=sessionTasks(record.id)[0];record.models[0]=exampleModel(task);
 assert.equal(submitLesson(record).correct,true);assert.equal(JSON.stringify(record.cases[0].attempts.slice(0,-1)),prefix);assert.equal(record.cases[0].attempts.at(-1).exposed,true);assert.equal(currentSubmission(record).status,'correct');assert.equal(lessonSummary(record).completed,true);assert.equal(lessonSummary(record).independent,false);
});

test('the ordinary existing current-workpiece conflict guard rejects a stale page after explicit retry',()=>{
 const stale=legacy('pointmove'),current=retried('pointmove'),before=JSON.stringify(current);
 assert.throws(()=>assertNoConcurrentLessonOverwrite(stale,current),/作品/);assert.equal(JSON.stringify(current),before);
});

test('full old v2 export retains the unsubmitted model as well as every historical attempt and note',()=>{
 const state=validate(fixture.backup.state,atlas),before=JSON.stringify(state),exported=JSON.stringify(backup(state));
 for(const {id} of fixture.legacyCases)retryNumericLesson(state.lessons[id],JSON.stringify(state.lessons[id].models[0]));
 const restored=parseBackup(exported,atlas);assert.equal(JSON.stringify(restored),before);assert.equal(restored.schema,2);assert.equal(JSON.parse(exported).version,2);
 for(const {id} of fixture.legacyCases){assert.equal(JSON.stringify(restored.lessons[id].models),JSON.stringify(fixture.backup.state.lessons[id].models));assert.equal(JSON.stringify(restored.lessons[id].cases),JSON.stringify(state.lessons[id].cases));assert.equal(lessonSummary(restored.lessons[id]).completed,false);}
});

test('original and retried records keep the v2 schema and backup format without extra fields',()=>{
 for(const state of [validate(fixture.backup.state,atlas),stateWith(retried('growshape')),fresh()]){const file=backup(state);assert.equal(state.schema,2);assert.equal(file.version,2);assert.equal(JSON.stringify(parseBackup(JSON.stringify(file),atlas)),JSON.stringify(state));for(const record of Object.values(state.lessons))assert.equal(Object.hasOwn(record,'numericArchives'),false);}
 for(const version of [3,4,99])assert.throws(()=>parseBackup(JSON.stringify({...backup(fresh()),version}),atlas),/版本/);
});

test('question snapshots and displaced scenes retain their actual legacy models without becoming graded evidence',()=>{
 const record=legacy('growshape'),state=fresh(),scene=captureSession(record);assert.deepEqual(validateScene(scene),scene);
 const q=addQuestion(state,'这里的负号还要怎样核对？',{nodeId:LESSONS.growshape.topicId,scene},'2026-11-14T01:00:00.000Z'),saved=validate(state,atlas);assert.equal(saved.schema,2);assert.deepEqual(parseBackup(JSON.stringify(backup(saved)),atlas).daily.questions[0].scene,scene);
 resumeQuestion(saved,q.id);assert.deepEqual(saved.lessons.growshape.models,record.models);assert.equal(lessonSummary(saved.lessons.growshape).completed,false);
 const displaced=fresh(),question=addQuestion(displaced,'先留下这个现场',{nodeId:LESSONS.growshape.topicId},'2026-11-14T01:00:00.000Z');question.events.push({id:'displaced-scene',kind:'resume',at:'2026-11-14T02:00:00.000Z',displaced:scene});assert.deepEqual(validate(displaced,atlas).daily.questions[0].events[0].displaced,scene);
});

test('a real associated task retains legacy storage and can explicitly restart without borrowing native completion',()=>{
 const candidate=Object.entries(BRIDGES).find(([,bridge])=>bridge.tasks.some(t=>JSON.stringify(t)===JSON.stringify(sessionTasks('pointmove')[0])));assert.ok(candidate);
 const[id,bridge]=candidate,index=bridge.tasks.findIndex(t=>JSON.stringify(t)===JSON.stringify(sessionTasks('pointmove')[0])),record=freshLesson(id);record.index=index;record.models[index]=legacy('pointmove').models[0];record.cases[index]=legacy('pointmove').cases[0];
 const restored=validateLesson(record,id,{allowBridge:true}),before=JSON.stringify(restored.models[index]);assert.equal(JSON.stringify(restored.models),JSON.stringify(record.models));assert.equal(lessonSummary(restored).completed,false);retryNumericLesson(restored,before);const state=fresh();state.daily.bridges[id]=restored;assert.equal(validate(state,atlas).schema,2);assert.equal(JSON.stringify(restored.cases),JSON.stringify(record.cases));
});

test('lossless compressed storage and idempotent backup merge preserve the full legacy records',()=>{
 const state=validate(fixture.backup.state,atlas),raw=JSON.stringify(state);assert.equal(unpackText(packText(raw,0)),raw);const incoming=parseBackup(JSON.stringify(backup(state)),atlas);assert.doesNotThrow(()=>assertNoImportConflicts(state,incoming));assert.equal(JSON.stringify(validate(merge(state,incoming),atlas)),raw);
 const copy=mergeLesson(state.lessons.pointmove,incoming.lessons.pointmove);assert.equal(JSON.stringify(copy),JSON.stringify(state.lessons.pointmove));
});

test('an original backup is a real restorable old current workpiece; importing it over changed work is a visible conflict',()=>{
 const old=validate(fixture.backup.state,atlas),current=structuredClone(old);retryNumericLesson(current.lessons.growshape,JSON.stringify(current.lessons.growshape.models[0]));assert.throws(()=>assertNoImportConflicts(current,old),/工作模型/);assert.equal(JSON.stringify(parseBackup(JSON.stringify(backup(old)),atlas).lessons.growshape.models[0]),JSON.stringify(old.lessons.growshape.models[0]));
});

test('a failed write leaves the saved old record untouched',()=>{
 const original=JSON.stringify(fixture.backup.state),storage={raw:original,setItem(){throw new Error('QuotaExceededError');}},next=JSON.stringify(stateWith(retried('growshape')));
 assert.throws(()=>writeStored('math-explorer-v2',next,storage),/QuotaExceededError/);assert.equal(storage.raw,original);
});
