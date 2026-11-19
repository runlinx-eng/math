import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import fixture from './fixtures/p9-scale-cases.cjs';
import * as M from '../dist/learning/phase5/b28-model.js';
import * as V from '../dist/learning/phase5/b28-view.js';
import * as State from '../dist/learning/state.js';
import * as Core from '../dist/exploration-core.js';
import * as Storage from '../dist/storage.js';
import {LESSONS} from '../dist/learning/catalog.js';
import {PRACTICE,exampleModel} from '../dist/learning/tasks.js';
import {BRIDGES,sessionTasks,sessionTaskFor} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import {scaleBinding as binding,replayScaleEvidence as replay} from '../dist/learning/scale-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';
await ensureB39Ready();
const cp=structuredClone,all=[...fixture.cases,...fixture.associated,...fixture.practice];
const at=c=>sessionTaskFor(c.id,c.index),ctx=c=>({sessionId:c.id,index:c.index});
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const digest=x=>createHash('sha256').update(x).digest('hex'),hash=x=>digest(JSON.stringify(stable(x)));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
function field(t,m,key,value){
 const html=V.controls(t,m),tags=[...html.matchAll(/<(?:input|select)\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-xfield']===key);
 assert.equal(tags.length,1,'source-visible field '+key);assert.doesNotMatch(tags[0],/\bdisabled\b|\breadonly\b/);
 if(tags[0].startsWith('<select')){const start=html.indexOf(tags[0]),body=html.slice(start,html.indexOf('</select>',start));assert.ok([...body.matchAll(/<option\b[^>]*>/g)].some(x=>attrs(x[0]).value===String(value)));}
 const[root,index]=key.split('.');if(index===undefined)m[root]=String(value);else m[root][+index]=String(value);M.field(t,m,key);assert.equal(M.valid(t,m),true);return m;
}
function record(t,m){
 const buttons=[...V.controls(t,m).matchAll(/<button\b[^>]*>/g)].map(x=>x[0]).filter(x=>attrs(x)['data-x']==='m28-record');
 assert.equal(buttons.length,1);assert.equal(attrs(buttons[0])['data-index'],undefined);assert.doesNotMatch(buttons[0],/\bdisabled\b/);
 M.act(t,m,'m28-record');assert.equal(M.valid(t,m),true);return m;
}
function save(c,m=M.initial(at(c)),raw=c.math.raw,unit=c.task.unit){const t=at(c);field(t,m,'measure',raw);field(t,m,'unit',unit);record(t,m);return m;}
function build(c,m=M.initial(at(c)),raw=c.math.raw){save(c,m,raw);if(c.math.answer)field(at(c),m,'answers.0',c.math.answer);return m;}
const reject=(t,m)=>assert.equal(replay(t,m),null),oldOnly=(t,m)=>{assert.equal(M.valid(t,m),true);assert.equal(M.inspect(t,m).correct,true);reject(t,m);};

test('complete source inventory is eight native, two associated and two actual practice instruments',()=>{
 for(const[file,sha]of Object.entries(fixture.sourceHashes))assert.equal(digest(readFileSync(new URL('../'+file,import.meta.url))),sha,file);
 for(const c of all){assert.deepEqual(at(c),c.task);assert.equal(hash(at(c)),c.taskHash);}
 const inventory=ids=>ids.flatMap(id=>sessionTasks(id).flatMap((t,index)=>t.type==='x-m28-scale'?[id+':'+index]:[])).sort();
 assert.deepEqual(inventory(Object.keys(LESSONS)),fixture.cases.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(inventory(Object.keys(BRIDGES)),fixture.associated.map(c=>c.id+':'+c.index).sort());
 assert.deepEqual(Object.keys(PRACTICE).filter(id=>PRACTICE[id].type==='x-m28-scale').sort(),['readscales','weightstart']);
 assert.equal(fixture.cases.length,8);assert.equal(fixture.associated.length,2);assert.equal(fixture.practice.length,2);assert.equal(new Set(fixture.cases.map(c=>c.nodeId)).size,3);
 for(const c of fixture.associated){assert.equal(Object.hasOwn(PRACTICE,c.id),false);assert.notEqual(sessionTaskFor(c.id,-1).type,'x-m28-scale');}
});

for(const c of fixture.cases)test(c.id+':'+c.index+' binds its exact source and saved reading without assigning unrecorded calculation',()=>{
 const t=at(c),m=build(c),before=cp(m),p=replay(t,m);assert.ok(p);assert.deepEqual(m,before);assert.equal(p.kind,'scale');assert.equal(p.shape,c.math.shape);assert.equal(p.eventCount,m.history.length);
 assert.equal(binding(t,ctx(c)).nodeId,c.nodeId);assert.equal(binding(t,ctx(c)).kind,c.math.shape);assert.equal(binding(t,ctx(c)).method,null);
 const i=p.construction.instrument;assert.equal(i.kind,c.math.kind);assert.equal(i.unit,t.unit);assert.equal(i.expectedReading.text,c.math.expected);assert.equal(i.suppliedByTool,true);
 assert.equal(p.construction.record.raw,c.math.raw);assert.equal(p.construction.record.unit,t.unit);assert.equal(p.construction.firstMeasure.index,0);
 if(c.math.shape==='analog'){for(const[key,want]of Object.entries({lowerLabel:c.math.lower,upperLabel:c.math.upper,fractionBetweenLabels:c.math.between,positionAcrossRange:c.math.position}))assert.equal(i[key].text,want);assert.equal(i.interpolationStepsRecorded,false);if(c.math.minor){assert.equal(i.minorStep.text,'1/10');assert.equal(i.minorIntervalsPerMajor.text,'10');assert.equal(i.minorIntervalsFromMinimum.text,'127');assert.equal(i.totalMinorIntervals.text,'150');}}
 else{assert.equal(i.display,'01:26.4');assert.equal(i.minutes.text,'1');assert.equal(i.seconds.text,'132/5');assert.equal(i.minuteSeconds.text,'60');assert.equal(i.secondsPerMinute,60);assert.equal(i.conversionStepsRecorded,false);assert.equal(Object.hasOwn(i,'positionAcrossRange'),false);}
 for(const k of ['physicalMeasurementAssessed','independentInterpolationProcessAssessed','independentConversionAssessed','freeExplanationAssessed','generalMasteryAssessed'])assert.equal(p[k],false);
});

test('associated and practice copies can replay mathematics but never borrow native guide contexts',()=>{
 for(const c of all)assert.ok(replay(at(c),build(c)));
 for(const c of [...fixture.associated,...fixture.practice])assert.equal(binding(at(c),ctx(c)),null);
});

test('full original task and native context are required, including B29 questions and exact digital display',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(c);for(const context of [null,{},[],{sessionId:c.id,index:String(c.index)},{sessionId:c.id,index:-1},{sessionId:c.id,index:.5},{sessionId:'__proto__',index:0}])assert.equal(binding(t,context),null);
  for(const mutate of [x=>x.prompt+='!',x=>x.value+=1,x=>x.max+=1,x=>x.major+=1,x=>x.unit='foreign',x=>x.questions.push({label:'extra',value:1}),x=>x.kind='foreign',x=>x.extra=true]){const changed=cp(t);mutate(changed);assert.equal(binding(changed,ctx(c)),null);reject(changed,m);}
 }
 const c=fixture.cases.find(c=>c.math.shape==='digital'),t=cp(at(c));t.display='01:26.5';reject(t,build(c));assert.equal(binding(t,ctx(c)),null);
 for(const[id,index]of [['weightstart',0],['weightstart',1],['measurecalc',0],['measurecalc',2],['precisionunits',0]]){const t=sessionTaskFor(id,index);assert.notEqual(t.type,'x-m28-scale');assert.equal(binding(t,{sessionId:id,index}),null);reject(t,exampleModel(t));}
});

test('all original drawings are supplied by the task and stay identical through wrong and corrected records',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t),svg=V.visual(t,m);save(c,m,'0');assert.equal(V.visual(t,m),svg);build(c,m);assert.equal(V.visual(t,m),svg);assert.equal(m.board.first.measure,'0');assert.equal(m.board.bad,true);assert.ok(replay(t,m));assert.match(V.controls(t,m),/记下读数/);}
});

