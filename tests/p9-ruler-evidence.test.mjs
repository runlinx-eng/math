import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-ruler-cases.cjs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,defaultModel,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {rulerBinding as binding,replayRulerEvidence as replay} from '../dist/learning/ruler-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
import {renderP3Flow} from '../dist/learning/p3-view.js';
import {ensureB39Ready,prepareSessionRuntime} from '../dist/learning/phase4/async-batches.js';
import {EVIDENCE_ADAPTERS} from '../dist/learning/evidence-adapters.js';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
await ensureB39Ready();await prepareSessionRuntime('strategy39',{view:true});
const cp=structuredClone,all=[...fixture.cases,...fixture.associated,...fixture.practice];
const at=c=>sessionTaskFor(c.id,c.index),context=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url),'utf8'));
function field(t,m,key,value){
 const html=V.controls(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'one original visible field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)),'select offers '+value);}
 if(attrs(tags[0]).type==='range')assert.ok(['-3','-2','-1','0','1','2','3'].includes(String(value)));
 const [root,index]=key.split('.');if(index===undefined)m[root]=String(value);else m[root][Number(index)]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);return m;
}
function action(t,m,name,index){
 const tags=[...V.controls(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']===name&&(index===undefined?attrs(x)['data-index']===undefined:attrs(x)['data-index']===String(index)));
 assert.equal(tags.length,1,'one original visible action '+name+':'+index);assert.doesNotMatch(tags[0],/\bdisabled\b/);M.act(t,m,name,index===undefined?{}:{index:String(index)});assert.equal(M.valid(t,m),true);return m;
}
function save(t,m,raw=String(t.value),unit=t.unit){field(t,m,'measure',raw);field(t,m,'unit',unit);action(t,m,'m28-record');return m;}
function build(t,m=M.initial(t),{estimate,raw}={}){
 if(t.tool)action(t,m,'m28-tool',t.tool);
 if(t.estimate&&m.board.prediction===null){field(t,m,'estimate',estimate??String(t.estimateExample??t.value));action(t,m,'m28-predict');}
 if(t.estimate)field(t,m,'error',String(Math.abs(Number(m.board.prediction)-t.value)));
 field(t,m,'offset','0');save(t,m,raw??String(t.value));t.questions.forEach((q,i)=>field(t,m,'answers.'+i,String(q.value)));return m;
}
function reject(t,m){assert.equal(replay(t,m),null);}
function oldOnly(t,m){assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);}
const retryTags=a=>{const host={innerHTML:''};renderP3Flow(host,{atlas,id:a.id,record:a});return[...host.innerHTML.matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-do']==='p3-retry');};

test('all 29 frozen tasks and 30 source files remain literal; only 16 native positions are eligible',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 assert.equal(Object.keys(fixture.sourceHashes).length,30);
 for(const c of all){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const inventory=ids=>ids.flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-ruler'?[id+':'+index]:[])).sort();
 assert.deepEqual(inventory(Object.keys(LESSONS)),fixture.cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(inventory(Object.keys(BRIDGES)),fixture.associated.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-m28-ruler').sort(),fixture.practice.map(c=>c.id).sort());
 assert.equal(fixture.cases.length,16);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,8);assert.equal(fixture.associated.length,11);assert.equal(fixture.practice.length,2);
 assert.deepEqual(Object.fromEntries(['plain','estimate','tool'].map(shape=>[shape,fixture.cases.filter(c=>c.math.shape===shape).length])),{plain:5,estimate:5,tool:6});
});

for(const c of fixture.cases)test(c.id+':'+c.index+' binds the full original source and proves actual alignment and the literal saved pair',()=>{
 const t=at(c),m=build(t),before=cp(m),p=replay(t,m);assert.ok(p);assert.deepEqual(m,before);assert.equal(p.kind,'ruler');assert.equal(p.shape,c.math.shape);assert.equal(p.eventCount,m.history.length);
 assert.equal(p.construction.record.raw,m.measure);assert.equal(p.construction.record.unit,t.unit);assert.deepEqual(p.construction.expectedReading,{numerator:String(t.value),denominator:'1',text:String(t.value)});
 assert.equal(p.construction.currentOffset,0);assert.equal(m.history[p.construction.record.alignedAt].f.offset,'0');assert.equal(m.history[p.construction.record.recordedAt].a,'record');
 assert.deepEqual(m.history[p.construction.record.recordedAt].f,m.board.saved);assert.equal(p.construction.firstMeasure.raw,String(t.value));assert.equal(p.construction.hadOriginalBad,false);
 assert.equal(binding(t,context(c)).nodeId,c.nodeId);assert.equal(binding(t,context(c)).method,null);
 for(const key of ['physicalMeasurementAssessed','independentConversionAssessed','estimationQualityAssessed','independentSubtractionProcessAssessed','generalToolChoiceReasoningAssessed','freeExplanationAssessed','generalMasteryAssessed'])assert.equal(p[key],false);
 assert.equal(p.construction.toolProvidedDimensions,true);assert.equal(p.construction.toolDrewRuler,true);
 if(t.tool){assert.equal(p.construction.selectedTool,t.tool);assert.equal(p.tools.at(-1).selected,t.tool);assert.equal(p.construction.record.toolSelectedAt,p.tools.at(-1).index);}
 if(t.estimate){assert.equal(p.construction.estimation.rawPrediction,String(t.estimateExample));assert.equal(p.construction.estimation.errorIsCurrentAnswerOnly,true);assert.equal(p.construction.record.predictedAt,p.construction.estimation.predictedAt);}
});

test('all associated and practice examples replay but never bind, guide or acquire strict native feedback',()=>{
 for(const c of all){const t=at(c),m=exampleModel(t);assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);assert.ok(replay(t,m));}
 for(const c of [...fixture.associated,...fixture.practice]){const t=at(c),m=build(t);assert.equal(binding(t,context(c)),null);assert.equal(thinkingGuide(t,context(c)),null);assert.equal(thinkingFeedback(t,m,{attempts:[{value:cp(m)}]},context(c)),null);}
});

test('foreign contexts, changed full tasks and other B28 types cannot borrow source evidence',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(const ctx of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:.5},{sessionId:'__proto__',index:0},{sessionId:[c.id],index:c.index}])assert.equal(binding(t,ctx),null);
  for(const change of [x=>x.prompt+='!',x=>x.value++,x=>x.unit='foreign',x=>x.axisMax++,x=>x.object+='!',x=>x.extra=true]){const changed=cp(t);change(changed);assert.equal(binding(changed,context(c)),null);reject(changed,m);}
 }
 for(const[id,index]of [['lengthstart',0],['precisionunits',0],['precisionunits',1],['link-measure-measurecalc',0]]){const t=sessionTaskFor(id,index);assert.notEqual(t.type,'x-m28-ruler');reject(t,exampleModel(t));assert.equal(binding(t,{sessionId:id,index}),null);}
});

