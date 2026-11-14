import test from 'node:test';
import {thinkingGuide,thinkingFeedback} from '../dist/learning/thinking-feedback.js';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import cases from './fixtures/p9-angle-cases.cjs';
import {LESSONS} from '../dist/learning/catalog.js';
import {BRIDGES,sessionTasks} from '../dist/learning/bridges.js';
import {ensureB39Ready} from '../dist/learning/phase4/async-batches.js';
import * as angles from '../dist/learning/phase5/b25-model.js';
import * as view from '../dist/learning/phase5/b25-view.js';
import {angleBinding,replayAngleEvidence} from '../dist/learning/angle-evidence.js';
import {latestSubmissionMatches} from '../dist/learning/evidence-contract.js';

await ensureB39Ready();
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort((a,b)=>a.localeCompare(b,'en')).map(k=>[k,stable(v[k])])):v;
const hash=t=>createHash('sha256').update(JSON.stringify(stable(t))).digest('hex');
const taskFor=c=>sessionTasks(c.id)[c.index];
const act=(t,m,action,data={})=>angles.act(t,m,'g25-'+action,data);
const field=(t,m,key,value)=>{
 const parts=key.split('.');if(parts.length===2)m[parts[0]][Number(parts[1])]=String(value);else m[key]=String(value);
 angles.field(t,m,key);return m;
};
const run=(t,m,steps=angles.solveSteps(t))=>{
 for(const s of steps)if(s.field)field(t,m,s.field,s.value);else angles.act(t,m,s.action,s.data);
 return m;
};
const answers=(t,m)=>{for(const s of angles.solveSteps(t))if(s.field?.startsWith('answers.'))field(t,m,s.field,s.value);return m;};
const set=(t,m,value)=>{field(t,m,'angle',value);act(t,m,'set');};
const record=(t,m,value)=>{set(t,m,value);act(t,m,'record');};
const original=(t,m)=>{assert.equal(angles.valid(t,m),true);assert.equal(angles.inspect(t,m).correct,true);};
const accepts=(t,m)=>{original(t,m);const before=JSON.stringify(m),p=replayAngleEvidence(t,m);assert.ok(p);assert.equal(JSON.stringify(m),before,'proof generation cannot change saved work');return p;};
const rejects=(t,m,label)=>assert.equal(replayAngleEvidence(t,m),null,label);

test('23 reviewed native positions bind 10 exact nodes and fixed full source hashes',()=>{
 assert.equal(cases.length,23);assert.equal(new Set(cases.map(c=>c.nodeId)).size,10);
 let native=0,associated=0;const found=[];
 for(const c of cases){
  const t=taskFor(c),binding=angleBinding(t,c);
  assert.equal(binding?.nodeId,c.nodeId);assert.equal(binding.method,null);
  assert.ok(binding.question.length>15);assert.equal(LESSONS[c.id].topicId,c.nodeId);
  assert.equal(hash(t),c.taskHash);assert.deepEqual(t.targets,c.targets);
  assert.equal(!!t.compareLengths,c.compareLengths);assert.equal(t.scene||null,c.scene);
  assert.deepEqual(t.questions.map(q=>q.value),c.answers);
  for(const bad of [null,[],false,'anglecorner',{}, {...c,index:String(c.index)},
   {...c,index:-1},{...c,sessionId:'__proto__'},{...c,sessionId:'constructor'},{...c,index:99}])
   assert.equal(angleBinding(t,bad),null);
  for(const bad of [{...t,prompt:t.prompt+' changed'},{...t,targets:[...t.targets,0]},
   {...t,compareLengths:!t.compareLengths},{...t,questions:[]},{...t,type:'x-g25-estimate'}]){
   assert.equal(angleBinding(bad,c),null);rejects(bad,angles.example(t));
  }
 }
 for(const id of Object.keys(LESSONS))for(const [index,t]of sessionTasks(id).entries()){
  if(t.type==='x-g25-turn')native++;
  if(angleBinding(t,{sessionId:id,index}))found.push(id+':'+index);
 }
 assert.equal(native,23);assert.deepEqual(found.sort(),cases.map(c=>c.id+':'+c.index).sort());
 for(const id of Object.keys(BRIDGES))for(const [index,t]of sessionTasks(id).entries()){
  assert.equal(angleBinding(t,{sessionId:id,index}),null,id+':'+index);
  if(t.type==='x-g25-turn')associated++;
 }
 assert.equal(associated,13,'associated copies do not inherit native evidence');
});