test('literal saved spelling needs a new visible record even when the quantity is equivalent',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(c),old=cp(m.board.saved),first=cp(m.board.first),history=cp(m.history),rewritten='  '+c.math.raw+'  ';
  field(t,m,'measure',rewritten);reject(t,m);assert.equal(M.inspect(t,m).correct,false);assert.deepEqual(m.board.saved,old);assert.deepEqual(m.history,history);
  record(t,m);assert.ok(replay(t,m));assert.equal(replay(t,m).construction.record.raw,rewritten);assert.deepEqual(m.board.first,first);
  field(t,m,'unit',t.unit==='g'?'kg':'g');record(t,m);reject(t,m);save(c,m);assert.ok(replay(t,m));assert.equal(m.board.bad,true);
 }
});

test('near and rounded Number success retain their original bad=false but do not become exact evidence',()=>{
 for(const c of fixture.cases)for(const suffix of ['00000001','000000000000000000001']){const t=at(c),raw=c.math.raw+(c.math.raw.includes('.')?'':'.')+suffix,m=build(c,undefined,raw);oldOnly(t,m);assert.equal(m.board.bad,false);assert.equal(m.board.first.measure,raw);field(t,m,'measure',c.math.raw);reject(t,m);record(t,m);const p=replay(t,m);assert.ok(p);assert.equal(p.construction.firstMeasure.exactReading,false);assert.equal(p.construction.hadOriginalBad,false);}
 for(const c of fixture.cases.filter(c=>!c.math.raw.includes('.'))){const t=at(c),raw=c.math.raw+' 1/1'+'0'.repeat(400),m=build(c,undefined,raw);oldOnly(t,m);assert.equal(m.board.bad,false);save(c,m);assert.ok(replay(t,m));}
});