test('failed alignment, tool, blank and wrong numeric records keep the original first and bad semantics',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);if(t.estimate){field(t,m,'estimate',String(t.estimateExample));action(t,m,'m28-predict');}
  save(t,m,'');assert.deepEqual(m.board.first,{});assert.equal(m.board.bad,false);assert.equal(m.issue,t.tool?'先选适合这件物体的工具。':'把尺子的零刻度对准物体的起点。');
  if(t.tool)action(t,m,'m28-tool',t.tool);field(t,m,'offset','0');save(t,m,'');assert.equal(m.issue,'先读出长度。');assert.equal(m.board.first.measure,undefined);
  save(t,m,String(t.value+1));assert.equal(m.board.first.measure,String(t.value+1));assert.equal(m.board.bad,true);reject(t,m);build(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.raw,String(t.value+1));assert.equal(p.construction.hadOriginalBad,true);
 }
});

test('saved raw spelling requires an actual new record even when the mathematical reading is equivalent',()=>{
 for(const c of all){const t=at(c),m=build(t),first=cp(m.board.first),old=cp(m.board.saved),history=cp(m.history);
  for(const raw of [t.value+'.0','  '+t.value+'  ',(t.value*2)+'/2',(t.value-1)+' 2/2']){field(t,m,'measure',raw);assert.equal(M.inspect(t,m).correct,false);reject(t,m);assert.deepEqual(m.board.saved,old);assert.deepEqual(m.history,history);}
  action(t,m,'m28-record');assert.ok(replay(t,m));assert.equal(m.board.saved.measure,m.measure);assert.deepEqual(m.board.first,first);
 }
});