for(const c of cases)test(`${c.id}:${c.index} proves recorded openings and exact question roles`,()=>{
 const t=taskFor(c),m=angles.example(t),p=accepts(t,m);
 assert.equal(p.angle,c.targets.at(-1));assert.deepEqual(p.targetRecords.map(r=>r.angle),c.targets);
 assert.deepEqual(p.answers.map(a=>a.value),c.answers);
 assert.equal(p.steps.length,m.history.length);assert.equal(p.records.length,c.targets.length+(c.compareLengths?1:0));
 assert.equal(p.confirmations,c.compareLengths?1:0,'same-angle solver set is confirmation, not another turn');
 assert.equal(p.changes,c.targets.length+(c.compareLengths?1:0));assert.deepEqual(p.advances,[]);
 assert.equal(!!p.lengthComparison,c.compareLengths);assert.equal(!!p.cross,c.scene==='cross');
 if(c.compareLengths){const a=p.records[p.lengthComparison.shortRecordIndex],b=p.records[p.lengthComparison.longRecordIndex];assert.equal(a.angle,b.angle);assert.deepEqual([a.length,b.length],[1,3]);}
 if(p.cross){assert.equal(p.cross.opposite,p.angle);assert.equal(p.cross.adjacent+p.angle,180);assert.equal(2*(p.angle+p.cross.adjacent),p.cross.around);}
 for(const r of p.records){assert.equal(m.history[r.historyIndex].a,'record');assert.ok(r.angle>=0&&r.angle<=360);}
 assert.equal(latestSubmissionMatches(m,{attempts:[{value:structuredClone(m)}]}),true);
 const edited=structuredClone(m);edited.answers[0]='wrong';
 assert.equal(latestSubmissionMatches(edited,{attempts:[{value:m}]}),false);
 assert.equal(latestSubmissionMatches(m,{attempts:[{value:m},{value:edited}]}),false);
 rejects(t,edited);accepts(t,JSON.parse(JSON.stringify(m)));
 for(const mutate of [x=>x.history=[],x=>x.history.pop(),x=>x.history.reverse(),
  x=>x.history[0].extra=true,x=>x.history[0].d.index='0',x=>x.history[0].f.extra='unused',
  x=>x.history[0].a='guess',x=>x.board.angle=999,x=>x.board.length=0,
  x=>x.board.records.push({angle:999,length:1}),x=>x.board.first.extra={},
  x=>x.base='1',x=>x.seed=0,x=>x.issue='failed',x=>x.extra=true]){
  const bad=structuredClone(m);mutate(bad);rejects(t,bad,c.id+':'+c.index);
 }
});

test('four real quarter actions preserve 0, full turn and next-circle orientation separately',()=>{
 const t=sessionTasks('rightcheck')[2],m=angles.initial(t,1);
 for(let n=0;n<4;n++){act(t,m,'quarter');act(t,m,'record');}
 answers(t,m);let p=accepts(t,m);
 assert.equal(m.angle,'','quarter actions do not manufacture angle input');
 assert.deepEqual(p.records.map(r=>r.angle),[90,180,270,360]);
 assert.deepEqual(p.advances.map(a=>a.degrees),[90,90,90,90]);assert.equal(p.changes,4);
 act(t,m,'quarter');set(t,m,360);p=accepts(t,m);
 assert.deepEqual(p.advances.at(-1),{historyIndex:8,from:360,to:90,degrees:90,wrapped:true,clamped:false});
 assert.equal(p.records.length,4,'another turn does not invent another recorded angle');
});