test('non-numeric records retain first, old save and real terminal issue rather than laundering history',()=>{
 for(const c of fixture.cases){const t=at(c),m=M.initial(t);record(t,m);assert.deepEqual(m.board.first,{});assert.equal(m.board.saved,null);build(c,m);const first=cp(m.board.first),saved=cp(m.board.saved);
  for(const raw of ['', 'NaN','Infinity','1e2','0x64','+500','1/0','-0 1/0']){save(c,m,raw);assert.equal(m.issue,'先写下读到的数字。');assert.deepEqual(m.board.saved,saved);assert.deepEqual(m.board.first,first);reject(t,m);field(t,m,'measure',saved.measure);assert.ok(replay(t,m));assert.equal(replay(t,m).issue,'先写下读到的数字。');}
 }
});

test('the B29 cm/mm question is current-only, can precede record, and needs a new complete submission after editing',()=>{
 const c=fixture.cases.find(c=>c.id==='measurecalc'&&c.index===1),t=at(c),m=M.initial(t);field(t,m,'answers.0','127');save(c,m);const p=replay(t,m);assert.ok(p);assert.deepEqual(p.construction.currentQuestions.map(q=>[q.raw,q.unit,q.sourceUnit,q.unitsPerSourceUnit,q.onlyCurrentField,q.editTimeRecorded,q.conversionStepsRecorded]),[['127','mm','cm',10,true,false,false]]);
 const history=cp(m.history),recordSnapshot={attempts:[{value:cp(m)}]};field(t,m,'answers.0','127.00000001');oldOnly(t,m);assert.deepEqual(m.history,history);field(t,m,'answers.0','127.0');assert.ok(replay(t,m));assert.equal(latestSubmissionMatches(m,recordSnapshot),false);assert.deepEqual(m.history,history);
});

test('hidden actions and nonempty data cannot borrow an original green grade',()=>{
 for(const c of fixture.cases){const t=at(c);for(const[name,data]of [['help',{}],['test',{}],['clear',{}],['choice',{index:'left'}],['remove',{}],['record',{index:'0'}]]){const m=build(c);assert.doesNotMatch(V.controls(t,m),new RegExp('data-x="m28-'+(name==='record'?'test':name)+'"'));M.act(t,m,'m28-'+name,data);oldOnly(t,m);}}
});

test('hidden fields, sparse arrays, extra keys, fake first/bad and issue are not observable source history',()=>{
 for(const c of fixture.cases){const t=at(c),m=build(c);for(const mutate of [x=>x.offset='0',x=>x.estimate='5',x=>x.error='0',x=>x.values.push('1'),x=>x.issue='invented',x=>x.extra=true,x=>x.board.extra=true,x=>x.board.first.extra='1',x=>x.board.bad=true,x=>x.history[0].extra=true,x=>x.history[0].f.extra='1',x=>x.history[0].d.index='']){const bad=cp(m);mutate(bad);reject(t,bad);}}
 const c=fixture.cases[0],m=build(c);delete m.history[0];m.history.extra={};reject(at(c),m);
});

test('2000 retained records cap the whole action model while fields and latest submission remain distinct',()=>{
 for(const key of ['readscales:0','readscales:4','measurecalc:1']){const c=fixture.cases.find(c=>c.id+':'+c.index===key),t=at(c),m=build(c);while(m.history.length<2000)M.act(t,m,'m28-record');assert.equal(M.valid(t,m),true);const before=cp(m);record(t,m);assert.deepEqual(m,before);assert.equal(replay(t,m).historyAtCapacity,true);
  const submitted={attempts:[{value:cp(m)}]};field(t,m,'measure',' '+c.math.raw);record(t,m);reject(t,m);field(t,m,'measure',c.math.raw);assert.ok(replay(t,m));field(t,m,'prose','仍未重新检查的原话');assert.ok(replay(t,m));assert.equal(latestSubmissionMatches(m,submitted),false);
 }
});

test('1200 text and complete constructed lesson/raw storage roundtrip preserve the original model and attempts',()=>{
 const atlas=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
 for(const c of fixture.cases){const t=at(c),m=build(c);field(t,m,'prose','中'.repeat(1200));assert.ok(replay(t,m));const bad=cp(m);bad.prose+='中';assert.equal(M.valid(t,bad),false);reject(t,bad);
  const lesson=State.freshLesson(c.id);lesson.index=c.index;lesson.view='task';lesson.models[c.index]=cp(m);State.submitLesson(lesson);assert.deepEqual(lesson.cases[c.index].attempts.at(-1).value,m);
  const state=Core.fresh();state.lessons[c.id]=lesson;assert.deepEqual(Core.validate(cp(state),atlas),state);
  const backing=new Map(),storage={getItem:k=>backing.get(k)??null,setItem:(k,v)=>backing.set(k,v)},raw=JSON.stringify(state);Storage.writeStored(Core.KEY,raw,storage);assert.equal(Storage.readStored(Core.KEY,storage),raw);assert.deepEqual(JSON.parse(raw),state);
 }
});