test('historical near-success retains original bad=false and must be genuinely resaved exactly',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t,M.initial(t),{raw:t.value+'.00000001'});assert.equal(m.board.bad,false);oldOnly(t,m);const nearFirst=m.board.first.measure;
  field(t,m,'measure',String(t.value));assert.equal(M.inspect(t,m).correct,false);reject(t,m);action(t,m,'m28-record');const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.raw,nearFirst);assert.equal(p.construction.firstMeasure.originalNearReading,true);assert.equal(p.construction.firstMeasure.exactReading,false);assert.equal(p.construction.hadOriginalBad,false);
 }
});

test('blank terminal records and temporary misalignment preserve old saves, exact issue and subsequent restoration',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t),saved=cp(m.board.saved);save(t,m,'');assert.deepEqual(m.board.saved,saved);reject(t,m);field(t,m,'measure',saved.measure);let p=replay(t,m);assert.ok(p);assert.equal(p.issue,'先读出长度。');assert.equal(p.records.at(-1).saved,false);
  field(t,m,'offset','1');action(t,m,'m28-record');assert.deepEqual(m.board.saved,saved);assert.equal(m.issue,'把尺子的零刻度对准物体的起点。');reject(t,m);field(t,m,'offset','0');p=replay(t,m);assert.ok(p);assert.deepEqual(m.board.saved,saved);assert.equal(p.alignments.at(-1).retainedRecord,p.construction.record.recordedAt);
 }
});

test('all canonical ruler shifts are real align events, and 25 pixels is a translation step rather than a source unit',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(let n=-3;n<=3;n++){field(t,m,'offset',String(n));assert.equal(m.board.offset,n);assert.equal(m.history.at(-1).f.offset,String(n));const rects=[...V.visual(t,m).matchAll(/<rect\b[^>]*>/g)].map(x=>attrs(x[0]));assert.equal(Number(rects[1].x),110+n*25-14);if(n!==0)reject(t,m);else assert.ok(replay(t,m));}field(t,m,'offset','0');assert.ok(replay(t,m));}
});

test('wrong tool and repeated identical tool selections keep first/bad but invalidate the saved pair',()=>{
 for(const c of fixture.cases.filter(c=>c.task.tool)){const t=at(c),m=M.initial(t),wrong=t.tools.find(x=>x.id!==t.tool).id;action(t,m,'m28-tool',wrong);field(t,m,'offset','0');save(t,m);assert.equal(m.board.saved,null);assert.equal(m.issue,'先选适合这件物体的工具。');build(t,m);const first=cp(m.board.first);assert.ok(replay(t,m));action(t,m,'m28-tool',t.tool);assert.equal(m.board.saved,null);assert.deepEqual(m.board.first,first);assert.equal(m.board.bad,true);reject(t,m);save(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstTool,wrong);assert.equal(p.tools.at(-1).previous,t.tool);assert.ok(Number.isInteger(p.tools.at(-1).invalidatedRecord));}
});