test('all 361 starting openings advance by the actual bounded amount and show truthful control text',()=>{
 const t=sessionTasks('angleparts')[0];let clipped=0;
 for(let from=0;from<=360;from++){
  const m=angles.initial(t,1);set(t,m,from);
  const html=view.controls(t,m),label=html.match(/data-x="g25-quarter"[^>]*>([^<]+)/)?.[1];
  assert.equal(label,from===360?'转到下一圈的四分之一处':from>270?`转到整圈（再转${360-from}°）`:'再转四分之一圈');
  act(t,m,'quarter');const to=from===360?90:Math.min(360,from+90);
  assert.equal(m.board.angle,to);run(t,m);const p=accepts(t,m),advance=p.advances[0];
  assert.deepEqual([advance.from,advance.to,advance.degrees,advance.wrapped,advance.clamped],
   [from,to,from===360?90:to-from,from===360,from>270&&from<360]);
  if(advance.clamped)clipped++;
 }
 assert.equal(clipped,89);
});

test('legal confirmations and exploratory zero/full openings never become extra mathematical changes',()=>{
 const t=sessionTasks('angleparts')[0],m=angles.initial(t,1);
 set(t,m,0);act(t,m,'record');set(t,m,360);act(t,m,'record');run(t,m);
 const before=accepts(t,m);set(t,m,'90/2');const after=accepts(t,m);
 assert.equal(after.confirmations,before.confirmations+1);assert.equal(after.changes,before.changes);
 assert.deepEqual(after.records.map(r=>r.angle),[0,360,45]);
 assert.equal(after.records[0].angle,0);assert.equal(after.records[1].angle,360);
 assert.equal(after.angle,45);assert.equal(after.steps.at(-1).changed,false);
});

test('length comparisons accept either recorded order and never treat levels as a length ratio',()=>{
 for(const c of cases.filter(c=>c.compareLengths)){
  const t=taskFor(c),m=angles.initial(t,1);set(t,m,c.targets[0]);
  field(t,m,'length','3');act(t,m,'length');act(t,m,'record');
  field(t,m,'length','1');act(t,m,'length');act(t,m,'record');answers(t,m);
  const p=accepts(t,m);
  assert.equal(p.length,1);assert.equal(p.lengthComparison.longRecordIndex,0);assert.equal(p.lengthComparison.shortRecordIndex,1);
  assert.ok(!Object.hasOwn(p.lengthComparison,'ratio'));
  const absent=structuredClone(m);absent.history.pop();rejects(t,absent);
 }
});

test('angle differences and cross relations come from the recorded openings, with bounded triangle claims',()=>{
 for(const [id,index,want]of [['angleadd',0,[115]],['angleadd',1,[40]],['angleadd',2,[150]],['trianglepossible',6,[50,40]]]){
  const t=sessionTasks(id)[index],p=accepts(t,angles.example(t));
  assert.deepEqual(p.differences.map(d=>d.difference),want);
  for(const d of p.differences){assert.equal(p.records[d.toRecordIndex].angle-p.records[d.fromRecordIndex].angle,d.difference);}
 }
 const t=sessionTasks('trianglepossible')[6],p=accepts(t,angles.example(t));
 assert.deepEqual(p.triangle,{parts:[100,50,40],sum:190,canForm:false});
 const crossed=sessionTasks('anglecross')[0],m=angles.initial(crossed,1);
 record(crossed,m,270);run(crossed,m);const q=accepts(crossed,m);
 assert.equal(q.records[0].angle,270,'a reflex exploration remains an opening, not a 270-degree intersection sector');
 assert.deepEqual(q.cross,{angle:100,opposite:100,adjacent:80,around:360});
});