test('blank and nonfinite predictions remain failures before the first finite raw locks the hidden input',()=>{
 for(const c of fixture.cases.filter(c=>c.task.estimate)){const t=at(c),m=M.initial(t);for(const raw of ['','bad','1/0','9'.repeat(400)]){field(t,m,'estimate',raw);action(t,m,'m28-predict');assert.equal(m.board.prediction,null);assert.equal(m.issue,'先写一个估计，再用尺看。');assert.doesNotMatch(V.controls(t,m),/data-x="m28-record"/);}
  build(t,m,{estimate:'-2'});const p=replay(t,m);assert.ok(p);assert.equal(p.construction.estimation.rawPrediction,'-2');assert.equal(p.construction.estimation.error.text,String(t.value+2));assert.equal(p.predictions.filter(x=>x.accepted).length,1);assert.doesNotMatch(V.controls(t,m),/data-xfield="estimate"|data-x="m28-predict"/);assert.equal(p.estimationQualityAssessed,false);
 }
});

test('exact fractional and negative-zero predictions keep B20 signs and an independently exact current absolute difference',()=>{
 for(const c of fixture.cases.filter(c=>c.task.estimate))for(const[raw,n,d]of [['-0 1/2',-1n,2n],['1/2',1n,2n],['-2 1/2',-5n,2n],[' 0002.50 ',5n,2n],['-0',0n,1n]]){
  const t=at(c),m=M.initial(t);field(t,m,'estimate',raw);action(t,m,'m28-predict');field(t,m,'offset','0');save(t,m);const diff=n-BigInt(t.value)*d;field(t,m,'error',String(diff<0n?-diff:diff)+'/'+d);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.estimation.rawPrediction,raw);assert.equal(BigInt(p.construction.estimation.error.numerator)*d,(diff<0n?-diff:diff)*BigInt(p.construction.estimation.error.denominator));
  field(t,m,'error',String(Number(diff<0n?-diff:diff)/Number(d)+.00000001));oldOnly(t,m);
 }
});

test('hidden post-prediction edits and hidden or repeated prediction/record actions fail despite original acceptance',()=>{
 for(const c of fixture.cases.filter(c=>c.task.estimate)){const t=at(c),m=build(t);let bad=cp(m);bad.estimate+='0';oldOnly(t,bad);bad=cp(m);M.act(t,bad,'m28-predict');oldOnly(t,bad);
  const hidden=M.initial(t);M.act(t,hidden,'m28-record');build(t,hidden);oldOnly(t,hidden);
 }
 for(const c of fixture.cases.filter(c=>!c.task.estimate)){const t=at(c),m=build(t);for(const key of ['error','estimate']){const bad=cp(m);bad[key]='0';oldOnly(t,bad);}const bad=cp(m);M.act(t,bad,'m28-predict');oldOnly(t,bad);}
});

test('wrong or blank source unit and choice remain wrong; arbitrary select options cannot become historical evidence',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);save(t,m,String(t.value),'');assert.equal(m.board.bad,true);reject(t,m);save(t,m);assert.ok(replay(t,m));
  const bad=cp(m);bad.history.at(-1).f.unit='foreign';bad.board.saved.unit='foreign';bad.unit='foreign';reject(t,bad);
  for(let i=0;i<t.questions.length;i++){field(t,m,'answers.'+i,'');reject(t,m);field(t,m,'answers.'+i,String(t.questions[i].value));assert.ok(replay(t,m));}
 }
});

test('exact readings support original decimals, fractions and mixed forms; unsupported Number spellings do not grant a proof',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);for(const raw of [String(t.value),t.value+'.00',(t.value*3)+'/3',(t.value-1)+' 4/4','\t'+t.value+'\n','0'.repeat(1180)+t.value]){save(t,m,raw);assert.ok(replay(t,m));}
  for(const raw of ['',String(t.value+1),'-'+t.value,'+'+t.value,t.value+'e0',t.value+'/0','0/0','Infinity','NaN',t.value+'.00000001']){save(t,m,raw);reject(t,m);save(t,m);assert.ok(replay(t,m));}
 }
});

test('10.16 cm is rounded to the nearest whole centimetre while the supplied inch model is a separate source',()=>{
 const a=fixture.cases.find(c=>c.id==='twounits'&&c.index===0),b=fixture.cases.find(c=>c.id==='twounits'&&c.index===1),t=at(a),m=build(t),p=replay(t,m);
 assert.deepEqual(p.construction.actualLength,{numerator:'254',denominator:'25',text:'254/25'});assert.equal(p.construction.expectedReading.text,'10');assert.equal(p.construction.readingRule,'nearest-whole-source-unit');assert.deepEqual(p.construction.roundingDifference,{numerator:'4',denominator:'25',text:'4/25'});assert.ok(4n*2n<25n);assert.equal(254n*520n*10n,416n*25n*127n);
 for(const c of [a,b]){const rect=[...V.visual(at(c),build(at(c))).matchAll(/<rect\b[^>]*>/g)][0][0];assert.ok(Math.abs(Number(attrs(rect).width)-416)<1e-9,'SVG attribute floating conversion only; exact length ratio is 416');}
 assert.equal(p.independentConversionAssessed,false);save(t,m,'10.16');reject(t,m);save(t,m,'10');assert.ok(replay(t,m));
});

test('extra keys, noncanonical ranges, foreign actions and fabricated issue fail closed without changing old grading',()=>{
 const changes=[m=>m.extra=true,m=>m.issue='invented',m=>m.history[0].extra=true,m=>m.history.find(e=>e.a==='align').d.index='',m=>m.history.find(e=>e.a==='align').f.offset='0/1',m=>m.history.find(e=>e.a==='record').d.index='',m=>m.offset='0.0'];
 for(const c of all){const t=at(c),good=build(t);for(const alter of changes){const m=cp(good);alter(m);oldOnly(t,m);}
  for(const name of ['m28-clear','m28-help']){const m=cp(good);M.act(t,m,name);oldOnly(t,m);}
  for(const alter of [m=>m.board.offset=1,m=>m.board.first.extra='',m=>m.history.pop(),m=>m.seed=0,m=>m.prose='x'.repeat(1201),m=>m.values.push(''),m=>m.history[0].f.extra='']){const m=cp(good);alter(m);reject(t,m);}
 }
});

test('at 2000 events buttons are model no-ops while range input can change only root; restored root can retain the old save',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(t);while(m.history.length<2000)M.act(t,m,'m28-record');assert.equal(m.history.length,2000);const before=cp(m),p=replay(t,m);assert.ok(p);assert.equal(p.historyAtCapacity,true);
  action(t,m,'m28-record');assert.deepEqual(m,before);if(t.tool){action(t,m,'m28-tool',t.tools.find(x=>x.id!==t.tool).id);assert.deepEqual(m,before);}
  field(t,m,'offset','1');assert.equal(m.board.offset,0);assert.equal(m.offset,'1');assert.deepEqual(m.history,before.history);oldOnly(t,m);field(t,m,'offset','0');assert.deepEqual(m,before);assert.ok(replay(t,m));
  field(t,m,'measure',t.value+'.0');action(t,m,'m28-record');assert.deepEqual(m.board.saved,before.board.saved);reject(t,m);field(t,m,'measure',before.measure);assert.ok(replay(t,m));const over=cp(m);over.history.push(cp(over.history.at(-1)));assert.equal(M.valid(t,over),false);reject(t,over);
 }
});