test('exact integer and rational inputs reject rounding and unavailable length options',()=>{
 const t=sessionTasks('anglecorner')[0];
 for(const raw of ['60','60.0000','120/2','59 2/2','0 60/1']){
  const m=angles.initial(t,1),steps=angles.solveSteps(t).map(s=>s.field==='angle'?{...s,value:raw}:s);
  run(t,m,steps);assert.equal(accepts(t,m).angle,60);
 }
 for(const raw of ['60.0000000000000001','60000000000000000001/1000000000000000000']){
  const m=angles.initial(t,1);set(t,m,raw);run(t,m);original(t,m);rejects(t,m,raw);
 }
 for(const raw of ['361','0/0','1e2','Infinity','60.1']){
  const m=angles.initial(t,1);set(t,m,raw);run(t,m);original(t,m);rejects(t,m,raw);
 }
 const numerical=sessionTasks('degreeunit')[1];
 for(const raw of ['45.00000001','45.0000000000000001']){
  const m=angles.example(numerical);m.answers[0]=raw;original(numerical,m);rejects(numerical,m,raw);
 }
 for(const raw of ['90/2','44 2/2','45.0000']){
  const m=angles.example(numerical);m.answers[0]=raw;assert.equal(accepts(numerical,m).answers[0].value,45);
 }
 for(const raw of ['6/2','3.0000000000000001']){
  const m=angles.initial(t,1);set(t,m,60);act(t,m,'record');field(t,m,'length',raw);act(t,m,'length');act(t,m,'record');answers(t,m);
  original(t,m);rejects(t,m,'length selector values are exact UI options: '+raw);
 }
});

test('negative mixed openings and lengths fail while later correct work retains the invalid history',()=>{
 const t=sessionTasks('anglecorner')[0];
 for(const raw of ['-0 60/1','-00 1/1','-0 1/2','-1','-1 1/2','-60']){
  const m=angles.initial(t,1);set(t,m,raw);
  assert.equal(m.board.angle,0);assert.notEqual(m.issue,'');
  const failed=structuredClone(m.history.at(-1));assert.equal(failed.f.angle,raw);
  run(t,m);original(t,m);assert.deepEqual(m.history[0],failed);
  rejects(t,m,'a later valid opening does not erase the failed negative angle: '+raw);
 }
 for(const raw of ['-0 3/1','-00 3/1','-3']){
  const m=angles.initial(t,1);set(t,m,60);act(t,m,'record');
  field(t,m,'length',raw);act(t,m,'length');
  assert.equal(m.board.length,1);assert.notEqual(m.issue,'');
  const failed=structuredClone(m.history.at(-1));assert.equal(failed.f.length,raw);
  assert.deepEqual(m.board.records,[{angle:60,length:1}]);
  field(t,m,'length','3');act(t,m,'length');act(t,m,'record');answers(t,m);original(t,m);
  assert.deepEqual(m.history[2],failed);
  rejects(t,m,'negative length in an imported event is not a legal selector choice: '+raw);
 }
 const zero=angles.initial(t,1);set(t,zero,'-0 0/1');
 assert.ok(zero.board.angle===0);assert.equal(zero.issue,'');run(t,zero);
 assert.equal(accepts(t,zero).angle,60,'signed zero is a legal zero opening before later exploration');
});

test('negative mixed answers do not become positive angle measurements',()=>{
 const t=sessionTasks('degreeunit')[1];
 for(const raw of ['-0 45/1','-00 45/1',' -000 45/1 ']){
  const m=angles.example(t);m.answers[0]=raw;
  assert.equal(angles.valid(t,m),true);assert.equal(angles.inspect(t,m).correct,false);
  rejects(t,m,'negative forty-five is outside this positive opening measurement');
  assert.equal(m.answers[0],raw,'rejecting the response does not rewrite the original input');
  m.answers[0]='45';assert.equal(accepts(t,m).answers[0].value,45,'editing a response does not fabricate or erase action history');
 }
});