test('a real current-model submission is required and earlier wrong/near/correct attempts, notes and draft survive retry',()=>{
 for(const c of fixture.cases){const t=at(c),a=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=M.initial(t);assert.equal(retryTags(a).length,0);let m=a.models[c.index];build(t,m,{raw:String(t.value+1)});State.supportLesson(a);assert.equal(State.submitLesson(a).correct,false);assert.equal(retryTags(a).length,1);save(t,m,t.value+'.00000001');assert.equal(State.submitLesson(a).correct,true);reject(t,m);save(t,m);State.submitLesson(a);const cases=cp(a.cases);State.addLessonNote(a,'保留原尺读数笔记');a.draft='原草稿';const notes=cp(a.notes);field(t,m,'prose','我留下这次模拟尺的操作。');assert.equal(latestSubmissionMatches(m,a.cases[c.index]),false);assert.equal(thinkingFeedback(t,m,a.cases[c.index],context(c)),null);
  a.models[c.index]=defaultModel(t);assert.deepEqual(a.cases,cases);assert.deepEqual(a.notes,notes);assert.equal(a.draft,'原草稿');build(t,a.models[c.index]);State.submitLesson(a);assert.deepEqual(a.cases[c.index].attempts.slice(0,-1),cases[c.index].attempts);assert.ok(thinkingFeedback(t,a.models[c.index],a.cases[c.index],context(c)));
 }
});

test('complete State and repeated v2 import retain all failed, near, terminal-issue and corrected snapshots',()=>{
 const state=Core.fresh();let n=0;for(const c of fixture.cases){const t=at(c),a=state.lessons[c.id]||=State.freshLesson(c.id);a.index=c.index;a.models[c.index]=build(t);const m=a.models[c.index];save(t,m,t.value+'.00000001');State.submitLesson(a);save(t,m);State.submitLesson(a);save(t,m,'');State.supportLesson(a);State.submitLesson(a);field(t,m,'measure',String(t.value));assert.ok(replay(t,m));State.submitLesson(a);State.addLessonNote(a,'尺来源 '+c.index);a.draft='原始草稿';a.updatedAt=new Date(Date.UTC(2026,10,16)+n++).toISOString();}
 Core.validate(state,atlas);const before=JSON.stringify(state),backup=JSON.stringify(Core.backup(cp(state))),parsed=Core.parseBackup(backup,atlas);assert.deepEqual(parsed,state);const merged=Core.merge(Core.fresh(),parsed,atlas);assert.deepEqual(merged,state);assert.deepEqual(Core.merge(cp(merged),Core.parseBackup(backup,atlas),atlas),state);assert.equal(JSON.stringify(state),before);
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};Storage.writeStored(Core.KEY,JSON.stringify(merged),storage);const raw=data.get(Core.KEY);Storage.writeStored(Core.KEY,JSON.stringify(Core.merge(cp(merged),parsed,atlas)),storage);assert.equal(data.get(Core.KEY),raw);const bad=JSON.parse(backup);bad.state.lessons.lengthstart.models[1].prose='x'.repeat(1201);assert.throws(()=>Core.parseBackup(JSON.stringify(bad),atlas));assert.equal(data.get(Core.KEY),raw);
});

test('one bounded registry entry and optional feedback describe current evidence without inventing reasoning or past submissions',()=>{
 const entries=EVIDENCE_ADAPTERS.filter(a=>a.id==='ruler');assert.equal(entries.length,1);assert.equal(entries[0].binding,binding);assert.equal(entries[0].replay,replay);
 for(const c of fixture.cases){const t=at(c),m=build(t),record={attempts:[{value:cp(m)}]};assert.ok(thinkingGuide(t,context(c)));const f=thinkingFeedback(t,m,record,context(c));assert.ok(f);assert.equal(f.method,null);assert.match(JSON.stringify(f),/工具/);assert.doesNotMatch(JSON.stringify(f),/此前提交|估计合理|掌握.*测量|独立完成换算/);
  for(const bad of [null,{}, {attempts:[]},{attempts:[{value:null}]},{attempts:[{value:cp(m)},{value:M.initial(t)}]}])assert.equal(thinkingFeedback(t,m,bad,context(c)),null);
  field(t,m,'prose','尚未再次检查的原话');assert.ok(replay(t,m));assert.equal(thinkingFeedback(t,m,record,context(c)),null);record.attempts.push({value:cp(m)});record.support=true;assert.ok(thinkingFeedback(t,m,record,context(c)));
 }
});