test('duplicate records, no-effect length commands, cross-widget events and reset cannot manufacture evidence',()=>{
 const t=sessionTasks('anglecorner')[0];
 for(const action of ['record','length','guess','reveal','test','choose','reset']){
  const m=angles.example(t);act(t,m,action);
  if(action==='reset')run(t,m);
  original(t,m);rejects(t,m,action);
 }
 const bad=angles.example(t);bad.history.push({a:'constructor',f:{},d:{}});rejects(t,bad);
 const model=angles.example(t);model.history.push({a:'__proto__',f:{},d:{}});rejects(t,model);
});

test('correct final grading cannot hide stale angles, pending input or reversed requested records',()=>{
 for(const c of cases){
  const t=taskFor(c),m=angles.example(t);set(t,m,0);original(t,m);rejects(t,m,'old records are not the current opening');
  for(const key of ['angle','length']){const pending=angles.example(t);pending[key]='2';original(t,pending);rejects(t,pending,key);}
  if(c.targets.length>1){
   const reversed=angles.initial(t,1);for(const angle of [...c.targets].reverse())record(t,reversed,angle);
   set(t,reversed,c.targets.at(-1));answers(t,reversed);original(t,reversed);rejects(t,reversed,'recorded order');
  }
 }
});

test('malformed snapshots fail closed and optional words remain outside mathematical evaluation',()=>{
 const t=sessionTasks('angleparts')[0],m=angles.example(t);
 for(const bad of [null,[],false,{}, {...m,seed:4294967296},{...m,seed:1.5},
  {...m,answers:[]},{...m,history:Array(1001).fill(m.history[0])},{...m,history:[null]},
  {...m,angle:45},{...m,prose:'x'.repeat(1501)}])rejects(t,bad);
 m.prose='这是我自己的原话；系统不判断这段解释。';accepts(t,m);
 const altered={...t,targets:[45.0000001]};rejects(altered,m);
});


test('angle feedback separates recorded openings, length comparison and actual bounded advances',()=>{
 for(const c of cases){
  const task=taskFor(c),model=angles.example(task),proof=replayAngleEvidence(task,model);
  const feedback=thinkingFeedback(task,model,{attempts:[{value:structuredClone(model)}]},c);
  assert.ok(feedback);assert.equal(feedback.method,null);assert.ok(thinkingGuide(task,c));
  assert.ok(c.targets.every(angle=>feedback.observation.includes(angle+'°')));
  assert.doesNotMatch(feedback.observation+feedback.detail.join(''),/最初猜|预测|扩大三倍|你已独立/);
  if(proof.lengthComparison)assert.ok(feedback.detail.some(line=>line.includes('短边、长边时同为')));
  if(proof.cross)assert.ok(feedback.detail.some(line=>line.includes(`对顶角为 ${proof.cross.opposite}°，邻角为 ${proof.cross.adjacent}°`)));
  if(proof.triangle)assert.ok(feedback.detail.some(line=>line.includes('本次没有实际构造三角形')));
 }
});

test('angle feedback names the specified target records when legitimate exploration lies between them',()=>{
 const task=sessionTasks('angleadd')[0],model=angles.initial(task,1);
 for(const opening of [65,100,180])record(task,model,opening);
 field(task,model,'answers.0','115');
 const proof=accepts(task,model),before=JSON.stringify(model);
 assert.deepEqual(proof.records.map(r=>r.angle),[65,100,180]);
 assert.deepEqual(proof.targetRecords.map(r=>r.recordIndex),[0,2]);
 assert.deepEqual(proof.differences,[{from:65,to:180,difference:115,fromRecordIndex:0,toRecordIndex:2}]);
 const feedback=thinkingFeedback(task,model,{attempts:[{value:structuredClone(model)}]},{sessionId:'angleadd',index:0});
 assert.ok(feedback);
 assert.ok(feedback.detail.some(line=>line.includes('本题指定的目标记录之间的差为：180° − 65° = 115°')));
 assert.doesNotMatch(feedback.detail.join('\n'),/相邻记录/);
 assert.equal(JSON.stringify(model),before,'feedback preserves the actual intermediate exploration and full event history');
});
